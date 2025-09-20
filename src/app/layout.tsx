import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { Header } from "@/components/header";
import { Bot } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TRACEIN",
  description: "ML integrated attendance system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <Sidebar>
              <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                  <Bot className="w-8 h-8 text-primary" />
                  <h1 className="text-xl font-semibold">TRACEIN</h1>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <MainNav />
              </SidebarContent>
            </Sidebar>
            <SidebarInset className="flex flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
