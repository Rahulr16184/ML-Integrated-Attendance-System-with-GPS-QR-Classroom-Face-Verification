
import StudentDashboardLayout from "@/app/student-dashboard/layout";

export const metadata = {
  title: "TRACEIN - Mark Attendance",
  description: "ML integrated attendance system",
};

export default function MarkAttendanceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StudentDashboardLayout>
      {children}
    </StudentDashboardLayout>
  );
}
