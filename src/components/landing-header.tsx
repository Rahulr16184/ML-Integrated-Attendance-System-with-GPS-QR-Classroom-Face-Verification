
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm sticky top-0 z-50 bg-background/95 backdrop-blur-sm animate-shine">
      <div className="container flex items-center">
        <div className="flex-1 flex justify-start">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center font-serif text-2xl font-bold tracking-wider">
            <span>TRACE</span>
            <span className="bg-foreground text-background rounded-md px-1 ml-0.5">IN</span>
          </Link>
        </div>
        <nav className="flex-1 flex justify-end gap-2 sm:gap-4">
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
