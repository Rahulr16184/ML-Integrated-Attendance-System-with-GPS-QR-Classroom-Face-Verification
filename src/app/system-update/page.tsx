
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import { loadModels, areModelsLoaded } from "@/lib/face-api";
import { getProfileCacheStatus, updateProfileDescriptorCache, getClassroomCacheStatus, updateClassroomDescriptorsCache } from "@/services/system-cache-service";
import type { Department } from "@/lib/types";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, RefreshCw, Loader2, Cpu, User, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type CacheItemStatus = "updated" | "pending" | "error" | "requires_update";

interface CacheItem {
    id: string;
    name: string;
    type: 'model' | 'profile' | 'classroom';
    status: CacheItemStatus;
    progress: number;
    isProcessing: boolean;
}

export default function SystemUpdatePage() {
    const { userProfile, loading: userLoading } = useUserProfile();
    const { toast } = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getIconForType = (type: CacheItem['type']) => {
        switch (type) {
            case 'model': return <Cpu className="h-6 w-6" />;
            case 'profile': return <User className="h-6 w-6" />;
            case 'classroom': return <ImageIcon className="h-6 w-6" />;
            default: return <Cpu className="h-6 w-6" />;
        }
    };
    
    const checkAllCacheStatus = useCallback(async () => {
        if (!userProfile) return;
        setIsLoading(true);
        
        let items: CacheItem[] = [];

        // 1. ML Models
        const modelsLoaded = areModelsLoaded();
        items.push({ id: 'ml_models', name: 'Core ML Models', type: 'model', status: modelsLoaded ? 'updated' : 'requires_update', progress: modelsLoaded ? 100 : 0, isProcessing: false });

        // 2. Profile Photo
        const profileStatus = await getProfileCacheStatus(userProfile);
        items.push({ id: 'profile_photo', name: 'User Profile Analysis', type: 'profile', status: profileStatus.needsUpdate ? 'requires_update' : 'updated', progress: profileStatus.needsUpdate ? 0 : 100, isProcessing: false });

        // 3. Classroom Photos
        if (userProfile.institutionId && userProfile.departmentIds) {
            const institutions = await getInstitutions();
            const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
            if (currentInstitution) {
                const userDepts = currentInstitution.departments.filter(d => userProfile.departmentIds.includes(d.id));
                setDepartments(userDepts);
                for (const dept of userDepts) {
                    const classroomStatus = await getClassroomCacheStatus(dept);
                    items.push({
                        id: `classroom_${dept.id}`,
                        name: `${dept.name} Classroom Analysis`,
                        type: 'classroom',
                        status: classroomStatus.needsUpdate ? 'requires_update' : 'updated',
                        progress: classroomStatus.needsUpdate ? 0 : 100,
                        isProcessing: false,
                    });
                }
            }
        }
        
        setCacheItems(items);
        setIsLoading(false);
    }, [userProfile]);

    useEffect(() => {
        if (!userLoading) {
            checkAllCacheStatus();
        }
    }, [userLoading, checkAllCacheStatus]);

    const handleUpdate = async (itemId: string) => {
        setCacheItems(prev => prev.map(item => item.id === itemId ? { ...item, isProcessing: true, status: 'pending' } : item));

        try {
            if (itemId === 'ml_models') {
                await loadModels();
                setCacheItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'updated', progress: 100 } : item));
                toast({ title: "Success", description: "Core models updated." });
            } 
            else if (itemId === 'profile_photo' && userProfile) {
                await updateProfileDescriptorCache(userProfile);
                setCacheItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'updated', progress: 100 } : item));
                toast({ title: "Success", description: "Profile photo analysis updated." });
            } 
            else if (itemId.startsWith('classroom_') && departments.length > 0) {
                const deptId = itemId.replace('classroom_', '');
                const dept = departments.find(d => d.id === deptId);
                if (dept) {
                    await updateClassroomDescriptorsCache(dept);
                    setCacheItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'updated', progress: 100 } : item));
                    toast({ title: "Success", description: `${dept.name} classroom analysis updated.` });
                }
            }
        } catch (error) {
            console.error(`Failed to update ${itemId}:`, error);
            setCacheItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'error' } : item));
            toast({ title: "Error", description: `Failed to update ${cacheItems.find(c=>c.id === itemId)?.name}.`, variant: 'destructive' });
        } finally {
            setCacheItems(prev => prev.map(item => item.id === itemId ? { ...item, isProcessing: false } : item));
        }
    };
    
    if (isLoading || userLoading) {
         return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-8 w-2/3" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="space-y-2 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System Update Center</h1>
                <p className="text-muted-foreground">
                    Check the status of your app's cached data. Updates are usually automatic, but you can manually trigger them here if needed.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cache Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {cacheItems.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-4 flex-1">
                                {getIconForType(item.type)}
                                <div className="flex-1">
                                    <p className="font-semibold">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {item.status === 'updated' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                        {item.status === 'requires_update' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                        {item.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                                        {item.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <span className="text-sm capitalize text-muted-foreground">
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <Progress value={item.status === 'updated' ? 100 : item.isProcessing ? 50 : 0} className="mt-2 h-2" />
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant={item.status === 'requires_update' ? 'default' : 'outline'}
                                onClick={() => handleUpdate(item.id)}
                                disabled={item.isProcessing || item.status === 'updated'}
                            >
                                {item.isProcessing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {item.isProcessing ? 'Updating...' : 'Update Now'}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
