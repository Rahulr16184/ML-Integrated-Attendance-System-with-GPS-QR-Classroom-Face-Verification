

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseISO, isSameDay, format, startOfToday, isBefore, isAfter, endOfDay, differenceInDays } from "date-fns";
import Image from "next/image";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import { getSemesters } from "@/services/working-days-service";
import { getStudentAttendance, addAttendanceRecord, updateAttendanceRecord } from "@/services/attendance-service";
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
import { RotateCcw, ShieldAlert } from "lucide-react";

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

  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [recordToConflict, setRecordToConflict] = useState<AttendanceLog | null>(null);
  const [conflictReason, setConflictReason] = useState("");
  const [isSavingConflict, setIsSavingConflict] = useState(false);
  
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [recordToRevoke, setRecordToRevoke] = useState<AttendanceLog | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isSavingRevoke, setIsSavingRevoke] = useState(false);

  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [recordToRevert, setRecordToRevert] = useState<AttendanceLog | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const [isSavingRevert, setIsSavingRevert] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    if (role !== 'admin' && role !== 'teacher') {
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
  }, [userProfile, userLoading, isAuthorized]);

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
          if (fetchedStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(fetchedStudents[0].uid);
          } else if (fetchedStudents.length === 0) {
            setSelectedStudentId("");
          }
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
        } else {
           setSelectedSemesterId("");
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Could not fetch semesters.', variant: 'destructive' });
      } finally {
        setLoadingSemesters(false);
      }
    }

    fetchStudentsAndSemesters();
  }, [selectedDepartmentId, userProfile, isAuthorized, toast]);
  

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

 const { presentDays, absentDays, approvedDays, conflictDays, revokedDays, remainingDays, totalDays, holidaysCount, attendancePercentage } = useMemo(() => {
    if (!selectedSemester) return { presentDays: [], absentDays: [], approvedDays: [], conflictDays: [], revokedDays: [], remainingDays: 0, totalDays: 0, holidaysCount: 0, attendancePercentage: 0 };
    
    const present = attendanceRecords.filter(r => r.status === 'Present').map(r => parseISO(r.date));
    const approved = attendanceRecords.filter(r => r.status === 'Approved Present').map(r => parseISO(r.date));
    const conflict = attendanceRecords.filter(r => r.status === 'Conflict').map(r => parseISO(r.date));
    const revoked = attendanceRecords.filter(r => r.status === 'Revoked').map(r => parseISO(r.date));
    
    const holidays = new Set(selectedSemester.holidays.map(h => h.toDateString()));
    const attendedDates = new Set([...present, ...approved, ...conflict, ...revoked].map(p => p.toDateString()));
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
    
    const passedWorkingDays = present.length + approved.length + absent.length + conflict.length + revoked.length;
    const percentage = passedWorkingDays > 0 ? ((present.length + approved.length) / passedWorkingDays) * 100 : 0;
    
    const remainingCalendarDays = isAfter(today, selectedSemester.dateRange.to)
        ? 0
        : differenceInDays(selectedSemester.dateRange.to, today);


    return { 
        presentDays: present, 
        absentDays: absent, 
        approvedDays: approved,
        conflictDays: conflict,
        revokedDays: revoked,
        remainingDays: remainingCalendarDays,
        totalDays: totalDaysInRange - selectedSemester.holidays.length,
        holidaysCount: selectedSemester.holidays.length,
        attendancePercentage: percentage
    };
}, [attendanceRecords, selectedSemester]);
  
  const calendarModifiers = {
    present: presentDays,
    absent: absentDays,
    approved: approvedDays,
    conflict: conflictDays,
    revoked: revokedDays,
    holiday: selectedSemester?.holidays || [],
  };

  const calendarModifiersClassNames = {
    present: "bg-green-200 dark:bg-green-800",
    absent: "bg-red-200 dark:bg-red-800",
    approved: "bg-blue-200 dark:bg-blue-800",
    conflict: "bg-yellow-200 dark:bg-yellow-800",
    revoked: "bg-purple-200 dark:bg-purple-800",
    holiday: 'text-red-500 line-through',
  };

  const handleDayClick = (day: Date, modifiers: any) => {
    if (!selectedStudentId) {
        toast({ title: "No Student Selected", description: "Please select a student to view or modify attendance.", variant: "destructive" });
        return;
    }
    if (isAfter(day, new Date()) && !isSameDay(day, new Date())) return;

    const record = attendanceRecords.find(r => isSameDay(parseISO(r.date), day));
    if (record) {
      setSelectedDateRecord(record);
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

  const handleMarkAsConflict = async () => {
      if (!recordToConflict || !conflictReason || !selectedStudentId) {
           toast({ title: 'Error', description: 'A reason is required to mark as absent.', variant: 'destructive' });
           return;
      }
      setIsSavingConflict(true);
      try {
          await updateAttendanceRecord(selectedStudentId, recordToConflict.id, {
              status: 'Conflict',
              notes: conflictReason,
          });
          toast({ title: 'Success', description: 'Attendance record has been updated.' });
          await fetchAttendance(); // Refetch data
          setIsConflictDialogOpen(false);
          setConflictReason("");
          setRecordToConflict(null);
      } catch (error) {
          console.error(error);
          toast({ title: 'Error', description: 'Failed to update record.', variant: 'destructive' });
      } finally {
          setIsSavingConflict(false);
      }
  };

  const handleRevertConflict = async () => {
    if (!recordToRevert || !revertReason || !selectedStudentId) {
        toast({ title: 'Error', description: 'A reason is required to revert the status.', variant: 'destructive' });
        return;
    }
    setIsSavingRevert(true);
    try {
        await updateAttendanceRecord(selectedStudentId, recordToRevert.id, {
            status: 'Present',
            notes: `Reverted by ${userProfile?.name} on ${new Date().toLocaleDateString()}: ${revertReason}`,
        });
        toast({ title: 'Success', description: 'Attendance record has been reverted to Present.' });
        await fetchAttendance(); // Refetch data
        setIsRevertDialogOpen(false);
        setRevertReason("");
        setRecordToRevert(null);
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to revert record.', variant: 'destructive' });
    } finally {
        setIsSavingRevert(false);
    }
  };

  const handleRevokeApproval = async () => {
    if (!recordToRevoke || !revokeReason || !selectedStudentId) {
        toast({ title: 'Error', description: 'A reason is required to revoke the approval.', variant: 'destructive' });
        return;
    }
    setIsSavingRevoke(true);
    try {
        await updateAttendanceRecord(selectedStudentId, recordToRevoke.id, {
            status: 'Revoked',
            notes: revokeReason,
        });
        toast({ title: 'Success', description: 'Approval has been revoked.' });
        await fetchAttendance();
        setIsRevokeDialogOpen(false);
        setRevokeReason("");
        setRecordToRevoke(null);
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to revoke approval.', variant: 'destructive' });
    } finally {
        setIsSavingRevoke(false);
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
  const revokedCount = revokedDays.length;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Attendance Records</CardTitle>
            <CardDescription>Select a department, student, and semester to view or modify attendance.</CardDescription>
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
                    <CardDescription>Click on a highlighted day to see details or modify a record.</CardDescription>
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
                <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Working Days</p>
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
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <p className="text-sm text-purple-600 dark:text-purple-400">Revoked</p>
                        <p className="text-2xl font-bold">{revokedCount}</p>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                        <p className="text-2xl font-bold">{remainingDays}</p>
                    </div>
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg col-span-2 lg:col-span-2">
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
              <>
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
                   ) : selectedDateRecord.status === 'Revoked' && selectedDateRecord.notes ? (
                       <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                           <h4 className="font-semibold text-purple-800 dark:text-purple-300">Revocation Reason</h4>
                           <p className="text-sm text-muted-foreground mt-1">{selectedDateRecord.notes}</p>
                       </div>
                   ) : (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image src={selectedDateRecord.verificationPhotoUrl} alt="Verification Photo" layout="fill" objectFit="contain" data-ai-hint="student classroom" />
                    </div>
                   )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium">Status:</div>
                        <div>
                          <Badge 
                            variant={
                              selectedDateRecord.status === 'Approved Present' ? 'secondary' : 
                              selectedDateRecord.status === 'Conflict' ? 'destructive' : 
                              selectedDateRecord.status === 'Revoked' ? 'outline' : 'default'
                            }
                            className={cn(selectedDateRecord.status === 'Revoked' && "bg-purple-100 text-purple-800 border-purple-300")}
                           >
                            {selectedDateRecord.status}
                           </Badge>
                        </div>
                        
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
                 {(userProfile?.role === 'admin' || userProfile?.role === 'teacher') && (
                    <DialogFooter>
                        {selectedDateRecord.status === 'Present' && (
                            <Button variant="destructive" onClick={() => { setIsConflictDialogOpen(true); setRecordToConflict(selectedDateRecord); setSelectedDateRecord(null); }}>
                                <ShieldAlert className="mr-2 h-4 w-4" /> Mark as Absent
                            </Button>
                        )}
                        {selectedDateRecord.status === 'Conflict' && (
                            <Button variant="outline" onClick={() => { setIsRevertDialogOpen(true); setRecordToRevert(selectedDateRecord); setSelectedDateRecord(null); }}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Revert to Present
                            </Button>
                        )}
                         {selectedDateRecord.status === 'Approved Present' && (
                            <Button variant="destructive" onClick={() => { setIsRevokeDialogOpen(true); setRecordToRevoke(selectedDateRecord); setSelectedDateRecord(null); }}>
                                <ShieldAlert className="mr-2 h-4 w-4" /> Revoke Approval
                            </Button>
                        )}
                    </DialogFooter>
                )}
              </>
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

      <Dialog open={isConflictDialogOpen} onOpenChange={(open) => { if (!open) { setIsConflictDialogOpen(false); setRecordToConflict(null); }}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Mark as Absent for {recordToConflict ? format(parseISO(recordToConflict.date), "PPP") : ""}</DialogTitle>
                <DialogDescription>Override this 'Present' record. The student's original verification photo will be kept for reference.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="conflict-reason">Reason for Override</Label>
                <Textarea 
                    id="conflict-reason"
                    placeholder="e.g., Student left early, not present during secondary check..."
                    value={conflictReason}
                    onChange={(e) => setConflictReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsConflictDialogOpen(false); setRecordToConflict(null); }}>Cancel</Button>
                <Button variant="destructive" onClick={handleMarkAsConflict} disabled={isSavingConflict || !conflictReason}>
                    {isSavingConflict ? "Saving..." : "Confirm Absent"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isRevertDialogOpen} onOpenChange={(open) => { if (!open) { setIsRevertDialogOpen(false); setRecordToRevert(null); }}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Revert to Present for {recordToRevert ? format(parseISO(recordToRevert.date), "PPP") : ""}</DialogTitle>
                <DialogDescription>Change the status from 'Conflict' back to 'Present'.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="revert-reason">Reason for Reversal</Label>
                <Textarea 
                    id="revert-reason"
                    placeholder="e.g., Mistakenly marked, issue resolved..."
                    value={revertReason}
                    onChange={(e) => setRevertReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsRevertDialogOpen(false); setRecordToRevert(null); }}>Cancel</Button>
                <Button onClick={handleRevertConflict} disabled={isSavingRevert || !revertReason}>
                    {isSavingRevert ? "Saving..." : "Revert and Save"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isRevokeDialogOpen} onOpenChange={(open) => { if (!open) { setIsRevokeDialogOpen(false); setRecordToRevoke(null); }}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Revoke Approval for {recordToRevoke ? format(parseISO(recordToRevoke.date), "PPP") : ""}</DialogTitle>
                <DialogDescription>This will mark the student's previously approved day as 'Revoked'.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="revoke-reason">Reason for Revocation</Label>
                <Textarea 
                    id="revoke-reason"
                    placeholder="e.g., Approval was a mistake, documentation was invalid..."
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsRevokeDialogOpen(false); setRecordToRevoke(null); }}>Cancel</Button>
                <Button variant="destructive" onClick={handleRevokeApproval} disabled={isSavingRevoke || !revokeReason}>
                    {isSavingRevoke ? "Saving..." : "Confirm Revoke"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    