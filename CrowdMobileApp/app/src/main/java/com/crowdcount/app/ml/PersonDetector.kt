package com.crowdcount.app.ml

import android.content.Context
import android.graphics.Bitmap
import android.graphics.RectF
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector

/**
 * Person detector using **MediaPipe Tasks** for EfficientDet-Lite0,
 * with a raw TFLite / SSD MobileNet fallback.
 *
 * MediaPipe Tasks handles all model preprocessing, inference, and
 * postprocessing automatically — no manual tensor mapping needed.
 *
 * Includes adaptive image-tiling for dense-crowd support.
 */
class PersonDetector(private val context: Context) {

    companion object {
        private const val TAG = "PersonDetector"
        private const val CONFIDENCE_THRESHOLD = 0.40f
        private const val IOU_THRESHOLD = 0.35f

        // Tiling for dense crowds
        private const val TILE_COLS = 2
        private const val TILE_ROWS = 2
        private const val TILE_ACTIVATION_THRESHOLD = 3

        private const val MEDIAPIPE_MODEL = "efficientdet_lite0.tflite"
        private const val SSD_MODEL = "ssd_mobilenet_v2.tflite"
        private const val YOLO_MODEL = "yolov8n_float32.tflite"
    }

    // YOLO backend
    private var yoloDetector: YoloV8Detector? = null

    // MediaPipe detector (primary)
    private var mpDetector: ObjectDetector? = null

    // Raw TFLite fallback
    private var tfliteFallback: SsdTfliteDetector? = null

    private var usedBackend = ""

    fun getBackendName() = usedBackend

    // ── init ────────────────────────────────────────────────────────────

    fun initialize(): Boolean {
        // Try YOLOv8 first (highest accuracy)
        if (tryYolo()) return true
        // Try MediaPipe Tasks second
        if (tryMediaPipe()) return true
        // Fall back to raw TFLite + SSD
        if (trySsdFallback()) return true

        Log.e(TAG, "No detection backend available!")
        return false
    }

    private fun tryYolo(): Boolean {
        return try {
            yoloDetector = YoloV8Detector(context, YOLO_MODEL, CONFIDENCE_THRESHOLD)
            if (yoloDetector!!.initialize()) {
                usedBackend = "YOLOv8"
                Log.i(TAG, "✓ YOLOv8 initialized ($YOLO_MODEL)")
                true
            } else {
                yoloDetector = null
                false
            }
        } catch (e: Throwable) {
            Log.w(TAG, "YOLOv8 init failed: ${e.message}")
            yoloDetector = null
            false
        }
    }

    private fun tryMediaPipe(): Boolean {
        return try {
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath(MEDIAPIPE_MODEL)
                .build()

            val options = ObjectDetector.ObjectDetectorOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.IMAGE)
                .setMaxResults(50)
                .setScoreThreshold(CONFIDENCE_THRESHOLD)
                .setCategoryAllowlist(listOf("person"))
                .build()

            mpDetector = ObjectDetector.createFromOptions(context, options)
            usedBackend = "MediaPipe EfficientDet"
            Log.i(TAG, "✓ MediaPipe ObjectDetector initialized ($MEDIAPIPE_MODEL)")
            true
        } catch (e: Throwable) {
            Log.w(TAG, "MediaPipe init failed: ${e.message}")
            mpDetector = null
            false
        }
    }

    private fun trySsdFallback(): Boolean {
        return try {
            tfliteFallback = SsdTfliteDetector(context, SSD_MODEL, CONFIDENCE_THRESHOLD)
            if (tfliteFallback!!.initialize()) {
                usedBackend = "TFLite SSD MobileNet"
                Log.i(TAG, "✓ SSD TFLite fallback initialized ($SSD_MODEL)")
                true
            } else {
                tfliteFallback = null
                false
            }
        } catch (e: Throwable) {
            Log.w(TAG, "SSD fallback init failed: ${e.message}")
            tfliteFallback = null
            false
        }
    }

    // ── detection ───────────────────────────────────────────────────────

    fun detect(bitmap: Bitmap): List<DetectionResult> {
        // Full-frame pass
        val fullRaw = detectSingle(bitmap)
        val fullResults = nms(fullRaw)
        Log.d(TAG, "Full-frame ($usedBackend): ${fullResults.size} people (raw ${fullRaw.size})")

        // Adaptive tiling — only for dense crowds
        if (fullResults.size < TILE_ACTIVATION_THRESHOLD) {
            Log.i(TAG, "→ ${fullResults.size} people (no tiling)")
            return fullResults
        }

        val all = fullResults.toMutableList()
        val tw = 1f / TILE_COLS
        val th = 1f / TILE_ROWS
        for (r in 0 until TILE_ROWS) {
            for (c in 0 until TILE_COLS) {
                val left = c * tw; val top = r * th
                val right = (c + 1) * tw; val bottom = (r + 1) * th
                val tile = cropBitmap(bitmap, left, top, right, bottom)
                val tileDets = detectSingle(tile).map { det ->
                    // Map tile-local coords back to full-frame
                    DetectionResult(
                        RectF(
                            left + det.boundingBox.left * tw,
                            top + det.boundingBox.top * th,
                            left + det.boundingBox.right * tw,
                            top + det.boundingBox.bottom * th
                        ),
                        det.confidence,
                        det.label
                    )
                }
                all.addAll(tileDets)
                tile.recycle()
            }
        }

        val merged = nms(all)
        Log.i(TAG, "→ ${merged.size} people (tiled, raw ${all.size})")
        return merged
    }

    /** Run detection on a single bitmap using whichever backend is active. */
    private fun detectSingle(bitmap: Bitmap): List<DetectionResult> {
        yoloDetector?.let { yolo ->
            return yolo.detect(bitmap)
        }
        mpDetector?.let { mp ->
            return detectWithMediaPipe(mp, bitmap)
        }
        tfliteFallback?.let { ssd ->
            return ssd.detect(bitmap)
        }
        return emptyList()
    }

    private fun detectWithMediaPipe(detector: ObjectDetector, bitmap: Bitmap): List<DetectionResult> {
        return try {
            val mpImage = BitmapImageBuilder(bitmap).build()
            val result = detector.detect(mpImage)

            result.detections().map { det ->
                val box = det.boundingBox()
                val w = bitmap.width.toFloat()
                val h = bitmap.height.toFloat()
                // MediaPipe returns pixel coords — normalise to [0..1]
                DetectionResult(
                    RectF(box.left / w, box.top / h, box.right / w, box.bottom / h),
                    det.categories().firstOrNull()?.score() ?: 0f,
                    "Person"
                )
            }
        } catch (e: Throwable) {
            Log.e(TAG, "MediaPipe detect error: ${e.message}")
            emptyList()
        }
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private fun cropBitmap(bmp: Bitmap, l: Float, t: Float, r: Float, b: Float): Bitmap {
        val w = bmp.width; val h = bmp.height
        val cx = (l * w).toInt().coerceIn(0, w - 1)
        val cy = (t * h).toInt().coerceIn(0, h - 1)
        val cw = ((r - l) * w).toInt().coerceIn(1, w - cx)
        val ch = ((b - t) * h).toInt().coerceIn(1, h - cy)
        return Bitmap.createBitmap(bmp, cx, cy, cw, ch)
    }

    private fun nms(dets: List<DetectionResult>): List<DetectionResult> {
        val sorted = dets.sortedByDescending { it.confidence }.toMutableList()
        val kept = mutableListOf<DetectionResult>()
        while (sorted.isNotEmpty()) {
            val best = sorted.removeAt(0)
            kept.add(best)
            sorted.removeAll { iou(best.boundingBox, it.boundingBox) > IOU_THRESHOLD }
        }
        return kept
    }

    private fun iou(a: RectF, b: RectF): Float {
        val ix = maxOf(0f, minOf(a.right, b.right) - maxOf(a.left, b.left))
        val iy = maxOf(0f, minOf(a.bottom, b.bottom) - maxOf(a.top, b.top))
        val inter = ix * iy
        val union = (a.width() * a.height()) + (b.width() * b.height()) - inter
        return if (union > 0f) inter / union else 0f
    }

    fun close() {
        yoloDetector?.close()
        mpDetector?.close()
        tfliteFallback?.close()
    }
}
