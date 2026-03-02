package com.crowdcount.app.ml;

/**
 * Detector for YOLOv8n (or any YOLOv8 variant) converted to TFLite.
 * Expects input size (typically 640x640) and output shape 1x84x8400.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000h\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0007\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\u0018\u0000 &2\u00020\u0001:\u0001&B\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\u0010\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0014H\u0002J\u0006\u0010\u0015\u001a\u00020\u0016J\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\u0006\u0010\u001a\u001a\u00020\u0014J\u0006\u0010\u001b\u001a\u00020\u001cJ\u0018\u0010\u001d\u001a\u00020\u00072\u0006\u0010\u001e\u001a\u00020\u001f2\u0006\u0010 \u001a\u00020\u001fH\u0002J\u0010\u0010!\u001a\u00020\"2\u0006\u0010#\u001a\u00020\u0005H\u0002J\u001c\u0010$\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\f\u0010%\u001a\b\u0012\u0004\u0012\u00020\u00190\u0018H\u0002R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\t\u001a\u0004\u0018\u00010\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\r\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\'"}, d2 = {"Lcom/crowdcount/app/ml/YoloV8Detector;", "", "context", "Landroid/content/Context;", "modelFile", "", "threshold", "", "(Landroid/content/Context;Ljava/lang/String;F)V", "gpuDelegate", "Lorg/tensorflow/lite/gpu/GpuDelegate;", "inputSize", "", "interpreter", "Lorg/tensorflow/lite/Interpreter;", "outputBoxCount", "outputFeatureCount", "bitmapToByteBuffer", "Ljava/nio/ByteBuffer;", "bmp", "Landroid/graphics/Bitmap;", "close", "", "detect", "", "Lcom/crowdcount/app/ml/DetectionResult;", "bitmap", "initialize", "", "iou", "a", "Landroid/graphics/RectF;", "b", "loadModelFile", "Ljava/nio/MappedByteBuffer;", "name", "nms", "dets", "Companion", "app_debug"})
public final class YoloV8Detector {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String modelFile = null;
    private final float threshold = 0.0F;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "YoloV8Detector";
    private static final float IOU_THRESHOLD = 0.35F;
    @org.jetbrains.annotations.Nullable()
    private org.tensorflow.lite.Interpreter interpreter;
    @org.jetbrains.annotations.Nullable()
    private org.tensorflow.lite.gpu.GpuDelegate gpuDelegate;
    private int inputSize = 640;
    private int outputBoxCount = 8400;
    private int outputFeatureCount = 84;
    @org.jetbrains.annotations.NotNull()
    public static final com.crowdcount.app.ml.YoloV8Detector.Companion Companion = null;
    
    public YoloV8Detector(@org.jetbrains.annotations.NotNull()
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
    
    private final java.util.List<com.crowdcount.app.ml.DetectionResult> nms(java.util.List<com.crowdcount.app.ml.DetectionResult> dets) {
        return null;
    }
    
    private final float iou(android.graphics.RectF a, android.graphics.RectF b) {
        return 0.0F;
    }
    
    public final void close() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0018\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0007"}, d2 = {"Lcom/crowdcount/app/ml/YoloV8Detector$Companion;", "", "()V", "IOU_THRESHOLD", "", "TAG", "", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}