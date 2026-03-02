package com.crowdcount.app.camera;

/**
 * CameraX ImageAnalysis.Analyzer that runs person detection
 * at a configurable interval (default 10 s).
 *
 * Between detection cycles the camera preview stays active
 * but no ML inference is executed, saving battery and CPU.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000P\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010\t\n\u0002\b\u0005\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u0000 \u001e2\u00020\u0001:\u0001\u001eB)\u0012\b\u0010\u0002\u001a\u0004\u0018\u00010\u0003\u0012\u0018\u0010\u0004\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00070\u0006\u0012\u0004\u0012\u00020\b0\u0005\u00a2\u0006\u0002\u0010\tJ\u0010\u0010\u0019\u001a\u00020\b2\u0006\u0010\u001a\u001a\u00020\u001bH\u0016J\u0012\u0010\u001c\u001a\u0004\u0018\u00010\u001d2\u0006\u0010\u001a\u001a\u00020\u001bH\u0002R\u001a\u0010\n\u001a\u00020\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\f\u0010\r\"\u0004\b\u000e\u0010\u000fR\u0010\u0010\u0002\u001a\u0004\u0018\u00010\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001a\u0010\u0010\u001a\u00020\u0011X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0010\u0010\u0012\"\u0004\b\u0013\u0010\u0014R\u000e\u0010\u0015\u001a\u00020\u0016X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0017\u001a\u00020\u0018X\u0082\u0004\u00a2\u0006\u0002\n\u0000R \u0010\u0004\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00070\u0006\u0012\u0004\u0012\u00020\b0\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u001f"}, d2 = {"Lcom/crowdcount/app/camera/FrameAnalyzer;", "Landroidx/camera/core/ImageAnalysis$Analyzer;", "detector", "Lcom/crowdcount/app/ml/PersonDetector;", "onResults", "Lkotlin/Function1;", "", "Lcom/crowdcount/app/ml/DetectionResult;", "", "(Lcom/crowdcount/app/ml/PersonDetector;Lkotlin/jvm/functions/Function1;)V", "detectionIntervalMs", "", "getDetectionIntervalMs", "()J", "setDetectionIntervalMs", "(J)V", "isDetectionEnabled", "", "()Z", "setDetectionEnabled", "(Z)V", "isProcessing", "Ljava/util/concurrent/atomic/AtomicBoolean;", "lastDetectionTime", "Ljava/util/concurrent/atomic/AtomicLong;", "analyze", "imageProxy", "Landroidx/camera/core/ImageProxy;", "imageProxyToBitmap", "Landroid/graphics/Bitmap;", "Companion", "app_debug"})
public final class FrameAnalyzer implements androidx.camera.core.ImageAnalysis.Analyzer {
    @org.jetbrains.annotations.Nullable()
    private final com.crowdcount.app.ml.PersonDetector detector = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlin.jvm.functions.Function1<java.util.List<com.crowdcount.app.ml.DetectionResult>, kotlin.Unit> onResults = null;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "FrameAnalyzer";
    
    /**
     * Interval between detections in milliseconds (configurable).
     */
    private long detectionIntervalMs = 10000L;
    
    /**
     * Master switch — when false no inference runs at all.
     */
    private boolean isDetectionEnabled = false;
    @org.jetbrains.annotations.NotNull()
    private final java.util.concurrent.atomic.AtomicLong lastDetectionTime = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.concurrent.atomic.AtomicBoolean isProcessing = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.crowdcount.app.camera.FrameAnalyzer.Companion Companion = null;
    
    public FrameAnalyzer(@org.jetbrains.annotations.Nullable()
    com.crowdcount.app.ml.PersonDetector detector, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.util.List<com.crowdcount.app.ml.DetectionResult>, kotlin.Unit> onResults) {
        super();
    }
    
    /**
     * Interval between detections in milliseconds (configurable).
     */
    public final long getDetectionIntervalMs() {
        return 0L;
    }
    
    /**
     * Interval between detections in milliseconds (configurable).
     */
    public final void setDetectionIntervalMs(long p0) {
    }
    
    /**
     * Master switch — when false no inference runs at all.
     */
    public final boolean isDetectionEnabled() {
        return false;
    }
    
    /**
     * Master switch — when false no inference runs at all.
     */
    public final void setDetectionEnabled(boolean p0) {
    }
    
    @java.lang.Override()
    public void analyze(@org.jetbrains.annotations.NotNull()
    androidx.camera.core.ImageProxy imageProxy) {
    }
    
    private final android.graphics.Bitmap imageProxyToBitmap(androidx.camera.core.ImageProxy imageProxy) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0012\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0005"}, d2 = {"Lcom/crowdcount/app/camera/FrameAnalyzer$Companion;", "", "()V", "TAG", "", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}