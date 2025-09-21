"use client";

import { useState, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInDays, isSameDay, isWeekend } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Calculator, Save } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function WorkingDaysPage() {
  const [batch, setBatch] = useState<string>("");
  const [semesterName, setSemesterName] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | null>(null);

  const handleHolidaySelect = (day: Date | undefined) => {
    if (!day) return;
    if (holidays.some((holiday) => isSameDay(holiday, day))) {
      setHolidays(holidays.filter((h) => !isSameDay(h, day)));
    } else {
      setHolidays([...holidays, day]);
    }
  };

  const calculateWorkingDays = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      setTotalWorkingDays(null);
      return;
    }

    let count = 0;
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const totalDays = differenceInDays(to, from) + 1;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(from, i);
      const isDayAHoliday = holidays.some((h) => isSameDay(h, currentDate));
      
      if (!isWeekend(currentDate) && !isDayAHoliday) {
        count++;
      }
    }
    setTotalWorkingDays(count);
  };
  
  const holidaysInMonth = useMemo(() => {
    const monthMap = new Map<string, Date[]>();
    holidays.forEach(day => {
        const monthKey = format(day, "yyyy-MM");
        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, []);
        }
        monthMap.get(monthKey)!.push(day);
    });
    return Array.from(monthMap.entries()).sort();
  }, [holidays]);


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Working Days</h1>
        <p className="text-muted-foreground">Define academic semesters, set holidays, and calculate total working days.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Configuration</CardTitle>
          <CardDescription>Set up the working days calendar for a specific batch.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid gap-2">
                <Label htmlFor="batch-select">Select Batch/Department</Label>
                <Select value={batch} onValueChange={setBatch}>
                    <SelectTrigger id="batch-select">
                        <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cs-2024">Computer Science - 2024</SelectItem>
                        <SelectItem value="ba-2024">Business Admin - 2024</SelectItem>
                        <SelectItem value="me-2024">Mechanical Eng - 2024</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="semester-name">Semester Name</Label>
              <Input 
                id="semester-name"
                placeholder="e.g., Fall Semester 2024"
                value={semesterName}
                onChange={(e) => setSemesterName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Semester Duration (From - To)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
             <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={calculateWorkingDays} className="w-full sm:w-auto" disabled={!dateRange}>
                <Calculator className="mr-2 h-4 w-4" /> Calculate Days
              </Button>
               <Button variant="outline" className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save Configuration
              </Button>
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
                    <Calendar
                        mode="multiple"
                        min={1}
                        selected={holidays}
                        onSelect={(days) => setHolidays(days || [])}
                        disabled={!dateRange}
                        defaultMonth={dateRange?.from}
                        fromDate={dateRange?.from}
                        toDate={dateRange?.to}
                    />
                </Card>
             </div>
             <div>
                <Label>Selected Holidays</Label>
                {holidays.length > 0 ? (
                    <Card className="p-4 max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                            {holidaysInMonth.map(([month, days]) => (
                                <div key={month}>
                                    <h4 className="font-semibold text-sm mb-1">{format(new Date(month + "-02"), "MMMM yyyy")}</h4>
                                    <div className="flex flex-wrap gap-2">
                                    {days.sort((a,b) => a.getTime() - b.getTime()).map(day => (
                                        <Badge key={day.toISOString()} variant="secondary" className="text-xs">
                                            {format(day, "MMM dd")}
                                        </Badge>
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">No holidays selected.</p>
                )}
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
