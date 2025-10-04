

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseISO, isSameDay, format, startOfTomorrow, isBefore, startOfToday, isAfter, endOfDay, differenceInDays } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from as unknown as string),
    to: parseISO(semester.dateRange.to as unknown as string),
  },
  holidays: semester.holidays.map(h => parseISO(h as unknown as string)),
});

export default function ViewAttendancePage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

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
    if (role !== 'student') {
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

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedSemesterId("");
    setSemesters([]);
    setAttendanceRecords([]);
  };

  useEffect(() => {
    async function fetchSemesters() {
      if (!isAuthorized || !selectedDepartmentId || !userProfile?.institutionId) return;

      setLoadingSemesters(true);
      try {
        const fetchedSemesters = await getSemesters(userProfile.institutionId, selectedDepartmentId);
        const parsedSemesters = fetchedSemesters.map(parseSemesterDates);
        setSemesters(parsedSemesters);
        if (parsedSemesters.length > 0) {
          const currentSem = parsedSemesters.find(s => isSameDay(s.dateRange.from, new Date()) || (new Date() > s.dateRange.from && new Date() < s.dateRange.to)) || parsedSemesters[0];
          setSelectedSemesterId(currentSem.id);
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Could not fetch semesters.', variant: 'destructive' });
      } finally {
        setLoadingSemesters(false);
      }
    }

    fetchSemesters();
  }, [selectedDepartmentId, userProfile, isAuthorized, toast]);
  

  const selectedSemester = useMemo(() => {
    return semesters.find(s => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  const fetchAttendance = useCallback(async () => {
      if (userProfile?.uid && selectedSemester) {
        setLoadingAttendance(true);
        const records = await getStudentAttendance(userProfile.uid, selectedSemester.dateRange.from, selectedSemester.dateRange.to);
        const filteredRecords = records.filter(rec => rec.departmentId === selectedDepartmentId);
        setAttendanceRecords(filteredRecords);
        setLoadingAttendance(false);
      } else {
        setAttendanceRecords([]);
      }
    }, [userProfile?.uid, selectedSemester, selectedDepartmentId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const { presentDays, absentDays, approvedDays, conflictDays, remainingDays, totalDays, holidaysCount, attendancePercentage } = useMemo(() => {
    if (!selectedSemester) return { presentDays: [], absentDays: [], approvedDays: [], conflictDays: [], remainingDays: 0, totalDays: 0, holidaysCount: 0, attendancePercentage: 0 };
    
    const present = attendanceRecords.filter(r => r.status === 'Present').map(r => parseISO(r.date));
    const approved = attendanceRecords.filter(r => r.status === 'Approved Present').map(r => parseISO(r.date));
    const conflict = attendanceRecords.filter(r => r.status === 'Conflict').map(r => parseISO(r.date));
    
    const holidays = new Set(selectedSemester.holidays.map(h => h.toDateString()));
    const attendedDates = new Set([...present, ...approved, ...conflict].map(p => p.toDateString()));
    const absent: Date[] = [];
    
    const today = startOfToday();
    const totalDaysInRange = differenceInDays(endOfDay(selectedSemester.dateRange.to), startOfToday(selectedSemester.dateRange.from)) + 1;
    
    for (let d = new Date(selectedSemester.dateRange.from); d <= today && d <= selectedSemester.dateRange.to; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toDateString();

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateString) && !attendedDates.has(dateString)) {
            absent.push(new Date(d));
        }
    }
    
    const passedWorkingDays = present.length + approved.length + absent.length + conflict.length;
    const percentage = passedWorkingDays > 0 ? ((present.length + approved.length) / passedWorkingDays) * 100 : 0;
    
    const remainingCalendarDays = isAfter(today, selectedSemester.dateRange.to)
        ? 0
        : differenceInDays(selectedSemester.dateRange.to, today);


    return { 
        presentDays: present, 
        absentDays: absent, 
        approvedDays: approved,
        conflictDays: conflict,
        remainingDays: remainingCalendarDays,
        totalDays: totalDaysInRange,
        holidaysCount: selectedSemester.holidays.length,
        attendancePercentage: percentage
    };
}, [attendanceRecords, selectedSemester]);
  
  const calendarModifiers = {
    present: presentDays,
    absent: absentDays,
    approved: approvedDays,
    conflict: conflictDays,
    holiday: selectedSemester?.holidays || [],
  };

  const calendarModifiersClassNames = {
    present: "bg-green-200 dark:bg-green-800",
    absent: "bg-red-200 dark:bg-red-800",
    approved: "bg-blue-200 dark:bg-blue-800",
    conflict: "bg-yellow-200 dark:bg-yellow-800",
    holiday: 'text-red-500 line-through',
  };

  const handleDayClick = (day: Date, modifiers: { present?: boolean; absent?: boolean; approved?: boolean; conflict?: boolean }) => {
    if (isAfter(day, new Date()) && !isSameDay(day, new Date())) return;

    if (modifiers.present || modifiers.approved || modifiers.conflict) {
      const record = attendanceRecords.find(r => isSameDay(parseISO(r.date), day));
      if (record) setSelectedDateRecord(record);
    } else if (modifiers.absent) {
        setSelectedDateRecord("absent");
    }
  };

  const isDayDisabled = (day: Date) => {
    if (!selectedSemester) return true;
    return isAfter(day, selectedSemester.dateRange.to) || isBefore(day, selectedSemester.dateRange.from) || (isAfter(day, new Date()) && !isSameDay(day, new Date()));
  };

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
  
  const presentCount = presentDays.length;
  const absentCount = absentDays.length;
  const approvedCount = approvedDays.length;
  const conflictCount = conflictDays.length;


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
                  <Select onValueChange={handleDepartmentChange} value={selectedDepartmentId} disabled={allDepartments.length === 0}>
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
        
        {selectedSemester && !loadingAttendance && !loadingSemesters && (
          <>
            <Card>
                <CardHeader>
                    <CardTitle>Calendar for {selectedSemester.name}</CardTitle>
                    <CardDescription>Click on a highlighted day to see details.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        pagedNavigation
                        fixedWeeks
                        defaultMonth={selectedSemester.dateRange.from}
                        fromDate={selectedSemester.dateRange.from}
                        toDate={selectedSemester.dateRange.to}
                        modifiers={calendarModifiers}
                        modifiersClassNames={calendarModifiersClassNames}
                        onDayClick={handleDayClick}
                        disabled={isDayDisabled}
                        className="p-0"
                        classNames={{
                          day: cn("h-10 w-10"),
                          day_disabled: "text-muted-foreground/50 cursor-not-allowed",
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
                <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Days</p>
                        <p className="text-2xl font-bold">{totalDays}</p>
                    </div>
                     <div className="p-4 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                        <p className="text-sm text-orange-600 dark:text-orange-400">Holidays</p>
                        <p className="text-2xl font-bold">{holidaysCount}</p>
                    </div>
                    <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">Present</p>
                        <p className="text-2xl font-bold">{presentCount}</p>
                    </div>
                     <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Approved</p>
                        <p className="text-2xl font-bold">{approvedCount}</p>
                    </div>
                    <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">Absent</p>
                        <p className="text-2xl font-bold">{absentCount}</p>
                    </div>
                     <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Conflict</p>
                        <p className="text-2xl font-bold">{conflictCount}</p>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                        <p className="text-2xl font-bold">{remainingDays}</p>
                    </div>
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg col-span-2 lg:col-span-1">
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">Attendance %</p>
                        <p className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg col-span-2 lg:col-span-2">
                        <p className="text-sm text-muted-foreground">Semester Dates</p>
                        <p className="text-sm font-bold mt-2">
                            {format(selectedSemester.dateRange.from, 'MMM dd')} - {format(selectedSemester.dateRange.to, 'MMM dd, yyyy')}
                        </p>
                    </div>
                </CardContent>
            </Card>
          </>
        )}
        {!selectedSemester && !loadingSemesters && selectedDepartmentId && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No semesters have been configured for this department.</p>
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
                  <DialogDescription>Details of attendance record for this day.</DialogDescription>
                )}
            </DialogHeader>
             {selectedDateRecord === 'absent' && (
                <div className="py-4 text-center">
                    <p className="text-muted-foreground">No attendance marked for this day.</p>
                </div>
            )}
            {isPresentRecord(selectedDateRecord) && (
                <div className="space-y-4 py-4">
                   {selectedDateRecord.status === 'Approved Present' ? (
                       <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                           <h4 className="font-semibold text-blue-800 dark:text-blue-300">Approval Reason</h4>
                           <p className="text-sm text-muted-foreground mt-1">{selectedDateRecord.verificationPhotoUrl}</p>
                       </div>
                   ) : selectedDateRecord.status === 'Conflict' && selectedDateRecord.notes ? (
                       <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                           <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Conflict Reason</h4>
                           <p className="text-sm text-muted-foreground mt-1">{selectedDateRecord.notes}</p>
                       </div>
                   ) : (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image src={selectedDateRecord.verificationPhotoUrl} alt="Verification Photo" layout="fill" objectFit="contain" data-ai-hint="student classroom" />
                    </div>
                   )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium">Status:</div>
                        <div><Badge variant={selectedDateRecord.status === 'Approved Present' ? 'secondary' : selectedDateRecord.status === 'Conflict' ? 'destructive' : 'default'}>{selectedDateRecord.status}</Badge></div>
                        
                        <div className="font-medium">Time:</div>
                        <div>{selectedDateRecord.status === 'Approved Present' ? '--' : format(parseISO(selectedDateRecord.date), "p")}</div>

                        <div className="font-medium">Mode:</div>
                        <div>{selectedDateRecord.status === 'Approved Present' ? '--' : selectedDateRecord.mode === 1 ? "GPS + Classroom + Face" : "QR + Face"}</div>
                        
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
