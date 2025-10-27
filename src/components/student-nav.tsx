
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { CheckSquare, ClipboardCheck, School, Home } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function StudentNav() {
  const pathname = usePathname();

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
    <SidebarMenu>
        <SidebarGroup>
            <div className="flex justify-end p-2 pb-0">
                <ThemeToggle />
            </div>
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
  );
}
