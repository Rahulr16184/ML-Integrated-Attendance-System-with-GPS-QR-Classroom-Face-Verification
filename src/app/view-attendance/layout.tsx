
import StudentDashboardLayout from "@/app/student-dashboard/layout";

export const metadata = {
  title: "TRACEIN - View Attendance",
  description: "ML integrated attendance system",
};

export default function ViewAttendanceLayout({
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
