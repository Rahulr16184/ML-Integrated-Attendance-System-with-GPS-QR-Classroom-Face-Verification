
"use client";

import { useUserProfile } from "@/hooks/use-user-profile";
import AdminDashboardLayout from "@/app/admin-dashboard/layout";
import TeacherDashboardLayout from "@/app/teacher-dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkingDaysLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userProfile, loading } = useUserProfile();

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Skeleton className="h-16 w-full" />
            <div className="flex flex-1">
                <Skeleton className="h-full w-16 hidden md:block" />
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (userProfile?.role === "admin") {
    return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
  }

  return <TeacherDashboardLayout>{children}</TeacherDashboardLayout>;
}
