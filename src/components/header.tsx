"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <Button variant="outline" size="icon" asChild>
        <Link href="/profile">
          <User className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Profile</span>
        </Link>
      </Button>
      <ThemeToggle />
    </header>
  );
}
