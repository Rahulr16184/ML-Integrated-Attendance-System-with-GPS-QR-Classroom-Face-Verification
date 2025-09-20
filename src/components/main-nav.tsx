"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Camera, UserPlus, FileText, Building, Users } from "lucide-react";
import { useEffect, useState } from "react";

export function MainNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem("userRole");
      setUserRole(role);
    }
  }, []);

  const serverMenuItems = [
    {
      href: "/server-manage-institution",
      label: "Create and Manage institutions",
      icon: Building,
    },
    {
      href: "/server-manage-user",
      label: "Manage and monitor users",
      icon: Users,
    },
  ];

  const defaultMenuItems = [
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

  const menuItems = userRole === 'server' ? serverMenuItems : defaultMenuItems;

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
