
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, LayoutDashboard, Settings, Info } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hi, Admin</h1>
        
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Info className="h-6 w-6" />
                <CardTitle>INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">NAME</p>
                    <p className="text-sm text-muted-foreground break-words">Admin User</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">DOB</p>
                    <p className="text-sm text-muted-foreground break-words">01-01-1990</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">MOBILE NO</p>
                    <p className="text-sm text-muted-foreground break-words">+1 234 567 890</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">MAIL ID</p>
                    <p className="text-sm text-muted-foreground break-words">admin@example.com</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">INSTITUTION</p>
                    <p className="text-sm text-muted-foreground break-words">Global Tech Academy</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">DEPARTMENT</p>
                    <p className="text-sm text-muted-foreground break-words">Administration</p>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, Admin!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Manage Users</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">active users</p>
              </CardContent>
              <CardFooter>
                 <Button asChild><Link href="/enrollment">Go to Enrollment</Link></Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System Reports</CardTitle>
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">new reports</p>
              </CardContent>
               <CardFooter>
                 <Button asChild><Link href="/reports">View Reports</Link></Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System Settings</CardTitle>
                <Settings className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Health</div>
                <p className="text-xs text-muted-foreground">System is running</p>
              </CardContent>
               <CardFooter>
                 <Button variant="outline">Configure</Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
