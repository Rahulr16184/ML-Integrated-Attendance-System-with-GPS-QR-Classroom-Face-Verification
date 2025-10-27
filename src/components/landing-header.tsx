
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex-1 flex justify-start">
        {/* Empty div for spacing, keeps the title centered */}
      </div>
      <div className="flex-1 flex justify-center">
        <Link href="/" className="font-bold text-xl tracking-wider">
          TRACEIN
        </Link>
      </div>
      <nav className="flex-1 flex justify-end gap-2 sm:gap-4">
        <Button asChild variant="outline">
            <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
            <Link href="/register">Sign Up</Link>
        </Button>
      </nav>
    </header>
  );
}
