"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Camera, UserPlus, FileText } from "lucide-react";

export function MainNav() {
  const pathname = usePathname();

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
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
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
    </SidebarMenu>
  );
}
