
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseISO, isSameDay, format, startOfTomorrow, isBefore, startOfToday, isAfter, endOfDay } from "date-fns";
import Image from "next/image";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import { getSemesters } from "@/services/working-days-service";
import { getStudentAttendance } from "@/services/attendance-service";
import type { Department, Semester, AttendanceLog } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from as unknown as string),
    to: parseISO(semester.dateRange.to as unknown as string),
  },
  holidays: semester.holidays.map(h => parseISO(h as unknown as string)),
});

export default function MaRecordsPage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLog[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceLog | "absent" | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    if (!role) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    async function fetchDepartments() {
      if (userProfile?.institutionId && userProfile.departmentIds) {
        setLoadingDepartments(true);
        const institutions = await getInstitutions();
        const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
        if (currentInstitution) {
          const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
          setAllDepartments(userDepartments);
          if (userDepartments.length > 0 && !selectedDepartmentId) {
            setSelectedDepartmentId(userDepartments[0].id);
          }
        }
        setLoadingDepartments(false);
      }
    }
    if (isAuthorized && !userLoading) {
      fetchDepartments();
    }
  }, [userProfile, userLoading, isAuthorized, selectedDepartmentId]);

  useEffect(() => {
    async function fetchSemesters() {
      if (userProfile?.institutionId && selectedDepartmentId) {
        setLoadingSemesters(true);
        const fetchedSemesters = await getSemesters(userProfile.institutionId, selectedDepartmentId);
        const parsedSemesters = fetchedSemesters.map(parseSemesterDates);
        setSemesters(parsedSemesters);
        if (parsedSemesters.length > 0) {
          const currentSem = parsedSemesters.find(s => isSameDay(s.dateRange.from, new Date()) || (new Date() > s.dateRange.from && new Date() < s.dateRange.to)) || parsedSemesters[0];
          setSelectedSemesterId(currentSem.id);
        } else {
          setSelectedSemesterId("");
        }
        setLoadingSemesters(false);
      }
    }
    if (isAuthorized && selectedDepartmentId) {
      fetchSemesters();
    }
  }, [userProfile, selectedDepartmentId, isAuthorized]);

  const selectedSemester = useMemo(() => {
    return semesters.find(s => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (userProfile?.uid && selectedSemester) {
        setLoadingAttendance(true);
        const records = await getStudentAttendance(userProfile.uid, selectedSemester.dateRange.from, selectedSemester.dateRange.to);
        const filteredRecords = records.filter(rec => rec.departmentId === selectedDepartmentId);
        setAttendanceRecords(filteredRecords);
        setLoadingAttendance(false);
      } else {
        setAttendanceRecords([]);
      }
    };
    fetchAttendance();
  }, [userProfile, selectedSemester, selectedDepartmentId]);

  const { presentDays, absentDays, remainingDays } = useMemo(() => {
    if (!selectedSemester) return { presentDays: [], absentDays: [], remainingDays: 0 };
    
    const present = attendanceRecords.map(r => parseISO(r.date));
    const absent: Date[] = [];
    
    const holidays = new Set(selectedSemester.holidays.map(h => h.toDateString()));
    const presentDates = new Set(present.map(p => p.toDateString()));

    // Calculate absent days (past working days with no attendance)
    for (let d = new Date(selectedSemester.dateRange.from); isBefore(d, startOfToday()); d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toDateString();

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateString) && !presentDates.has(dateString)) {
            absent.push(new Date(d));
        }
    }
    
    // Calculate remaining working days (from tomorrow to end of semester)
    let remaining = 0;
    const tomorrow = startOfTomorrow();
    if (isAfter(selectedSemester.dateRange.to, tomorrow)) {
        for (let d = new Date(tomorrow); isBefore(d, endOfDay(selectedSemester.dateRange.to)); d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateString = d.toDateString();

            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateString)) {
                remaining++;
            }
        }
    }

    return { presentDays: present, absentDays: absent, remainingDays: remaining };
  }, [attendanceRecords, selectedSemester]);
  
  const calendarModifiers = {
    present: presentDays,
    absent: absentDays,
    holiday: selectedSemester?.holidays || [],
  };

  const calendarModifiersClassNames = {
    present: "bg-green-200 dark:bg-green-800 rounded-full",
    absent: "bg-red-200 dark:bg-red-800 rounded-full",
    holiday: 'text-red-500 line-through',
  };

  const handleDayClick = (day: Date, modifiers: { present?: boolean, absent?: boolean }) => {
    if (modifiers.present) {
      const record = attendanceRecords.find(r => isSameDay(parseISO(r.date), day));
      if (record) {
        setSelectedDateRecord(record);
      }
    } else if (modifiers.absent) {
        setSelectedDateRecord("absent");
    }
  };
  
  const numberOfMonths = useMemo(() => {
    if (!selectedSemester) return 1;
    const from = selectedSemester.dateRange.from;
    const to = selectedSemester.dateRange.to;
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  }, [selectedSemester]);


  if (!isAuthorized || userLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isPresentRecord = (record: typeof selectedDateRecord): record is AttendanceLog => {
      return record !== null && record !== 'absent';
  }
  
  const totalWorkingDays = selectedSemester?.workingDays ?? 0;
  const presentCount = presentDays.length;
  const absentCount = absentDays.length;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance Records</CardTitle>
            <CardDescription>Select a department and semester to view your attendance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                {loadingDepartments ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={allDepartments.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                {loadingSemesters ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select onValueChange={setSelectedSemesterId} value={selectedSemesterId} disabled={semesters.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                    <SelectContent>
                      {semesters.map(sem => <SelectItem key={sem.id} value={sem.id}>{sem.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {(loadingSemesters || loadingAttendance) && <Skeleton className="h-96 w-full" />}
        
        {selectedSemester && !loadingAttendance && (
          <>
            <Card>
                <CardHeader>
                    <CardTitle>Calendar for {selectedSemester.name}</CardTitle>
                    <CardDescription>Click on a highlighted day to see details.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="default"
                        month={selectedSemester.dateRange.from}
                        fromDate={selectedSemester.dateRange.from}
                        toDate={selectedSemester.dateRange.to}
                        modifiers={calendarModifiers}
                        modifiersClassNames={calendarModifiersClassNames}
                        onDayClick={handleDayClick}
                        disabled={{ after: new Date() }}
                        numberOfMonths={numberOfMonths}
                        className="p-0"
                        classNames={{
                          day: cn("h-10 w-10"),
                          day_disabled: "text-muted-foreground/50",
                          day_selected: "",
                          day_range_middle: "",
                        }}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Days</p>
                        <p className="text-2xl font-bold">{totalWorkingDays}</p>
                    </div>
                    <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">Present</p>
                        <p className="text-2xl font-bold">{presentCount}</p>
                    </div>
                    <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">Absent</p>
                        <p className="text-2xl font-bold">{absentCount}</p>
                    </div>
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Remaining</p>
                        <p className="text-2xl font-bold">{remainingDays}</p>
                    </div>
                </CardContent>
            </Card>
          </>
        )}
        {!selectedSemester && !loadingSemesters && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Please select a department and semester to view the calendar.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedDateRecord} onOpenChange={() => setSelectedDateRecord(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {selectedDateRecord === 'absent' ? "Absent" : `Attendance for ${isPresentRecord(selectedDateRecord) ? format(parseISO(selectedDateRecord.date), "PPP") : ""}`}
                </DialogTitle>
                {selectedDateRecord !== 'absent' && (
                  <DialogDescription>Details of your attendance record for this day.</DialogDescription>
                )}
            </DialogHeader>
             {selectedDateRecord === 'absent' && (
                <div className="py-4 text-center">
                    <p className="text-muted-foreground">No attendance marked for this day.</p>
                </div>
            )}
            {isPresentRecord(selectedDateRecord) && (
                <div className="space-y-4 py-4">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image src={selectedDateRecord.verificationPhotoUrl} alt="Verification Photo" layout="fill" objectFit="contain" data-ai-hint="student classroom" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium">Status:</div>
                        <div><Badge>{selectedDateRecord.status}</Badge></div>
                        
                        <div className="font-medium">Time:</div>
                        <div>{format(parseISO(selectedDateRecord.date), "p")}</div>

                        <div className="font-medium">Mode:</div>
                        <div>{selectedDateRecord.mode === 1 ? "GPS + Classroom + Face" : "QR + Face"}</div>
                        
                        <div className="font-medium">Marked by:</div>
                        <div className="capitalize">{selectedDateRecord.markedBy || '--'}</div>

                        <div className="font-medium">Location:</div>
                        <div>{selectedDateRecord.location ? `${selectedDateRecord.location.lat.toFixed(5)}, ${selectedDateRecord.location.lng.toFixed(5)}` : '--'}</div>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}

    