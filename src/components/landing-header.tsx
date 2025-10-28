
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b bg-background/95 backdrop-blur-sm animate-shine">
      <div className="container flex h-full items-center">
        <Link href="/" className="mr-6 flex items-center font-serif text-2xl font-bold tracking-wider">
          <span>TRACE</span>
          <span className="bg-foreground text-background rounded-md px-1 ml-0.5">IN</span>
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon">
              <Link href="/login">
                  <LogIn className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Login</span>
              </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
