
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import type { Department } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Camera, QrCode, UserCheck, Save, Settings } from "lucide-react";


interface ModeConfig {
    enabled: boolean;
    startTime: string;
    endTime: string;
}

interface DepartmentModes {
    [key: string]: {
        mode1: ModeConfig;
        mode2: ModeConfig;
    };
}

const initialModeConfig: ModeConfig = {
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
};

export default function MaModesPage() {
    const router = useRouter();
    const { userProfile, loading: userLoading } = useUserProfile();
    const { toast } = useToast();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [modesConfig, setModesConfig] = useState<DepartmentModes>({});

    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
        if (role !== 'admin' && role !== 'teacher') {
            router.push('/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

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
                        // Initialize config for all fetched departments
                        const initialConfigs: DepartmentModes = {};
                        userDepartments.forEach(dept => {
                            initialConfigs[dept.id] = {
                                mode1: { ...initialModeConfig },
                                mode2: { ...initialModeConfig },
                            };
                        });
                        setModesConfig(initialConfigs);
                    }
                } catch (error) {
                    toast({ title: "Error", description: "Could not fetch departments.", variant: "destructive" });
                } finally {
                    setLoadingDepartments(false);
                }
            }
        }
        if (isAuthorized && userProfile) {
            fetchDepartments();
        }
    }, [userProfile, isAuthorized, toast]);

    const handleModeChange = (mode: 'mode1' | 'mode2', field: keyof ModeConfig, value: boolean | string) => {
        if (!selectedDepartmentId) return;
        setModesConfig(prev => ({
            ...prev,
            [selectedDepartmentId]: {
                ...prev[selectedDepartmentId],
                [mode]: {
                    ...prev[selectedDepartmentId][mode],
                    [field]: value,
                }
            }
        }));
    };

    const handleSaveChanges = async () => {
        if (!selectedDepartmentId) {
            toast({ title: "No Department Selected", description: "Please select a department to save settings.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            // Here you would typically call a service to save `modesConfig[selectedDepartmentId]`
            // to your backend/database for the specific department.
            console.log("Saving config for", selectedDepartmentId, modesConfig[selectedDepartmentId]);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            toast({
                title: "Settings Saved",
                description: `Attendance modes for ${departments.find(d => d.id === selectedDepartmentId)?.name} have been updated.`,
            });
        } catch (error) {
            toast({ title: "Save Failed", description: "Could not save the settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const currentDeptConfig = useMemo(() => {
        return modesConfig[selectedDepartmentId] || { mode1: initialModeConfig, mode2: initialModeConfig };
    }, [modesConfig, selectedDepartmentId]);

    if (userLoading || loadingDepartments) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-12 w-full max-w-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Master Attendance Modes</h1>
                <p className="text-muted-foreground">Enable, disable, and schedule attendance verification modes for each department.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Department Selection</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="max-w-md space-y-2">
                        <Label htmlFor="department">Configure modes for</Label>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Mode 1</span>
                                <Switch
                                    checked={currentDeptConfig.mode1.enabled}
                                    onCheckedChange={(checked) => handleModeChange('mode1', 'enabled', checked)}
                                />
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                                <MapPin className="h-4 w-4" />+
                                <Camera className="h-4 w-4" />+
                                <UserCheck className="h-4 w-4" />
                                <span>GPS + Classroom + Face Verification</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mode1-start">Enable Automatically At</Label>
                                <Input 
                                    id="mode1-start" 
                                    type="time" 
                                    value={currentDeptConfig.mode1.startTime}
                                    onChange={(e) => handleModeChange('mode1', 'startTime', e.target.value)}
                                    disabled={!currentDeptConfig.mode1.enabled}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="mode1-end">Disable Automatically At</Label>
                                <Input 
                                    id="mode1-end" 
                                    type="time" 
                                    value={currentDeptConfig.mode1.endTime}
                                    onChange={(e) => handleModeChange('mode1', 'endTime', e.target.value)}
                                    disabled={!currentDeptConfig.mode1.enabled}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mode 2 Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Mode 2</span>
                                <Switch
                                    checked={currentDeptConfig.mode2.enabled}
                                    onCheckedChange={(checked) => handleModeChange('mode2', 'enabled', checked)}
                                />
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                                <QrCode className="h-4 w-4" />+
                                <UserCheck className="h-4 w-4" />
                                <span>QR + Face Verification</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mode2-start">Enable Automatically At</Label>
                                <Input 
                                    id="mode2-start" 
                                    type="time"
                                    value={currentDeptConfig.mode2.startTime}
                                    onChange={(e) => handleModeChange('mode2', 'startTime', e.target.value)}
                                    disabled={!currentDeptConfig.mode2.enabled}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="mode2-end">Disable Automatically At</Label>
                                <Input 
                                    id="mode2-end" 
                                    type="time"
                                    value={currentDeptConfig.mode2.endTime}
                                    onChange={(e) => handleModeChange('mode2', 'endTime', e.target.value)}
                                    disabled={!currentDeptConfig.mode2.enabled}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2">
                        <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            ) : (
                <Card className="mt-6">
                    <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <Settings className="h-10 w-10"/>
                        <p>Please select a department to manage its attendance modes.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
