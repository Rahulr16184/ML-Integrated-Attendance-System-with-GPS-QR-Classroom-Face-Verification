import type { AttendanceRecord } from '@/lib/types';

export const mockAttendanceRecords: AttendanceRecord[] = [
  { id: '1', employeeId: 'E123', name: 'Alice Johnson', date: '2024-07-29', time: '09:02', status: 'Present' },
  { id: '2', employeeId: 'E456', name: 'Bob Williams', date: '2024-07-29', time: '09:15', status: 'Present' },
  { id: '3', employeeId: 'E789', name: 'Charlie Brown', date: '2024-07-29', time: '--', status: 'Absent' },
  { id: '4', employeeId: 'E101', name: 'Diana Miller', date: '2024-07-29', time: '09:08', status: 'Late' },
  { id: '5', employeeId: 'E112', name: 'Ethan Davis', date: '2024-07-28', time: '08:55', status: 'Present' },
  { id: '6', employeeId: 'E789', name: 'Charlie Brown', date: '2024-07-28', time: '09:05', status: 'Present' },
];
