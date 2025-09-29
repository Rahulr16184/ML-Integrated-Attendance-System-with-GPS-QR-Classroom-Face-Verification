
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { parseISO, isWithinInterval, isSameDay } from "date-fns";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions } from "@/services/institution-service";
import { getSemesters } from "@/services/working-days-service";
import type { Department, Semester } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  }, [userProfile, userLoading, isAuthorized, selectedDepartmentId]);

  useEffect(() => {
    async function fetchSemesters() {
      if (userProfile?.institutionId && selectedDepartmentId) {
        setLoadingSemesters(true);
        const fetchedSemesters = await getSemesters(userProfile.institutionId, selectedDepartmentId);
        const parsedSemesters = fetchedSemesters.map(parseSemesterDates);
        setSemesters(parsedSemesters);
        if (parsedSemesters.length > 0) {
          setSelectedSemesterId(parsedSemesters[0].id);
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

  const workingDaysModifiers = useMemo(() => {
    if (!selectedSemester) return { working: [], holiday: [] };
    
    const holidays = selectedSemester.holidays.map(h => new Date(h));

    return {
      working: (date: Date) => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = holidays.some(h => isSameDay(date, h));
        const isInRange = isWithinInterval(date, { start: selectedSemester.dateRange.from, end: selectedSemester.dateRange.to });
        return isInRange && !isWeekend && !isHoliday;
      },
      holiday: holidays,
    };
  }, [selectedSemester]);

  const workingDaysModifiersClassNames = {
    working: 'bg-green-200 dark:bg-green-800 rounded-full',
    holiday: 'text-red-500 line-through',
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
    <div className="p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Master Attendance Records</CardTitle>
          <CardDescription>
            Select a department and semester to view the calendar of working days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              {loadingDepartments ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={allDepartments.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDepartments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
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
                <Select onValueChange={setSelectedSemesterId} value={selectedSemesterId} disabled={semesters.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(sem => (
                      <SelectItem key={sem.id} value={sem.id}>{sem.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedSemester ? (
        <Card>
            <CardHeader>
                <CardTitle>Calendar for {selectedSemester.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <Calendar
                    mode="default"
                    month={selectedSemester.dateRange.from}
                    fromDate={selectedSemester.dateRange.from}
                    toDate={selectedSemester.dateRange.to}
                    modifiers={workingDaysModifiers}
                    modifiersClassNames={workingDaysModifiersClassNames}
                    numberOfMonths={Math.min(3, new Date(selectedSemester.dateRange.to).getMonth() - new Date(selectedSemester.dateRange.from).getMonth() + 1)}
                    className="p-0"
                    classNames={{
                      day: cn("h-10 w-10"),
                      day_disabled: "text-muted-foreground/50",
                    }}
                 />
            </CardContent>
        </Card>
      ) : (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>
                    {loadingSemesters ? "Loading semesters..." : "Please select a department and semester to view the calendar."}
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
