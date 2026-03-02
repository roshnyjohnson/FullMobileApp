package com.crowdcount.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "detections")
data class Detection(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val zoneId: Int,
    val crowdCount: Int,
    val timestamp: Long
)
