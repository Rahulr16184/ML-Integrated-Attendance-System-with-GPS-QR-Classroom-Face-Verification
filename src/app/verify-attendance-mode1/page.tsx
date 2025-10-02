

"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions, verifyClassroomCode } from '@/services/institution-service';
import type { Department, ClassroomPhoto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, MapPin, Camera, UserCheck, ArrowUp, KeyRound, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { LatLngExpression } from 'leaflet';
import { Progress } from '@/components/ui/progress';
import { getFaceApi } from '@/lib/face-api';
import { getCachedDescriptor } from '@/services/system-cache-service';
import { updateClassroomDescriptorsCache, getClassroomCacheStatus } from '@/services/system-cache-service';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { VerificationInfoDialog } from '@/components/verification-info-dialog';


const STEPS = [
    { id: 'gps', title: 'GPS', icon: MapPin },
    { id: 'classroom', title: 'Classroom', icon: Camera },
    { id: 'face', title: 'Face', icon: UserCheck },
];

const getDistance = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const R = 6371e3; // metres
    const φ1 = from.lat * Math.PI / 180;
    const φ2 = to.lat * Math.PI / 180;
    const Δφ = (to.lat - from.lat) * Math.PI / 180;
    const Δλ = (to.lng - from.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

const getBearing = (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
    const toRadians = (deg: number) => deg * Math.PI / 180;
    const toDegrees = (rad: number) => rad * 180 / Math.PI;

    const startLat = toRadians(start.lat);
    const startLng = toRadians(start.lng);
    const endLat = toRadians(end.lat);
    const endLng = toRadians(end.lng);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    let brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    return (brng + 360) % 360;
};

const CLASSROOM_VERIFICATION_PROMPTS = ['left', 'right', 'front'];
const SCAN_DURATION = 5; // seconds
const SIMILARITY_THRESHOLD = 0.5; // Adjust as needed (0 to 1)
const FACE_MATCH_THRESHOLD = 0.45; // Stricter for user's own face

export default function VerifyAttendanceMode1Page() {
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile, loading: userProfileLoading } = useUserProfile();
    const { toast } = useToast();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [stepStatus, setStepStatus] = useState<'pending' | 'verifying' | 'success' | 'failed' | 'instructions'>('pending');
    const [statusMessage, setStatusMessage] = useState('');
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
    const [arrowRotation, setArrowRotation] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Classroom verification state
    const [isCameraLive, setIsCameraLive] = useState(false);
    const [classroomVerificationSubstep, setClassroomVerificationSubstep] = useState(0);
    const [scanCountdown, setScanCountdown] = useState(SCAN_DURATION);
    const [isScanning, setIsScanning] = useState(false);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [referenceDescriptors, setReferenceDescriptors] = useState<Float32Array[]>([]);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [userProfileDescriptor, setUserProfileDescriptor] = useState<Float32Array | null>(null);


    const Map = useMemo(() => dynamic(() => import('@/components/map'), { 
        loading: () => <Skeleton className="h-full w-full" />,
        ssr: false 
    }), []);

    // Load Department Details & User Profile Descriptor
    useEffect(() => {
        async function fetchInitialData() {
            if (userProfileLoading) return;
            
            if (!departmentId) {
                setError('No department selected.');
                setLoading(false);
                return;
            }

            if (userProfile?.institutionId) {
                setLoading(true);
                try {
                    await getFaceApi(); // Ensure models are loaded before anything else
                    const institutions = await getInstitutions();
                    const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                    const currentDept = currentInstitution?.departments.find(dept => dept.id === departmentId);

                    if (currentDept) {
                        setDepartment(currentDept);
                        const status = await getClassroomCacheStatus(currentDept);
                        if(status.needsUpdate) {
                           await updateClassroomDescriptorsCache(currentDept);
                        }
                        const cachedClassroomDescriptors = getCachedDescriptor(`classroom_${currentDept.id}`);
                        if (cachedClassroomDescriptors) {
                             const flatDescriptors = JSON.parse(new TextDecoder().decode(cachedClassroomDescriptors));
                             setReferenceDescriptors(flatDescriptors.map((d: number[]) => new Float32Array(d)));
                        }
                        setError(null);
                    } else {
                        setError(`Department not found.`);
                        setDepartment(null);
                    }

                    // Load user profile descriptor
                    const cachedProfileDescriptor = getCachedDescriptor('userProfileImage');
                    if (cachedProfileDescriptor) {
                        const descriptorArray = JSON.parse(new TextDecoder().decode(cachedProfileDescriptor));
                        setUserProfileDescriptor(new Float32Array(descriptorArray));
                    }

                } catch (err) {
                    setError('Failed to fetch department details.');
                } finally {
                    setLoading(false);
                }
            } else if (!userProfile) {
                 setError('Could not load user profile.');
                 setLoading(false);
            }
        }
        fetchInitialData();
    }, [departmentId, userProfile, userProfileLoading]);


    // Device Orientation Handler
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        const alpha = event.alpha;
        if (alpha !== null) {
            setDeviceHeading(alpha);
        }
    }, []);

    const startGpsVerification = useCallback(() => {
        if (!department) return;

        if (!department?.location?.lat || !department?.location?.lng) {
            setStatusMessage("GPS location for this department is not set. Skipping.");
            setStepStatus('success');
            setTimeout(() => {
                setCurrentStep(1);
                setStepStatus('instructions');
            }, 2000);
            return;
        }

        setStepStatus('verifying');
        setStatusMessage('Getting your location...');
        
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            (DeviceOrientationEvent as any).requestPermission()
                .then((permissionState: string) => {
                    if (permissionState === 'granted') window.addEventListener('deviceorientation', handleOrientation, true);
                }).catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentUserLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(currentUserLocation);
                
                if (department.location) {
                    const distance = getDistance(currentUserLocation, department.location);
                    if (distance <= (department.radius || 100)) {
                        setStatusMessage(`Location verified! You are inside the zone.`);
                        setStepStatus('success');
                        window.removeEventListener('deviceorientation', handleOrientation, true);
                        setTimeout(() => {
                            setCurrentStep(1);
                            setStepStatus('instructions');
                        }, 1500);
                    } else {
                        const bearing = getBearing(currentUserLocation, department.location);
                        if(deviceHeading !== null) setArrowRotation(bearing - deviceHeading);
                        setStatusMessage(`You are ${distance.toFixed(0)}m away. Follow the arrow to get in range.`);
                        setStepStatus('failed');
                    }
                }
            },
            (err) => {
                 let message = `Could not get location: ${err.message}. Please enable location services.`;
                 if(err.code === err.TIMEOUT) {
                    message = "Could not get location: Timeout expired. Please enable location services."
                 }
                setStatusMessage(message);
                setStepStatus('failed');
            }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    }, [department, deviceHeading, handleOrientation]);

    useEffect(() => {
        if (stepStatus === 'failed' && deviceHeading !== null && userLocation && department?.location) {
            const bearing = getBearing(userLocation, department.location);
            setArrowRotation(bearing - deviceHeading);
        }
    }, [deviceHeading, userLocation, department, stepStatus]);
    
    // Camera & Verification Logic
    useEffect(() => {
        if (department?.id) {
            const descriptors = getCachedDescriptor(`classroom_${department.id}`);
            if (descriptors) {
                 const flatDescriptors = JSON.parse(new TextDecoder().decode(descriptors));
                 setReferenceDescriptors(flatDescriptors.map((d: number[]) => new Float32Array(d)));
            }
        }
    }, [department]);


    const startCamera = useCallback(async () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraLive(false);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsCameraLive(true);
            }
        } catch (err) {
            setStatusMessage(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setStepStatus('failed');
        }
    }, []);

    const stopCamera = useCallback(() => {
         if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraLive(false);
        }
    }, []);

    const handleClassroomVerification = useCallback(async () => {
        if (!videoRef.current || !isCameraLive) return;
        setStepStatus('verifying');
        setStatusMessage(`Scanning... Keep the camera steady.`);
        const faceapi = await getFaceApi();

        const detections = await faceapi.detectAllFaces(videoRef.current).withFaceLandmarks().withFaceDescriptors();
        
        let bestMatch = 0;
        if (detections.length > 0 && referenceDescriptors.length > 0) {
            const faceMatcher = new faceapi.FaceMatcher(referenceDescriptors);
            detections.forEach(detection => {
                const match = faceMatcher.findBestMatch(detection.descriptor);
                if (match.distance < bestMatch || bestMatch === 0) {
                    bestMatch = 1 - match.distance; // Higher is better
                }
            });
        }
        
        let userFaceFound = false;
        if (userProfileDescriptor && detections.length > 0) {
             const faceMatcher = new faceapi.FaceMatcher([userProfileDescriptor]);
             detections.forEach(d => {
                 const match = faceMatcher.findBestMatch(d.descriptor);
                 if (match.label !== 'unknown' && 1 - match.distance > FACE_MATCH_THRESHOLD) userFaceFound = true;
             })
        }

        const overallScore = userFaceFound ? (bestMatch + 1) / 2 : bestMatch / 2;

        if (overallScore > SIMILARITY_THRESHOLD) {
            setStatusMessage(`Verification successful for this angle! Score: ${Math.round(overallScore * 100)}%`);
            setStepStatus('success');
            setTimeout(() => {
                setCurrentStep(2);
                setStepStatus('instructions');
                stopCamera();
            }, 2000);
        } else {
            if (classroomVerificationSubstep < CLASSROOM_VERIFICATION_PROMPTS.length - 1) {
                setClassroomVerificationSubstep(prev => prev + 1);
                setStepStatus('instructions');
                setStatusMessage(`Low match. Score: ${Math.round(overallScore * 100)}%. Let's try another angle.`);
            } else {
                setStatusMessage(`Could not verify classroom. Please try again. Score: ${Math.round(overallScore * 100)}%`);
                setStepStatus('failed');
                 stopCamera();
            }
        }
    }, [isCameraLive, referenceDescriptors, classroomVerificationSubstep, stopCamera, userProfileDescriptor]);
    
    const startScan = useCallback(() => {
        setIsScanning(true);
        setScanCountdown(SCAN_DURATION);

        countdownIntervalRef.current = setInterval(() => {
            setScanCountdown(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        scanIntervalRef.current = setTimeout(() => {
            clearInterval(countdownIntervalRef.current!);
            if (currentStep === 1) handleClassroomVerification();
            if (currentStep === 2) handleFaceVerification();
            setIsScanning(false);
        }, SCAN_DURATION * 1000);

    }, [handleClassroomVerification, currentStep]);

    const startClassroomVerification = async () => {
        setShowCodeInput(false);
        setStepStatus('verifying');
        setStatusMessage('Starting camera...');
        await startCamera();
        setStepStatus('instructions');
    }

    const handleVerifyCode = async () => {
        if (!verificationCode || !userProfile?.institutionId || !departmentId) return;
        setIsVerifyingCode(true);
        setStatusMessage("Verifying code...");
        setStepStatus('verifying');

        try {
            const result = await verifyClassroomCode(userProfile.institutionId, departmentId, verificationCode);
            if(result.success) {
                setStatusMessage(result.message);
                setStepStatus('success');
                setTimeout(() => {
                    setCurrentStep(2); // Move to next step
                    setStepStatus('instructions');
                }, 1500);
            } else {
                setStatusMessage(result.message);
                setStepStatus('failed');
                toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            setStatusMessage("An error occurred during code verification.");
            setStepStatus('failed');
        } finally {
            setIsVerifyingCode(false);
        }
    }

    const startFaceVerification = async () => {
        setStepStatus('verifying');
        setStatusMessage('Starting camera for face verification...');
        await startCamera();
        setStepStatus('instructions');
    }

    const handleFaceVerification = useCallback(async () => {
        if (!userProfileDescriptor) {
            setStatusMessage('User profile data not found for verification.');
            setStepStatus('failed');
            return;
        }
        if (!videoRef.current || !isCameraLive) {
            setStatusMessage('Camera not ready. Please try again.');
            setStepStatus('failed');
            return;
        }
        
        setStepStatus('verifying');
        setStatusMessage('Scanning face...');
        const faceapi = await getFaceApi();

        const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            const faceMatcher = new faceapi.FaceMatcher(userProfileDescriptor);
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            
            if (bestMatch.label !== 'unknown' && 1 - bestMatch.distance > FACE_MATCH_THRESHOLD) {
                setStatusMessage(`Face verified successfully! Attendance marked.`);
                setStepStatus('success');
                stopCamera();
                // TODO: Here you would make an API call to record the attendance
            } else {
                setStatusMessage(`Face does not match profile. Please try again.`);
                setStepStatus('failed');
            }
        } else {
            setStatusMessage('No face detected. Please position your face in the center.');
            setStepStatus('failed');
        }

    }, [isCameraLive, userProfileDescriptor, stopCamera]);


    // Effect to trigger verification for the current step
    useEffect(() => {
        if (loading || !department) return;

        if (currentStep === 0 && stepStatus === 'pending') {
            startGpsVerification();
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            if(scanIntervalRef.current) clearTimeout(scanIntervalRef.current);
            if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            stopCamera();
        }
    }, [currentStep, stepStatus, loading, department, startGpsVerification, handleOrientation, stopCamera]);


    const renderStepContent = () => {
        const CurrentIcon = STEPS[currentStep].icon;
        
        const renderGpsContent = () => (
            <>
                <p className="text-muted-foreground font-medium">{statusMessage}</p>
                {stepStatus === 'failed' && (
                    <div className="flex flex-col items-center gap-2 text-sm text-center">
                        <div className="relative flex items-center justify-center h-20 w-20 rounded-full border-2 border-dashed">
                            <ArrowUp className="h-10 w-10 text-primary transition-transform duration-500" style={{ transform: `rotate(${arrowRotation}deg)`}}/>
                        </div>
                        <Button onClick={startGpsVerification}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                    </div>
                )}
            </>
        );

        const renderClassroomContent = () => {
             if (showCodeInput) {
                return (
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
                            <Button variant="link" onClick={() => setShowCodeInput(false)} disabled={isVerifyingCode}>
                                Use Camera Instead
                            </Button>
                        </div>
                    </div>
                )
            }
            if (stepStatus === 'instructions' && !isScanning) {
                return (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground font-medium">{statusMessage || `Point your camera at the ${CLASSROOM_VERIFICATION_PROMPTS[classroomVerificationSubstep]} of the classroom.`}</p>
                        <Button onClick={startScan}>Start {CLASSROOM_VERIFICATION_PROMPTS[classroomVerificationSubstep]} Scan</Button>
                        <Button variant="link" onClick={() => { stopCamera(); setShowCodeInput(true); }}>Enter Code Instead</Button>
                    </div>
                )
            }
             if (stepStatus === 'verifying' && isScanning) {
                return (
                     <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground font-medium">Scanning... Keep camera still for {scanCountdown}s.</p>
                        <Progress value={((SCAN_DURATION - scanCountdown) / SCAN_DURATION) * 100} className="w-full" />
                    </div>
                )
            }
             if (stepStatus === 'verifying' && !isScanning) {
                return <p className="text-muted-foreground font-medium">{statusMessage}</p>
             }

             if (stepStatus === 'failed') {
                 return (
                     <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground font-medium">{statusMessage}</p>
                        <Button onClick={startClassroomVerification}><RefreshCw className="mr-2 h-4 w-4" /> Try Camera Again</Button>
                        <Button variant="link" onClick={() => setShowCodeInput(true)}>Enter Code Instead</Button>
                     </div>
                 )
             }

            return <p className="text-muted-foreground font-medium">{statusMessage}</p>;
        };

        const renderFaceContent = () => {
             if (stepStatus === 'instructions') {
                return (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground font-medium">{statusMessage || 'Center your face in the camera.'}</p>
                        <Button onClick={startScan} disabled={!userProfileDescriptor}>
                           {userProfileDescriptor ? "Start Face Scan" : "Loading Profile..."}
                        </Button>
                    </div>
                )
            }
             if (stepStatus === 'failed') {
                 return (
                     <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground font-medium">{statusMessage}</p>
                        <Button onClick={startFaceVerification}><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
                     </div>
                 )
             }
              if (stepStatus === 'success') {
                 return (
                     <div className="flex flex-col items-center gap-4">
                        <p className="font-semibold text-green-600">{statusMessage}</p>
                        <Button onClick={() => window.location.href = '/student-dashboard'}>Go to Dashboard</Button>
                     </div>
                 )
             }
            return <p className="text-muted-foreground font-medium">{statusMessage}</p>
        };

        let content;
        let showMainIcon = true;
        let isCameraStep = false;

        switch (currentStep) {
            case 0:
                content = renderGpsContent();
                break;
            case 1:
                isCameraStep = true;
                if (showCodeInput || stepStatus === 'instructions' || (stepStatus === 'verifying' && isScanning)) {
                    showMainIcon = false;
                }
                content = renderClassroomContent();
                break;
            case 2:
                isCameraStep = true;
                 if (stepStatus === 'instructions' || (stepStatus === 'verifying' && isScanning)) {
                    showMainIcon = false;
                }
                content = renderFaceContent();
                break;
            default:
                content = <p>Something went wrong.</p>;
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CurrentIcon className="h-5 w-5" />
                        Step {currentStep + 1}: {STEPS[currentStep].title} Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[200px] flex flex-col items-center justify-center gap-4 text-center">
                    {showMainIcon && stepStatus === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                    {showMainIcon && stepStatus === 'success' && currentStep < 2 && <CheckCircle className="h-12 w-12 text-green-500" />}
                    {showMainIcon && stepStatus === 'success' && currentStep === 2 && null}
                    {showMainIcon && stepStatus === 'failed' && <XCircle className="h-12 w-12 text-destructive" />}

                    {isCameraStep && stepStatus === 'pending' ? (
                        <div className="flex flex-col items-center gap-4">
                             <p className="text-muted-foreground">{statusMessage || `Get ready for the next step.`}</p>
                             <Button onClick={currentStep === 1 ? startClassroomVerification : startFaceVerification} disabled={currentStep === 2 && !userProfileDescriptor}>
                                {currentStep === 2 && !userProfileDescriptor ? "Loading Profile..." : `Start ${STEPS[currentStep].title} Verification`}
                            </Button>
                             {currentStep === 1 && <Button variant="link" onClick={() => setShowCodeInput(true)}>Enter Code Instead</Button>}
                        </div>
                    ) : content}
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-2/3 mx-auto" />
                <Skeleton className="h-16 w-full max-w-lg mx-auto" />
                <div className="max-w-2xl mx-auto"><Skeleton className="h-64 w-full" /></div>
            </div>
        )
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
    
    const mapCenter = department?.location ? [department.location.lat, department.location.lng] as LatLngExpression : userLocation ? [userLocation.lat, userLocation.lng] as LatLngExpression : null;
    const userMarkerPosition = userLocation ? [userLocation.lat, userLocation.lng] as LatLngExpression : null;
    const isCameraStep = (currentStep === 1 || currentStep === 2) && !showCodeInput && stepStatus !== 'success';


    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">GPS+CLASSROOM VERIFICATION+FACE VERIFICATION</h1>
                {department && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <span>Department: {department.name}</span>
                         <VerificationInfoDialog department={department} userProfile={userProfile}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Info className="h-4 w-4" />
                            </Button>
                        </VerificationInfoDialog>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center max-w-2xl mx-auto">
                {STEPS.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                currentStep > index ? 'bg-green-500 text-white' : 
                                currentStep === index ? 'bg-primary text-primary-foreground' : 
                                'bg-muted text-muted-foreground'
                            }`}>
                                {currentStep > index ? <CheckCircle /> : <step.icon />}
                            </div>
                            <span className="text-xs font-medium">{step.title}</span>
                        </div>
                        {index < STEPS.length - 1 && (
                             <div className={`flex-1 h-1 mx-2 ${currentStep > index ? 'bg-green-500' : 'bg-muted'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="max-w-2xl mx-auto">
                {isCameraStep && (stepStatus === 'verifying' || stepStatus === 'instructions' || stepStatus === 'pending') ? (
                     <Card>
                        <CardContent className="p-4">
                           <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 ${isCameraLive ? "block" : "hidden"}`}/>
                                {!isCameraLive && <p className="text-muted-foreground">Camera is starting...</p>}
                                {isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <p>Scanning... {scanCountdown}s</p>
                                    </div>
                                )}
                           </div>
                        </CardContent>
                     </Card>
                ) : null}

                {renderStepContent()}
            </div>
            
            {currentStep === 0 && mapCenter && (
                 <Card className="max-w-2xl mx-auto">
                     <CardHeader>
                         <CardTitle>Verification Map</CardTitle>
                     </CardHeader>
                     <CardContent className="h-80 w-full p-0">
                         <Map position={mapCenter} userPosition={userMarkerPosition} radius={department?.radius} draggable={false} />
                     </CardContent>
                 </Card>
            )}
        </div>
    );
}
