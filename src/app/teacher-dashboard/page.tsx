
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CheckSquare, Users, Info, CreditCard, DatabaseZap, CalendarDays } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hi, Teacher</h1>
        
        <div className="w-full">
            <Button asChild className="w-full text-lg py-6">
                <Link href="/idcard">
                    <CreditCard className="mr-2 h-5 w-5" />
                    View ID Card
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Info className="h-6 w-6" />
                <CardTitle>INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">NAME</p>
                    <p className="text-sm text-muted-foreground break-words">Teacher User</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">DOB</p>
                    <p className="text-sm text-muted-foreground break-words">20-05-1985</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">MOBILE NO</p>
                    <p className="text-sm text-muted-foreground break-words">+1 111 222 333</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">MAIL ID</p>
                    <p className="text-sm text-muted-foreground break-words">teacher@example.com</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">INSTITUTION</p>
                    <p className="text-sm text-muted-foreground break-words">Global Tech Academy</p>
                </div>
                <div className="grid grid-cols-2 items-center">
                    <p className="text-sm font-medium">DEPARTMENT</p>
                    <p className="text-sm text-muted-foreground break-words">Computer Science</p>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, Teacher!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">classes assigned</p>
              </CardContent>
              <CardFooter>
                <Button>View Classes</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Log Attendance</CardTitle>
                <CheckSquare className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Ready</div>
                <p className="text-xs text-muted-foreground">Start taking attendance</p>
              </CardContent>
              <CardFooter>
                <Button asChild><Link href="/attendance">Start</Link></Button>
              </CardFooter>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Student Enrollment</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Enroll</div>
                <p className="text-xs text-muted-foreground">Add new students</p>
              </CardContent>
              <CardFooter>
                <Button asChild><Link href="/enrollment">Enroll</Link></Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DatabaseZap className="h-6 w-6" />
                    MANAGE MASTER ATTENDANCE
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Button asChild variant="secondary" className="h-24 w-28 flex-col gap-2">
                    <Link href="/working-days">
                        <CalendarDays className="h-8 w-8" />
                        <span className="text-sm font-semibold">WORKING DAYS</span>
                    </Link>
                </Button>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}
