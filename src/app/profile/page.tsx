"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole"));
    setUserEmail(localStorage.getItem("userEmail"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    router.push("/login");
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://picsum.photos/seed/1/200/200" alt="User avatar" data-ai-hint="profile picture" />
              <AvatarFallback>{userEmail?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold capitalize">{userRole || 'User'}</h2>
              <p className="text-muted-foreground">{userEmail || 'No email found'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium">Role</h3>
            <p className="text-muted-foreground capitalize">{userRole || 'Not assigned'}</p>
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleLogout} variant="destructive">
                Logout
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
