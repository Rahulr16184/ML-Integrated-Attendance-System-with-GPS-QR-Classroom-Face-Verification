
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, Palette, School, Users2 } from "lucide-react";
import Link from "next/link";
import { getAllUsers } from "@/services/user-service";
import { getInstitutions } from "@/services/institution-service";
import { InstitutionStatsChart } from "@/components/institution-stats-chart";

export default async function ServerDashboardPage() {
  const users = await getAllUsers();
  const institutions = await getInstitutions();

  const totalUsers = users.length;
  const totalInstitutions = institutions.length;

  const institutionStats = institutions.map(inst => {
    const usersInInstitution = users.filter(u => u.institutionId === inst.id);
    const roleCounts = {
      student: usersInInstitution.filter(u => u.role === 'student').length,
      teacher: usersInInstitution.filter(u => u.role === 'teacher').length,
      admin: usersInInstitution.filter(u => u.role === 'admin').length,
    };
    return {
      id: inst.id,
      name: inst.name,
      departmentCount: inst.departments.length,
      totalUsers: usersInInstitution.length,
      chartData: [
        { role: "Students", count: roleCounts.student, fill: "var(--color-students)" },
        { role: "Teachers", count: roleCounts.teacher, fill: "var(--color-teachers)" },
        { role: "Admins", count: roleCounts.admin, fill: "var(--color-admins)" },
      ],
    };
  });

  const chartConfig = {
    count: {
      label: "Users",
    },
    students: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
    teachers: {
      label: "Teachers",
      color: "hsl(var(--chart-2))",
    },
    admins: {
      label: "Admins",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Server Dashboard</h1>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
             <Button asChild size="lg" className="h-16 text-base sm:h-20 sm:text-lg">
              <Link href="/server-manage-theme">
                <Palette className="mr-2 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6" />
                Manage Theme
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>An overview of all users and institutions in the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                        <Users2 className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users in System</p>
                            <p className="text-2xl font-bold">{totalUsers}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                        <Building className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Institutions</p>
                            <p className="text-2xl font-bold">{totalInstitutions}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {institutionStats.map(stat => (
                        <div key={stat.id} className="p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold">{stat.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 mb-4 text-center md:text-left">
                               <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                    <Users2 className="h-5 w-5 text-muted-foreground"/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Users</p>
                                        <p className="font-bold">{stat.totalUsers}</p>
                                    </div>
                               </div>
                               <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                    <School className="h-5 w-5 text-muted-foreground"/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Departments</p>
                                        <p className="font-bold">{stat.departmentCount}</p>
                                    </div>
                               </div>
                            </div>
                            <InstitutionStatsChart chartConfig={chartConfig} chartData={stat.chartData} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
