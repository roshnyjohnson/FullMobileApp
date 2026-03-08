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

    @GET("/events")
    fun getEvents(): Call<List<Event>>

    @GET("/events/{event_id}/zones")
    fun getZonesForEvent(@retrofit2.http.Path("event_id") eventId: Int): Call<List<Zone>>
}

data class Event(val event_id: Int, val event_name: String)
data class Zone(val zone_id: Int, val zone_name: String, val event_id: Int)

// Match fields to Merin's database model
data class CrowdData(
    val device_id: String,
    val zone_id: Int,
    val crowd_count: Int,
    val timestamp: String
)