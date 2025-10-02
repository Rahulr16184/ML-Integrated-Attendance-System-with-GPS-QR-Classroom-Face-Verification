
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions } from '@/services/institution-service';
import type { Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, MapPin, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { LatLngExpression } from 'leaflet';
import { VerificationSteps } from '@/components/verification-steps';
import { VerificationInfoDialog } from '@/components/verification-info-dialog';

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

export default function VerifyGpsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile, loading: userProfileLoading } = useUserProfile();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending');
    const [statusMessage, setStatusMessage] = useState('');
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    const Map = useMemo(() => dynamic(() => import('@/components/map'), { 
        loading: () => <Skeleton className="h-full w-full" />,
        ssr: false 
    }), []);

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

    const startGpsVerification = useCallback(() => {
        if (!department) return;

        if (!department?.location?.lat || !department?.location?.lng) {
            setStatusMessage("GPS location for this department is not set. Skipping to next step.");
            setStatus('success');
            setTimeout(() => router.push(`/verify-classroom?deptId=${departmentId}`), 2000);
            return;
        }

        setStatus('verifying');
        setStatusMessage('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentUserLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(currentUserLocation);
                
                if (department.location) {
                    const distance = getDistance(currentUserLocation, department.location);
                    if (distance <= (department.radius || 100)) {
                        setStatusMessage(`Location verified! Redirecting to the next step...`);
                        setStatus('success');
                        setTimeout(() => router.push(`/verify-classroom?deptId=${departmentId}`), 1500);
                    } else {
                        setStatusMessage(`You are ${distance.toFixed(0)}m away. Move into the designated zone.`);
                        setStatus('failed');
                    }
                }
            },
            (err) => {
                let message = `Could not get location: ${err.message}. Please enable location services.`;
                if (err.code === err.TIMEOUT) {
                    message = "Could not get location: Timeout expired. Please enable location services.";
                }
                setStatusMessage(message);
                setStatus('failed');
            }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    }, [department, departmentId, router]);
    
    useEffect(() => {
        if (!loading && department && status === 'pending') {
            startGpsVerification();
        }
    }, [loading, department, status, startGpsVerification]);

    const mapCenter = department?.location ? [department.location.lat, department.location.lng] as LatLngExpression : userLocation ? [userLocation.lat, userLocation.lng] as LatLngExpression : null;
    const userMarkerPosition = userLocation ? [userLocation.lat, userLocation.lng] as LatLngExpression : null;

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

            <VerificationSteps currentStep={0} />

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Step 1: GPS Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[150px] flex flex-col items-center justify-center gap-4 text-center">
                        {status === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                        {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                        {status === 'failed' && <XCircle className="h-12 w-12 text-destructive" />}

                        <p className="text-muted-foreground font-medium">{statusMessage}</p>

                        {status === 'failed' && (
                            <Button onClick={startGpsVerification}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Retry
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            {mapCenter && (
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
