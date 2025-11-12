
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Info, CreditCard, PieChart, CalendarDays } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getInstitutions,
} from "@/services/institution-service";
import { getSemesters } from "@/services/working-days-service";
import { getStudentAttendance } from "@/services/attendance-service";
import type { Department, Semester, AttendanceLog } from "@/lib/types";
import {
  parseISO,
  isSameDay,
  isAfter,
  startOfToday,
  differenceInDays,
  endOfDay,
} from "date-fns";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart as RechartsPieChart } from "recharts";

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from as unknown as string),
    to: parseISO(semester.dateRange.to as unknown as string),
  },
  holidays: semester.holidays.map((h) => parseISO(h as unknown as string)),
});

function AttendanceReportCard() {
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLog[]>(
    []
  );
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
    async function fetchSemesters() {
      if (!selectedDepartmentId || !userProfile?.institutionId) return;

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
    }

    fetchSemesters();
  }, [selectedDepartmentId, userProfile, toast]);

  const selectedSemester = useMemo(() => {
    return semesters.find((s) => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  useEffect(() => {
    async function fetchAttendance() {
      if (userProfile?.uid && selectedSemester) {
        setLoadingAttendance(true);
        const records = await getStudentAttendance(
          userProfile.uid,
          selectedSemester.dateRange.from,
          selectedSemester.dateRange.to
        );
        const filteredRecords = records.filter(
          (rec) => rec.departmentId === selectedDepartmentId
        );
        setAttendanceRecords(filteredRecords);
        setLoadingAttendance(false);
      } else {
        setAttendanceRecords([]);
      }
    }
    fetchAttendance();
  }, [userProfile?.uid, selectedSemester, selectedDepartmentId]);

  const {
    presentDays,
    absentDays,
    approvedDays,
    conflictDays,
    revokedDays,
    totalWorkingDays,
    holidaysCount,
    attendancePercentage,
  } = useMemo(() => {
    if (!selectedSemester)
      return {
        presentDays: 0,
        absentDays: 0,
        approvedDays: 0,
        conflictDays: 0,
        revokedDays: 0,
        totalWorkingDays: 0,
        holidaysCount: 0,
        attendancePercentage: 0,
      };

    const present = attendanceRecords.filter(
      (r) => r.status === "Present"
    ).length;
    const approved = attendanceRecords.filter(
      (r) => r.status === "Approved Present"
    ).length;
    const conflict = attendanceRecords.filter(
      (r) => r.status === "Conflict"
    ).length;
    const revoked = attendanceRecords.filter(
      (r) => r.status === "Revoked"
    ).length;

    const holidays = new Set(
      selectedSemester.holidays.map((h) => h.toDateString())
    );
    const attendedDates = new Set(
      attendanceRecords.map((p) => parseISO(p.date).toDateString())
    );
    let absent = 0;

    const today = startOfToday();
    const totalDaysInSemester =
      differenceInDays(
        endOfDay(selectedSemester.dateRange.to),
        selectedSemester.dateRange.from
      ) + 1;
    let workingDays = 0;

    for (
      let d = new Date(selectedSemester.dateRange.from);
      d <= selectedSemester.dateRange.to;
      d.setDate(d.getDate() + 1)
    ) {
      const dayOfWeek = d.getDay();
      const dateString = d.toDateString();

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateString)) {
        workingDays++;
        if (d <= today && !attendedDates.has(dateString)) {
          absent++;
        }
      }
    }

    const passedWorkingDays = present + approved + absent + conflict + revoked;
    const percentage =
      passedWorkingDays > 0
        ? ((present + approved) / passedWorkingDays) * 100
        : 0;

    return {
      presentDays: present,
      absentDays: absent,
      approvedDays: approved,
      conflictDays: conflict,
      revokedDays: revoked,
      totalWorkingDays: selectedSemester.workingDays || workingDays,
      holidaysCount: selectedSemester.holidays.length,
      attendancePercentage: percentage,
    };
  }, [attendanceRecords, selectedSemester]);

  const chartData = [
    { type: "Present", value: presentDays, fill: "var(--color-present)" },
    { type: "Absent", value: absentDays, fill: "var(--color-absent)" },
    { type: "Approved", value: approvedDays, fill: "var(--color-approved)" },
    { type: "Conflict", value: conflictDays, fill: "var(--color-conflict)" },
  ];

  const chartConfig = {
    value: {
      label: "Days",
    },
    present: {
      label: "Present",
      color: "hsl(var(--chart-2))",
    },
    absent: {
      label: "Absent",
      color: "hsl(var(--chart-5))",
    },
    approved: {
      label: "Approved",
      color: "hsl(var(--chart-1))",
    },
    conflict: {
        label: "Conflict",
        color: "hsl(var(--chart-4))",
      },
  } satisfies ChartConfig;

  const isLoading =
    userLoading ||
    loadingDepartments ||
    loadingSemesters ||
    loadingAttendance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Student Master Attendance Report
        </CardTitle>
        <CardDescription>
          Select a department and semester to view your attendance summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            {userLoading || loadingDepartments ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                onValueChange={setSelectedDepartmentId}
                value={selectedDepartmentId}
                disabled={allDepartments.length === 0}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
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
            <Label htmlFor="semester">Semester</Label>
            {loadingSemesters ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                onValueChange={setSelectedSemesterId}
                value={selectedSemesterId}
                disabled={semesters.length === 0}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
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
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
            <div className="col-span-2 md:col-span-4 pt-4">
              <Skeleton className="aspect-video h-[250px] w-full" />
            </div>
          </div>
        ) : selectedSemesterId ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Working Days</p>
                <p className="text-xl font-bold">{totalWorkingDays}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Present
                </p>
                <p className="text-xl font-bold">{presentDays}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Absent
                </p>
                <p className="text-xl font-bold">{absentDays}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Approved
                </p>
                <p className="text-xl font-bold">{approvedDays}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Conflict
                </p>
                <p className="text-xl font-bold">{conflictDays}</p>
              </div>
               <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Holidays
                </p>
                <p className="text-xl font-bold">{holidaysCount}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg col-span-2">
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  Attendance %
                </p>
                <p className="text-2xl font-bold">
                  {attendancePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full max-w-xs">
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={50}
                    strokeWidth={5}
                  />
                </RechartsPieChart>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <p>Select a department and semester to view the report.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentDashboardPage() {
  const { userProfile, loading } = useUserProfile();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {loading ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Hi, {userProfile?.name?.split(" ")[0] || "Student"}
          </h1>
        )}

        <div className="w-full">
          <Button asChild className="w-full text-lg py-6">
            <Link href="/idcard">
              <CreditCard className="mr-2 h-5 w-5" />
              View ID Card
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Info className="h-6 w-6" />
            <CardTitle>INFORMATION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-2 items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                ))}
              </div>
            ) : userProfile ? (
              <>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">NAME</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.name || "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">DOB</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.dob
                      ? new Date(userProfile.dob).toLocaleDateString()
                      : "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">MOBILE NO</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.phone || "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">MAIL ID</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.email || "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">INSTITUTION</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.institutionName || "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">DEPARTMENTS</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.departmentNames?.join(", ") || "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">ROLL NO</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.rollNo || "--"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p className="text-sm font-medium">REGISTER NO</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {userProfile.registerNo || "--"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not load user information.
              </p>
            )}
          </CardContent>
        </Card>

        <AttendanceReportCard />
      </main>
    </div>
  );
}
