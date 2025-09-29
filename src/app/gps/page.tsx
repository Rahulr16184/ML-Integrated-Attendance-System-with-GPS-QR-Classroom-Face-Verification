
"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions, updateDepartmentGps } from "@/services/institution-service";
import type { Department } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { LatLngExpression } from "leaflet";
import { Save, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GpsPage() {
    const { userProfile, loading: userLoading } = useUserProfile();
    const { toast } = useToast();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
    const [radius, setRadius] = useState<number>(100);
    const [position, setPosition] = useState<LatLngExpression | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const Map = useMemo(() => dynamic(() => import('@/components/map'), { 
        loading: () => <Skeleton className="h-full w-full" />,
        ssr: false 
    }), []);

    const fetchCurrentLocation = useCallback((showToast = false) => {
        if (typeof navigator.geolocation === 'undefined') {
            toast({ title: "Geolocation Not Supported", description: "Your browser does not support geolocation.", variant: "destructive" });
            const fallbackPos: LatLngExpression = [51.505, -0.09];
            setPosition(fallbackPos);
            setAccuracy(null);
            return;
        }

        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
                setPosition(newPos);
                setAccuracy(pos.coords.accuracy);
                setIsFetchingLocation(false);
                if (showToast) {
                    toast({ title: "Success", description: "Location updated." });
                }
            },
            () => {
                const fallbackPos: LatLngExpression = [51.505, -0.09];
                setPosition(fallbackPos);
                setAccuracy(null);
                setIsFetchingLocation(false);
                if (showToast) {
                    toast({ title: "Error", description: "Could not fetch location. Using fallback.", variant: "destructive" });
                }
            },
            { enableHighAccuracy: true }
        );
    }, [toast]);


    useEffect(() => {
        async function fetchDepartments() {
            if (userProfile?.institutionId && userProfile.departmentIds) {
                setLoadingDepartments(true);
                const institutions = await getInstitutions();
                const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                if (currentInstitution) {
                    const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
                    setDepartments(userDepartments);
                    if (userDepartments.length > 0 && !selectedDepartmentId) {
                        setSelectedDepartmentId(userDepartments[0].id);
                    }
                } else {
                    setDepartments([]);
                }
                setLoadingDepartments(false);
            }
        }
        if (!userLoading) {
          fetchDepartments();
        }
    }, [userProfile, userLoading, selectedDepartmentId]);

    useEffect(() => {
        if (selectedDepartmentId && departments.length > 0) {
            const department = departments.find(d => d.id === selectedDepartmentId);
            if (department?.location?.lat && department?.location?.lng) {
                setPosition([department.location.lat, department.location.lng]);
                setRadius(department.radius || 100);
                setAccuracy(null); // Accuracy is only relevant for live location, not saved ones
            } else {
                // If the selected department has no location, fetch the current one
                fetchCurrentLocation(false);
            }
        } else if (!selectedDepartmentId && !userLoading && departments.length > 0) {
             // If no department is selected (e.g. on first load), fetch current location
             fetchCurrentLocation(false);
        }
    }, [selectedDepartmentId, departments, fetchCurrentLocation, userLoading]);

    const handleSave = async () => {
        if (!userProfile?.institutionId || !selectedDepartmentId || !position || radius <= 0) {
            toast({ title: "Error", description: "Please select a department, set a valid location, and radius.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const location = Array.isArray(position) ? { lat: position[0], lng: position[1] } : position;
            await updateDepartmentGps(userProfile.institutionId, selectedDepartmentId, location, radius);
            toast({ title: "Success", description: "GPS location updated successfully." });
            
            // Refresh departments data locally to reflect the change
            setDepartments(prevDepts => prevDepts.map(d => 
                d.id === selectedDepartmentId ? { ...d, location, radius } : d
            ));

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save GPS settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePositionChange = (newPosition: LatLngExpression) => {
        setPosition(newPosition);
         // When user drags marker, accuracy is no longer relevant for the manually set point
        setAccuracy(null);
    }
    
    const getAccuracyBadgeVariant = () => {
        if (accuracy === null) return 'secondary';
        if (accuracy <= 10) return 'default'; // Good (greenish)
        if (accuracy <= 30) return 'secondary'; // Okay (yellowish)
        return 'destructive'; // Poor (red)
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">GPS Location Setup</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Configure Geofence</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                             {userLoading || loadingDepartments ? <Skeleton className="h-10 w-full" /> : (
                                <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={departments.length === 0}>
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Select your department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="radius">Radius (meters)</Label>
                            <Input
                                id="radius"
                                type="number"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                placeholder="e.g., 100"
                                min="1"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2 h-80 md:h-full min-h-[300px] rounded-lg overflow-hidden border">
                        {position ? (
                           <Map position={position} radius={radius} onPositionChange={handlePositionChange} draggable={true} />
                        ) : (
                           <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                                {isFetchingLocation ? "Fetching location..." : "Select a department to load map..."}
                           </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                     <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={isSaving || !position}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Settings"}
                        </Button>
                        <Button onClick={() => fetchCurrentLocation(true)} variant="outline" disabled={isFetchingLocation}>
                             <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingLocation ? 'animate-spin' : ''}`} />
                            Refetch Location
                        </Button>
                    </div>
                    {accuracy !== null && (
                        <div className="flex items-center gap-2 text-sm">
                           <span className="font-medium">GPS Accuracy:</span>
                           <Badge variant={getAccuracyBadgeVariant()}>
                            {accuracy.toFixed(2)} meters
                           </Badge>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
