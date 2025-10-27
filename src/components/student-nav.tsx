
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar";
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
import { Button } from "@/components/ui/button";
import { CheckSquare, ClipboardCheck, School, Home, LogOut, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function StudentNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    router.push("/login");
  };

  const menuItems = [
    {
      href: "/student-dashboard",
      label: "Dashboard",
      icon: Home,
      group: "main",
    },
    {
      href: "/mark-attendance",
      label: "Mark Attendance",
      icon: CheckSquare,
      group: "attendance",
    },
    {
      href: "/view-attendance",
      label: "View Attendance",
      icon: ClipboardCheck,
      group: "attendance",
    },
    {
      href: "/add-department",
      label: "Add a Department",
      icon: School,
      group: "settings",
    },
  ];

  return (
    <>
      <SidebarMenu className="flex-1">
          <SidebarGroup>
              {menuItems.filter(item => item.group === 'main').map((item) => (
                  <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.label}
                          className={cn(pathname === item.href && "bg-sidebar-accent")}
                      >
                          <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
          </SidebarGroup>
        
          <SidebarSeparator />

          <SidebarGroup>
              <SidebarGroupLabel>Master Attendance</SidebarGroupLabel>
              {menuItems.filter(item => item.group === 'attendance').map((item) => (
                  <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className={cn(pathname === item.href && "bg-sidebar-accent")}
                  >
                      <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              {menuItems.filter(item => item.group === 'settings').map((item) => (
                  <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className={cn(pathname === item.href && "bg-sidebar-accent")}
                  >
                      <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
          </SidebarGroup>
      </SidebarMenu>
      
      <SidebarFooter>
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 border gap-2">
            <ThemeToggle />
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
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
      </SidebarFooter>
    </>
  );
}
