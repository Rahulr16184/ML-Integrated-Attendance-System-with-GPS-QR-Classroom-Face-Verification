
"use client";

import type { Metadata } from "next";
import { Header } from "@/components/header";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import { StudentNav } from "@/components/student-nav";
import { useIsMobile } from "@/hooks/use-mobile";

// Metadata can't be used in a client component, but we can keep it for static analysis
// export const metadata: Metadata = {
//   title: "TRACEIN - Student",
//   description: "ML integrated attendance system",
// };

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    {/* You can add a logo or title here */}
                </SidebarHeader>
                <StudentNav />
            </SidebarContent>
        </Sidebar>
        <div className="flex flex-col min-h-screen">
          <Header userRole="student" />
          <SidebarInset>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </SidebarInset>
        </div>
    </SidebarProvider>
  );
}
