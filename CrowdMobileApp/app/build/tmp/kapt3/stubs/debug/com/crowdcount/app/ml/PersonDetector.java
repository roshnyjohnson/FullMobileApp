package com.crowdcount.app.ml;

/**
 * Person detector using **MediaPipe Tasks** for EfficientDet-Lite0,
 * with a raw TFLite / SSD MobileNet fallback.
 *
 * MediaPipe Tasks handles all model preprocessing, inference, and
 * postprocessing automatically — no manual tensor mapping needed.
 *
 * Includes adaptive image-tiling for dense-crowd support.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\\\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0007\u0018\u0000 )2\u00020\u0001:\u0001)B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0006\u0010\r\u001a\u00020\u000eJ0\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00102\u0006\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u00132\u0006\u0010\u0015\u001a\u00020\u00132\u0006\u0010\u0016\u001a\u00020\u0013H\u0002J\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\u0006\u0010\u001a\u001a\u00020\u0010J\u0016\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\u0006\u0010\u001a\u001a\u00020\u0010H\u0002J\u001e\u0010\u001c\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\u0006\u0010\u001d\u001a\u00020\u00062\u0006\u0010\u001a\u001a\u00020\u0010H\u0002J\u0006\u0010\u001e\u001a\u00020\nJ\u0006\u0010\u001f\u001a\u00020 J\u0018\u0010!\u001a\u00020\u00132\u0006\u0010\"\u001a\u00020#2\u0006\u0010\u0016\u001a\u00020#H\u0002J\u001c\u0010$\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\f\u0010%\u001a\b\u0012\u0004\u0012\u00020\u00190\u0018H\u0002J\b\u0010&\u001a\u00020 H\u0002J\b\u0010\'\u001a\u00020 H\u0002J\b\u0010(\u001a\u00020 H\u0002R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0005\u001a\u0004\u0018\u00010\u0006X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0007\u001a\u0004\u0018\u00010\bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000b\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006*"}, d2 = {"Lcom/crowdcount/app/ml/PersonDetector;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "mpDetector", "Lcom/google/mediapipe/tasks/vision/objectdetector/ObjectDetector;", "tfliteFallback", "Lcom/crowdcount/app/ml/SsdTfliteDetector;", "usedBackend", "", "yoloDetector", "Lcom/crowdcount/app/ml/YoloV8Detector;", "close", "", "cropBitmap", "Landroid/graphics/Bitmap;", "bmp", "l", "", "t", "r", "b", "detect", "", "Lcom/crowdcount/app/ml/DetectionResult;", "bitmap", "detectSingle", "detectWithMediaPipe", "detector", "getBackendName", "initialize", "", "iou", "a", "Landroid/graphics/RectF;", "nms", "dets", "tryMediaPipe", "trySsdFallback", "tryYolo", "Companion", "app_debug"})
public final class PersonDetector {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "PersonDetector";
    private static final float CONFIDENCE_THRESHOLD = 0.4F;
    private static final float IOU_THRESHOLD = 0.35F;
    private static final int TILE_COLS = 2;
    private static final int TILE_ROWS = 2;
    private static final int TILE_ACTIVATION_THRESHOLD = 3;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String MEDIAPIPE_MODEL = "efficientdet_lite0.tflite";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String SSD_MODEL = "ssd_mobilenet_v2.tflite";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String YOLO_MODEL = "yolov8n_float32.tflite";
    @org.jetbrains.annotations.Nullable()
    private com.crowdcount.app.ml.YoloV8Detector yoloDetector;
    @org.jetbrains.annotations.Nullable()
    private com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector mpDetector;
    @org.jetbrains.annotations.Nullable()
    private com.crowdcount.app.ml.SsdTfliteDetector tfliteFallback;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String usedBackend = "";
    @org.jetbrains.annotations.NotNull()
    public static final com.crowdcount.app.ml.PersonDetector.Companion Companion = null;
    
    public PersonDetector(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getBackendName() {
        return null;
    }
    
    public final boolean initialize() {
        return false;
    }
    
    private final boolean tryYolo() {
        return false;
    }
    
    private final boolean tryMediaPipe() {
        return false;
    }
    
    private final boolean trySsdFallback() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.crowdcount.app.ml.DetectionResult> detect(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap) {
        return null;
    }
    
    /**
     * Run detection on a single bitmap using whichever backend is active.
     */
    private final java.util.List<com.crowdcount.app.ml.DetectionResult> detectSingle(android.graphics.Bitmap bitmap) {
        return null;
    }
    
    private final java.util.List<com.crowdcount.app.ml.DetectionResult> detectWithMediaPipe(com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector detector, android.graphics.Bitmap bitmap) {
        return null;
    }
    
    private final android.graphics.Bitmap cropBitmap(android.graphics.Bitmap bmp, float l, float t, float r, float b) {
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
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0004\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\u0007X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\u0007X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u000bX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u000bX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000bX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u0007X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u000f"}, d2 = {"Lcom/crowdcount/app/ml/PersonDetector$Companion;", "", "()V", "CONFIDENCE_THRESHOLD", "", "IOU_THRESHOLD", "MEDIAPIPE_MODEL", "", "SSD_MODEL", "TAG", "TILE_ACTIVATION_THRESHOLD", "", "TILE_COLS", "TILE_ROWS", "YOLO_MODEL", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}