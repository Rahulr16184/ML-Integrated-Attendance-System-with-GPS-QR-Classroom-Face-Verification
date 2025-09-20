import { AttendanceReportClient } from "@/components/attendance-report-client";
import { mockAttendanceRecords } from "@/lib/data";

export default function ReportsPage() {
  // In a real app, you would fetch this data from a database.
  const records = mockAttendanceRecords;

  return (
    <div className="p-4 sm:p-6">
      <AttendanceReportClient initialRecords={records} />
    </div>
  );
}
