
"use client";

import { useState, useMemo, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { differenceInDays, format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Calculator, Save, PlusCircle, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Semester } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getSemesters, saveSemester, deleteSemester } from "@/services/working-days-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SEMESTER_ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from),
    to: parseISO(semester.dateRange.to),
  },
  holidays: semester.holidays.map(h => parseISO(h)),
});


export default function WorkingDaysPage() {
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();

  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  
  const [editingMode, setEditingMode] = useState<"new" | string | null>(null);
  
  const [selectedRoman, setSelectedRoman] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (userProfile?.departmentName) {
      // Default batch could be based on current year or user's context
      const defaultBatch = `${userProfile.departmentName.toLowerCase().replace(/\s/g, '-')}-${new Date().getFullYear()}`;
      setSelectedBatch(defaultBatch);
    }
  }, [userProfile]);

  useEffect(() => {
    async function fetchSemesters() {
      if (userProfile?.institutionId && userProfile?.departmentId && selectedBatch) {
        setLoadingSemesters(true);
        const fetchedSemesters = await getSemesters(userProfile.institutionId, userProfile.departmentId, selectedBatch);
        setSemesters(fetchedSemesters.map(parseSemesterDates));
        setLoadingSemesters(false);
      }
    }
    fetchSemesters();
  }, [selectedBatch, userProfile]);

  const availableRomans = useMemo(() => {
    const usedRomans = semesters.filter(s => s.id !== editingMode).map(s => s.roman);
    return SEMESTER_ROMANS.filter(r => !usedRomans.includes(r));
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
    const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1;
    const workingDays = totalDays - holidays.length;
    setTotalWorkingDays(workingDays);
    return workingDays;
  };
  
  const handleSaveSemester = async () => {
    if (!userProfile?.institutionId || !userProfile?.departmentId || !selectedBatch || !selectedRoman || !dateRange?.from || !dateRange.to) {
        toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
        return;
    }
    const workingDays = totalWorkingDays === null ? calculateWorkingDays() : totalWorkingDays;

    const semesterData: Omit<Semester, 'id'> & { id?: string } = {
        name: `Semester ${selectedRoman}`,
        roman: selectedRoman,
        batch: selectedBatch,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        holidays: holidays.map(h => h.toISOString()),
        workingDays,
    };
    if (editingMode !== "new") {
        semesterData.id = editingMode;
    }

    try {
        const savedId = await saveSemester(userProfile.institutionId, userProfile.departmentId, semesterData);
        const savedSemester = { ...semesterData, id: editingMode === "new" ? savedId : editingMode! };
        
        const newSemesters = editingMode === "new"
            ? [...semesters, parseSemesterDates(savedSemester as Semester)]
            : semesters.map(s => s.id === editingMode ? parseSemesterDates(savedSemester as Semester) : s);
        
        setSemesters(newSemesters);
        setEditingMode(null);
        toast({ title: "Success", description: "Semester saved successfully." });
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to save semester.", variant: "destructive" });
    }
  };

  const handleDeleteSemester = async () => {
    if (deleteTarget && deleteConfirmation === "CONFIRM" && userProfile?.institutionId && userProfile?.departmentId) {
        try {
            await deleteSemester(userProfile.institutionId, userProfile.departmentId, deleteTarget);
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
  
  if (userLoading) {
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
    <div className="p-4 sm:p-6 space-y-6">
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if(!open) setDeleteTarget(null)}}>
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Working Days</h1>
            <p className="text-muted-foreground">Define academic semesters, set holidays, and calculate total working days.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Step 1: Select Batch</CardTitle>
                </CardHeader>
                <CardContent>
                     <Label>Batch / Department</Label>
                     <Input value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} placeholder="e.g., cs-2024" />
                     <p className="text-xs text-muted-foreground mt-2">Enter a unique identifier for the batch (e.g., department-year).</p>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Step 2: Manage Semesters</CardTitle>
                    <CardDescription>Select a semester to edit or add a new one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingSemesters && <Skeleton className="h-20 w-full" />}
                    {!loadingSemesters && semesters.sort((a,b) => SEMESTER_ROMANS.indexOf(a.roman) - SEMESTER_ROMANS.indexOf(b.roman)).map(semester => (
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
                    {selectedBatch && !loadingSemesters && (
                         <Button onClick={handleStartAddNew} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Add New Semester
                        </Button>
                    )}
                     {(!selectedBatch || semesters.length === 0) && !loadingSemesters && (
                        <div className="text-center text-muted-foreground p-4 border-dashed border-2 rounded-lg">
                            <p>{!selectedBatch ? "Please select a batch first." : "No semesters found for this batch."}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {editingMode && (
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{editingMode === 'new' ? 'Create New Semester' : `Editing Semester ${semesters.find(s => s.id === editingMode)?.roman}`}</CardTitle>
                        <CardDescription>Set the duration, mark holidays, and calculate working days.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Semester</Label>
                                    <Select value={selectedRoman} onValueChange={setSelectedRoman}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRomans.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                     <Label>Batch</Label>
                                     <Input value={selectedBatch} disabled />
                                </div>
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
                                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
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
                                    <Calendar mode="multiple" min={1} selected={holidays} onSelect={(days) => setHolidays(days || [])} disabled={!dateRange?.from} fromDate={dateRange?.from} toDate={dateRange?.to} />
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
                <DialogTitle className="flex items-center gap-2"><ShieldAlert/>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. This will permanently delete the semester data.
                </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                    To confirm, please type <strong>CONFIRM</strong> in the box below.
                </AlertDescription>
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
      </Dialog>
    </div>
  );
}

    