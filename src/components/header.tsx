"use client";

import Link from "next/link";
import { User, Home, LogOut, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type HeaderProps = {
    dashboardUrl?: string;
    userRole?: string;
}

export function Header({ dashboardUrl = "/profile", userRole }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={dashboardUrl}>
            <Home className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </Button>
        {userRole && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs capitalize text-muted-foreground">{userRole}</span>
          </div>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
         {userRole !== 'server' && (
            <Button variant="outline" size="icon" asChild>
                <Link href="/profile">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Profile</span>
                </Link>
            </Button>
         )}
        <ThemeToggle />
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <LogOut className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Logout</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert />Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to log out? Any unsaved changes may be lost.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
