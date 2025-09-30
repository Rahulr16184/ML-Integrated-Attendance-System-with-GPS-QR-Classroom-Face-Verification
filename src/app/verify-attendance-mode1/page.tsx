
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions } from '@/services/institution-service';
import type { Department, ClassroomPhoto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, MapPin, Camera, UserCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { loadModels, getFaceApi } from '@/lib/face-api';
import * as faceapi from 'face-api.js';

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

export default function VerifyAttendanceMode1Page() {
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile } = useUserProfile();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [stepStatus, setStepStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending');
    const [statusMessage, setStatusMessage] = useState('');

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Load Department Details
    useEffect(() => {
        async function fetchDepartmentDetails() {
            if (!departmentId) {
                setError('No department selected.');
                setLoading(false);
                return;
            }
            if (userProfile?.institutionId) {
                setLoading(true);
                try {
                    const institutions = await getInstitutions();
                    const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                    const currentDept = currentInstitution?.departments.find(dept => dept.id === departmentId);

                    if (currentDept) {
                        setDepartment(currentDept);
                        setError(null);
                    } else {
                        setError(`Department not found.`);
                        setDepartment(null);
                    }
                } catch (err) {
                    setError('Failed to fetch department details.');
                } finally {
                    setLoading(false);
                }
            }
        }
        if (userProfile) {
            fetchDepartmentDetails();
        }
    }, [departmentId, userProfile]);

    // Load Face-API Models
    useEffect(() => {
        const loadMLModels = async () => {
            await loadModels();
            setModelsLoaded(true);
        };
        loadMLModels();
    }, []);

    const verifyGps = useCallback(() => {
        if (!department?.location) {
            setStatusMessage("GPS location for this department is not set. Skipping.");
            setTimeout(() => {
                setStepStatus('success');
                setCurrentStep(1);
            }, 2000);
            return;
        }

        setStepStatus('verifying');
        setStatusMessage('Getting your location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                const distance = getDistance(userLocation, department.location!);

                if (distance <= (department.radius || 100)) {
                    setStatusMessage(`Location verified! You are ${distance.toFixed(0)}m from the center.`);
                    setStepStatus('success');
                    setTimeout(() => setCurrentStep(1), 1500);
                } else {
                    setStatusMessage(`You are too far from the classroom (${distance.toFixed(0)}m away). Please move closer.`);
                    setStepStatus('failed');
                }
            },
            (err) => {
                setStatusMessage(`Could not get location: ${err.message}. Please enable location services.`);
                setStepStatus('failed');
            }, { enableHighAccuracy: true }
        );
    }, [department]);
    
    // Effect to trigger verification for the current step
    useEffect(() => {
        if (loading || !department) return;

        if (currentStep === 0 && stepStatus === 'pending') {
            verifyGps();
        }
        // Future steps will be added here
    }, [currentStep, stepStatus, loading, department, verifyGps]);


    const renderStepContent = () => {
        const CurrentIcon = STEPS[currentStep].icon;
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CurrentIcon className="h-5 w-5" />
                        Step {currentStep + 1}: {STEPS[currentStep].title} Verification
                    </CardTitle>
                    <CardDescription>
                        {loading ? <Skeleton className="h-4 w-1/2 mt-1" /> : `Verifying for department: ${department?.name}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex flex-col items-center justify-center gap-4 text-center">
                    {stepStatus === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                    {stepStatus === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                    {stepStatus === 'failed' && <XCircle className="h-12 w-12 text-destructive" />}

                    <p className="text-muted-foreground font-medium">{statusMessage}</p>

                    {stepStatus === 'failed' && (
                        <Button onClick={verifyGps}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loading || !department) {
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
    

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">GPS+CLASSROOM VERIFICATION+FACE VERIFICATION</h1>
            </div>

            {/* Stepper UI */}
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
                {renderStepContent()}
            </div>
        </div>
    );
}

