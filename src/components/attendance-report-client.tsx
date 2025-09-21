"use client";

import { useState } from "react";
import type { AttendanceRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Pencil } from "lucide-react";

type AttendanceReportClientProps = {
  initialRecords: AttendanceRecord[];
};

export function AttendanceReportClient({ initialRecords }: AttendanceReportClientProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceRecord["status"]>("Present");

  const handleEditClick = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setNewStatus(record.status);
  };

  const handleSaveChanges = () => {
    if (editingRecord) {
      setRecords(
        records.map((r) =>
          r.id === editingRecord.id ? { ...r, status: newStatus } : r
        )
      );
      setEditingRecord(null);
    }
  };

  const handleGenerateReport = () => {
    const header = "Employee ID,Name,Date,Time,Status\n";
    const rows = records
      .map((r) => `${r.employeeId},${r.name},${r.date},${r.time},${r.status}`)
      .join("\n");
    const reportContent = header + rows;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getStatusVariant = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present':
        return 'default';
      case 'Absent':
        return 'destructive';
      case 'Late':
        return 'secondary';
      default:
        return 'outline';
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Reports</h1>
        <Button onClick={handleGenerateReport}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.employeeId}</TableCell>
                <TableCell className="font-medium">{record.name}</TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.time}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(record)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right">Name</span>
              <span className="col-span-3 font-medium">{editingRecord?.name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right">Status</span>
              <div className="col-span-3">
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as AttendanceRecord["status"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
