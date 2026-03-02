package com.crowdcount.app.ml;

/**
 * Raw TFLite SSD MobileNet detector — used as fallback when MediaPipe
 * Tasks is unavailable. Outputs up to 10 detections per pass.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000^\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0007\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\u0018\u0000 \u001f2\u00020\u0001:\u0001\u001fB\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\u0010\u0010\u0010\u001a\u00020\u00112\u0006\u0010\u0012\u001a\u00020\u0013H\u0002J\u0006\u0010\u0014\u001a\u00020\u0015J\u0014\u0010\u0016\u001a\b\u0012\u0004\u0012\u00020\u00180\u00172\u0006\u0010\u0019\u001a\u00020\u0013J\u0006\u0010\u001a\u001a\u00020\u001bJ\u0010\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u0005H\u0002R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\t\u001a\u0004\u0018\u00010\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\r\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006 "}, d2 = {"Lcom/crowdcount/app/ml/SsdTfliteDetector;", "", "context", "Landroid/content/Context;", "modelFile", "", "threshold", "", "(Landroid/content/Context;Ljava/lang/String;F)V", "gpuDelegate", "Lorg/tensorflow/lite/gpu/GpuDelegate;", "inputSize", "", "interpreter", "Lorg/tensorflow/lite/Interpreter;", "maxDetections", "bitmapToByteBuffer", "Ljava/nio/ByteBuffer;", "bmp", "Landroid/graphics/Bitmap;", "close", "", "detect", "", "Lcom/crowdcount/app/ml/DetectionResult;", "bitmap", "initialize", "", "loadModelFile", "Ljava/nio/MappedByteBuffer;", "name", "Companion", "app_debug"})
public final class SsdTfliteDetector {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String modelFile = null;
    private final float threshold = 0.0F;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "SsdTfliteDetector";
    @org.jetbrains.annotations.Nullable()
    private org.tensorflow.lite.Interpreter interpreter;
    @org.jetbrains.annotations.Nullable()
    private org.tensorflow.lite.gpu.GpuDelegate gpuDelegate;
    private int inputSize = 300;
    private int maxDetections = 10;
    @org.jetbrains.annotations.NotNull()
    public static final com.crowdcount.app.ml.SsdTfliteDetector.Companion Companion = null;
    
    public SsdTfliteDetector(@org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    java.lang.String modelFile, float threshold) {
        super();
    }
    
    public final boolean initialize() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.crowdcount.app.ml.DetectionResult> detect(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap) {
        return null;
    }
    
    private final java.nio.MappedByteBuffer loadModelFile(java.lang.String name) {
        return null;
    }
    
    private final java.nio.ByteBuffer bitmapToByteBuffer(android.graphics.Bitmap bmp) {
        return null;
    }
    
    public final void close() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0012\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0005"}, d2 = {"Lcom/crowdcount/app/ml/SsdTfliteDetector$Companion;", "", "()V", "TAG", "", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}