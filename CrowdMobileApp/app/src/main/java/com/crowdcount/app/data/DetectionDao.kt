package com.crowdcount.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface DetectionDao {
    @Insert
    suspend fun insert(detection: Detection)

    @Query("SELECT * FROM detections")
    suspend fun getAllDetections(): List<Detection>
}
