import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CheckSquare, Users, User, Calendar, Phone, Mail, Building, Network } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hi, Teacher</h1>
        
        <Card>
            <CardHeader className="text-center">
                <CardTitle>INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center space-x-4">
                    <User className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">NAME</p>
                        <p className="text-sm text-muted-foreground">Teacher User</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">DOB</p>
                        <p className="text-sm text-muted-foreground">20-05-1985</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Phone className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">MOBILE NO</p>
                        <p className="text-sm text-muted-foreground">+1 111 222 333</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Mail className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">MAIL ID</p>
                        <p className="text-sm text-muted-foreground">teacher@example.com</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Building className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">INSTITUTION</p>
                        <p className="text-sm text-muted-foreground">Global Tech Academy</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Network className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">DEPARTMENT</p>
                        <p className="text-sm text-muted-foreground">Computer Science</p>
                    </div>
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
      </main>
    </div>
  );
}
