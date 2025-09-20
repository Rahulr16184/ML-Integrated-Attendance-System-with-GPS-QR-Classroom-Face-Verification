"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Header() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <ThemeToggle />
      <div className="flex flex-col items-center">
        <Button variant="outline" size="icon" asChild>
          <Link href="/profile">
            <User className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Profile</span>
          </Link>
        </Button>
        {userRole && (
          <div className="flex items-center gap-1 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs capitalize text-muted-foreground">{userRole}</span>
          </div>
        )}
      </div>
    </header>
  );
}
