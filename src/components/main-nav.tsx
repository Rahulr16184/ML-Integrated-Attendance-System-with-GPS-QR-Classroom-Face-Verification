"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Camera, UserPlus, FileText, CreditCard, User } from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { useState, useEffect } from "react";

export function MainNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const getProfileUrl = () => {
    switch (userRole) {
      case "admin": return "/admin-profile";
      case "teacher": return "/teacher-profile";
      case "student": return "/student-profile";
      default: return "/profile";
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
        href: getProfileUrl(),
        label: "Profile",
        icon: User,
    }
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
