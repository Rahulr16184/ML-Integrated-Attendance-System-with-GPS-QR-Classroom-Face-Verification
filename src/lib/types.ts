export type AttendanceRecord = {
  id: string;
  employeeId: string;
  name: string;
  date: string;
  time: string;
  status: 'Present' | 'Absent' | 'Late';
};

export type Department = {
  id: string;
  name: string;
  secretCodes: {
    student: string;
    teacher: string;
    admin: string;
    server: string;
  };
};

export type Institution = {
  id: string;
  name: string;
  departments: Department[];
};

export type Semester = {
  id: string;
  name: string;
  roman: string;
  batch: string;
  dateRange: { from: string; to: string };
  holidays: string[];
  workingDays: number;
};

    
