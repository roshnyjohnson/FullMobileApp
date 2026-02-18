package com.crowdcount.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.Size
import android.view.Surface
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.activity.viewModels
import com.crowdcount.app.camera.FrameAnalyzer
import com.crowdcount.app.databinding.ActivityMainBinding
import com.crowdcount.app.ml.PersonDetector
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Main (and only) Activity.
 *
 * Responsibilities:
 *  • Request camera permission
 *  • Bind CameraX Preview + ImageAnalysis to lifecycle
 *  • Toggle detection on/off via the FAB
 *  • Display count, bounding boxes, and countdown timer
 *  • Send crowd count to FastAPI server and fetch stored data
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraExecutor: ExecutorService
    private val viewModel: MainViewModel by viewModels()

    private var frameAnalyzer: FrameAnalyzer? = null
    private var isDetectionRunning = false

    // countdown UI
    private val handler = Handler(Looper.getMainLooper())
    private var countdownRunnable: Runnable? = null

    // ── permission ──────────────────────────────────────────────────────

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startCamera()
            fetchCrowdDataFromServer()
        } else {
            Toast.makeText(this, "Camera permission is required", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    // ── lifecycle ───────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            binding = ActivityMainBinding.inflate(layoutInflater)
            setContentView(binding.root)
        } catch (e: Throwable) {
            Log.e(TAG, "Layout inflation failed", e)
            Toast.makeText(this, "UI error: ${e.message}", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        cameraExecutor = Executors.newSingleThreadExecutor()

        viewModel.modelLoaded.observe(this) { loaded ->
            if (!loaded && viewModel.detector != null) {
                Toast.makeText(this, "ML model load failed — detection disabled", Toast.LENGTH_LONG).show()
            }
        }

        binding.toggleButton.setOnClickListener { toggleDetection() }

        // Camera permission gate
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            startCamera()
            fetchCrowdDataFromServer()
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopCountdown()
        cameraExecutor.shutdown()
    }

    // ── camera ──────────────────────────────────────────────────────────

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val provider = cameraProviderFuture.get()

                val preview = Preview.Builder()
                    .build()
                    .also { it.setSurfaceProvider(binding.previewView.surfaceProvider) }

                frameAnalyzer = FrameAnalyzer(viewModel.detector) { results ->
                    runOnUiThread {
                        binding.overlayView.setDetections(results)
                        binding.countText.text = results.size.toString()
                        binding.statusText.text = "Detected: ${results.size} people\n(via ${viewModel.detector?.getBackendName()})"
                        // Only send to server when detection is actively running
                        if (isDetectionRunning) {
                            sendCrowdCountToServer(results.size)
                        }
                        startCountdown()
                    }
                }

                val analysis = ImageAnalysis.Builder()
                    .setTargetResolution(Size(640, 480))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { it.setAnalyzer(cameraExecutor, frameAnalyzer!!) }

                provider.unbindAll()
                provider.bindToLifecycle(
                    this, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis
                )
                Log.i(TAG, "Camera bound successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Camera setup failed", e)
                Toast.makeText(this, "Camera error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // ── detection toggle ────────────────────────────────────────────────

    private fun toggleDetection() {
        val detector = viewModel.detector
        if (detector == null || viewModel.modelLoaded.value != true) {
            Toast.makeText(this, "ML model not loaded yet — please wait", Toast.LENGTH_SHORT).show()
            return
        }

        isDetectionRunning = !isDetectionRunning
        frameAnalyzer?.isDetectionEnabled = isDetectionRunning

        if (isDetectionRunning) {
            binding.toggleButton.text = "Stop Detection"
            binding.toggleButton.setIconResource(android.R.drawable.ic_media_pause)
            binding.statusText.text = "Scanning..."
            binding.statusText.setTextColor(
                ContextCompat.getColor(this, android.R.color.holo_green_light)
            )
        } else {
            binding.toggleButton.text = "Start Detection"
            binding.toggleButton.setIconResource(android.R.drawable.ic_media_play)
            binding.statusText.text = "Paused"
            binding.statusText.setTextColor(
                ContextCompat.getColor(this, android.R.color.holo_orange_light)
            )
            binding.overlayView.clear()
            stopCountdown()
        }
    }

    // ── API: Fetch crowd data from FastAPI server ────────────────────────

    private fun fetchCrowdDataFromServer() {
        RetrofitClient.apiService.getCrowdData().enqueue(object : Callback<List<CrowdData>> {
            override fun onResponse(
                call: Call<List<CrowdData>>,
                response: Response<List<CrowdData>>
            ) {
                if (response.isSuccessful) {
                    val dataList = response.body()
                    if (!dataList.isNullOrEmpty()) {
                        val latest = dataList.last()
                        runOnUiThread {
                            Log.i(TAG, "Fetched from DB: Zone ${latest.zone_id}, Count ${latest.crowd_count}")
                        }
                    }
                } else {
                    Log.e(TAG, "API error: ${response.code()}")
                }
            }

            override fun onFailure(call: Call<List<CrowdData>>, t: Throwable) {
                Log.e(TAG, "API call failed: ${t.message}")
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Server not reachable — is FastAPI running?",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        })
    }

    // ── API: Send crowd count to FastAPI server ──────────────────────────

    private fun sendCrowdCountToServer(count: Int) {
        // Use Instant.now() to get a proper UTC ISO-8601 timestamp (e.g. "2026-02-18T09:39:43.123Z")
        // FastAPI's `datetime` type requires this format — LocalDateTime causes a 422 error
        val data = CrowdData(
            zone_id = 1,
            crowd_count = count,
            timestamp = java.time.Instant.now().toString()
        )
        RetrofitClient.apiService.postCrowdData(data).enqueue(object : Callback<Map<String, String>> {
            override fun onResponse(
                call: Call<Map<String, String>>,
                response: Response<Map<String, String>>
            ) {
                Log.i(TAG, "Count sent to server: $count | Response: ${response.body()}")
            }

            override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                Log.e(TAG, "POST failed: ${t.message}")
            }
        })
    }

    // ── countdown timer between scans ───────────────────────────────────

    private fun startCountdown() {
        stopCountdown()
        val totalSec = (frameAnalyzer?.detectionIntervalMs ?: 10_000L) / 1000
        var remaining = totalSec

        countdownRunnable = object : Runnable {
            override fun run() {
                if (!isDetectionRunning) return
                remaining--
                if (remaining > 0) {
                    binding.statusText.text = "Next scan in ${remaining}s"
                    handler.postDelayed(this, 1000)
                } else {
                    binding.statusText.text = "Scanning..."
                }
            }
        }
        handler.postDelayed(countdownRunnable!!, 1000)
    }

    private fun stopCountdown() {
        countdownRunnable?.let { handler.removeCallbacks(it) }
        countdownRunnable = null
    }
}
