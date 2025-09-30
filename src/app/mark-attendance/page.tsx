
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import type { Department } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, UserCheck, QrCode, ArrowRight } from "lucide-react";


const isTimeWithinRange = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    start.setHours(startHours, startMinutes, 0, 0);
    
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    end.setHours(endHours, endMinutes, 0, 0);

    return now >= start && now <= end;
}

export default function MarkAttendancePage() {
    const router = useRouter();
    const { userProfile, loading: userLoading } = useUserProfile();
    const { toast } = useToast();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
    const [loadingDepartments, setLoadingDepartments] = useState(true);

    const selectedDepartment = useMemo(() => {
        return departments.find(d => d.id === selectedDepartmentId);
    }, [departments, selectedDepartmentId]);

    useEffect(() => {
        async function fetchDepartments() {
            if (userProfile?.institutionId && userProfile.departmentIds) {
                setLoadingDepartments(true);
                try {
                    const institutions = await getInstitutions();
                    const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                    if (currentInstitution) {
                        const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
                        setDepartments(userDepartments);
                        if (userDepartments.length > 0 && !selectedDepartmentId) {
                            setSelectedDepartmentId(userDepartments[0].id);
                        }
                    }
                } catch (error) {
                    toast({ title: "Error", description: "Could not fetch department data.", variant: "destructive" });
                } finally {
                    setLoadingDepartments(false);
                }
            }
        }
        if (userProfile) {
            fetchDepartments();
        }
    }, [userProfile, toast, selectedDepartmentId]);

    const isModeActive = (mode: 'mode1' | 'mode2'): boolean => {
        if (!selectedDepartment || !selectedDepartment.modes?.[mode]) {
            return false;
        }
        const modeConfig = selectedDepartment.modes[mode];
        if (!modeConfig.enabled) {
            return false;
        }
        return isTimeWithinRange(modeConfig.startTime, modeConfig.endTime);
    };
    
    const mode1Active = isModeActive('mode1');
    const mode2Active = isModeActive('mode2');

    if (userLoading || loadingDepartments) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-12 w-full max-w-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mark Master Attendance</h1>
                <p className="text-muted-foreground">Select your department and choose an active attendance mode.</p>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Department Selection</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="max-w-md space-y-2">
                        <Label htmlFor="department">Select your department</Label>
                        <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={departments.length === 0}>
                        <SelectTrigger id="department">
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedDepartmentId ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mode 1 Card */}
                    <Card className={!mode1Active ? 'bg-muted/50' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Mode 1</span>
                                 <Badge variant={mode1Active ? 'default' : 'destructive'}>
                                    {mode1Active ? 'Active' : 'Inactive'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                                <MapPin className="h-4 w-4" />+
                                <Camera className="h-4 w-4" />+
                                <UserCheck className="h-4 w-4" />
                                <span>GPS + Classroom + Face Verification</span>
                            </CardDescription>
                        </CardHeader>
                         <CardContent className="flex flex-col items-center justify-center text-center p-6 min-h-[150px]">
                            <Button size="lg" disabled={!mode1Active} onClick={() => toast({title: "Coming Soon!", description: "This feature is under development."})}>
                                Start Verification <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            {!mode1Active && (
                                <p className="text-muted-foreground mt-4 text-sm">This mode is not currently active. Please check the schedule or try another mode.</p>
                            )}
                        </CardContent>
                    </Card>

                     {/* Mode 2 Card */}
                    <Card className={!mode2Active ? 'bg-muted/50' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Mode 2</span>
                               <Badge variant={mode2Active ? 'default' : 'destructive'}>
                                    {mode2Active ? 'Active' : 'Inactive'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                                <QrCode className="h-4 w-4" />+
                                <UserCheck className="h-4 w-4" />
                                <span>QR + Face Verification</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center p-6 min-h-[150px]">
                            <Button size="lg" disabled={!mode2Active} onClick={() => toast({title: "Coming Soon!", description: "This feature is under development."})}>
                               Scan QR Code <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            {!mode2Active && (
                               <p className="text-muted-foreground mt-4 text-sm">This mode is not currently active. Please check the schedule or try another mode.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                 <Card className="mt-6">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>Please select a department to see available attendance modes.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
