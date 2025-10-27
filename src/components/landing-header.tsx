
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, University } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <Link href="/" className="flex items-center justify-center">
        <University className="h-6 w-6" />
        <span className="sr-only">TRACEIN</span>
      </Link>
      <nav className="ml-auto hidden lg:flex gap-4 sm:gap-6">
        <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
          Features
        </Link>
        <Button asChild variant="outline">
            <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
            <Link href="/register">Sign Up</Link>
        </Button>
      </nav>
      <div className="ml-auto lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="grid gap-6 text-lg font-medium mt-12">
              <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                <University className="h-6 w-6" />
                <span className="sr-only">TRACEIN</span>
              </Link>
              <Link href="#features" className="text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <div className="flex flex-col gap-4 mt-8">
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
