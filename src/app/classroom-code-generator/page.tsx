
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions, generateClassroomCode, clearClassroomCode } from "@/services/institution-service";
import type { Department } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Hash, Play, StopCircle, Loader2, Copy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CODE_EXPIRY_DURATION = 120; // in seconds

export default function ClassroomCodeGeneratorPage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(CODE_EXPIRY_DURATION);
  
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
  }, [userProfile, isAuthorized, toast, selectedDepartmentId]);

  const stopGenerator = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only try to clear the code if a department was selected
    if (userProfile?.institutionId && selectedDepartmentId) {
       try {
         await clearClassroomCode(userProfile.institutionId, selectedDepartmentId);
       } catch (error) {
         console.error("Failed to clear classroom code on stop:", error);
         // Don't show a toast here as it might be annoying if it's just a cleanup
       }
    }

    setIsGenerating(false);
    setGeneratedCode("");
    setCountdown(CODE_EXPIRY_DURATION);

  }, [userProfile?.institutionId, selectedDepartmentId]);

  const startGenerator = async () => {
    if (!selectedDepartmentId || !userProfile?.institutionId) {
      toast({ title: "No Department Selected", description: "Please select a department first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setCountdown(CODE_EXPIRY_DURATION);
    
    try {
        const code = await generateClassroomCode(userProfile.institutionId, selectedDepartmentId);
        setGeneratedCode(code);
        
        intervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    stopGenerator();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

    } catch (error) {
        toast({ title: "Error", description: "Could not generate code.", variant: "destructive" });
        setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({ title: "Copied!", description: "The classroom code has been copied to your clipboard." });
  };

  // Cleanup on component unmount to ensure the code is cleared
  useEffect(() => {
    return () => {
      if (isGenerating) {
        stopGenerator();
      }
    };
  }, [isGenerating, stopGenerator]);
  
  if(userLoading || !isAuthorized) {
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
          <CardTitle className="flex items-center gap-2"><Hash/> Classroom Code Generator</CardTitle>
          <CardDescription>
            Generate a temporary 6-digit code for students to bypass camera-based classroom verification.
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
            
            <div className="flex flex-col items-center justify-center gap-4 p-4 border-dashed border-2 rounded-lg min-h-[250px]">
                {isGenerating ? (
                    <>
                        {generatedCode ? (
                            <>
                                <p className="text-5xl font-bold tracking-widest text-primary">{generatedCode}</p>
                                <Button onClick={handleCopy} variant="outline" size="sm">
                                    <Copy className="mr-2 h-4 w-4"/> Copy Code
                                </Button>
                            </>
                        ) : (
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        )}
                        <div className="w-full max-w-xs text-center mt-4">
                            <p className="text-sm text-muted-foreground">Code expires in {countdown}s...</p>
                            <Progress value={(countdown / CODE_EXPIRY_DURATION) * 100} className="mt-2" />
                        </div>
                    </>
                ) : (
                     <div className="text-center text-muted-foreground space-y-2">
                        <Hash className="h-16 w-16 mx-auto" />
                        <p>Click "Start Generator" to create a new code.</p>
                     </div>
                )}
            </div>
        </CardContent>
        <CardFooter className="flex justify-center">
            {isGenerating ? (
                <Button onClick={stopGenerator} variant="destructive" size="lg">
                    <StopCircle className="mr-2 h-5 w-5" /> Invalidate & Stop
                </Button>
            ) : (
                <Button onClick={startGenerator} size="lg" disabled={!selectedDepartmentId || loadingDepartments}>
                    <Play className="mr-2 h-5 w-5" /> Generate Code
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
