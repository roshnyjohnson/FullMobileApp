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
 * Raw TFLite SSD MobileNet detector — used as fallback when MediaPipe
 * Tasks is unavailable. Outputs up to 10 detections per pass.
 */
class SsdTfliteDetector(
    private val context: Context,
    private val modelFile: String,
    private val threshold: Float
) {
    companion object {
        private const val TAG = "SsdTfliteDetector"
    }

    private var interpreter: Interpreter? = null
    private var gpuDelegate: GpuDelegate? = null
    private var inputSize = 300
    private var maxDetections = 10

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
            inputSize = interp.getInputTensor(0).shape()[1]
            maxDetections = interp.getOutputTensor(0).shape().let {
                if (it.size >= 2) it[1] else 10
            }

            // Validate with blank image
            val testBmp = Bitmap.createBitmap(inputSize, inputSize, Bitmap.Config.ARGB_8888)
            val testIn = bitmapToByteBuffer(testBmp)
            testBmp.recycle()
            val o0 = Array(1) { Array(maxDetections) { FloatArray(4) } }
            val o1 = Array(1) { FloatArray(maxDetections) }
            val o2 = Array(1) { FloatArray(maxDetections) }
            val o3 = FloatArray(1)
            val outs = HashMap<Int, Any>()
            outs[0] = o0; outs[1] = o1; outs[2] = o2; outs[3] = o3
            interp.runForMultipleInputsOutputs(arrayOf(testIn), outs)

            interpreter = interp
            Log.i(TAG, "SSD loaded: input=$inputSize maxDet=$maxDetections")
            true
        } catch (e: Throwable) {
            Log.e(TAG, "SSD init failed", e); false
        }
    }

    fun detect(bitmap: Bitmap): List<DetectionResult> {
        val interp = interpreter ?: return emptyList()
        val scaled = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        val input = bitmapToByteBuffer(scaled)
        if (scaled !== bitmap) scaled.recycle()

        val boxes   = Array(1) { Array(maxDetections) { FloatArray(4) } }
        val classes = Array(1) { FloatArray(maxDetections) }
        val scores  = Array(1) { FloatArray(maxDetections) }
        val count   = FloatArray(1)
        val outs = HashMap<Int, Any>()
        outs[0] = boxes; outs[1] = classes; outs[2] = scores; outs[3] = count

        try {
            interp.runForMultipleInputsOutputs(arrayOf(input), outs)
        } catch (e: Throwable) {
            Log.e(TAG, "Inference error", e); return emptyList()
        }

        val results = mutableListOf<DetectionResult>()
        for (i in 0 until maxDetections) {
            val s = scores[0][i]; val c = classes[0][i].toInt()
            if (s >= threshold && (c == 0 || c == 1)) {
                results.add(DetectionResult(
                    RectF(
                        boxes[0][i][1].coerceIn(0f, 1f),
                        boxes[0][i][0].coerceIn(0f, 1f),
                        boxes[0][i][3].coerceIn(0f, 1f),
                        boxes[0][i][2].coerceIn(0f, 1f)
                    ), s, "Person"
                ))
            }
        }
        return results
    }

    private fun loadModelFile(name: String): MappedByteBuffer {
        val fd = context.assets.openFd(name)
        val s = FileInputStream(fd.fileDescriptor)
        return s.channel.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
    }

    private fun bitmapToByteBuffer(bmp: Bitmap): ByteBuffer {
        // SSD MobileNet expects float32 input: 4 bytes per channel
        val buf = ByteBuffer.allocateDirect(inputSize * inputSize * 3 * 4)
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

    fun close() { interpreter?.close(); gpuDelegate?.close() }
}
