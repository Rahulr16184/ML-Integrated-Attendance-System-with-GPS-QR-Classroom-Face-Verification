
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, LogIn, UserPlus } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="grid grid-cols-3 h-full items-center px-4 md:px-6">
        <div className="flex items-center">
          <ThemeToggle />
        </div>
        <div className="flex justify-center">
          <Link href="/" className="flex items-center font-serif text-2xl font-bold tracking-wider">
            <span>TRACE</span>
            <span className="bg-foreground text-background rounded-md px-1 ml-0.5">IN</span>
          </Link>
        </div>
        <div className="flex justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 text-lg font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 rounded-md p-2 hover:bg-muted">
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link href="/login" className="flex items-center gap-2 rounded-md p-2 hover:bg-muted">
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </Link>
                <Link href="/register" className="flex items-center gap-2 rounded-md p-2 hover:bg-muted">
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
