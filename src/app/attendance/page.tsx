"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/camera-capture";
import { useToast } from "@/hooks/use-toast";
import { logAttendanceViaFacialRecognition } from "@/ai/flows/log-attendance-via-facial-recognition";
import type { LogAttendanceViaFacialRecognitionOutput } from "@/ai/flows/log-attendance-via-facial-recognition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";

export default function AttendancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LogAttendanceViaFacialRecognitionOutput | null>(null);
  const { toast } = useToast();

  const handleCapture = async (photoDataUri: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const timestamp = new Date().toISOString();
      const response = await logAttendanceViaFacialRecognition({ photoDataUri, timestamp });
      setResult(response);
      toast({
        title: "Attendance Logged",
        description: `Employee ${response.employeeId} marked as ${response.attendanceStatus}.`,
      });
    } catch (error) {
      console.error("Error logging attendance:", error);
      toast({
        title: "Error",
        description: "Failed to log attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Log Attendance</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CameraCapture 
            onCapture={handleCapture}
            captureLabel="Log Attendance"
            isCapturing={isLoading}
          />
        </div>
        <div className="min-h-[300px] lg:min-h-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recognition Result</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p>Analyzing image...</p>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                   <p>Capture an image to see the attendance result here.</p>
                </div>
              )}
              {result && (
                <div className="space-y-4 w-full">
                  {result.attendanceStatus === 'present' ? (
                     <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  ) : (
                     <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  )}
                  <div className="text-center">
                    <p className="text-lg font-medium">{`Employee ID: ${result.employeeId}`}</p>
                    <p className="text-muted-foreground">{`Status: ${result.attendanceStatus}`}</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Confidence</span>
                      <span className="text-sm font-medium">{`${(result.confidence * 100).toFixed(0)}%`}</span>
                    </div>
                    <Progress value={result.confidence * 100} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
