package com.crowdcount.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.crowdcount.app.ml.PersonDetector
import kotlin.concurrent.thread

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val _modelLoaded = MutableLiveData<Boolean>(false)
    val modelLoaded: LiveData<Boolean> = _modelLoaded

    var detector: PersonDetector? = null
        private set

    init {
        initializeDetector()
    }

    private fun initializeDetector() {
        thread {
            val det = PersonDetector(getApplication())
            val success = det.initialize()
            detector = det
            _modelLoaded.postValue(success)
        }
    }

    override fun onCleared() {
        super.onCleared()
        detector?.close()
    }
}
