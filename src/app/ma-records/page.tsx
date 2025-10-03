
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseISO, isSameDay, format } from "date-fns";
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
  const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceLog | null>(null);

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
      }
    };
    fetchAttendance();
  }, [userProfile, selectedSemester, selectedDepartmentId]);

  const markedDays = useMemo(() => attendanceRecords.map(r => parseISO(r.date)), [attendanceRecords]);
  
  const calendarModifiers = {
    present: markedDays,
    holiday: selectedSemester?.holidays || [],
  };

  const calendarModifiersClassNames = {
    present: "bg-green-200 dark:bg-green-800 rounded-full",
    holiday: 'text-red-500 line-through',
  };

  const handleDayClick = (day: Date, modifiers: { present?: boolean }) => {
    if (modifiers.present) {
      const record = attendanceRecords.find(r => isSameDay(parseISO(r.date), day));
      if (record) {
        setSelectedDateRecord(record);
      }
    }
  };


  if (!isAuthorized || userLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

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
                      numberOfMonths={Math.min(3, new Date(selectedSemester.dateRange.to).getMonth() - new Date(selectedSemester.dateRange.from).getMonth() + 1)}
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
                <DialogTitle>Attendance for {selectedDateRecord ? format(parseISO(selectedDateRecord.date), "PPP") : ""}</DialogTitle>
                <DialogDescription>Details of your attendance record for this day.</DialogDescription>
            </DialogHeader>
            {selectedDateRecord && (
                <div className="space-y-4 py-4">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image src={selectedDateRecord.verificationPhotoUrl} alt="Verification Photo" layout="fill" objectFit="contain" data-ai-hint="student classroom" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="font-medium">Status:</p>
                        <p><Badge>{selectedDateRecord.status}</Badge></p>
                        
                        <p className="font-medium">Time:</p>
                        <p>{format(parseISO(selectedDateRecord.date), "p")}</p>

                        <p className="font-medium">Mode:</p>
                        <p>Mode {selectedDateRecord.mode}</p>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
