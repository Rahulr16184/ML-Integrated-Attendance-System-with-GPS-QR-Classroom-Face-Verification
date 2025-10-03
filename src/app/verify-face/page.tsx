
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
import { getCachedDescriptor } from '@/services/system-cache-service';

const SIMILARITY_THRESHOLD = 0.55;
const SMILE_THRESHOLD = 0.75;
const EAR_THRESHOLD = 0.2; // Eye Aspect Ratio threshold for blink detection
const LIVENESS_CHALLENGES = ['smile', 'blink'] as const;

type LivenessChallenge = (typeof LIVENESS_CHALLENGES)[number];

// Function to calculate Eye Aspect Ratio
const getEAR = (landmarks: any) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    const ear = (eye: any[]) => {
        const A = dist(eye[1], eye[5]);
        const B = dist(eye[2], eye[4]);
        const C = dist(eye[0], eye[3]);
        return (A + B) / (2.0 * C);
    };

    return (ear(leftEye) + ear(rightEye)) / 2.0;
};


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

    const [status, setStatus] = useState<'pending' | 'scanning' | 'liveness' | 'success' | 'failed'>('pending');
    const [feedbackMessage, setFeedbackMessage] = useState('Click "Start Scan" to begin.');
    const [similarity, setSimilarity] = useState<number | null>(null);
    const [livenessChallenge, setLivenessChallenge] = useState<LivenessChallenge | null>(null);
    
    const earHistory = useRef<number[]>([]);

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
                
                const cachedDescriptorArray = getCachedDescriptor(userProfile.uid);
                if (cachedDescriptorArray) {
                    // **CRITICAL FIX**: Reconstruct the Float32Array from the cached plain array.
                    setUserDescriptor(new Float32Array(cachedDescriptorArray));
                    setFeedbackMessage('Models loaded. Ready to scan.');
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
    
    const detectFace = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !areModelsLoaded() || !userDescriptor || videoRef.current.readyState < 3) return;
        
        const faceapi = await getFaceApi();
        const currentStatus = statusRef.current; // Use a ref to get the latest status inside the interval

        if (currentStatus === 'scanning') {
            const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
            if (detections) {
                const distance = faceapi.euclideanDistance(detections.descriptor, userDescriptor);
                const currentSimilarity = 1 - distance; 
                setSimilarity(currentSimilarity);

                if (currentSimilarity > SIMILARITY_THRESHOLD) {
                    const challenge = LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)];
                    setStatus('liveness');
                    setLivenessChallenge(challenge);
                    if (challenge === 'blink') earHistory.current = []; // Reset blink history
                } else {
                     setFeedbackMessage('Verifying similarity...');
                }
            } else {
                setSimilarity(0);
                setFeedbackMessage("No face detected.");
            }
        } else if (currentStatus === 'liveness') {
            const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceExpressions();
            if (!detections) {
                setFeedbackMessage("Keep your face in the frame.");
                return;
            }

            if (livenessChallenge === 'smile') {
                if (detections.expressions.happy > SMILE_THRESHOLD) {
                    setStatus('success');
                } else {
                    setFeedbackMessage("Please Smile!");
                }
            } else if (livenessChallenge === 'blink') {
                const currentEAR = getEAR(detections.landmarks);
                earHistory.current.push(currentEAR);
                if (earHistory.current.length > 5) earHistory.current.shift(); // Keep a short history

                const maxEAR = Math.max(...earHistory.current);
                if (maxEAR > 0.25 && currentEAR < EAR_THRESHOLD) { 
                    setStatus('success');
                } else {
                    setFeedbackMessage("Please Blink!");
                }
            }
        }
    };
    
    // Use a ref to track the status for the interval callback
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);


    const startCamera = useCallback(async () => {
        if (isCameraLive || !userDescriptor) return;
        setStatus('scanning');
        setFeedbackMessage('Starting camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsCameraLive(true);
                    setFeedbackMessage('Center your face in the frame.');
                    // **CRITICAL FIX**: Start detection only after video is ready.
                    if (!detectionIntervalRef.current) {
                        detectionIntervalRef.current = setInterval(detectFace, 500);
                    }
                }
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setStatus('failed');
            setIsCameraLive(false);
        }
    }, [isCameraLive, userDescriptor, detectFace]);
    
    useEffect(() => {
        if (status === 'success') {
            stopCamera();
        }
    }, [status, stopCamera]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const renderFeedback = () => {
        if (status === 'success') {
            return (
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Face Verified!</span>
                    </div>
                     <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Liveness Verified!</span>
                    </div>
                </div>
            );
        }
        
        if (status === 'scanning') {
            const percentage = similarity === null ? 0 : Math.max(0, Math.min(100, Math.round(similarity * 100)));
            return (
                 <div className="w-full max-w-xs text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{feedbackMessage}</p>
                    <Progress value={percentage} />
                    <p className="text-sm font-medium">{percentage}% Match</p>
                </div>
            )
        }
        
        if (status === 'liveness') {
            return (
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Face Verified!</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                         <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-semibold">{livenessChallenge === 'smile' ? "Now, Please Smile" : "Now, Please Blink"}</span>
                    </div>
                </div>
            );
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
                            Step 3: Face & Liveness Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                        <div className={cn(
                            "aspect-square w-64 bg-muted rounded-full flex items-center justify-center overflow-hidden relative border-4 transition-colors",
                            { "border-muted": status === 'pending',
                              "border-primary": status === 'scanning' || status === 'liveness',
                              "border-green-500": status === 'success',
                              "border-destructive": status === 'failed' }
                        )}>
                           <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover transform -scale-x-100", !isCameraLive && "hidden")}/>
                           {!isCameraLive && status === 'success' && (
                               <CheckCircle className="h-24 w-24 text-green-500" />
                           )}
                           {!isCameraLive && status === 'pending' && (
                                <UserCheck className="h-24 w-24 text-muted-foreground/50"/>
                           )}
                           {!isCameraLive && status === 'failed' && (
                                <XCircle className="h-24 w-24 text-destructive"/>
                           )}
                        </div>
                        
                        {!isCameraLive && status === 'pending' && (
                             <Button onClick={startCamera} disabled={!userDescriptor}>
                                {userDescriptor ? 'Start Scan' : <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {userDescriptor ? 'Start Scan' : 'Loading...'}
                             </Button>
                        )}

                        <div className="h-20 mt-2 flex flex-col justify-center items-center">
                            {renderFeedback()}
                        </div>
                         {status === 'success' && (
                             <Button onClick={() => router.push('/student-dashboard')}>Done</Button>
                         )}
                         {status === 'failed' && (
                              <Button onClick={startCamera} variant="outline">Try Again</Button>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
