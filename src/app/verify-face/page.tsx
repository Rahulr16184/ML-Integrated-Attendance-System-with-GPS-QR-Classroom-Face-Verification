
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
import { Loader2, UserCheck, Info, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { VerificationSteps } from '@/components/verification-steps';
import { cn } from '@/lib/utils';
import { VerificationInfoDialog } from '@/components/verification-info-dialog';
import { getFaceApi, areModelsLoaded } from '@/lib/face-api';
import { Progress } from '@/components/ui/progress';

const SIMILARITY_THRESHOLD = 0.55; // Threshold for face match (face-api.js L2 distance, lower is better)
const EXPRESSION_THRESHOLD = 0.7; // Threshold for smile/blink detection (confidence)

// Correctly defines the structure of the cached data
type CachedDescriptor = {
  descriptor: number[];
  metadata: {
    source: string;
    createdAt: number;
  }
}

export default function VerifyFacePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile, loading: userProfileLoading } = useUserProfile();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isCameraLive, setIsCameraLive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [userDescriptor, setUserDescriptor] = useState<Float32Array | null>(null);

    const [status, setStatus] = useState<'pending' | 'scanning' | 'verified' | 'liveness_challenge' | 'liveness_verified' | 'failed'>('pending');
    const [feedbackMessage, setFeedbackMessage] = useState('Click "Start Scan" to begin.');
    const [similarity, setSimilarity] = useState<number | null>(null);

    const [livenessChallenge, setLivenessChallenge] = useState<'blink' | 'smile' | null>(null);
    const [livenessPrompt, setLivenessPrompt] = useState('');

    useEffect(() => {
        async function fetchInitialData() {
            if (userProfileLoading) return;
            if (!departmentId) { setError('No department selected.'); setLoading(false); return; }
            if (!userProfile) { setError('Could not load user profile.'); setLoading(false); return; }

            setLoading(true);
            try {
                const institutions = await getInstitutions();
                const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                const currentDept = currentInstitution?.departments.find(dept => dept.id === departmentId);
                if (currentDept) setDepartment(currentDept);
                else { setError(`Department not found.`); setLoading(false); return; }

                setFeedbackMessage("Loading AI models...");
                await getFaceApi(); 
                
                // ** THE CRITICAL FIX IS HERE **
                // Correctly retrieve and parse the cached descriptor from sessionStorage.
                const cachedItemRaw = sessionStorage.getItem(`system-cache-v1-${userProfile.uid}`);
                if (cachedItemRaw) {
                    const cachedItem = JSON.parse(cachedItemRaw) as CachedDescriptor;
                    if (cachedItem?.descriptor) {
                        setUserDescriptor(new Float32Array(cachedItem.descriptor));
                        setFeedbackMessage('Models loaded. Ready to scan.');
                    } else {
                        setError("Your profile photo hasn't been analyzed. Please go to your profile, set a picture, and run the System Update.");
                    }
                } else {
                    setError("Your profile photo hasn't been analyzed. Please go to your profile, set a picture, and run the System Update.");
                }

            } catch (err) {
                console.error("Error during initial data fetch:", err);
                setError('Failed to load verification data. Please try again.');
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, [departmentId, userProfile, userProfileLoading]);

    const stopDetection = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
    }, []);

    const stopCamera = useCallback(() => {
        stopDetection();
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraLive(false);
    }, [stopDetection]);

    const startLivenessChallenge = () => {
        setStatus('liveness_challenge');
        const challenge = Math.random() > 0.5 ? 'blink' : 'smile';
        setLivenessChallenge(challenge);
        setLivenessPrompt(challenge === 'blink' ? 'Please Blink Now' : 'Please Smile Now');
        // Restart detection for expressions
        detectionIntervalRef.current = setInterval(detectFace, 500);
    }
    
    const detectFace = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !areModelsLoaded()) return;
        const faceapi = await getFaceApi();

        if (status === 'scanning' && userDescriptor) {
            const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
            if (detections) {
                setFeedbackMessage("Verifying...");
                const distance = faceapi.euclideanDistance(detections.descriptor, userDescriptor);
                const currentSimilarity = 1 - distance; 
                setSimilarity(currentSimilarity);

                if (distance < SIMILARITY_THRESHOLD) {
                    setStatus('verified');
                    setFeedbackMessage('Face Verified!');
                    stopDetection(); // Stop similarity check
                    setTimeout(startLivenessChallenge, 1000); // Start liveness check after a short delay
                }
            } else {
                setFeedbackMessage("No face detected.");
                setSimilarity(0);
            }
        } 
        else if (status === 'liveness_challenge' && livenessChallenge) {
             const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceExpressions();
             if (detections) {
                 if (livenessChallenge === 'smile' && detections.expressions.happy > EXPRESSION_THRESHOLD) {
                     setStatus('liveness_verified');
                     setFeedbackMessage('Liveness Verified!');
                     stopCamera();
                 }
                 if (livenessChallenge === 'blink') {
                     // For demo purposes, let's assume any neutral face can be a "blink"
                     if(detections.expressions.neutral > 0.8) {
                        setStatus('liveness_verified');
                        setFeedbackMessage('Liveness Verified!');
                        stopCamera();
                     }
                 }
             }
        }
    };

    const startCamera = useCallback(async () => {
        if (isCameraLive || !userDescriptor) return;
        setStatus('scanning');
        setFeedbackMessage('Starting camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsCameraLive(true);
                setFeedbackMessage('Center your face in the frame.');
                detectionIntervalRef.current = setInterval(detectFace, 500);
            }
        } catch (err) {
            setError(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setStatus('failed');
            setIsCameraLive(false);
        }
    }, [isCameraLive, userDescriptor]);
    
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const renderVerificationStatus = () => {
        const percentage = similarity === null ? 0 : Math.max(0, Math.min(100, Math.round(similarity * 100)));

        if (status === 'scanning') {
            return (
                 <div className="w-full max-w-xs text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{feedbackMessage}</p>
                    <Progress value={percentage} />
                    <p className="text-sm font-medium">{percentage}% Match</p>
                </div>
            )
        }
        if (status === 'verified' || status === 'liveness_challenge' || status === 'liveness_verified') {
            return (
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Face Verified!</span>
                    </div>
                     {status === 'liveness_challenge' && (
                        <div className="flex items-center justify-center gap-2 text-primary pt-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-semibold">{livenessPrompt}</span>
                        </div>
                    )}
                    {status === 'liveness_verified' && (
                        <div className="flex items-center justify-center gap-2 text-green-600 pt-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Liveness Verified!</span>
                        </div>
                    )}
                </div>
            )
        }
        
        return <p className="text-muted-foreground text-sm">{feedbackMessage}</p>;
    }

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

            <VerificationSteps currentStep={2} />

            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Step 3: Face Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                        <div className={cn(
                            "aspect-square w-64 bg-muted rounded-full flex items-center justify-center overflow-hidden relative border-4 transition-colors",
                            { "border-muted": status === 'pending',
                              "border-primary": status === 'scanning' || status === 'liveness_challenge',
                              "border-green-500": status === 'verified' || status === 'liveness_verified',
                              "border-destructive": status === 'failed' }
                        )}>
                           <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover transform -scale-x-100", !isCameraLive && "hidden")}/>
                           {!isCameraLive && (status === 'liveness_verified' || status === 'verified') && (
                               <CheckCircle className="h-24 w-24 text-green-500" />
                           )}
                           {!isCameraLive && status === 'pending' && (
                                <UserCheck className="h-24 w-24 text-muted-foreground/50"/>
                           )}
                        </div>
                        
                        {!isCameraLive && status === 'pending' && (
                             <Button onClick={startCamera} disabled={!userDescriptor}>
                                {userDescriptor ? 'Start Scan' : <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {userDescriptor ? 'Start Scan' : 'Loading...'}
                             </Button>
                        )}

                        <div className="h-16 mt-2 flex flex-col justify-center items-center">
                            {renderVerificationStatus()}
                        </div>
                         {status === 'liveness_verified' && (
                             <Button onClick={() => router.push('/student-dashboard')}>Done</Button>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    