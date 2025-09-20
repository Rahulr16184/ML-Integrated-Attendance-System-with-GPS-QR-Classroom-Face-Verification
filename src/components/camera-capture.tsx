"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Video, VideoOff, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CameraCaptureProps = {
  onCapture: (dataUri: string) => void;
  captureLabel?: string;
  isCapturing?: boolean;
};

export function CameraCapture({ onCapture, captureLabel = "Capture", isCapturing = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    setError(null);
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
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    }
  }, [stream]);

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

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {isCameraOn ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground">
              <VideoOff className="mx-auto h-12 w-12" />
              <p>Camera is off</p>
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        <Button variant="outline" onClick={isCameraOn ? stopCamera : startCamera} className="w-full sm:w-auto">
          {isCameraOn ? (
            <><VideoOff className="mr-2 h-4 w-4" /> Stop Camera</>
          ) : (
            <><Video className="mr-2 h-4 w-4" /> Start Camera</>
          )}
        </Button>
        <Button onClick={handleCapture} disabled={!isCameraOn || isCapturing} className="w-full sm:w-auto">
          <Camera className="mr-2 h-4 w-4" />
          {isCapturing ? "Processing..." : captureLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
