
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Video, VideoOff, Camera, Loader2, RefreshCw, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  onCapture: (dataUri: string) => void;
  captureLabel?: string;
  isCapturing?: boolean;
};

export function CameraCapture({ onCapture, captureLabel = "Capture", isCapturing = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraLive, setIsCameraLive] = useState(false);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraLive(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setIsCameraLive(false);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setError(null);
        setIsCameraLive(true);
      }
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
      setIsCameraLive(false);
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, stopCamera]);


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
        // Flip the canvas horizontally to reverse the mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUri);
        stopCamera();
      }
    }
  };

  const handleRecapture = async () => {
    await startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
        onCapture(capturedImage);
        setCapturedImage(null); 
    }
  }

  return (
    <Card>
      <CardContent className="p-0 sm:p-4">
        <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
          {!isCameraLive && !capturedImage && !error && (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
              <Loader2 className="animate-spin h-8 w-8" />
              <p>Starting camera...</p>
            </div>
          )}
           {capturedImage && (
             <Image src={capturedImage} alt="Captured preview" layout="fill" objectFit="cover" />
          )}
          {error && (
             <div className="text-center text-muted-foreground p-4">
              <VideoOff className="mx-auto h-12 w-12" />
              <p className="mt-2">Camera is off or not available.</p>
              <p className="text-sm text-destructive mt-2">{error}</p>
              <Button variant="outline" onClick={startCamera} className="mt-4">
                  <Video className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={cn(
              "w-full h-full object-cover transform -scale-x-100",
              capturedImage || error || !isCameraLive ? "hidden" : "block"
            )}
          />
          {!capturedImage && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 aspect-square border-4 border-dashed border-white/50 rounded-full"></div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 pt-4">
        {capturedImage ? (
          <>
            <Button onClick={handleRecapture} variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" /> Recapture
            </Button>
            <Button onClick={handleUsePhoto} disabled={isCapturing} className="w-full sm:w-auto">
               <Check className="mr-2 h-4 w-4" />
              {isCapturing ? "Saving..." : "Use this photo"}
            </Button>
          </>
        ) : (
          <Button onClick={handleCapture} disabled={!isCameraLive || isCapturing} className="w-full sm:w-auto">
            <Camera className="mr-2 h-4 w-4" />
            {isCapturing ? "Processing..." : captureLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
