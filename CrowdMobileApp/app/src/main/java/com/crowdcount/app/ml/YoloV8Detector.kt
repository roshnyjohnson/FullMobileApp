package com.crowdcount.app.ml

import android.content.Context
import android.graphics.Bitmap
import android.graphics.RectF
import android.util.Log
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

/**
 * Detector for YOLOv8n (or any YOLOv8 variant) converted to TFLite.
 * Expects input size (typically 640x640) and output shape 1x84x8400.
 */
class YoloV8Detector(
    private val context: Context,
    private val modelFile: String,
    private val threshold: Float
) {
    companion object {
        private const val TAG = "YoloV8Detector"
        private const val IOU_THRESHOLD = 0.35f
    }

    private var interpreter: Interpreter? = null
    private var gpuDelegate: GpuDelegate? = null
    private var inputSize = 640 
    private var outputBoxCount = 8400
    private var outputFeatureCount = 84 // 4 (boxes) + 80 (COCO classes)

    fun initialize(): Boolean {
        return try {
            val model = loadModelFile(modelFile)
            val options = Interpreter.Options()

            try {
                gpuDelegate = GpuDelegate()
                options.addDelegate(gpuDelegate)
            } catch (e: Throwable) {
                gpuDelegate = null
                options.setNumThreads(4)
            }

            val interp = Interpreter(model, options)
            
            // Inspect input shape [1, size, size, 3]
            val inputShape = interp.getInputTensor(0).shape()
            inputSize = inputShape[1]

            // Inspect output shape [1, features, boxes]
            val outputShape = interp.getOutputTensor(0).shape()
            outputFeatureCount = outputShape[1]
            outputBoxCount = outputShape[2]

            interpreter = interp
            Log.i(TAG, "YOLOv8 loaded: input=$inputSize features=$outputFeatureCount boxes=$outputBoxCount")
            true
        } catch (e: Throwable) {
            Log.e(TAG, "YOLOv8 init failed: ${e.message}")
            false
        }
    }

    fun detect(bitmap: Bitmap): List<DetectionResult> {
        val interp = interpreter ?: return emptyList()

        // 1. Preprocess: Resize and Normalize to [0..1]
        val scaled = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        val input = bitmapToByteBuffer(scaled)
        if (scaled !== bitmap) scaled.recycle()

        // 2. Output buffer [1][84][8400]
        val output = Array(1) { Array(outputFeatureCount) { FloatArray(outputBoxCount) } }

        try {
            interp.run(input, output)
        } catch (e: Throwable) {
            Log.e(TAG, "Inference error", e)
            return emptyList()
        }

        // 3. Post-process: Filter by threshold and COCO 'person' (index 0)
        val candidates = mutableListOf<DetectionResult>()
        val raw = output[0]
        
        for (i in 0 until outputBoxCount) {
            // YOLOv8 output: [xc, yc, w, h, class0, class1, ...]
            val score = raw[4][i] // Index 4 is the first class (person in COCO)
            
            if (score >= threshold) {
                val xc = raw[0][i]
                val yc = raw[1][i]
                val w  = raw[2][i]
                val h  = raw[3][i]

                // Convert [center_x, center_y, width, height] to [left, top, right, bottom]
                // and normalize to [0..1] based on inputSize
                val l = (xc - w/2f) / inputSize
                val t = (yc - h/2f) / inputSize
                val r = (xc + w/2f) / inputSize
                val b = (yc + h/2f) / inputSize

                candidates.add(DetectionResult(
                    RectF(l.coerceIn(0f, 1f), t.coerceIn(0f, 1f), 
                         r.coerceIn(0f, 1f), b.coerceIn(0f, 1f)),
                    score,
                    "Person"
                ))
            }
        }

        // 4. NMS (internal to avoid returning 100 overlapping boxes)
        return nms(candidates)
    }

    private fun loadModelFile(name: String): MappedByteBuffer {
        val fd = context.assets.openFd(name)
        val s = FileInputStream(fd.fileDescriptor)
        return s.channel.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
    }

    private fun bitmapToByteBuffer(bmp: Bitmap): ByteBuffer {
        val buf = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4) // Float32
        buf.order(ByteOrder.nativeOrder())
        val px = IntArray(inputSize * inputSize)
        bmp.getPixels(px, 0, inputSize, 0, 0, inputSize, inputSize)
        for (p in px) {
            buf.putFloat(((p shr 16) and 0xFF) / 255f)
            buf.putFloat(((p shr 8) and 0xFF) / 255f)
            buf.putFloat((p and 0xFF) / 255f)
        }
        return buf
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
        interpreter?.close()
        gpuDelegate?.close()
    }
}
