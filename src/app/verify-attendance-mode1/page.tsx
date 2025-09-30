
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function VerifyAttendanceMode1Page() {
    const searchParams = useSearchParams();
    const departmentId = searchParams.get('deptId');

    if (!departmentId) {
        return (
            <div className="p-4 sm:p-6 text-center">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">No department was selected. Please go back and select a department.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">MARK MASTER ATTENDANCE WITH GPS-&gt;CLASSROOM VERIFICATION-&gt;FACE VERIFICATION</h1>
            </div>
            
            {/* Verification steps will be added here one by one */}
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Verification Steps</CardTitle>
                        <CardDescription>The verification process will begin here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Department ID: {departmentId}</p>
                        <p className="text-muted-foreground mt-4">Coming soon: GPS Verification step.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
