
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
import { Home, LogOut, ShieldAlert, Sun, Moon, DatabaseZap, CalendarDays, MapPin, ClipboardCheck, Camera, QrCode, ToggleRight, Hash, Settings, School } from "lucide-react";

export function AdminNav() {
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
    { href: "/admin-dashboard", label: "Dashboard", icon: Home, group: "main" },
    { href: "/working-days", label: "Working Days", icon: CalendarDays, group: "attendance" },
    { href: "/gps", label: "GPS Set-up", icon: MapPin, group: "attendance" },
    { href: "/ma-records", label: "MA Records", icon: ClipboardCheck, group: "attendance" },
    { href: "/classroom-photo-config", label: "Classroom Photo Conf", icon: Camera, group: "attendance" },
    { href: "/qr-generator", label: "QR Generator", icon: QrCode, group: "attendance" },
    { href: "/ma-modes", label: "MA Modes", icon: ToggleRight, group: "attendance" },
    { href: "/classroom-code-generator", label: "Classroom Code", icon: Hash, group: "attendance" },
    { href: "/add-department", label: "Add a Department", icon: School, group: "settings" },
  ];

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <SidebarMenu className="flex-1">
          <div className="p-2 flex flex-row gap-2">
            <Button onClick={toggleTheme} className="flex-1 justify-center">
              {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
               <span>Mode</span>
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1 justify-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
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
              <SidebarGroupLabel className="flex items-center gap-2"><DatabaseZap className="h-4 w-4"/> Master Attendance</SidebarGroupLabel>
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
              <SidebarGroupLabel className="flex items-center gap-2"><Settings className="h-4 w-4"/> Settings</SidebarGroupLabel>
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
    </>
  );
}
