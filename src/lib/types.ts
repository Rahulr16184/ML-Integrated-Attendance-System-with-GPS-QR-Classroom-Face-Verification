
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
  };
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  classroomPhotoUrls?: string[];
  studentsInClassroomPhotoUrls?: string[];
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
  dateRange: { from: string; to: string };
  holidays: string[];
  workingDays: number;
};

    

    