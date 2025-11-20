
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import Image from "next/image";
import { getInstitutions } from "@/services/institution-service";
import { getDepartmentAttendanceByDate } from "@/services/attendance-service";
import { getStudentsByDepartment } from "@/services/user-service";
import { getSemesters } from "@/services/working-days-service";
import type { Department, AttendanceLog, Student, Semester } from "@/lib/types";
import { format, isSameDay, parseISO } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ClipboardList, Frown, Loader2, Calendar as CalendarIcon, Briefcase, Coffee } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type ReportRecord = Partial<AttendanceLog> & { 
    id: string;
    studentId: string;
    studentName: string; 
    profileImage?: string;
    status: AttendanceLog['status'] | 'Absent';
};

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from as unknown as string),
    to: parseISO(semester.dateRange.to as unknown as string),
  },
  holidays: semester.holidays.map(h => parseISO(h as unknown as string)),
});

export default function ViewTodayClassReportPage() {
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLog[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      if (userProfile?.institutionId && userProfile.departmentIds) {
        setLoadingDepartments(true);
        try {
          const institutions = await getInstitutions();
          const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
          if (currentInstitution) {
            const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
            setDepartments(userDepartments);
            if (userDepartments.length > 0 && !selectedDepartmentId) {
              setSelectedDepartmentId(userDepartments[0].id);
            }
          }
        } catch (error) {
          toast({ title: "Error", description: "Could not fetch departments.", variant: "destructive" });
        } finally {
          setLoadingDepartments(false);
        }
      }
    }
    if (userProfile) fetchDepartments();
  }, [userProfile, toast, selectedDepartmentId]);

  const fetchReportData = useCallback(async () => {
    if (!selectedDepartmentId || !userProfile?.institutionId) return;

    setIsLoadingReport(true);
    try {
      const [fetchedStudents, fetchedRecords, fetchedSemesters] = await Promise.all([
        getStudentsByDepartment(userProfile.institutionId, selectedDepartmentId),
        getDepartmentAttendanceByDate(selectedDepartmentId, selectedDate),
        getSemesters(userProfile.institutionId, selectedDepartmentId)
      ]);
      
      setAllStudents(fetchedStudents);
      setAttendanceRecords(fetchedRecords);
      setSemesters(fetchedSemesters.map(parseSemesterDates));

    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch class report.", variant: "destructive" });
      setAllStudents([]);
      setAttendanceRecords([]);
      setSemesters([]);
    } finally {
      setIsLoadingReport(false);
    }
  }, [selectedDepartmentId, selectedDate, userProfile, toast]);
  
  useEffect(() => {
    if(selectedDepartmentId) {
      fetchReportData();
    }
  }, [selectedDepartmentId, selectedDate, fetchReportData]);

  const { reportData, isWorkingDay, dayStatusMessage } = useMemo(() => {
    const today = selectedDate;
    const currentSemester = semesters.find(s => today >= s.dateRange.from && today <= s.dateRange.to);

    if (!currentSemester) {
        return { reportData: [], isWorkingDay: false, dayStatusMessage: "The selected date does not fall within any configured semester." };
    }

    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { reportData: [], isWorkingDay: false, dayStatusMessage: "The selected date is a weekend." };
    }
    
    const isHoliday = currentSemester.holidays.some(h => isSameDay(h, today));
    if (isHoliday) {
        return { reportData: [], isWorkingDay: false, dayStatusMessage: "The selected date is a holiday." };
    }

    const allReportRecords: ReportRecord[] = allStudents.map(student => {
      const record = attendanceRecords.find(r => r.studentId === student.uid);
      if (record) {
        return { ...record, studentName: student.name, profileImage: student.profileImage };
      } else {
        return {
          id: `absent-${student.uid}`,
          studentId: student.uid,
          studentName: student.name,
          profileImage: student.profileImage,
          departmentId: selectedDepartmentId,
          date: selectedDate.toISOString(),
          status: "Absent",
        };
      }
    });
    
    let filteredData = allReportRecords;
    if (statusFilter !== 'all') {
      const filterMap = {
        'present': 'Present',
        'absent': 'Absent',
        'approved': 'Approved Present',
        'conflict': 'Conflict',
        'revoked': 'Revoked'
      };
      filteredData = allReportRecords.filter(r => r.status === filterMap[statusFilter as keyof typeof filterMap]);
    }
    
    return { reportData: filteredData, isWorkingDay: true, dayStatusMessage: "" };
  }, [attendanceRecords, allStudents, statusFilter, selectedDepartmentId, selectedDate, semesters]);
  
  const getStatusBadgeVariant = (status: ReportRecord['status']) => {
    switch(status) {
        case 'Present': return 'default';
        case 'Approved Present': return 'secondary';
        case 'Conflict': return 'destructive';
        case 'Revoked': return 'outline';
        case 'Absent': return 'destructive';
        default: return 'outline';
    }
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList/> Class Report</CardTitle>
          <CardDescription>View attendance records for students in a department for a specific day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
                <Label>Department</Label>
                {loadingDepartments ? <Skeleton className="h-10 w-full" /> : (
                    <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={departments.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                            {departments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                    disabled={isLoadingReport}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date || new Date())}
                    disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoadingReport}>
                <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="conflict">Conflict</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingReport && (
        <div className="text-center p-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Fetching Report...</p>
        </div>
      )}

      {!isLoadingReport && isWorkingDay && reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.map(record => (
                <Card key={record.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start gap-4 p-4">
                       <Avatar className="h-16 w-16 rounded-lg">
                          <AvatarImage src={record.profileImage} alt={record.studentName} />
                          <AvatarFallback className="rounded-lg">{record.studentName?.[0]}</AvatarFallback>
                       </Avatar>
                        <div className="flex-1 space-y-1">
                            <CardTitle className="text-base">{record.studentName}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={getStatusBadgeVariant(record.status)} className="capitalize">{record.status.replace(' Present', '')}</Badge>
                                {record.status !== 'Absent' && record.mode && (
                                    <Badge variant="outline">
                                        {record.mode === 1 ? "GPS+Face" : "QR+Face"}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    {record.status !== 'Absent' && (
                        <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground border-t">
                             {record.verificationPhotoUrl && (record.status === 'Present' || record.status === 'Conflict' || record.status === 'Revoked') && (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                                    <Image src={record.verificationPhotoUrl} alt="Verification" fill className="object-cover" data-ai-hint="student classroom"/>
                                </div>
                             )}
                             {record.status === 'Approved Present' && record.verificationPhotoUrl && (
                                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Approval Reason</p>
                                    <p className="text-sm">{record.verificationPhotoUrl}</p>
                                </div>
                             )}
                              <div className="grid grid-cols-2 gap-1">
                                  <span className="font-medium">Time:</span>
                                  <span>{record.date && record.status !== 'Approved Present' ? format(new Date(record.date), 'p') : '--'}</span>
                                  <span className="font-medium">Marked By:</span>
                                  <span className="capitalize">{record.markedBy || '--'}</span>
                                  {record.location && (
                                      <>
                                          <span className="font-medium">Location:</span>
                                          <span>{`${record.location.lat.toFixed(4)}, ${record.location.lng.toFixed(4)}`}</span>
                                      </>
                                  )}
                              </div>
                              {record.notes && (
                                  <div className="pt-2">
                                      <p className="text-xs font-semibold">Notes:</p>
                                      <p>{record.notes}</p>
                                  </div>
                              )}
                        </CardContent>
                    )}
                </Card>
            ))}
          </div>
      )}

      {!isLoadingReport && !isWorkingDay && (
          <Alert>
              <Coffee className="h-4 w-4" />
              <AlertTitle>Not a Working Day</AlertTitle>
              <AlertDescription>{dayStatusMessage}</AlertDescription>
          </Alert>
      )}

      {!isLoadingReport && isWorkingDay && reportData.length === 0 && (
          <Alert>
              <Frown className="h-4 w-4" />
              <AlertTitle>No Records Found</AlertTitle>
              <AlertDescription>
                  There are no attendance records matching your current filter criteria for this working day.
              </AlertDescription>
          </Alert>
      )}

    </div>
  );
}
