
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import type { Department } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Play, StopCircle, Loader2, ScanLine } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const QR_REFRESH_INTERVAL = 30; // in seconds

export default function QrGeneratorPage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(QR_REFRESH_INTERVAL);
  const [scanCount, setScanCount] = useState(0);
  const [wasScanned, setWasScanned] = useState(false);
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
      const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
      if (role !== 'admin' && role !== 'teacher') {
          router.push('/login');
      } else {
          setIsAuthorized(true);
      }
  }, [router]);


  useEffect(() => {
    async function fetchDepartments() {
      if (userProfile?.institutionId && userProfile.departmentIds) {
        setLoadingDepartments(true);
        try {
          const institutions = await getInstitutions();
          const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
          if (currentInstitution) {
            const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
            setDepartments(userDepartments);
            if (userDepartments.length > 0 && !selectedDepartmentId) {
              setSelectedDepartmentId(userDepartments[0].id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch departments", error);
          toast({ title: "Error", description: "Could not fetch departments.", variant: "destructive" });
        } finally {
          setLoadingDepartments(false);
        }
      } else {
         setLoadingDepartments(false);
      }
    }
    if(isAuthorized && userProfile) {
        fetchDepartments();
    }
  }, [userProfile, isAuthorized, toast]);

  const stopGenerator = useCallback(() => {
    setIsGenerating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setQrCodeUrl("");
    setScanCount(0);
  }, []);

  const handleInterval = useCallback(() => {
    if (wasScanned) {
      // If scanned, generate a new one and continue
      generateQrCode();
    } else {
      // If not scanned, stop the generator
      stopGenerator();
      toast({
        title: "QR Generator Stopped",
        description: "The code was not scanned within the time limit.",
        variant: "destructive"
      });
    }
  }, [wasScanned, stopGenerator, toast]);

  const generateQrCode = useCallback(() => {
    if (!selectedDepartmentId) return;
    const uniqueToken = `tracein-qr;dept:${selectedDepartmentId};ts:${Date.now()};rand:${Math.random()}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(uniqueToken)}&size=250x250`;
    setQrCodeUrl(url);
    setCountdown(QR_REFRESH_INTERVAL);
    setWasScanned(false);
  }, [selectedDepartmentId]);

  const startGenerator = () => {
    if (!selectedDepartmentId) {
      toast({ title: "No Department Selected", description: "Please select a department first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setScanCount(0);
    generateQrCode();
    intervalRef.current = setInterval(handleInterval, QR_REFRESH_INTERVAL * 1000);
  };

  const simulateScan = () => {
    if (!isGenerating) return;
    
    setScanCount(prev => prev + 1);
    toast({ title: "Scan Simulated", description: "Generating new QR code." });
    
    // Immediately generate a new QR and reset the interval
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    generateQrCode(); // This will also reset wasScanned to false
    intervalRef.current = setInterval(handleInterval, QR_REFRESH_INTERVAL * 1000);
  };

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    if (isGenerating) {
        countdownInterval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : QR_REFRESH_INTERVAL));
        }, 1000);
    } else {
        if(countdownInterval) clearInterval(countdownInterval);
    }
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isGenerating]);


  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  if(userLoading) {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode/> QR Code Generator</CardTitle>
          <CardDescription>
            Generate a unique, single-use QR code for attendance. The code will automatically refresh or stop if not used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {loadingDepartments ? <Skeleton className="h-10 w-full" /> : (
                    <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={isGenerating || departments.length === 0}>
                    <SelectTrigger id="department">
                        <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
            </div>
            
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-4 p-4 border-dashed border-2 rounded-lg min-h-[300px]">
                    {qrCodeUrl ? (
                         <Image src={qrCodeUrl} alt="Generated QR Code" width={250} height={250} priority data-ai-hint="qr code" />
                    ) : (
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    )}
                    <div className="w-full max-w-xs text-center">
                        <p className="text-sm text-muted-foreground">Generator will stop or refresh in {countdown}s...</p>
                        <Progress value={(countdown / QR_REFRESH_INTERVAL) * 100} className="mt-2" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg">Scans: {scanCount}</p>
                        <Button onClick={simulateScan} variant="outline" size="sm" className="mt-2">
                            <ScanLine className="mr-2 h-4 w-4" />
                            Simulate Student Scan
                        </Button>
                    </div>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-4 border-dashed border-2 rounded-lg min-h-[300px]">
                    <QrCode className="h-16 w-16" />
                    <p>Click "Start Generator" to begin displaying QR codes for attendance.</p>
                 </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-center">
            {isGenerating ? (
                <Button onClick={stopGenerator} variant="destructive" size="lg">
                    <StopCircle className="mr-2 h-5 w-5" /> Stop Generator
                </Button>
            ) : (
                <Button onClick={startGenerator} size="lg" disabled={!selectedDepartmentId || loadingDepartments}>
                    <Play className="mr-2 h-5 w-5" /> Start Generator
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
