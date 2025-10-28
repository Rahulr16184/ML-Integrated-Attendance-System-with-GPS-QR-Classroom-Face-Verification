
"use client";

import { Header } from "@/components/header";
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";
import { AdminNav } from "@/components/admin-nav";
import { useIsMobile } from "@/hooks/use-mobile";

// Metadata can't be used in a client component, but we can keep it for static analysis
// export const metadata: Metadata = {
//   title: "TRACEIN - Admin",
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
                <AdminNav />
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <Header userRole="admin" />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </SidebarInset>
    </>
  );
}
