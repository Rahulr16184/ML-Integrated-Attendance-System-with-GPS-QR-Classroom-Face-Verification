"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Video, VideoOff, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CameraCaptureProps = {
  onCapture: (dataUri: string) => void;
  captureLabel?: string;
  isCapturing?: boolean;
};

export function CameraCapture({ onCapture, captureLabel = "Capture", isCapturing = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsCameraOn(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (stream) {
        stopCamera();
    }
    setError(null);
    setIsInitializing(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please check permissions.";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          message = "Camera access was denied. Please allow camera access in your browser settings.";
        } else if (err.name === "NotFoundError") {
          message = "No camera was found. Please connect a camera and try again.";
        }
      }
      setError(message);
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
      setIsCameraOn(false);
    } finally {
        setIsInitializing(false);
    }
  }, [toast, stream, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        onCapture(dataUri);
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-0 sm:p-4">
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
              <Loader2 className="animate-spin h-8 w-8" />
              <p>Starting camera...</p>
            </div>
          ) : isCameraOn ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground p-4">
              <VideoOff className="mx-auto h-12 w-12" />
              <p className="mt-2">Camera is off or not available.</p>
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
               {!error && (
                 <Button variant="outline" onClick={startCamera} className="mt-4">
                    <Video className="mr-2 h-4 w-4" /> Retry
                 </Button>
               )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 pt-4">
        <Button onClick={handleCapture} disabled={!isCameraOn || isCapturing} className="w-full sm:w-auto">
          <Camera className="mr-2 h-4 w-4" />
          {isCapturing ? "Processing..." : captureLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
