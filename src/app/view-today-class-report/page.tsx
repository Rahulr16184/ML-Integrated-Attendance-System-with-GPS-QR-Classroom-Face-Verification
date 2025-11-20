
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import Image from "next/image";
import { getInstitutions } from "@/services/institution-service";
import { getDepartmentAttendanceByDate } from "@/services/attendance-service";
import { getStudentsByDepartment } from "@/services/user-service";
import type { Department, AttendanceLog, Student } from "@/lib/types";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ClipboardList, Frown, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type ReportRecord = AttendanceLog & { studentName: string; profileImage?: string };

export default function ViewTodayClassReportPage() {
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();

  // State for filters and data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLog[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Fetch departments user has access to
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

  // Fetch students and attendance records when filters change
  const fetchReportData = useCallback(async () => {
    if (!selectedDepartmentId || !userProfile?.institutionId) return;

    setIsLoadingReport(true);
    try {
      // Fetch all students for the department
      const students = await getStudentsByDepartment(userProfile.institutionId, selectedDepartmentId);
      setAllStudents(students);

      // Fetch attendance records for that date
      const records = await getDepartmentAttendanceByDate(selectedDepartmentId, selectedDate);
      setAttendanceRecords(records);

    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch class report.", variant: "destructive" });
    } finally {
      setIsLoadingReport(false);
    }
  }, [selectedDepartmentId, selectedDate, userProfile, toast]);
  
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const reportData = useMemo(() => {
    const presentStudentIds = new Set(attendanceRecords.map(r => r.studentId));

    const allReportRecords = allStudents.map(student => {
      const record = attendanceRecords.find(r => r.studentId === student.uid);
      if (record) {
        return { ...record, studentName: student.name, profileImage: student.profileImage };
      } else {
        // Synthesize an 'Absent' record
        return {
          id: `absent-${student.uid}`,
          studentId: student.uid,
          studentName: student.name,
          profileImage: student.profileImage,
          departmentId: selectedDepartmentId,
          date: selectedDate.toISOString(),
          status: "Absent",
        } as ReportRecord;
      }
    });
    
    if (statusFilter === 'all') return allReportRecords;
    if (statusFilter === 'present') return allReportRecords.filter(r => r.status !== 'Absent');
    if (statusFilter === 'absent') return allReportRecords.filter(r => r.status === 'Absent');

    return [];
  }, [attendanceRecords, allStudents, statusFilter, selectedDepartmentId, selectedDate]);
  
  const getStatusBadgeVariant = (status: AttendanceLog['status']) => {
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
          <CardTitle className="flex items-center gap-2"><ClipboardList/> Today's Class Report</CardTitle>
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
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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

      {!isLoadingReport && reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.map(record => (
                <Card key={record.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start gap-4 p-4">
                       <Image src={record.profileImage || `https://picsum.photos/seed/${record.studentId}/200/200`} alt={record.studentName} width={64} height={64} className="rounded-lg object-cover border" data-ai-hint="profile picture" />
                        <div className="flex-1 space-y-1">
                            <CardTitle className="text-base">{record.studentName}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={getStatusBadgeVariant(record.status)}>{record.status}</Badge>
                                {record.status !== 'Absent' && (
                                    <Badge variant="outline">
                                        {record.mode === 1 ? "GPS+Face" : "QR+Face"}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    {record.status !== 'Absent' && (
                        <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground border-t">
                             {record.status !== 'Approved Present' && record.verificationPhotoUrl && (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                                    <Image src={record.verificationPhotoUrl} alt="Verification" fill className="object-cover" data-ai-hint="student classroom" />
                                </div>
                             )}
                             {record.status === 'Approved Present' && (
                                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Approval Reason</p>
                                    <p className="text-sm">{record.verificationPhotoUrl}</p>
                                </div>
                             )}
                              <div className="grid grid-cols-2 gap-1">
                                  <span className="font-medium">Time:</span>
                                  <span>{record.status === 'Approved Present' ? '--' : format(new Date(record.date), 'p')}</span>
                                  <span className="font-medium">Marked By:</span>
                                  <span className="capitalize">{record.markedBy || '--'}</span>
                                  <span className="font-medium">Location:</span>
                                  <span>{record.location ? `${record.location.lat.toFixed(4)}, ${record.location.lng.toFixed(4)}` : '--'}</span>
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

      {!isLoadingReport && reportData.length === 0 && (
          <Alert>
              <Frown className="h-4 w-4" />
              <AlertTitle>No Records Found</AlertTitle>
              <AlertDescription>
                  There are no attendance records matching your current filter criteria for the selected department and date.
              </AlertDescription>
          </Alert>
      )}

    </div>
  );
}
