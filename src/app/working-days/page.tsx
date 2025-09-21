
"use client";

import { useState, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInDays, isSameDay, isWeekend, format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Calculator, Save, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Semester } from "@/lib/types";
import mockSemesters from "@/lib/working-days.json";

const SEMESTER_ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// Helper to parse dates from the JSON file
const parseSemesterDates = (semester: Semester) => ({
  ...semester,
  dateRange: {
    from: parseISO(semester.dateRange.from),
    to: parseISO(semester.dateRange.to),
  },
  holidays: semester.holidays.map(h => parseISO(h)),
});


export default function WorkingDaysPage() {
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [semesters, setSemesters] = useState<any[]>(mockSemesters.semesters.map(parseSemesterDates));
  
  // 'new' for creating, or semester id for editing
  const [editingMode, setEditingMode] = useState<"new" | string | null>(null);
  
  // Form state for new/editing semester
  const [selectedRoman, setSelectedRoman] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | null>(null);

  const availableRomans = useMemo(() => {
    const usedRomans = semesters
      .filter(s => s.batch === selectedBatch)
      .map(s => s.roman);
    return SEMESTER_ROMANS.filter(r => !usedRomans.includes(r));
  }, [semesters, selectedBatch]);
  
  const filteredSemesters = useMemo(() => {
    return semesters.filter(s => s.batch === selectedBatch).sort((a,b) => SEMESTER_ROMANS.indexOf(a.roman) - SEMESTER_ROMANS.indexOf(b.roman));
  }, [semesters, selectedBatch]);

  const handleStartAddNew = () => {
    setEditingMode("new");
    setSelectedRoman("");
    setDateRange(undefined);
    setHolidays([]);
    setTotalWorkingDays(null);
  };

  const handleSelectExisting = (semester: any) => {
    setEditingMode(semester.id);
    setSelectedRoman(semester.roman);
    setDateRange(semester.dateRange);
    setHolidays(semester.holidays);
    setTotalWorkingDays(semester.workingDays);
  };
  
  const handleCancel = () => {
    setEditingMode(null);
  }

  const calculateWorkingDays = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      setTotalWorkingDays(null);
      return 0;
    }
    
    // Calculate total days in the range (inclusive)
    const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1;
    
    // Subtract the number of holidays
    const workingDays = totalDays - holidays.length;
    
    setTotalWorkingDays(workingDays);
    return workingDays;
  };
  
  const handleSaveSemester = () => {
    if (!selectedBatch || !selectedRoman || !dateRange || !dateRange.from || !dateRange.to) {
        // Add toast notification later
        return;
    }
    const workingDays = totalWorkingDays === null ? calculateWorkingDays() : totalWorkingDays;

    const newSemester = {
        id: editingMode === "new" ? `sem-${Date.now()}` : editingMode!,
        name: `Semester ${selectedRoman}`,
        roman: selectedRoman,
        batch: selectedBatch,
        dateRange,
        holidays,
        workingDays,
    };

    if (editingMode === "new") {
        setSemesters([...semesters, newSemester]);
    } else {
        setSemesters(semesters.map(s => s.id === editingMode ? newSemester : s));
    }
    setEditingMode(null);
  };

  const handleDeleteSemester = (semesterId: string) => {
    setSemesters(semesters.filter(s => s.id !== semesterId));
    if (editingMode === semesterId) {
      setEditingMode(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Working Days</h1>
            <p className="text-muted-foreground">Define academic semesters, set holidays, and calculate total working days.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Card 1: Batch Selection */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Step 1: Select Batch</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                        <SelectTrigger id="batch-select">
                            <SelectValue placeholder="Select a batch/department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cs-2024">Computer Science - 2024</SelectItem>
                            <SelectItem value="ba-2024">Business Admin - 2024</SelectItem>
                            <SelectItem value="me-2024">Mechanical Eng - 2024</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Card 2: Semester Management */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Step 2: Manage Semesters</CardTitle>
                    <CardDescription>Select a semester to edit or add a new one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredSemesters.map(semester => (
                        <div key={semester.id} className={cn("flex items-center justify-between p-3 rounded-lg border", editingMode === semester.id ? "bg-accent border-primary" : "bg-background")}>
                            <div>
                                <p className="font-semibold">{semester.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(semester.dateRange.from!, 'MMM dd, yyyy')} - {format(semester.dateRange.to!, 'MMM dd, yyyy')}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleSelectExisting(semester)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                 <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSemester(semester.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {selectedBatch && (
                         <Button onClick={handleStartAddNew} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Add New Semester
                        </Button>
                    )}
                     {!selectedBatch && (
                        <div className="text-center text-muted-foreground p-4 border-dashed border-2 rounded-lg">
                            <p>Please select a batch first.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card 3: Editor */}
            {editingMode && (
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{editingMode === 'new' ? 'Create New Semester' : `Editing ${filteredSemesters.find(s => s.id === editingMode)?.name}`}</CardTitle>
                        <CardDescription>Set the duration, mark holidays, and calculate working days.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Semester</Label>
                                    {editingMode === 'new' ? (
                                        <Select value={selectedRoman} onValueChange={setSelectedRoman}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRomans.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={selectedRoman} disabled />
                                    )}
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
                                    <Calendar mode="multiple" min={1} selected={holidays} onSelect={(days) => setHolidays(days || [])} disabled={!dateRange} defaultMonth={dateRange?.from} fromDate={dateRange?.from} toDate={dateRange?.to} />
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                    <CardContent>
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
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
