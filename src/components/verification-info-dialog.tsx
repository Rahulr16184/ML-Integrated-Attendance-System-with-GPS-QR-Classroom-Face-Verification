
"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Department } from "@/lib/types";
import type { UserProfile } from "@/services/user-service";
import type { LatLngExpression } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "./ui/separator";

interface VerificationInfoDialogProps {
  department: Department | null;
  userProfile: UserProfile | null;
  children: React.ReactNode;
}

export function VerificationInfoDialog({ department, userProfile, children }: VerificationInfoDialogProps) {
  
  const Map = useMemo(() => dynamic(() => import('@/components/map'), { 
    loading: () => <Skeleton className="h-full w-full" />,
    ssr: false 
  }), []);

  const embeddedClassroomPhotos = useMemo(() => {
    if (!department) return [];
    const photos = [
        ...(department.classroomPhotoUrls || []),
        ...(department.studentsInClassroomPhotoUrls || [])
    ];
    return photos.filter(p => p.embedded);
  }, [department]);

  const mapCenter = department?.location ? [department.location.lat, department.location.lng] as LatLngExpression : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
          {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Verification Reference Information</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <div className="p-4 space-y-6">
                {/* GPS Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Step 1: GPS Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mapCenter ? (
                            <div className="h-64 w-full rounded-lg overflow-hidden border">
                                <Map position={mapCenter} radius={department?.radius} draggable={false} />
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No GPS location has been set for this department.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Separator />

                {/* Classroom Photos Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Classroom Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {embeddedClassroomPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {embeddedClassroomPhotos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                                        <Image src={photo.url} alt={`Reference photo ${index+1}`} fill className="object-cover" data-ai-hint="classroom" />
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <p className="text-muted-foreground">No reference photos have been embedded for this classroom yet.</p>
                         )}
                    </CardContent>
                </Card>
                
                <Separator />

                {/* Face Photo Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Your Face Photo</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {userProfile?.profileImage ? (
                            <Image src={userProfile.profileImage} alt="Your profile photo" width={150} height={150} className="rounded-lg object-cover" data-ai-hint="profile picture" />
                        ) : (
                            <p className="text-muted-foreground">You have not set a profile photo.</p>
                        )}
                    </CardContent>
                </Card>

            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
