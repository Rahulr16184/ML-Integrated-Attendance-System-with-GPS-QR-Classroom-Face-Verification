
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInstitutions } from '@/services/institution-service';
import type { Department } from '@/lib/types';

export default function VerifyAttendanceMode1Page() {
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');
    const { userProfile } = useUserProfile();

    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDepartmentDetails() {
            if (!departmentId) {
                setError('No department was selected. Please go back and select a department.');
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
                        setError(`Department with ID ${departmentId} not found in your institution.`);
                        setDepartment(null);
                    }
                } catch (err) {
                    setError('Failed to fetch department details.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        }

        fetchDepartmentDetails();
    }, [departmentId, userProfile]);

    if (error) {
        return (
            <div className="p-4 sm:p-6 text-center">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">GPS+CLASSROOM VERIFICATION+FACE VERIFICATION</h1>
            </div>
            
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Verification Steps</CardTitle>
                        {loading ? (
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        ) : (
                            <CardDescription>Verifying for department: <span className="font-semibold">{department?.name}</span></CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Coming soon: GPS Verification step.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
