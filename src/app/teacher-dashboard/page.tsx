
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Info, CreditCard } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDashboardPage() {
  const { userProfile, loading } = useUserProfile();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
         {loading ? (
            <Skeleton className="h-9 w-48" />
        ) : (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hi, {userProfile?.name?.split(' ')[0] || 'Teacher'}</h1>
        )}
        
        <div className="w-full">
            <Button asChild className="w-full text-lg py-6">
                <Link href="/idcard">
                    <CreditCard className="mr-2 h-5 w-5" />
                    View ID Card
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Info className="h-6 w-6" />
                <CardTitle>INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {loading ? (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                             <div key={i} className="grid grid-cols-2 items-center">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                        ))}
                    </div>
                 ) : userProfile ? (
                    <>
                        <div className="grid grid-cols-2 items-center">
                            <p className="text-sm font-medium">NAME</p>
                            <p className="text-sm text-muted-foreground break-words">{userProfile.name || "--"}</p>
                        </div>
                        <div className="grid grid-cols-2 items-center">
                            <p className="text-sm font-medium">DOB</p>
                            <p className="text-sm text-muted-foreground break-words">{userProfile.dob ? new Date(userProfile.dob).toLocaleDateString() : "--"}</p>
                        </div>
                        <div className="grid grid-cols-2 items-center">
                            <p className="text-sm font-medium">MOBILE NO</p>
                            <p className="text-sm text-muted-foreground break-words">{userProfile.phone || "--"}</p>
                        </div>
                        <div className="grid grid-cols-2 items-center">
                            <p className="text-sm font-medium">MAIL ID</p>
                            <p className="text-sm text-muted-foreground break-words">{userProfile.email || "--"}</p>
                        </div>
                        <div className="grid grid-cols-2 items-center">
                            <p className="text-sm font-medium">INSTITUTION</p>
                            <p className="text-sm text-muted-foreground break-words">{userProfile.institutionName || "--"}</p>
                        </div>
                        <div className="grid grid-cols-2 items-center">
                            <p className="text-sm font-medium">DEPARTMENTS</p>
                            <p className="text-sm text-muted-foreground break-words">{userProfile.departmentNames?.join(', ') || "--"}</p>
                        </div>
                    </>
                 ) : (
                    <p className="text-sm text-muted-foreground">Could not load user information.</p>
                 )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
