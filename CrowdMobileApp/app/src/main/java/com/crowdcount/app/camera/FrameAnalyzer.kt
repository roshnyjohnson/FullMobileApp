package com.crowdcount.app.camera

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Log
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.crowdcount.app.ml.DetectionResult
import com.crowdcount.app.ml.PersonDetector
import java.io.ByteArrayOutputStream
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

/**
 * CameraX ImageAnalysis.Analyzer that runs person detection
 * at a configurable interval (default 2 s).
 *
 * Between detection cycles the camera preview stays active
 * but no ML inference is executed, saving battery and CPU.
 */
class FrameAnalyzer(
    private val detector: PersonDetector?,
    private val onResults: (List<DetectionResult>) -> Unit
) : ImageAnalysis.Analyzer {

    companion object {
        private const val TAG = "FrameAnalyzer"
    }

    /** Interval between detections in milliseconds (configurable). */
    var detectionIntervalMs: Long = 2_000L

    /** Master switch — when false no inference runs at all. */
    var isDetectionEnabled: Boolean = false

    private val lastDetectionTime = AtomicLong(0L)
    private val isProcessing = AtomicBoolean(false)

    override fun analyze(imageProxy: ImageProxy) {
        // Skip if detection is paused, detector not ready, or already processing
        if (!isDetectionEnabled || detector == null || isProcessing.get()) {
            imageProxy.close()
            return
        }

        // Skip if interval hasn't elapsed yet
        val now = System.currentTimeMillis()
        if (now - lastDetectionTime.get() < detectionIntervalMs) {
            imageProxy.close()
            return
        }

        // Atomically claim processing lock
        if (!isProcessing.compareAndSet(false, true)) {
            imageProxy.close()
            return
        }

        try {
            val bitmap = imageProxyToBitmap(imageProxy)
            if (bitmap != null) {
                lastDetectionTime.set(now)
                val results = detector.detect(bitmap)
                onResults(results)
                bitmap.recycle()
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Detection error", e)
        } finally {
            isProcessing.set(false)
            imageProxy.close()
        }
    }

    // ── YUV_420_888 → Bitmap conversion ────────────────────────────────

    private fun imageProxyToBitmap(imageProxy: ImageProxy): Bitmap? {
        val planes = imageProxy.planes
        val width = imageProxy.width
        val height = imageProxy.height

        val yPlane = planes[0]
        val uPlane = planes[1]
        val vPlane = planes[2]

        val yRowStride = yPlane.rowStride
        val uvRowStride = uPlane.rowStride
        val uvPixelStride = uPlane.pixelStride

        val yBuffer = yPlane.buffer
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer

        // Build NV21 byte array
        val nv21 = ByteArray(width * height * 3 / 2)

        // Copy Y plane row by row
        for (row in 0 until height) {
            yBuffer.position(row * yRowStride)
            yBuffer.get(nv21, row * width, width)
        }

        // Interleave V and U into NV21 format
        val uvHeight = height / 2
        val uvWidth = width / 2
        var offset = width * height
        for (row in 0 until uvHeight) {
            for (col in 0 until uvWidth) {
                val uvIdx = row * uvRowStride + col * uvPixelStride
                nv21[offset++] = vBuffer.get(uvIdx)
                nv21[offset++] = uBuffer.get(uvIdx)
            }
        }

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, width, height), 85, out)
        val jpeg = out.toByteArray()
        val bitmap = BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size)
            ?: return null

        // Apply sensor rotation so the image is right-side-up
        val rotation = imageProxy.imageInfo.rotationDegrees
        return if (rotation != 0) {
            val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
            Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                .also { if (it !== bitmap) bitmap.recycle() }
        } else {
            bitmap
        }
    }
}
