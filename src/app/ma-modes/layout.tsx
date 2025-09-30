
import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "TRACEIN - Attendance Modes",
  description: "ML integrated attendance system",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
