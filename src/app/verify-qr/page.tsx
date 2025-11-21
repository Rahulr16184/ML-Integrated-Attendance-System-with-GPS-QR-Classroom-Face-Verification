
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions, verifyQrToken } from '@/services/institution-service';
import type { Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, QrCode, Info, ScanLine } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { VerificationSteps } from '@/components/verification-steps';
import { cn } from '@/lib/utils';
import { VerificationInfoDialog } from '@/components/verification-info-dialog';
import { useToast } from '@/hooks/use-toast';
import jsQR from "jsqr";

export default function VerifyQrPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile, loading: userProfileLoading } = useUserProfile();
    const { toast } = useToast();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [status, setStatus] = useState<'pending' | 'scanning' | 'verifying' | 'success' | 'failed'>('pending');
    const [statusMessage, setStatusMessage] = useState('Click "Start Scan" to begin.');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isCameraLive, setIsCameraLive] = useState(false);

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
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraLive(false);
    }, []);

    const handleVerification = useCallback(async (token: string) => {
        if (!userProfile?.institutionId || !departmentId) return;

        stopCamera();
        setStatus('verifying');
        setStatusMessage('Validating token...');

        try {
            const result = await verifyQrToken(userProfile.institutionId, departmentId, token);
            if (result.success) {
                setStatus('success');
                setStatusMessage('QR Code Validated! Redirecting...');
                toast({ title: "Success", description: result.message });
                setTimeout(() => {
                    router.push(`/verify-face?deptId=${departmentId}&mode=2`);
                }, 1500);
            } else {
                setStatus('failed');
                setStatusMessage(result.message);
                toast({ title: "Invalid QR Code", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            setStatus('failed');
            setStatusMessage("An error occurred during verification.");
            toast({ title: "Error", description: "Could not verify the token.", variant: "destructive" });
        }
    }, [userProfile?.institutionId, departmentId, stopCamera, toast, router]);
    

    const tick = useCallback(() => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });

            if (context) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                if (code) {
                    handleVerification(code.data);
                }
            }
        }
    }, [handleVerification]);
    
    const startCamera = useCallback(async () => {
        if (isCameraLive) return;
        setStatus('scanning');
        setStatusMessage('Starting camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsCameraLive(true);
                setStatusMessage('Point your camera at the QR code.');
                scanIntervalRef.current = setInterval(tick, 200); // Scan every 200ms
            }
        } catch (err) {
            setStatusMessage(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setStatus('failed');
            setIsCameraLive(false);
        }
    }, [isCameraLive, tick]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

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
        { "border-muted": status === 'pending',
          "border-primary": status === 'scanning' || status === 'verifying',
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

            <VerificationSteps currentStep={0} mode={2} />
            
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Step 1: QR Code Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-center">
                        <div className={cameraFrameColor}>
                             {status === 'pending' && <QrCode className="h-12 w-12 text-muted-foreground"/>}
                             {status === 'verifying' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
                             {(status === 'failed' && !isCameraLive) && <XCircle className="h-12 w-12 text-destructive" />}
                             {(status === 'success' && !isCameraLive) && <CheckCircle className="h-12 w-12 text-green-500" />}

                            <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraLive && "hidden")} />
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {isCameraLive && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-2/3 h-2/3 relative">
                                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="font-medium text-muted-foreground">{statusMessage}</p>

                        {status === 'pending' && <Button onClick={startCamera}><ScanLine className="mr-2 h-4 w-4"/>Start Scan</Button>}
                        {status === 'failed' && <Button onClick={startCamera} variant="outline">Try Again</Button>}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
