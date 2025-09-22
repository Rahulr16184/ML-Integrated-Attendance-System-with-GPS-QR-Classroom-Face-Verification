
"use client";

import React, { useState, useEffect } from 'react';
import type { Institution, Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, University, Pen, Trash2, KeyRound, Save, X, ShieldAlert } from 'lucide-react';
import { createInstitution, createDepartment, updateDepartmentSecretCodes, updateInstitutionName, updateDepartmentName, deleteDepartment, deleteInstitution, getInstitutions } from '@/services/institution-service';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface InstitutionManagerProps {
  initialInstitutions: Institution[];
}

export function InstitutionManager({ initialInstitutions }: InstitutionManagerProps) {
  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [editingName, setEditingName] = useState('');
  const [secretCodes, setSecretCodes] = useState<Department['secretCodes']>({ student: '', teacher: '', admin: '', server: '' });
  
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: 'institution' | 'department', name: string} | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const { toast } = useToast();
  
  useEffect(() => {
    setInstitutions(initialInstitutions);
    if (selectedInstitution) {
        const currentSelected = initialInstitutions.find(inst => inst.id === selectedInstitution.id);
        setSelectedInstitution(currentSelected || null);
    } else {
        setSelectedInstitution(null);
    }
  }, [initialInstitutions, selectedInstitution?.id]);

  const refreshState = (newInstitutions: Institution[]) => {
      setInstitutions(newInstitutions);
      if (selectedInstitution) {
          const updatedSelection = newInstitutions.find(inst => inst.id === selectedInstitution.id);
          setSelectedInstitution(updatedSelection || null);
      }
  }

  const handleCreateInstitution = async () => {
    if (newInstitutionName.trim()) {
      try {
        await createInstitution(newInstitutionName.trim());
        const updatedInstitutions = await getInstitutions();
        refreshState(updatedInstitutions);
        setNewInstitutionName('');
        toast({ title: 'Success', description: 'Institution created successfully.' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to create institution.', variant: 'destructive' });
      }
    }
  };

  const handleCreateDepartment = async () => {
    if (newDepartmentName.trim() && selectedInstitution) {
      try {
        await createDepartment(selectedInstitution.id, newDepartmentName.trim());
        const updatedInstitutions = await getInstitutions();
        refreshState(updatedInstitutions);
        setNewDepartmentName('');
        toast({ title: 'Success', description: 'Department created successfully.' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to create department.', variant: 'destructive' });
      }
    }
  };
  
  const handleOpenEditModal = (department: Department) => {
    setEditingDepartment(department);
    // Ensure all keys are present to avoid uncontrolled to controlled input warning
    setSecretCodes({
      student: department.secretCodes?.student || '',
      teacher: department.secretCodes?.teacher || '',
      admin: department.secretCodes?.admin || '',
      server: department.secretCodes?.server || '',
    });
    setEditingName('');
  };

  const handleUpdateSecretCodes = async () => {
    if (editingDepartment && selectedInstitution) {
        try {
            await updateDepartmentSecretCodes(selectedInstitution.id, editingDepartment.id, secretCodes);
            const updatedInstitutions = await getInstitutions();
            refreshState(updatedInstitutions);
            setEditingDepartment(null);
            toast({ title: 'Success', description: 'Secret codes updated.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update secret codes.', variant: 'destructive' });
        }
    }
  };

  const handleCodeChange = (role: 'student' | 'teacher' | 'admin' | 'server', value: string) => {
    setSecretCodes(prev => ({...prev, [role]: value}));
  };

  const startEditing = (item: Institution | Department, name: string) => {
    if ('departments' in item) {
      setEditingInstitution(item);
      setEditingDepartment(null);
    } else {
      setEditingDepartment(item);
      setEditingInstitution(null);
    }
    setEditingName(name);
  };
  
  const cancelEditing = () => {
    setEditingInstitution(null);
    setEditingDepartment(null);
    setEditingName('');
  };

  const saveName = async (id: string, type: 'institution' | 'department') => {
    if (!editingName.trim()) {
      toast({ title: 'Error', description: 'Name cannot be empty.', variant: 'destructive' });
      return;
    }
    try {
        if (type === 'institution') {
            await updateInstitutionName(id, editingName.trim());
        } else if (selectedInstitution) {
            await updateDepartmentName(selectedInstitution.id, id, editingName.trim());
        }
        cancelEditing();
        const updatedInstitutions = await getInstitutions();
        refreshState(updatedInstitutions);
        toast({ title: 'Success', description: `${type === 'institution' ? 'Institution' : 'Department'} name updated.` });
    } catch (error) {
        toast({ title: 'Error', description: `Failed to update ${type} name.`, variant: 'destructive' });
    }
  };
  
  const openDeleteDialog = (item: Institution | Department, type: 'institution' | 'department') => {
    setDeleteTarget({ id: item.id, type, name: item.name });
  };
  
  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmation !== 'CONFIRM') return;

    try {
        if (deleteTarget.type === 'institution') {
            await deleteInstitution(deleteTarget.id);
        } else if (deleteTarget.type === 'department' && selectedInstitution) {
            await deleteDepartment(selectedInstitution.id, deleteTarget.id);
        }
        const updatedInstitutions = await getInstitutions();
        refreshState(updatedInstitutions);
        toast({ title: 'Success', description: `${deleteTarget.name} deleted.` });
    } catch (error) {
        toast({ title: 'Error', description: `Failed to delete ${deleteTarget.name}.`, variant: 'destructive' });
    } finally {
        setDeleteTarget(null);
        setDeleteConfirmation('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Institution</CardTitle>
          <CardDescription>Add a new institution to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              placeholder="e.g., Global Tech University"
              value={newInstitutionName}
              onChange={(e) => setNewInstitutionName(e.target.value)}
            />
            <Button onClick={handleCreateInstitution} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Create</Button>
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
            <Accordion type="single" collapsible className="w-full" value={selectedInstitution?.id} onValueChange={(value) => setSelectedInstitution(institutions.find(inst => inst.id === value) || null)}>
              {institutions.map((inst) => (
                <AccordionItem key={inst.id} value={inst.id}>
                  <div className="flex items-center w-full">
                    <AccordionTrigger className="text-lg font-medium flex-grow hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                          {editingInstitution?.id === inst.id ? (
                            <div className="flex items-center gap-2 w-full pr-10">
                              <Input value={editingName} onChange={e => setEditingName(e.target.value)} onClick={e => e.stopPropagation()} className="h-9" />
                              <Button size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); saveName(inst.id, 'institution');}}><Save className="h-4 w-4"/></Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); cancelEditing();}}><X className="h-4 w-4"/></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <University className="h-5 w-5 sm:h-6 sm:w-6" /> <span className="text-base sm:text-lg text-left">{inst.name}</span>
                            </div>
                          )}
                      </div>
                    </AccordionTrigger>
                    {editingInstitution?.id !== inst.id && (
                      <div className="flex items-center ml-auto pr-2 gap-0">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); startEditing(inst, inst.name); }}>
                              <Pen className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteDialog(inst, 'institution'); }}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    )}
                  </div>
                  <AccordionContent className="pl-4 space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h4 className="font-semibold mb-2">Create Department/Class</h4>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Input
                          placeholder="e.g., Computer Science"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                        />
                        <Button onClick={handleCreateDepartment} variant="secondary" disabled={!selectedInstitution} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                      </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-muted-foreground">Departments:</h4>
                         {inst.departments.length > 0 ? (
                            <ul className="space-y-2">
                            {inst.departments.map((dept) => (
                                <li key={dept.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 border rounded-md gap-2">
                                    {editingDepartment?.id === dept.id && editingInstitution === null ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-9"/>
                                            <Button size="icon" className="h-9 w-9" onClick={() => saveName(dept.id, 'department')}><Save className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium">{dept.name}</span>
                                            <div className="flex items-center sm:ml-auto">
                                                <Button variant="ghost" size="icon" onClick={() => startEditing(dept, dept.name)}>
                                                    <Pen className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(dept)}>
                                                    <KeyRound className="h-4 w-4" />
                                                    <span className="sr-only">Edit Codes</span>
                                                </Button>
                                                 <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteDialog(dept, 'department'); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
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

      <Dialog open={!!editingDepartment && editingInstitution === null} onOpenChange={(open) => { if (!open) setEditingDepartment(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Secret Codes for {editingDepartment?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="student-code" className="text-right">Student</Label>
                <Input id="student-code" value={secretCodes.student} onChange={(e) => handleCodeChange('student', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher-code" className="text-right">Teacher</Label>
                <Input id="teacher-code" value={secretCodes.teacher} onChange={(e) => handleCodeChange('teacher', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin-code" className="text-right">Admin</Label>
                <Input id="admin-code" value={secretCodes.admin} onChange={(e) => handleCodeChange('admin', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="server-code" className="text-right">Server</Label>
                <Input id="server-code" value={secretCodes.server} onChange={(e) => handleCodeChange('server', e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdateSecretCodes}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={!!deleteTarget} onOpenChange={(open) => { if(!open) { setDeleteTarget(null); setDeleteConfirmation(""); }}}>
         <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ShieldAlert/>Delete {deleteTarget?.name}?</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. This will permanently delete the {deleteTarget?.type} and all associated data.
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
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                    variant="destructive"
                    disabled={deleteConfirmation !== 'CONFIRM'}
                    onClick={handleDelete}
                >
                    I understand, delete this {deleteTarget?.type}
                </Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}
