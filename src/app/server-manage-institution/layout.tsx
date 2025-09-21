import type { Metadata } from "next";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ServerNav } from "@/components/server-nav";
import { Header } from "@/components/header";
import { Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "TRACEIN - Server",
  description: "ML integrated attendance system",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold">TRACEIN</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ServerNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <Header dashboardUrl="/server-dashboard" userRole="server" />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
