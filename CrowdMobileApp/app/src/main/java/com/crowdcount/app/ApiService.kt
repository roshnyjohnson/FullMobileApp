package com.crowdcount.app

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body
import retrofit2.Call

// Match these to whatever endpoints Merin's FastAPI exposes
interface ApiService {

    @GET("/all-crowd-data")  // Change "/crowd" to match Merin's actual endpoint
    fun getCrowdData(): Call<List<CrowdData>>

    @POST("/update-crowd")
    fun postCrowdData(@Body data: CrowdData): Call<Map<String, String>>
}

// Match fields to Merin's database model
data class CrowdData(
    val zone_id: Int,
    val crowd_count: Int,
    val timestamp: String
)