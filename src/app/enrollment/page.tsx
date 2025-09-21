"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/camera-capture";
import { useToast } from "@/hooks/use-toast";
import { analyzeAndStoreFaceImage } from "@/ai/flows/analyze-and-store-face-images";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function EnrollmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<{isSuitable: boolean; reason?: string} | null>(null);

  const handleCapture = async (photoDataUri: string) => {
    if (!employeeId) {
      toast({
        title: "Employee ID Required",
        description: "Please enter an Employee ID before enrolling a face.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeAndStoreFaceImage({ photoDataUri });
      setAnalysisResult(result);
      if (result.isSuitable) {
        toast({
          title: "Enrollment Successful",
          description: `Face image for Employee ID: ${employeeId} has been successfully analyzed and stored.`,
        });
      } else {
        toast({
          title: "Image Not Suitable",
          description: result.reason || "The provided image is not suitable for enrollment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Error",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Face Enrollment</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Details</CardTitle>
            <CardDescription>Provide the employee's ID to associate with the face enrollment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder="e.g., E12345"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
            <CardTitle>Step 2: Capture Photo</CardTitle>
            <CardDescription>Use the camera to capture a clear, forward-facing photo.</CardDescription>
          </CardHeader>
          <CardContent>
            <CameraCapture 
                onCapture={handleCapture}
                captureLabel="Enroll Face"
                isCapturing={isLoading}
            />
          </CardContent>
        </Card>
      </div>
      
      {analysisResult && (
        <div className="max-w-2xl mx-auto">
          {analysisResult.isSuitable ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Image Suitable!</AlertTitle>
              <AlertDescription>
                The captured image meets the requirements and is suitable for enrollment.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Image Not Suitable</AlertTitle>
              <AlertDescription>
                {analysisResult.reason || "The image does not meet enrollment criteria. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
