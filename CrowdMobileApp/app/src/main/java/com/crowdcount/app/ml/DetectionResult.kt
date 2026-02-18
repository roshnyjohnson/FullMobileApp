package com.crowdcount.app.ml

import android.graphics.RectF

/**
 * Represents a single person detection result.
 * @param boundingBox Normalized bounding box [0..1] coordinates.
 * @param confidence Detection confidence score [0..1].
 * @param label Detection label (always "Person").
 */
data class DetectionResult(
    val boundingBox: RectF,
    val confidence: Float,
    val label: String
)
