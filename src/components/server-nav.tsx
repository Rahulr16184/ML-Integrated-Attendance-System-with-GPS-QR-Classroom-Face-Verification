"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Building, Users } from "lucide-react";

export function ServerNav() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/server-manage-institution",
      label: "Manage Institutions",
      icon: Building,
    },
    {
      href: "/server-manage-user",
      label: "Manage Users",
      icon: Users,
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
