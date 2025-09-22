
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Camera, UserPlus, FileText, CreditCard, User, CalendarDays, Map, School } from "lucide-react";
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
      href: "/gps",
      label: "GPS",
      icon: Map,
    },
    {
        href: getProfileUrl(),
        label: "Profile",
        icon: User,
    }
  ];

  if (userRole === "admin" || userRole === "teacher") {
    menuItems.splice(4, 0, {
      href: "/working-days",
      label: "Working Days",
      icon: CalendarDays,
    });
  }

  // Add "Add Department" for all roles as requested
  menuItems.push({
    href: "/add-department",
    label: "Add Department",
    icon: School
  });


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
