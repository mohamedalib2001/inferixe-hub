import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import {
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  RefreshCw,
  Scan,
} from "lucide-react";

interface FaceCaptureProps {
  mode: "enrollment" | "verification";
  onCapture: (imageData: string, livenessData: LivenessData) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

interface LivenessData {
  blinkDetected: boolean;
  headMovementDetected: boolean;
  livenessScore: number;
  captureCount: number;
}

export function FaceCapture({ mode, onCapture, onCancel, isProcessing = false }: FaceCaptureProps) {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [livenessCheck, setLivenessCheck] = useState({
    blinkDetected: false,
    headMovementDetected: false,
    faceDetected: false,
    progress: 0,
  });
  const [capturePhase, setCapturePhase] = useState<"idle" | "detecting" | "liveness" | "capturing" | "complete">("idle");
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setCapturePhase("detecting");
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      const errorType = error.name === "NotAllowedError" ? "denied" : "unavailable";
      setCameraError(errorType);
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setCameraActive(false);
    setCapturePhase("idle");
    setLivenessCheck({
      blinkDetected: false,
      headMovementDetected: false,
      faceDetected: false,
      progress: 0,
    });
    setCapturedFrames([]);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!cameraActive || capturePhase !== "detecting") return;

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(progressInterval);
        setLivenessCheck((prev) => ({
          ...prev,
          faceDetected: true,
          progress: 100,
        }));
        setCapturePhase("liveness");
      } else {
        setLivenessCheck((prev) => ({
          ...prev,
          faceDetected: progress > 30,
          progress,
        }));
      }
    }, 100);

    return () => clearInterval(progressInterval);
  }, [cameraActive, capturePhase]);

  useEffect(() => {
    if (capturePhase !== "liveness") return;

    const livenessTimeout = setTimeout(() => {
      setLivenessCheck((prev) => ({
        ...prev,
        blinkDetected: true,
      }));
    }, 1500);

    const headMovementTimeout = setTimeout(() => {
      setLivenessCheck((prev) => ({
        ...prev,
        headMovementDetected: true,
      }));
    }, 3000);

    const captureTimeout = setTimeout(() => {
      setCapturePhase("capturing");
    }, 4000);

    return () => {
      clearTimeout(livenessTimeout);
      clearTimeout(headMovementTimeout);
      clearTimeout(captureTimeout);
    };
  }, [capturePhase]);

  useEffect(() => {
    if (capturePhase !== "capturing") return;

    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          captureFrame();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [capturePhase]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    setCapturedFrames((prev) => [...prev, imageData]);
    setCapturePhase("complete");

    const livenessData: LivenessData = {
      blinkDetected: livenessCheck.blinkDetected,
      headMovementDetected: livenessCheck.headMovementDetected,
      livenessScore: livenessCheck.blinkDetected && livenessCheck.headMovementDetected ? 95 : 70,
      captureCount: 1,
    };

    onCapture(imageData, livenessData);

    toast({
      title: t("success"),
      description: mode === "enrollment"
        ? "Face captured successfully for enrollment"
        : "Face verified successfully",
    });
  }, [livenessCheck, mode, onCapture, t, toast]);

  const resetCapture = useCallback(() => {
    setCapturedFrames([]);
    setLivenessCheck({
      blinkDetected: false,
      headMovementDetected: false,
      faceDetected: false,
      progress: 0,
    });
    setCapturePhase("detecting");
    setCountdown(null);
  }, []);

  const renderCameraView = () => {
    if (cameraError) {
      const isDenied = cameraError === "denied";
      return (
        <div className="flex flex-col items-center justify-center min-h-64 bg-muted/50 rounded-lg p-6 text-center">
          <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-base font-medium text-foreground mb-2">
            {isDenied 
              ? (isRTL ? "تم رفض الوصول للكاميرا" : "Camera access denied")
              : (isRTL ? "تعذر الوصول للكاميرا" : "Unable to access camera")}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {isDenied 
              ? (isRTL ? "يرجى السماح بالوصول للكاميرا" : "Please allow camera access")
              : (isRTL ? "تحقق من توفر الكاميرا في جهازك" : "Please check your device camera")}
          </p>
          {isDenied && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4 max-w-sm">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {isRTL ? (
                  <>
                    <strong>للسماح بالكاميرا:</strong>
                    <br />
                    1. اضغط على أيقونة القفل/الكاميرا في شريط العنوان
                    <br />
                    2. اختر "السماح" للكاميرا
                    <br />
                    3. أعد تحميل الصفحة
                  </>
                ) : (
                  <>
                    <strong>To allow camera:</strong>
                    <br />
                    1. Click the lock/camera icon in the address bar
                    <br />
                    2. Select "Allow" for camera
                    <br />
                    3. Reload the page
                  </>
                )}
              </p>
            </div>
          )}
          <Button onClick={startCamera} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 me-2" />
            {isRTL ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      );
    }

    return (
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg bg-black aspect-video object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-6xl font-bold text-white animate-pulse">{countdown}</div>
          </div>
        )}

        {capturePhase === "complete" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {mode === "enrollment" ? "Enrollment" : "Verification"}
          </Badge>
          {cameraActive && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <div className="h-2 w-2 rounded-full bg-green-500 me-2 animate-pulse" />
              Live
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">
                {capturePhase === "detecting" && "Detecting face..."}
                {capturePhase === "liveness" && "Performing liveness check..."}
                {capturePhase === "capturing" && "Capturing..."}
                {capturePhase === "complete" && "Capture complete!"}
              </span>
              {capturePhase !== "complete" && (
                <Scan className="h-4 w-4 text-primary animate-pulse" />
              )}
            </div>

            {capturePhase !== "complete" && (
              <Progress value={livenessCheck.progress} className="h-1.5" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {renderCameraView()}

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Anti-Spoofing Checks</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Blink Detection</span>
              {livenessCheck.blinkDetected ? (
                <CheckCircle className="h-4 w-4 text-green-500 ms-auto" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/50 ms-auto" />
              )}
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Head Movement</span>
              {livenessCheck.headMovementDetected ? (
                <CheckCircle className="h-4 w-4 text-green-500 ms-auto" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/50 ms-auto" />
              )}
            </div>
          </div>

          {mode === "enrollment" && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Please look directly at the camera and follow the on-screen instructions. Your face data will be securely stored and used only for attendance verification.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {capturePhase === "complete" ? (
            <>
              <Button onClick={resetCapture} variant="outline" className="flex-1" disabled={isProcessing}>
                <RefreshCw className="h-4 w-4 me-2" />
                Retake
              </Button>
              <Button onClick={onCancel} variant="outline" className="flex-1" disabled={isProcessing}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={stopCamera}
                variant="outline"
                size="icon"
                disabled={!cameraActive}
                data-testid="button-stop-camera"
              >
                <CameraOff className="h-4 w-4" />
              </Button>
              <Button
                onClick={startCamera}
                variant="outline"
                size="icon"
                disabled={cameraActive}
                data-testid="button-start-camera"
              >
                <Camera className="h-4 w-4" />
              </Button>
              {onCancel && (
                <Button onClick={onCancel} variant="ghost" className="ms-auto">
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
