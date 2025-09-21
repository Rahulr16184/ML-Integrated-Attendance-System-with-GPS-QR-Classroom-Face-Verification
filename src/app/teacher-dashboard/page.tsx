
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Info, CreditCard, DatabaseZap, CalendarDays } from "lucide-react";

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
