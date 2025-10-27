
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
import { CheckSquare, ClipboardCheck, School, Home, LogOut, ShieldAlert, Sun, Moon } from "lucide-react";

export function StudentNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <SidebarMenu className="flex-1">
          <div className="p-2">
            <Button onClick={toggleTheme} className="w-full justify-start text-base p-2 h-auto">
              {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              Switch Mode
            </Button>
          </div>
        
          <SidebarSeparator />

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
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start text-base p-2 h-auto">
                    <LogOut className="mr-2 h-4 w-4 text-white" /> Logout
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
      </SidebarFooter>
    </>
  );
}
