package com.crowdcount.app

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ USING PHYSICAL ANDROID PHONE?
    //    1. Run `ipconfig` on your laptop → find Wi-Fi "IPv4 Address" (e.g. 192.168.1.10)
    //    2. Set BASE_URL = "http://192.168.1.10:8000/"  (use YOUR actual IP)
    //    3. Phone must be on the SAME Wi-Fi network as your laptop
    //    4. Start FastAPI with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    //       (the --host 0.0.0.0 makes it reachable from your phone!)
    //
    // ✅ USING ANDROID EMULATOR (AVD)?
    //    → Keep BASE_URL = "http://10.0.2.2:8000/"
    //    → 10.0.2.2 is the emulator's built-in alias for your laptop's localhost
    //    → Start FastAPI with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    // ─────────────────────────────────────────────────────────────────────────

    // ⚠️ CHANGE THIS to your laptop's Wi-Fi IP if using a physical phone!
    // Example for physical phone: private const val BASE_URL = "http://192.168.1.10:8000/"
    private const val BASE_URL = "http://192.168.1.15:8000/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
        .build()

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}