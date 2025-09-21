import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CheckSquare, User, Calendar, Phone, Mail, Building, Network } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hi, Student</h1>
        
        <Card>
            <CardHeader className="text-center">
                <CardTitle>INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center space-x-4">
                    <User className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">NAME</p>
                        <p className="text-sm text-muted-foreground">Student User</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">DOB</p>
                        <p className="text-sm text-muted-foreground">15-08-2002</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Phone className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">MOBILE NO</p>
                        <p className="text-sm text-muted-foreground">+1 987 654 321</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Mail className="w-6 h-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">MAIL ID</p>
                        <p className="text-sm text-muted-foreground">student@example.com</p>
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
            <CardTitle>Welcome, Student!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">courses enrolled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <CheckSquare className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">overall attendance</p>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter>
            <Button>View Details</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
