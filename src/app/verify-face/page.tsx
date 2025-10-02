
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
import { Loader2, UserCheck, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { VerificationSteps } from '@/components/verification-steps';
import { cn } from '@/lib/utils';
import { VerificationInfoDialog } from '@/components/verification-info-dialog';

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

    useEffect(() => {
        async function fetchInitialData() {
            if (userProfileLoading) return;
            if (!departmentId) { setError('No department selected.'); setLoading(false); return; }
            if (!userProfile?.institutionId) { setError('Could not load user profile.'); setLoading(false); return; }

            setLoading(true);
            try {
                const institutions = await getInstitutions();
                const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                const currentDept = currentInstitution?.departments.find(dept => dept.id === departmentId);
                if (currentDept) setDepartment(currentDept);
                else setError(`Department not found.`);
            } catch (err) {
                setError('Failed to fetch data.');
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
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsCameraLive(true);
            }
        } catch (err) {
            setError(`Camera error: ${(err as Error).message}. Please grant permissions.`);
            setIsCameraLive(false);
        }
    }, [isCameraLive]);
    
    useEffect(() => {
        return () => stopCamera();
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
                        <div className="aspect-square w-64 bg-muted rounded-full flex items-center justify-center overflow-hidden relative border-4 border-muted">
                           <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover transform -scale-x-100", !isCameraLive && "hidden")}/>
                           {!isCameraLive && (
                                <UserCheck className="h-24 w-24 text-muted-foreground/50"/>
                           )}
                        </div>
                        
                        {!isCameraLive && (
                             <Button onClick={startCamera}>Start Scan</Button>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
