
import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "TRACEIN - Manage Theme",
  description: "ML integrated attendance system",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header dashboardUrl="/server-dashboard" userRole="server" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
