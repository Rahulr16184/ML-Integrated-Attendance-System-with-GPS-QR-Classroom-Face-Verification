
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users } from "lucide-react";
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
      </main>
    </div>
  );
}
