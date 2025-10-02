
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions } from '@/services/institution-service';
import type { Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, UserCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getFaceApi } from '@/lib/face-api';
import { getCachedDescriptor } from '@/services/system-cache-service';
import { VerificationSteps } from '@/components/verification-steps';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const FACE_MATCH_THRESHOLD = 0.45; // Stricter for user's own face

export default function VerifyFacePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile, loading: userProfileLoading } = useUserProfile();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [status, setStatus] = useState<'pending' | 'instructions' | 'verifying' | 'success' | 'failed'>('pending');
    const [statusMessage, setStatusMessage] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraLive, setIsCameraLive] = useState(false);
    const [userProfileDescriptor, setUserProfileDescriptor] = useState<Float32Array | null>(null);

    useEffect(() => {
        async function fetchInitialData() {
            if (userProfileLoading) return;
            if (!departmentId) { setError('No department selected.'); setLoading(false); return; }
            if (!userProfile?.institutionId) { setError('Could not load user profile.'); setLoading(false); return; }

            setLoading(true);
            try {
                await getFaceApi();
                const institutions = await getInstitutions();
                const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                const currentDept = currentInstitution?.departments.find(dept => dept.id === departmentId);
                if (currentDept) setDepartment(currentDept);
                else setError(`Department not found.`);

                const cachedDescriptor = getCachedDescriptor('userProfileImage');
                if (cachedDescriptor) {
                    const descriptorArray = JSON.parse(new TextDecoder().decode(cachedDescriptor));
                    setUserProfileDescriptor(new Float32Array(descriptorArray));
                } else {
                    setError('User profile face data not found. Please set a profile picture.');
                }
            } catch (err) {
                setError('Failed to fetch data or load models.');
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
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
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsCameraLive(true);
                setStatus('instructions');
                setStatusMessage('Center your face in the frame.');
            }
        } catch (err) {
            setStatusMessage(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setStatus('failed');
            setIsCameraLive(false);
        }
    }, [isCameraLive]);
    
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);
    
    const handleFaceVerification = useCallback(async () => {
        if (!userProfileDescriptor) {
            setStatusMessage('User profile data not found for verification.');
            setStatus('failed');
            return;
        }
        if (!videoRef.current || !isCameraLive) {
            setStatusMessage('Camera not ready. Please try again.');
            setStatus('failed');
            return;
        }
        
        setStatus('verifying');
        setStatusMessage('Analyzing face...');
        const faceapi = await getFaceApi();

        const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            const faceMatcher = new faceapi.FaceMatcher(userProfileDescriptor);
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            
            if (bestMatch.label !== 'unknown' && 1 - bestMatch.distance > FACE_MATCH_THRESHOLD) {
                setStatusMessage(`Face verified successfully! Attendance marked.`);
                setStatus('success');
                stopCamera();
            } else {
                setStatusMessage(`Face does not match profile. Please try again.`);
                setStatus('failed');
            }
        } else {
            setStatusMessage('No face detected. Please position your face in the center.');
            setStatus('failed');
        }
    }, [isCameraLive, userProfileDescriptor, stopCamera]);

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

    const cameraFrameColor = cn("aspect-square w-full max-w-sm mx-auto bg-muted rounded-full flex items-center justify-center overflow-hidden relative border-4 transition-colors",
        { "border-muted": status === 'pending' || status === 'instructions',
          "border-primary": status === 'verifying',
          "border-green-500": status === 'success',
          "border-destructive": status === 'failed' });

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ATTENDANCE VERIFICATION</h1>
                {department && <p className="text-muted-foreground">Department: {department.name}</p>}
            </div>

            <VerificationSteps currentStep={2} />

            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Step 3: Face Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[350px] flex flex-col items-center justify-center gap-4 text-center">
                        {status === 'pending' && (
                             <Button onClick={startCamera} disabled={!userProfileDescriptor}>
                                {userProfileDescriptor ? "Start Face Verification" : "Loading Profile..."}
                            </Button>
                        )}

                        {isCameraLive && (
                             <div className="w-full">
                                <div className={cameraFrameColor}>
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"/>
                                </div>
                             </div>
                        )}

                        {status === 'instructions' && isCameraLive && (
                             <Button onClick={handleFaceVerification}>Scan My Face</Button>
                        )}
                        
                        {(status === 'verifying' || status === 'failed' || status === 'success') && !isCameraLive && (
                             <>
                                {status === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                                {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                                {status === 'failed' && <XCircle className="h-12 w-12 text-destructive" />}
                                <p className="font-semibold">{statusMessage}</p>
                                {status === 'failed' && (
                                     <Button onClick={startCamera}><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
                                )}
                                {status === 'success' && (
                                     <Button asChild><Link href="/student-dashboard">Go to Dashboard</Link></Button>
                                )}
                             </>
                        )}
                         
                         {statusMessage && isCameraLive && (
                             <p className="text-muted-foreground font-medium">{statusMessage}</p>
                         )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
