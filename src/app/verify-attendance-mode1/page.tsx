
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, MapPin, Camera, UserCheck, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CameraCapture } from '@/components/camera-capture';

const VerificationStep = ({ title, status, onClick, children, isCurrent, isDisabled }: { title: string, status: 'pending' | 'loading' | 'success' | 'error', onClick?: () => void, children: React.ReactNode, isCurrent: boolean, isDisabled: boolean }) => {
    
    const getStatusIcon = () => {
        switch(status) {
            case 'success': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'error': return <XCircle className="h-6 w-6 text-red-500" />;
            case 'loading': return <Loader2 className="h-6 w-6 animate-spin" />;
            default: return null;
        }
    }

    return (
        <Card className={!isCurrent && !isDisabled ? 'bg-muted/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                {getStatusIcon()}
            </CardHeader>
            {isCurrent && (
                <CardContent>
                    {children}
                    {onClick && (
                         <Button onClick={onClick} disabled={isDisabled} className="w-full mt-4">
                            Next Step <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardContent>
            )}
        </Card>
    )
}


export default function VerifyAttendanceMode1Page() {
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');

    const [currentStep, setCurrentStep] = useState(1);
    const [gpsStatus, setGpsStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
    const [classroomStatus, setClassroomStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
    const [faceStatus, setFaceStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
    
    const [capturedClassroom, setCapturedClassroom] = useState<string|null>(null);
    const [capturedFace, setCapturedFace] = useState<string|null>(null);


    useEffect(() => {
        // Automatically start GPS check
        if (currentStep === 1 && gpsStatus === 'pending') {
            verifyGps();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, gpsStatus]);

    const verifyGps = async () => {
        setGpsStatus('loading');
        // Simulate GPS check
        await new Promise(resolve => setTimeout(resolve, 2000));
        // In a real app, you'd get coordinates and check against department geofence
        const success = Math.random() > 0.2; // 80% chance of success
        setGpsStatus(success ? 'success' : 'error');
        if (success) {
            setCurrentStep(2);
        }
    };
    
    const handleClassroomCapture = (dataUri: string) => {
        setClassroomStatus('loading');
        setCapturedClassroom(dataUri);
         // Simulate classroom photo analysis
        setTimeout(() => {
            setClassroomStatus('success');
            setCurrentStep(3);
        }, 1500);
    }
    
    const handleFaceCapture = (dataUri: string) => {
        setFaceStatus('loading');
        setCapturedFace(dataUri);
        // Simulate face verification
        setTimeout(() => {
            setFaceStatus('success');
            setCurrentStep(4); // Verification complete
        }, 2000);
    }

    const progress = useMemo(() => {
        let value = 0;
        if (gpsStatus === 'success') value += 33;
        if (classroomStatus === 'success') value += 33;
        if (faceStatus === 'success') value += 34;
        return value;
    }, [gpsStatus, classroomStatus, faceStatus]);


    if (!departmentId) {
        return <div className="p-4">Error: No department selected.</div>;
    }
    
    if (currentStep === 4 && faceStatus === 'success') {
        return (
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-4 min-h-full">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h1 className="text-2xl sm:text-3xl font-bold">Attendance Marked Successfully!</h1>
                <p className="text-muted-foreground">Your attendance has been recorded for today.</p>
                <Button asChild>
                    <a href="/student-dashboard">Back to Dashboard</a>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Verification (Mode 1)</h1>
                 <Progress value={progress} className="h-2" />
                 <p className="text-sm text-muted-foreground text-center">{Math.round(progress)}% Complete</p>
            </div>

            <div className="space-y-4">
                <VerificationStep
                    title="Step 1: GPS Verification"
                    status={gpsStatus}
                    isCurrent={currentStep === 1}
                    isDisabled={true}
                >
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground p-4">
                       {gpsStatus === 'loading' && <><Loader2 className="animate-spin h-8 w-8" /><p>Checking your location... please wait.</p></>}
                       {gpsStatus === 'error' && <><XCircle className="h-8 w-8 text-destructive" /><p>GPS check failed. Please ensure you are within the designated area and try again.</p><Button onClick={verifyGps} className="mt-2">Retry</Button></>}
                    </div>
                </VerificationStep>
                
                <VerificationStep
                    title="Step 2: Classroom Photo Verification"
                    status={classroomStatus}
                    isCurrent={currentStep === 2}
                    isDisabled={gpsStatus !== 'success'}
                >
                    <Alert>
                        <Camera className="h-4 w-4"/>
                        <AlertTitle>Capture Classroom Photo</AlertTitle>
                        <AlertDescription>
                            Take a clear photo of the classroom environment.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <CameraCapture onCapture={handleClassroomCapture} captureLabel="Verify Classroom Photo" isCapturing={classroomStatus === 'loading'} />
                    </div>
                </VerificationStep>
                
                <VerificationStep
                    title="Step 3: Face Verification"
                    status={faceStatus}
                    isCurrent={currentStep === 3}
                    isDisabled={classroomStatus !== 'success'}
                >
                     <Alert>
                        <UserCheck className="h-4 w-4"/>
                        <AlertTitle>Face Verification</AlertTitle>
                        <AlertDescription>
                            Position your face inside the circle for verification.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                         <CameraCapture onCapture={handleFaceCapture} captureLabel="Verify My Attendance" isCapturing={faceStatus === 'loading'} />
                    </div>
                </VerificationStep>
            </div>

        </div>
    );
}

