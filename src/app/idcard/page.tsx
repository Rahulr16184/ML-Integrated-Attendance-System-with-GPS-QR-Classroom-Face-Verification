
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Skeleton } from "@/components/ui/skeleton";

export default function IdCardPage() {
  const { userProfile, loading } = useUserProfile();

  const IdCardSkeleton = () => (
     <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden border-primary/50">
        <CardHeader className="p-6 text-center">
            <Skeleton className="h-8 w-32 mx-auto" />
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center">
            <div className="flex justify-center mb-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-24 mx-auto mb-4" />
            <div className="w-full space-y-3 pt-4 mt-4 border-t">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-2 items-center text-left gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-36" />
                    </div>
                ))}
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 flex justify-center">
             <Skeleton className="h-4 w-28" />
        </CardFooter>
      </Card>
  );

  if (loading) {
    return (
        <div className="p-4 sm:p-6 flex items-center justify-center bg-muted/40 min-h-full">
            <IdCardSkeleton />
        </div>
    );
  }

  if (!userProfile) {
    return (
        <div className="p-4 sm:p-6 flex items-center justify-center bg-muted/40 min-h-full">
            <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden border-destructive">
                <CardHeader>
                    <CardTitle className="text-xl text-center">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">Could not load user data for the ID card.</p>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="p-4 sm:p-6 flex items-center justify-center bg-muted/40 min-h-full">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden border-primary/50">
        <CardHeader className="p-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-wider">DIGITAL ID</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center">
            <div className="flex justify-center mb-4">
                <Image 
                    src={userProfile.profileImage || "https://picsum.photos/seed/1/200/200"} 
                    alt={userProfile.name || "User"} 
                    width={80} 
                    height={80} 
                    className="rounded-lg object-cover"
                    data-ai-hint="profile picture"
                />
            </div>
            <p className="font-bold text-lg capitalize">{userProfile.role || "--"}</p>
            <div className="w-full text-sm space-y-2 pt-4 mt-4 border-t">
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">NAME:</span>
                  <span className="font-medium break-words">{userProfile.name || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">GENDER:</span>
                  <span>{userProfile.gender || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">MOBILE NO:</span>
                  <span className="break-words">{userProfile.phone || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">MAIL ID:</span>
                  <span className="break-words">{userProfile.email || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">INSTITUTION:</span>
                  <span className="break-words">{userProfile.institutionName || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">DEPARTMENTS:</span>
                  <span className="break-words">{userProfile.departmentNames?.join(', ') || "--"}</span>
               </div>
               {userProfile.role === 'student' && (
                <>
                    <div className="grid grid-cols-2 items-center text-left">
                        <span className="font-medium text-muted-foreground">ROLL NO:</span>
                        <span className="break-words">{userProfile.rollNo || "--"}</span>
                    </div>
                    <div className="grid grid-cols-2 items-center text-left">
                        <span className="font-medium text-muted-foreground">REGISTER NO:</span>
                        <span className="break-words">{userProfile.registerNo || "--"}</span>
                    </div>
                </>
               )}
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-center">
            <p className="text-xs text-muted-foreground">Tracein digital id</p>
        </CardFooter>
      </Card>
    </div>
  );
}
