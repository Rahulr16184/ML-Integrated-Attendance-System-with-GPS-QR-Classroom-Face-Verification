

"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/user-service';
import { addAttendanceRecord } from '@/services/attendance-service';
import type { AttendanceLog } from '@/lib/types';

const SIMILARITY_THRESHOLD = 0.55;
const SMILE_THRESHOLD = 0.8;

export default function VerifyFacePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const departmentId = searchParams.get('deptId');
    const mode = searchParams.get('mode') === '2' ? 2 : 1;
    const { userProfile, loading: userProfileLoading } = useUserProfile();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isCameraLive, setIsCameraLive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [userDescriptor, setUserDescriptor] = useState<Float32Array | null>(null);
    
    const [status, setStatus] = useState<'pending' | 'scanning' | 'liveness' | 'positioning' | 'success' | 'failed'>('pending');
    const [feedbackMessage, setFeedbackMessage] = useState('Click "Start Scan" to begin.');
    const [similarity, setSimilarity] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [finalCapture, setFinalCapture] = useState<string | null>(null);
    
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

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

    const captureFinalImage = useCallback(() => {
        if (videoRef.current && userProfile && department) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext("2d");
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUri = canvas.toDataURL("image/jpeg");
                setFinalCapture(dataUri);

                stopCamera();

                (async () => {
                    try {
                        const imageUrl = await uploadImage(dataUri);
                        const record: Omit<AttendanceLog, 'id'> = {
                            studentId: userProfile.uid,
                            studentName: userProfile.name,
                            date: new Date().toISOString(),
                            departmentId: department.id,
                            mode: mode,
                            status: 'Present',
                            verificationPhotoUrl: imageUrl,
                            markedBy: 'student',
                        };
                        await addAttendanceRecord(userProfile.uid, record);
                        toast({
                            title: "Attendance Logged!",
                            description: "Your attendance has been recorded with a verification photo.",
                        });
                        setStatus('success');
                    } catch (e) {
                         toast({
                            title: "Save Failed",
                            description: "Could not save your attendance record. Please try again.",
                            variant: 'destructive'
                        });
                        setStatus('failed');
                    }
                })();
            }
        }
    }, [stopCamera, toast, userProfile, department, mode]);
    
    useEffect(() => {
        let countdownInterval: NodeJS.Timeout | null = null;
        if (status === 'positioning') {
            stopDetection();
            countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval!);
                        captureFinalImage();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (countdownInterval) clearInterval(countdownInterval);
        };
    }, [status, stopDetection, captureFinalImage]);
    
    const detectFace = useCallback(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !areModelsLoaded() || !userDescriptor || videoRef.current.readyState < 3) {
            return;
        }
        
        const faceapi = await getFaceApi();
        const currentStatus = statusRef.current;

        if (currentStatus === 'scanning') {
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
            if (detection) {
                const distance = faceapi.euclideanDistance(detection.descriptor, userDescriptor);
                const currentSimilarity = 1 - distance; 
                setSimilarity(currentSimilarity);

                if (currentSimilarity > SIMILARITY_THRESHOLD) {
                    setFeedbackMessage('Face verified! Now for liveness...');
                    setStatus('liveness');
                } else {
                     setFeedbackMessage('Verifying similarity...');
                }
            } else {
                setSimilarity(0);
                setFeedbackMessage("No face detected. Please center your face.");
            }
        } else if (currentStatus === 'liveness') {
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceExpressions();
            if (!detection) {
                setFeedbackMessage("Keep your face in the frame.");
                return;
            }

            if (detection.expressions.happy > SMILE_THRESHOLD) {
                setStatus('positioning');
                setFeedbackMessage("Great! Now hold your pose for the final photo.");
            } else {
                setFeedbackMessage("Please Smile!");
            }
        }
    }, [userDescriptor]);


    const startCamera = useCallback(async () => {
        if (isCameraLive || !userDescriptor) return;
        setStatus('scanning');
        setFeedbackMessage('Starting camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play();
                        setIsCameraLive(true);
                        setFeedbackMessage('Center your face in the frame.');
                        if (!detectionIntervalRef.current) {
                            detectionIntervalRef.current = setInterval(detectFace, 500);
                        }
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
                    <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Attendance Logged!</span>
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
                        <span className="font-semibold">{feedbackMessage}</span>
                    </div>
                </div>
            );
        }

        if (status === 'positioning') {
            return (
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Frame your face with the classroom in the background.</p>
                    <p className="text-2xl font-bold">{countdown}</p>
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

    const currentStepIndex = mode === 1 ? 2 : 1;

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

            <VerificationSteps currentStep={currentStepIndex} mode={mode} />

            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Step {currentStepIndex + 1}: Face & Liveness Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                        <div className={cn(
                            "aspect-square w-64 bg-muted rounded-full flex items-center justify-center overflow-hidden relative border-4 transition-colors",
                            { "border-muted": status === 'pending',
                              "border-primary": status === 'scanning' || status === 'liveness' || status === 'positioning',
                              "border-green-500": status === 'success',
                              "border-destructive": status === 'failed' }
                        )}>
                           <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover transform -scale-x-100", !isCameraLive && "hidden")}/>
                           {!isCameraLive && finalCapture && (
                               <Image src={finalCapture} alt="Final capture" layout="fill" className="object-cover transform -scale-x-100" />
                           )}
                           {!isCameraLive && !finalCapture && status === 'success' && (
                               <CheckCircle className="h-24 w-24 text-green-500" />
                           )}
                           {!isCameraLive && status === 'pending' && (
                                <UserCheck className="h-24 w-24 text-muted-foreground/50"/>
                           )}
                           {!isCameraLive && status === 'failed' && (
                                <XCircle className="h-24 w-24 text-destructive"/>
                           )}
                           {status === 'positioning' && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                   <span className="text-white text-6xl font-bold drop-shadow-lg">{countdown}</span>
                               </div>
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
