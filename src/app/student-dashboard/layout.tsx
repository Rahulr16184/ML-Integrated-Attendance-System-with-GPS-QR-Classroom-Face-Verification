
"use client";

import { Header } from "@/components/header";
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";
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
    <>
        <Sidebar>
            <SidebarContent>
                <StudentNav />
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <Header userRole="student" />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </SidebarInset>
    </>
  );
}
