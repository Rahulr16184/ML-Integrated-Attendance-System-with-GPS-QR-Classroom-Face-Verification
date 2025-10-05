

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { differenceInDays, format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Calculator, Save, PlusCircle, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Semester, Department } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getSemesters, saveSemester, deleteSemester } from "@/services/working-days-service";
import { getInstitutions } from "@/services/institution-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SEMESTER_ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from as unknown as string),
    to: parseISO(semester.dateRange.to as unknown as string),
  },
  holidays: semester.holidays.map(h => parseISO(h as unknown as string)),
});


export default function WorkingDaysPage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  
  const [editingMode, setEditingMode] = useState<"new" | string | null>(null);
  
  const [selectedRoman, setSelectedRoman] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [isAuthorized, setIsAuthorized] = useState(false);

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
            // If admin, show all departments of the institution. Otherwise, show only user's departments.
            if (userProfile.role === 'admin') {
                setAllDepartments(currentInstitution.departments);
                // Set the first one as default if not set
                if (!selectedDepartmentId && currentInstitution.departments.length > 0) {
                    setSelectedDepartmentId(currentInstitution.departments[0].id);
                }
            } else {
                const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
                setAllDepartments(userDepartments);
                if (userDepartments.length > 0 && !selectedDepartmentId) {
                    setSelectedDepartmentId(userDepartments[0].id);
                }
            }
        } else {
            setAllDepartments([]);
        }
        setLoadingDepartments(false);
      }
    }
    if (isAuthorized) {
      fetchDepartments();
    }
  }, [userProfile, selectedDepartmentId, isAuthorized]);

  useEffect(() => {
    async function fetchSemesters() {
      if (userProfile?.institutionId && selectedDepartmentId) {
        setLoadingSemesters(true);
        const fetchedSemesters = await getSemesters(userProfile.institutionId, selectedDepartmentId);
        setSemesters(fetchedSemesters.map(parseSemesterDates));
        setEditingMode(null);
        setLoadingSemesters(false);
      } else {
        setSemesters([]);
      }
    }
    if (isAuthorized) {
      fetchSemesters();
    }
  }, [selectedDepartmentId, userProfile, isAuthorized]);


  const availableRomans = useMemo(() => {
    const usedRomans = semesters.filter(s => s.id !== editingMode).map(s => s.roman);
    return SEMESTER_ROMANS.filter(r => !usedRomans.includes(r));
  }, [semesters, editingMode]);
  
  const disabledDates = useMemo(() => {
    if (!editingMode) return [];
    const otherSemesters = semesters.filter(semester => semester.id !== editingMode);
    
    // Add weekends (Saturday and Sunday) to disabled dates
    const weekends = { dayOfWeek: [0, 6] };
    
    return [weekends, ...otherSemesters.map(s => s.dateRange)];
  }, [semesters, editingMode]);

  const handleStartAddNew = () => {
    setEditingMode("new");
    setSelectedRoman("");
    setDateRange(undefined);
    setHolidays([]);
    setTotalWorkingDays(null);
  };

  const handleSelectExisting = (semester: Semester) => {
    setEditingMode(semester.id);
    setSelectedRoman(semester.roman);
    setDateRange(semester.dateRange);
    setHolidays(semester.holidays);
    setTotalWorkingDays(semester.workingDays);
  };
  
  const handleCancel = () => {
    setEditingMode(null);
  };

  const calculateWorkingDays = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      setTotalWorkingDays(null);
      return 0;
    }
    let count = 0;
    const curDate = new Date(dateRange.from.getTime());
    while (curDate <= dateRange.to) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not a weekend
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    const workingDays = count - holidays.length;
    setTotalWorkingDays(workingDays);
    return workingDays;
  };
  
  const handleSaveSemester = async () => {
    if (!userProfile?.institutionId || !selectedDepartmentId || !selectedRoman || !dateRange?.from || !dateRange.to) {
        toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
        return;
    }
    const workingDays = totalWorkingDays === null ? calculateWorkingDays() : totalWorkingDays;
    
    if (workingDays < 0) {
      toast({ title: "Invalid Calculation", description: "Working days cannot be negative. Check your holidays and date range.", variant: "destructive" });
      return;
    }


    const semesterData: Omit<Semester, 'id'> & { id?: string } = {
        name: `Semester ${selectedRoman}`,
        roman: selectedRoman,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        holidays: holidays.map(h => h.toISOString()),
        workingDays,
    };
    if (editingMode !== "new") {
        semesterData.id = editingMode;
    }

    try {
        const savedId = await saveSemester(userProfile.institutionId, selectedDepartmentId, semesterData);
        const savedSemester = { ...semesterData, id: editingMode === "new" ? savedId : editingMode! };
        
        const newSemesters = editingMode === "new"
            ? [...semesters, parseSemesterDates(savedSemester as Semester)]
            : semesters.map(s => s.id === editingMode ? parseSemesterDates(savedSemester as Semester) : s);
        
        setSemesters(newSemesters.sort((a,b) => SEMESTER_ROMANS.indexOf(a.roman) - SEMESTER_ROMANS.indexOf(b.roman)));
        setEditingMode(null);
        toast({ title: "Success", description: "Semester saved successfully." });

    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to save semester.", variant: "destructive" });
    }
  };

  const handleDeleteSemester = async () => {
    if (deleteTarget && deleteConfirmation === "CONFIRM" && userProfile?.institutionId && selectedDepartmentId) {
        try {
            await deleteSemester(userProfile.institutionId, selectedDepartmentId, deleteTarget);
            setSemesters(semesters.filter(s => s.id !== deleteTarget));
            if (editingMode === deleteTarget) {
                setEditingMode(null);
            }
            toast({ title: "Success", description: "Semester deleted successfully." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete semester.", variant: "destructive" });
        } finally {
            setDeleteTarget(null);
            setDeleteConfirmation("");
        }
    }
  };
  
  if (!isAuthorized || userLoading) {
      return (
          <div className="p-4 sm:p-6 space-y-6">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-6 w-3/4" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-40 lg:col-span-1 rounded-lg"/>
                  <Skeleton className="h-64 lg:col-span-2 rounded-lg"/>
              </div>
          </div>
      )
  }

  return (
    <Dialog open={!!deleteTarget} onOpenChange={(open) => { if(!open) setDeleteTarget(null)}}>
    <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Working Days</h1>
            <p className="text-muted-foreground">Define academic semesters, set holidays, and calculate total working days.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Step 1: Select Department</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Department</Label>
                        {loadingDepartments ? (
                            <Skeleton className="h-10 w-full"/>
                        ) : (
                            <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={allDepartments.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allDepartments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedDepartmentId && (
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Step 2: Manage Semesters</CardTitle>
                        <CardDescription>Select a semester to edit or add a new one.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingSemesters && <Skeleton className="h-20 w-full" />}
                        {!loadingSemesters && semesters.map(semester => (
                            <div key={semester.id} className={cn("flex items-center justify-between p-3 rounded-lg border", editingMode === semester.id ? "bg-accent border-primary" : "bg-background")}>
                                <div>
                                    <p className="font-semibold">{semester.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(semester.dateRange.from, 'MMM dd, yyyy')} - {format(semester.dateRange.to, 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleSelectExisting(semester)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(semester.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                </div>
                            </div>
                        ))}
                        {selectedDepartmentId && !loadingSemesters && (
                            <Button onClick={handleStartAddNew} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add New Semester
                            </Button>
                        )}
                        {semesters.length === 0 && !loadingSemesters && (
                            <div className="text-center text-muted-foreground p-4 border-dashed border-2 rounded-lg">
                                <p>No semesters found for this department. Add one to get started.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}


            {editingMode && (
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{editingMode === 'new' ? 'Create New Semester' : `Editing Semester ${semesters.find(s => s.id === editingMode)?.roman}`}</CardTitle>
                        <CardDescription>Set the duration, mark holidays, and calculate total working days.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label>Semester</Label>
                                <Select value={selectedRoman} onValueChange={setSelectedRoman}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {editingMode !== 'new' ? <SelectItem value={selectedRoman}>{selectedRoman}</SelectItem> : null}
                                        {availableRomans.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Semester Duration (From - To)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} disabled={disabledDates} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {totalWorkingDays !== null && (
                                <Alert>
                                    <AlertTitle>Calculation Result</AlertTitle>
                                    <AlertDescription className="space-y-2 mt-2">
                                        <p><strong>Total Holidays Selected:</strong> {holidays.length} days</p>
                                        <p className="font-bold text-lg"><strong>Total Working Days:</strong> {totalWorkingDays} days</p>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Mark Holidays</Label>
                                <Card className="p-2">
                                    <Calendar mode="multiple" selected={holidays} onSelect={(days) => setHolidays(days || [])} disabled={!dateRange?.from} fromDate={dateRange?.from} toDate={dateRange?.to} />
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleSaveSemester} className="w-full sm:w-auto" disabled={!dateRange || !selectedRoman}>
                                <Save className="mr-2 h-4 w-4" /> Save Semester
                            </Button>
                             <Button onClick={calculateWorkingDays} variant="secondary" className="w-full sm:w-auto" disabled={!dateRange}>
                                <Calculator className="mr-2 h-4 w-4" /> Calculate Days
                            </Button>
                            <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </div>
      <DialogContent>
          <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ShieldAlert/>Delete {deleteTarget?.name}?</DialogTitle>
              <DialogDescription>
                  This action cannot be undone. This will permanently delete the semester data.
              </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
              <AlertTitle>Warning</AlertTitle>
              <DialogDescription>
                  To confirm, please type <strong>CONFIRM</strong> in the box below.
              </DialogDescription>
          </Alert>
          <Input 
              id="delete-confirm" 
              placeholder='Type "CONFIRM" to delete'
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
          />
          <DialogFooter>
              <DialogClose asChild>
                  <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmation("")}}>Cancel</Button>
              </DialogClose>
              <Button
                  variant="destructive"
                  disabled={deleteConfirmation !== 'CONFIRM'}
                  onClick={handleDeleteSemester}
              >
                  I understand, delete this semester
              </Button>
          </DialogFooter>
      </DialogContent>
    </div>
    </Dialog>
  );
}

    

    
