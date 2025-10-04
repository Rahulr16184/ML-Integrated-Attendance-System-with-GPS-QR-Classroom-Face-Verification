
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseISO, isSameDay, format, startOfTomorrow, isBefore, startOfToday, isAfter, endOfDay, differenceInDays } from "date-fns";
import Image from "next/image";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import { getSemesters } from "@/services/working-days-service";
import { getStudentAttendance, addAttendanceRecord } from "@/services/attendance-service";
import { getStudentsByDepartment } from "@/services/user-service";
import type { Department, Semester, AttendanceLog, Student } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

export default function MaRecordsPage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLog[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceLog | "absent" | null>(null);

  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [dateToApprove, setDateToApprove] = useState<Date | null>(null);
  const [approvalReason, setApprovalReason] = useState("");
  const [isSavingApproval, setIsSavingApproval] = useState(false);

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

  // Handle department change
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    // Reset selections and data for the new department
    setSelectedStudentId("");
    setSelectedSemesterId("");
    setStudents([]);
    setSemesters([]);
    setAttendanceRecords([]);
  };

  useEffect(() => {
    async function fetchStudentsAndSemesters() {
      if (!isAuthorized || !selectedDepartmentId || !userProfile?.institutionId) return;

      // Fetch students for teacher/admin
      if (userProfile.role === 'admin' || userProfile.role === 'teacher') {
        setLoadingStudents(true);
        try {
          const fetchedStudents = await getStudentsByDepartment(userProfile.institutionId, selectedDepartmentId);
          setStudents(fetchedStudents);
        } catch (error) {
          toast({ title: 'Error', description: 'Could not fetch student list.', variant: 'destructive' });
        } finally {
          setLoadingStudents(false);
        }
      }

      // Fetch semesters
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

    fetchStudentsAndSemesters();
  }, [selectedDepartmentId, userProfile, isAuthorized, toast]);
  

  useEffect(() => {
    if (userProfile?.role === 'student' && userProfile.uid) {
        setSelectedStudentId(userProfile.uid);
    } else if (userProfile?.role !== 'student' && students.length > 0) {
        // Default to the first student in the list for admin/teacher
        setSelectedStudentId(students[0].uid);
    } else if (userProfile?.role !== 'student') {
        setSelectedStudentId("");
    }
  }, [userProfile, students]);

  const selectedSemester = useMemo(() => {
    return semesters.find(s => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  const fetchAttendance = useCallback(async () => {
      if (selectedStudentId && selectedSemester) {
        setLoadingAttendance(true);
        const records = await getStudentAttendance(selectedStudentId, selectedSemester.dateRange.from, selectedSemester.dateRange.to);
        const filteredRecords = records.filter(rec => rec.departmentId === selectedDepartmentId);
        setAttendanceRecords(filteredRecords);
        setLoadingAttendance(false);
      } else {
        setAttendanceRecords([]);
      }
    }, [selectedStudentId, selectedSemester, selectedDepartmentId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const { presentDays, absentDays, approvedDays, remainingDays, totalWorkingDays, holidaysCount } = useMemo(() => {
    if (!selectedSemester) return { presentDays: [], absentDays: [], approvedDays: [], remainingDays: 0, totalWorkingDays: 0, holidaysCount: 0 };
    
    const present = attendanceRecords.filter(r => r.status === 'Present').map(r => parseISO(r.date));
    const approved = attendanceRecords.filter(r => r.status === 'Approved Present').map(r => parseISO(r.date));
    const absent: Date[] = [];
    
    const holidays = new Set(selectedSemester.holidays.map(h => h.toDateString()));
    const attendedDates = new Set([...present, ...approved].map(p => p.toDateString()));
    
    const totalDaysInRange = differenceInDays(selectedSemester.dateRange.to, selectedSemester.dateRange.from) + 1;
    const workingDays = totalDaysInRange - selectedSemester.holidays.length;

    for (let d = new Date(selectedSemester.dateRange.from); d <= selectedSemester.dateRange.to; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toDateString();

        if (isBefore(d, startOfToday()) && dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateString) && !attendedDates.has(dateString)) {
            absent.push(new Date(d));
        }
    }

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
    return { presentDays: present, absentDays: absent, approvedDays: approved, remainingDays: remaining, totalWorkingDays: workingDays, holidaysCount: selectedSemester.holidays.length };
  }, [attendanceRecords, selectedSemester]);
  
  const calendarModifiers = {
    present: presentDays,
    absent: absentDays,
    approved: approvedDays,
    holiday: selectedSemester?.holidays || [],
  };

  const calendarModifiersClassNames = {
    present: "bg-green-200 dark:bg-green-800 rounded-full",
    absent: "bg-red-200 dark:bg-red-800 rounded-full",
    approved: "bg-blue-200 dark:bg-blue-800 rounded-full",
    holiday: 'text-red-500 line-through',
  };

  const handleDayClick = (day: Date, modifiers: { present?: boolean; absent?: boolean; approved?: boolean; }) => {
    if (!selectedStudentId) {
        toast({ title: "No Student Selected", description: "Please select a student to view or modify attendance.", variant: "destructive" });
        return;
    }
    if (isAfter(day, new Date()) && !isSameDay(day, new Date())) return;

    if (modifiers.present || modifiers.approved) {
      const record = attendanceRecords.find(r => isSameDay(parseISO(r.date), day));
      if (record) setSelectedDateRecord(record);
    } else if (modifiers.absent) {
        if (userProfile?.role === 'admin' || userProfile?.role === 'teacher') {
            setDateToApprove(day);
            setIsApprovalDialogOpen(true);
        } else {
            setSelectedDateRecord("absent");
        }
    }
  };

  const handleApproveAbsence = async () => {
    const studentToApprove = students.find(s => s.uid === selectedStudentId);

    if (!dateToApprove || !userProfile || !selectedDepartmentId || !approvalReason || !studentToApprove) {
        toast({ title: 'Error', description: 'A student and reason for approval are required.', variant: 'destructive' });
        return;
    }
    setIsSavingApproval(true);
    try {
        const newRecord: Omit<AttendanceLog, 'id'> = {
            studentId: studentToApprove.uid,
            studentName: studentToApprove.name,
            departmentId: selectedDepartmentId,
            date: dateToApprove.toISOString(),
            status: 'Approved Present',
            mode: 1, // Or a specific mode for approved
            verificationPhotoUrl: approvalReason, // Storing reason in photo url field
            markedBy: userProfile.role as 'teacher' | 'admin',
        };

        await addAttendanceRecord(studentToApprove.uid, newRecord);
        toast({ title: 'Success', description: 'Absence has been marked as approved present.' });
        
        await fetchAttendance(); // Refetch data
        
        setIsApprovalDialogOpen(false);
        setApprovalReason("");
        setDateToApprove(null);

    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to approve absence.', variant: 'destructive' });
    } finally {
        setIsSavingApproval(false);
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

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance Records</CardTitle>
            <CardDescription>Select a department and semester to view attendance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              
               {(userProfile?.role === 'admin' || userProfile?.role === 'teacher') && (
                 <div className="space-y-2">
                    <Label>Student</Label>
                    {loadingStudents ? <Skeleton className="h-10 w-full" /> : (
                         <Select onValueChange={setSelectedStudentId} value={selectedStudentId} disabled={students.length === 0}>
                            <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                            <SelectContent>
                                {students.map(s => <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
               )}

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
        
        {(loadingSemesters || loadingAttendance || loadingStudents) && <Skeleton className="h-96 w-full" />}
        
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
                <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Working</p>
                        <p className="text-2xl font-bold">{totalWorkingDays}</p>
                    </div>
                     <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Holidays</p>
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
                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                        <p className="text-2xl font-bold">{remainingDays}</p>
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
                   ) : (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image src={selectedDateRecord.verificationPhotoUrl} alt="Verification Photo" layout="fill" objectFit="contain" data-ai-hint="student classroom" />
                    </div>
                   )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium">Status:</div>
                        <div><Badge variant={selectedDateRecord.status === 'Approved Present' ? 'secondary' : 'default'}>{selectedDateRecord.status}</Badge></div>
                        
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

      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Approve Absence for {dateToApprove ? format(dateToApprove, "PPP") : ""}</DialogTitle>
                <DialogDescription>Mark this student as 'Approved Present' for the selected day. This action will be logged.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="approval-reason">Reason for Approval</Label>
                <Textarea 
                    id="approval-reason"
                    placeholder="e.g., Medical leave, approved event participation..."
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleApproveAbsence} disabled={isSavingApproval || !approvalReason}>
                    {isSavingApproval ? "Saving..." : "Approve and Save"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    