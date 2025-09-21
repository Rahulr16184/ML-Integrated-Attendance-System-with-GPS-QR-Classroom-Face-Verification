import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Database, Activity, Building, Users } from "lucide-react";
import Link from "next/link";

export default function ServerDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Server Dashboard</h1>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button asChild size="lg" className="h-16 text-base sm:h-20 sm:text-lg">
              <Link href="/server-manage-institution">
                <Building className="mr-2 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6" />
                Manage Institutions
              </Link>
            </Button>
            <Button asChild size="lg" className="h-16 text-base sm:h-20 sm:text-lg">
              <Link href="/server-manage-user">
                <Users className="mr-2 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6" />
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, Server Admin!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Server className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24%</div>
                <p className="text-xs text-muted-foreground">Normal utilization</p>
              </CardContent>
              <CardFooter>
                 <Button variant="outline">View Details</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Database className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6.8 / 16 GB</div>
                <p className="text-xs text-muted-foreground">42% used</p>
              </CardContent>
               <CardFooter>
                 <Button variant="outline">Manage</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">152</div>
                <p className="text-xs text-muted-foreground">new events in last hour</p>
              </CardContent>
               <CardFooter>
                 <Button>View Logs</Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
