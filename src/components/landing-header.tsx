
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm sticky top-0 z-50 bg-background/95 backdrop-blur-sm animate-shine">
      <div className="flex-1 flex justify-start">
        {/* Empty div for spacing, keeps the title centered */}
      </div>
      <div className="flex-1 flex justify-center">
        <Link href="/" className="font-bold text-xl tracking-wider">
          TRACEIN
        </Link>
      </div>
      <nav className="flex-1 flex justify-end gap-2 sm:gap-4">
        <ThemeToggle />
      </nav>
    </header>
  );
}
