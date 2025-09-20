export type AttendanceRecord = {
  id: string;
  employeeId: string;
  name: string;
  date: string;
  time: string;
  status: 'Present' | 'Absent' | 'Late';
};
