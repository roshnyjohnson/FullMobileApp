package com.crowdcount.app.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import com.crowdcount.app.ml.DetectionResult

/**
 * Transparent overlay that draws bounding boxes and confidence
 * labels over the camera preview for each detected person.
 */
class OverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var results: List<DetectionResult> = emptyList()

    // ── paints ──────────────────────────────────────────────────────────

    private val boxPaint = Paint().apply {
        color = Color.parseColor("#00E676")
        style = Paint.Style.STROKE
        strokeWidth = 4f
        isAntiAlias = true
    }

    private val dotPaint = Paint().apply {
        color = Color.parseColor("#00E676")
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val labelBgPaint = Paint().apply {
        color = Color.parseColor("#CC000000")
        style = Paint.Style.FILL
    }

    private val labelPaint = Paint().apply {
        color = Color.WHITE
        textSize = 26f
        isAntiAlias = true
        isFakeBoldText = true
    }

    // ── public API ──────────────────────────────────────────────────────

    /** Update the detections to draw and trigger a repaint. */
    fun setDetections(detections: List<DetectionResult>) {
        results = detections
        postInvalidate()
    }

    /** Clear all drawn detections. */
    fun clear() {
        results = emptyList()
        postInvalidate()
    }

    // ── drawing ─────────────────────────────────────────────────────────

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        for (result in results) {
            // Scale normalised [0..1] coordinates to view dimensions
            val rect = RectF(
                result.boundingBox.left * width,
                result.boundingBox.top * height,
                result.boundingBox.right * width,
                result.boundingBox.bottom * height
            )

            // Bounding box
            canvas.drawRect(rect, boxPaint)

            // Corner dots for visual flair
            val dotRadius = 5f
            canvas.drawCircle(rect.left, rect.top, dotRadius, dotPaint)
            canvas.drawCircle(rect.right, rect.top, dotRadius, dotPaint)
            canvas.drawCircle(rect.left, rect.bottom, dotRadius, dotPaint)
            canvas.drawCircle(rect.right, rect.bottom, dotRadius, dotPaint)

            // Label background + text
            val label = "${(result.confidence * 100).toInt()}%"
            val tw = labelPaint.measureText(label)
            val th = labelPaint.textSize
            canvas.drawRect(
                rect.left, rect.top - th - 8f,
                rect.left + tw + 16f, rect.top,
                labelBgPaint
            )
            canvas.drawText(label, rect.left + 8f, rect.top - 6f, labelPaint)
        }
    }
}
