

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  name: string;
  date: string;
  time: string;
  status: 'Present' | 'Absent' | 'Late';
};

export type ClassroomPhoto = {
  url: string;
  embedded: boolean;
};

export type ModeConfig = {
    enabled: boolean;
};

export type Department = {
  id:string;
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
  classroomPhotoUrls?: ClassroomPhoto[];
  studentsInClassroomPhotoUrls?: ClassroomPhoto[];
  modes?: {
    mode1: ModeConfig;
    mode2: ModeConfig;
  };
  classroomCode?: {
    code: string;
    expiresAt: number; // Store as Firestore Timestamp or number
  }
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

export type AttendanceLog = {
    id: string;
    studentId: string;
    studentName: string;
    departmentId: string;
    date: string; // ISO string
    status: 'Present' | 'Absent' | 'Late' | 'Approved Present' | 'Conflict' | 'Revoked';
    mode: 1 | 2;
    verificationPhotoUrl: string;
    markedBy: 'student' | 'teacher' | 'admin';
    location?: { lat: number; lng: number } | null;
    notes?: string;
};

export type Student = {
    uid: string;
    name: string;
    profileImage?: string;
};
