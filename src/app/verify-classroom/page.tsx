
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions, verifyClassroomCode } from '@/services/institution-service';
import type { Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Camera, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { VerificationSteps } from '@/components/verification-steps';
import { cn } from '@/lib/utils';
import { VerificationInfoDialog } from '@/components/verification-info-dialog';

export default function VerifyClassroomPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile, loading: userProfileLoading } = useUserProfile();
    const { toast } = useToast();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [status, setStatus] = useState<'pending' | 'instructions' | 'verifying' | 'success' | 'failed'>('pending');
    const [statusMessage, setStatusMessage] = useState('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraLive, setIsCameraLive] = useState(false);
    
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

    useEffect(() => {
        async function fetchDepartment() {
            if (userProfileLoading) return;
            if (!departmentId) { setError('No department selected.'); setLoading(false); return; }
            if (!userProfile?.institutionId) { setError('Could not load user profile.'); setLoading(false); return; }

            setLoading(true);
            try {
                const institutions = await getInstitutions();
                const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                const currentDept = currentInstitution?.departments.find(dept => dept.id === departmentId);
                if (currentDept) {
                    setDepartment(currentDept);
                } else {
                    setError(`Department not found.`);
                }
            } catch (err) {
                setError('Failed to fetch department details.');
            } finally {
                setLoading(false);
            }
        }
        fetchDepartment();
    }, [departmentId, userProfile, userProfileLoading]);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraLive(false);
    }, []);

    const startCamera = useCallback(async () => {
        if (isCameraLive) return;
        setStatusMessage('Starting camera...');
        setStatus('verifying');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsCameraLive(true);
                setStatus('instructions');
                setStatusMessage('Point your camera at the classroom.');
            }
        } catch (err) {
            setStatusMessage(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setStatus('failed');
            setIsCameraLive(false);
        }
    }, [isCameraLive]);

    useEffect(() => {
        // Cleanup camera on component unmount
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleClassroomConfirmation = () => {
        setStatus('verifying');
        setStatusMessage('Classroom confirmed! Redirecting...');
        stopCamera();
        
        setTimeout(() => {
            setStatus('success');
            router.push(`/verify-face?deptId=${departmentId}`);
        }, 1500);
    };

    const handleVerifyCode = async () => {
        if (!verificationCode || !userProfile?.institutionId || !departmentId) return;
        setIsVerifyingCode(true);
        setStatusMessage("Verifying code...");
        setStatus('verifying');

        try {
            const result = await verifyClassroomCode(userProfile.institutionId, departmentId, verificationCode);
            if (result.success) {
                setStatusMessage(result.message + " Redirecting...");
                setStatus('success');
                setTimeout(() => router.push(`/verify-face?deptId=${departmentId}`), 1500);
            } else {
                setStatusMessage(result.message);
                setStatus('failed');
                toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            setStatusMessage("An error occurred during code verification.");
            setStatus('failed');
        } finally {
            setIsVerifyingCode(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-2/3 mx-auto" />
                <Skeleton className="h-16 w-full max-w-lg mx-auto" />
                <div className="max-w-2xl mx-auto"><Skeleton className="h-64 w-full" /></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 sm:p-6 text-center">
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const cameraFrameColor = cn("aspect-video w-full mx-auto bg-muted rounded-lg flex items-center justify-center overflow-hidden relative border-4 transition-colors",
        { "border-muted": status === 'pending' || status === 'instructions',
          "border-primary": status === 'verifying',
          "border-green-500": status === 'success',
          "border-destructive": status === 'failed' });

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ATTENDANCE VERIFICATION</h1>
                {department && (
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-muted-foreground">Department: {department.name}</p>
                        <VerificationInfoDialog department={department} userProfile={userProfile}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Info className="h-4 w-4" />
                            </Button>
                        </VerificationInfoDialog>
                    </div>
                )}
            </div>

            <VerificationSteps currentStep={1} />
            
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Step 2: Classroom Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[250px] flex flex-col items-center justify-center gap-4 text-center">
                        {status === 'pending' && !showCodeInput && (
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-muted-foreground">Confirm you are in the classroom using your camera or a code from your teacher.</p>
                                <Button onClick={startCamera}>Start Camera Verification</Button>
                                <Button variant="link" onClick={() => setShowCodeInput(true)}>Enter Code Instead</Button>
                            </div>
                        )}
                        {showCodeInput && (
                             <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                <p className="text-muted-foreground font-medium">Enter the 6-digit code provided by your teacher.</p>
                                <Input 
                                    type="text"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="text-center text-2xl tracking-widest font-mono"
                                    placeholder="_ _ _ _ _ _"
                                />
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <Button onClick={handleVerifyCode} disabled={isVerifyingCode || verificationCode.length !== 6} className="w-full">
                                        {isVerifyingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                        Verify Code
                                    </Button>
                                    <Button variant="link" onClick={() => { setShowCodeInput(false); setStatus('pending'); setStatusMessage('') }} disabled={isVerifyingCode}>
                                        Use Camera Instead
                                    </Button>
                                </div>
                            </div>
                        )}
                        {(status === 'verifying' || status === 'instructions' || isCameraLive) && !showCodeInput && (
                             <div className="w-full">
                                <div className={cameraFrameColor}>
                                    {!isCameraLive && status !== 'failed' && (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <p>{statusMessage || "Preparing camera..."}</p>
                                        </div>
                                    )}
                                    <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover", !isCameraLive && "hidden")}/>
                                </div>
                                {status === 'instructions' && isCameraLive && (
                                     <Button onClick={handleClassroomConfirmation} className="mt-4">Confirm I'm in the Classroom</Button>
                                )}
                             </div>
                        )}
                        {(status === 'success' || status === 'failed') && !isCameraLive && (
                            <>
                                {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                                {status === 'failed' && !showCodeInput && <XCircle className="h-12 w-12 text-destructive" />}
                                <p className="text-muted-foreground font-medium">{statusMessage}</p>
                                {status === 'failed' && (
                                    <div className="flex gap-2">
                                        <Button onClick={() => setStatus('pending')}>Try Again</Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
