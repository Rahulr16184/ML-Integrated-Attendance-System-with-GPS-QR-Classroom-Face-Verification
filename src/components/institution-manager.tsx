"use client";

import React, { useState } from 'react';
import type { Institution, Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Building, University, Pen, Trash2, KeyRound } from 'lucide-react';

interface InstitutionManagerProps {
  initialInstitutions: Institution[];
}

export function InstitutionManager({ initialInstitutions }: InstitutionManagerProps) {
  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [secretCodes, setSecretCodes] = useState({ student: '', teacher: '', admin: '' });
  const { toast } = useToast();

  const handleCreateInstitution = () => {
    if (newInstitutionName.trim()) {
      const newInstitution: Institution = {
        id: `inst-${Date.now()}`,
        name: newInstitutionName.trim(),
        departments: [],
      };
      setInstitutions([...institutions, newInstitution]);
      setNewInstitutionName('');
      toast({ title: 'Success', description: 'Institution created successfully.' });
    }
  };

  const handleCreateDepartment = () => {
    if (newDepartmentName.trim() && selectedInstitution) {
      const newDepartment: Department = {
        id: `dept-${Date.now()}`,
        name: newDepartmentName.trim(),
        secretCodes: { student: '', teacher: '', admin: '' },
      };
      const updatedInstitutions = institutions.map((inst) =>
        inst.id === selectedInstitution.id
          ? { ...inst, departments: [...inst.departments, newDepartment] }
          : inst
      );
      setInstitutions(updatedInstitutions);
      setSelectedInstitution(updatedInstitutions.find(inst => inst.id === selectedInstitution.id) || null);
      setNewDepartmentName('');
      toast({ title: 'Success', description: 'Department created successfully.' });
    }
  };
  
  const handleOpenEditModal = (department: Department) => {
    setEditingDepartment(department);
    setSecretCodes(department.secretCodes);
  };

  const handleUpdateSecretCodes = () => {
    if (editingDepartment && selectedInstitution) {
        const updatedDepartments = selectedInstitution.departments.map(dept => 
            dept.id === editingDepartment.id ? { ...dept, secretCodes } : dept
        );
        const updatedInstitutions = institutions.map(inst => 
            inst.id === selectedInstitution.id ? { ...inst, departments: updatedDepartments } : inst
        );
      setInstitutions(updatedInstitutions);
      setSelectedInstitution(updatedInstitutions.find(inst => inst.id === selectedInstitution.id) || null);
      setEditingDepartment(null);
      toast({ title: 'Success', description: 'Secret codes updated.' });
    }
  };

  const handleCodeChange = (role: 'student' | 'teacher' | 'admin', value: string) => {
    setSecretCodes(prev => ({...prev, [role]: value}));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Institution</CardTitle>
          <CardDescription>Add a new institution to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., Global Tech University"
              value={newInstitutionName}
              onChange={(e) => setNewInstitutionName(e.target.value)}
            />
            <Button onClick={handleCreateInstitution}><PlusCircle className="mr-2" /> Create</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Institutions</CardTitle>
          <CardDescription>View and manage created institutions and their departments.</CardDescription>
        </CardHeader>
        <CardContent>
          {institutions.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {institutions.map((inst) => (
                <AccordionItem key={inst.id} value={inst.id} onClick={() => setSelectedInstitution(inst)}>
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center gap-3">
                        <University /> {inst.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h4 className="font-semibold mb-2">Create Department/Class</h4>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="e.g., Computer Science"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                        />
                        <Button onClick={handleCreateDepartment} variant="secondary"><PlusCircle className="mr-2" /> Add</Button>
                      </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-muted-foreground">Departments:</h4>
                         {inst.departments.length > 0 ? (
                            <ul className="space-y-2">
                            {inst.departments.map((dept) => (
                                <li key={dept.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span className="font-medium">{dept.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(dept)}>
                                    <Pen className="h-4 w-4" />
                                    <span className="sr-only">Edit Codes</span>
                                </Button>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No departments created yet.</p>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground">No institutions created yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Secret Codes for {editingDepartment?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="student-code" className="text-right">Student Code</Label>
                <Input id="student-code" value={secretCodes.student} onChange={(e) => handleCodeChange('student', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher-code" className="text-right">Teacher Code</Label>
                <Input id="teacher-code" value={secretCodes.teacher} onChange={(e) => handleCodeChange('teacher', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin-code" className="text-right">Admin Code</Label>
                <Input id="admin-code" value={secretCodes.admin} onChange={(e) => handleCodeChange('admin', e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdateSecretCodes}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
