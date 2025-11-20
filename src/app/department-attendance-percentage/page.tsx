

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import { getSemesters } from "@/services/working-days-service";
import { getStudentsByDepartment } from "@/services/user-service";
import { getStudentAttendance } from "@/services/attendance-service";
import type { Department, Semester, AttendanceLog, Student } from "@/lib/types";
import { parseISO, startOfToday, isSameDay, format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BarChart, Users, UserCheck, UserX } from "lucide-react";

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from as unknown as string),
    to: parseISO(semester.dateRange.to as unknown as string),
  },
  holidays: semester.holidays.map((h) => parseISO(h as unknown as string)),
});

type StudentAttendanceSummary = {
  uid: string;
  name: string;
  profileImage?: string;
  present: number;
  approved: number;
  conflict: number;
  revoked: number;
  workingDaysPassed: number;
  percentage: number;
};

export default function DepartmentAttendancePage() {
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceLog[]>
  >({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      if (userProfile?.institutionId && userProfile.departmentIds) {
        setLoadingDepartments(true);
        const institutions = await getInstitutions();
        const currentInstitution = institutions.find(
          (inst) => inst.id === userProfile.institutionId
        );
        if (currentInstitution) {
          const userDepartments = currentInstitution.departments.filter((d) =>
            userProfile.departmentIds?.includes(d.id)
          );
          setAllDepartments(userDepartments);
          if (userDepartments.length > 0 && !selectedDepartmentId) {
            setSelectedDepartmentId(userDepartments[0].id);
          }
        }
        setLoadingDepartments(false);
      }
    }
    if (!userLoading) {
      fetchDepartments();
    }
  }, [userProfile, userLoading, selectedDepartmentId]);

  useEffect(() => {
    async function fetchSemestersAndStudents() {
      if (!selectedDepartmentId || !userProfile?.institutionId) return;

      // Fetch Semesters
      setLoadingSemesters(true);
      try {
        const fetchedSemesters = await getSemesters(
          userProfile.institutionId,
          selectedDepartmentId
        );
        const parsedSemesters = fetchedSemesters.map(parseSemesterDates);
        setSemesters(parsedSemesters);
        if (parsedSemesters.length > 0) {
          const currentSem =
            parsedSemesters.find(
              (s) =>
                isSameDay(s.dateRange.from, new Date()) ||
                (new Date() > s.dateRange.from && new Date() < s.dateRange.to)
            ) || parsedSemesters[0];
          setSelectedSemesterId(currentSem.id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch semesters.",
          variant: "destructive",
        });
      } finally {
        setLoadingSemesters(false);
      }

      // Fetch Students
      setLoadingStudents(true);
      try {
        const fetchedStudents = await getStudentsByDepartment(
          userProfile.institutionId,
          selectedDepartmentId
        );
        setStudents(fetchedStudents);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch student list.",
          variant: "destructive",
        });
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchSemestersAndStudents();
  }, [selectedDepartmentId, userProfile?.institutionId, toast]);

  const selectedSemester = useMemo(() => {
    return semesters.find((s) => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  useEffect(() => {
    async function fetchAllAttendance() {
      if (students.length === 0 || !selectedSemester) {
        setAttendanceData({});
        return;
      }

      setLoadingAttendance(true);
      const allData: Record<string, AttendanceLog[]> = {};
      await Promise.all(
        students.map(async (student) => {
          const records = await getStudentAttendance(
            student.uid,
            selectedSemester.dateRange.from,
            selectedSemester.dateRange.to
          );
          allData[student.uid] = records.filter(rec => rec.departmentId === selectedDepartmentId);
        })
      );
      setAttendanceData(allData);
setLoadingAttendance(false);
    }

    fetchAllAttendance();
  }, [students, selectedSemester, selectedDepartmentId]);

  const { attendanceSummary, eligibleStudents, nonEligibleStudents } = useMemo(() => {
    if (!selectedSemester || students.length === 0) return { attendanceSummary: [], eligibleStudents: 0, nonEligibleStudents: 0 };

    const today = startOfToday();
    const holidays = new Set(
      selectedSemester.holidays.map((h) => h.toDateString())
    );
    
    let workingDaysPassed = 0;

    for (
      let d = new Date(selectedSemester.dateRange.from);
      d <= today && d <= selectedSemester.dateRange.to;
      d.setDate(d.getDate() + 1)
    ) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(d.toDateString())) {
          workingDaysPassed++;
      }
    }

    const summary = students.map((student) => {
      const records = attendanceData[student.uid] || [];
      const present = records.filter((r) => r.status === "Present").length;
      const approved = records.filter(
        (r) => r.status === "Approved Present"
      ).length;
      const conflict = records.filter((r) => r.status === "Conflict").length;
      const revoked = records.filter((r) => r.status === "Revoked").length;
      
      const percentage =
        workingDaysPassed > 0
          ? ((present + approved) / workingDaysPassed) * 100
          : 0;
      
      return {
        uid: student.uid,
        name: student.name,
        profileImage: student.profileImage,
        present,
        approved,
        conflict,
        revoked,
        workingDaysPassed,
        percentage,
      };
    });

    const eligible = summary.filter(s => s.percentage >= 75).length;
    const nonEligible = summary.length - eligible;

    return {
      attendanceSummary: summary,
      eligibleStudents: eligible,
      nonEligibleStudents: nonEligible,
    }
  }, [selectedSemester, students, attendanceData]);
  
  const isLoading = userLoading || loadingDepartments || loadingSemesters || loadingStudents || loadingAttendance;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart/> Department Attendance Eligibility</CardTitle>
          <CardDescription>
            View student attendance percentages for the 75% eligibility criteria.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Department</Label>
            {userLoading || loadingDepartments ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                onValueChange={setSelectedDepartmentId}
                value={selectedDepartmentId}
                disabled={allDepartments.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {allDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Semester</Label>
            {loadingSemesters ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                onValueChange={setSelectedSemesterId}
                value={selectedSemesterId}
                disabled={semesters.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : selectedDepartmentId && selectedSemesterId ? (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Users className="h-4 w-4" /> Total Students</p>
                        <p className="text-2xl font-bold">{students.length}</p>
                    </div>
                    <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-2"><UserCheck className="h-4 w-4" /> Eligible (>=75%)</p>
                        <p className="text-2xl font-bold">{eligibleStudents}</p>
                    </div>
                    <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2"><UserX className="h-4 w-4" /> Not Eligible (&lt;75%)</p>
                        <p className="text-2xl font-bold">{nonEligibleStudents}</p>
                    </div>
                </CardContent>
                {selectedSemester && (
                    <CardFooter className="justify-center pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Working days from {format(selectedSemester.dateRange.from, 'MMM dd, yyyy')} to {format(selectedSemester.dateRange.to, 'MMM dd, yyyy')}. 
                            <span className="font-bold text-green-600 dark:text-green-400"> Total: {selectedSemester.workingDays} days</span>
                        </p>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Student Overview</CardTitle>
                    <CardDescription>
                        {students.length} student(s) found in this department.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="px-2 sm:px-4">Student</TableHead>
                            <TableHead className="text-center px-2 sm:px-4">Attendance</TableHead>
                            <TableHead className="text-center px-2 sm:px-4">Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceSummary.map((student) => (
                            <TableRow key={student.uid}>
                                <TableCell className="px-2 sm:px-4">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <Avatar>
                                            <AvatarImage src={student.profileImage} />
                                            <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-xs sm:text-sm">{student.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-mono text-base sm:text-lg px-2 sm:px-4">
                                    {student.present + student.approved}
                                </TableCell>
                                <TableCell
                                className={cn(
                                    "text-center font-bold text-base sm:text-lg px-2 sm:px-4",
                                    student.percentage >= 75
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                                >
                                {student.percentage.toFixed(2)}%
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    {students.length === 0 && (
                        <div className="text-center text-muted-foreground p-8">
                            No students found in this department.
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
      ) : (
          <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                  Select a department and semester to view the report.
              </CardContent>
          </Card>
      )}
    </div>
  );
}

    