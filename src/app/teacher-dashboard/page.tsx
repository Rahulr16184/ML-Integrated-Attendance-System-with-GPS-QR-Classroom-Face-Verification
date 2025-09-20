import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CheckSquare, Users } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Teacher!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
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
      </main>
    </div>
  );
}
