
"use client";

import Link from "next/link";
import { User, Home, LogOut, ShieldAlert, Book, Camera, UserPlus, FileText, CreditCard, Map, CalendarDays, School } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react";

type HeaderProps = {
    dashboardUrl?: string;
    userRole?: string;
}

export function Header({ dashboardUrl: defaultDashboardUrl, userRole: initialUserRole }: HeaderProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState(initialUserRole);

  useEffect(() => {
    if (!initialUserRole) {
      const roleFromStorage = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
      if (roleFromStorage) {
        setUserRole(roleFromStorage);
      }
    }
  }, [initialUserRole]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    router.push("/login");
  };

  const getDashboardUrl = () => {
    if (defaultDashboardUrl) return defaultDashboardUrl;
    switch (userRole) {
      case "admin": return "/admin-dashboard";
      case "teacher": return "/teacher-dashboard";
      case "student": return "/student-dashboard";
      case "server": return "/server-dashboard";
      default: return "/";
    }
  };

  const getProfileUrl = () => {
    switch (userRole) {
      case "admin": return "/admin-profile";
      case "teacher": return "/teacher-profile";
      case "student": return "/student-profile";
      default: return "/";
    }
  };
  
    const menuItems = [
    {
      href: "/attendance",
      label: "Attendance",
      icon: Camera,
    },
    {
      href: "/enrollment",
      label: "Enrollment",
      icon: UserPlus,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
    },
    {
      href: "/idcard",
      label: "ID Card",
      icon: CreditCard,
    },
    {
      href: "/gps",
      label: "GPS",
      icon: Map,
    },
  ];

  if (userRole === "admin" || userRole === "teacher") {
    menuItems.push({
      href: "/working-days",
      label: "Working Days",
      icon: CalendarDays,
    });
  }
  
  if (userRole !== 'server') {
      menuItems.push({
        href: "/add-department",
        label: "Add Department",
        icon: School
      });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={getDashboardUrl()}>
            <Home className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </Button>
        {userRole && userRole !== 'server' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Book className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {menuItems.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                   <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
                <Link href={getProfileUrl()}>
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
