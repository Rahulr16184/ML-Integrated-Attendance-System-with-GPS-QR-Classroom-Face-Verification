
"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import type { UserProfile } from '@/services/user-service';
import type { Institution } from '@/lib/types';
import { updateUser } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowUpDown, ShieldAlert, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserManagerProps {
  initialUsers: UserProfile[];
  initialInstitutions: Institution[];
}

const UPGRADE_SECRET_CODE = "4231";

export function UserManager({ initialUsers, initialInstitutions }: UserManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const { toast } = useToast();

  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Dialog states
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [userToUpgrade, setUserToUpgrade] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  
  const handleUpgradeClick = (user: UserProfile) => {
    setUserToUpgrade(user);
    setNewRole(user.role);
    setIsUpgradeDialogOpen(true);
  };

  const handleVerifyCode = () => {
    if (secretCode === UPGRADE_SECRET_CODE) {
        setIsCodeVerified(true);
        toast({ title: 'Code Verified', description: 'You can now change the user role.' });
    } else {
        toast({ title: 'Invalid Code', description: 'The secret code is incorrect.', variant: 'destructive' });
    }
  };

  const handleRoleUpgrade = async () => {
    if (!userToUpgrade || !newRole || !isCodeVerified) return;

    try {
        await updateUser(userToUpgrade.uid, { role: newRole });
        setUsers(users.map(u => u.uid === userToUpgrade.uid ? { ...u, role: newRole } : u));
        toast({ title: 'Success', description: `${userToUpgrade.name}'s role has been updated to ${newRole}.` });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update user role.', variant: 'destructive' });
    } finally {
        closeUpgradeDialog();
    }
  };

  const closeUpgradeDialog = () => {
    setIsUpgradeDialogOpen(false);
    setIsCodeVerified(false);
    setSecretCode("");
    setUserToUpgrade(null);
    setNewRole("");
  };

  const departmentsForFilter = useMemo(() => {
    if (institutionFilter === 'all') return [];
    const inst = initialInstitutions.find(i => i.id === institutionFilter);
    return inst ? inst.departments : [];
  }, [institutionFilter, initialInstitutions]);


  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const institutionMatch = institutionFilter === 'all' || user.institutionId === institutionFilter;
      const departmentMatch = departmentFilter === 'all' || user.departmentIds?.includes(departmentFilter);
      return roleMatch && institutionMatch && departmentMatch;
    });
  }, [users, roleFilter, institutionFilter, departmentFilter]);
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'secondary';
      case 'student': return 'default';
      case 'server': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleBorderColor = (role: string) => {
    switch (role) {
      case 'student': return 'border-blue-500';
      case 'admin': return 'border-green-500';
      case 'teacher': return 'border-red-500';
      case 'server': return 'border-purple-500';
      default: return 'border-transparent';
    }
  };


  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by role..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="server">Server</SelectItem>
              </SelectContent>
            </Select>
            <Select value={institutionFilter} onValueChange={(val) => { setInstitutionFilter(val); setDepartmentFilter('all'); }}>
              <SelectTrigger><SelectValue placeholder="Filter by institution..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                {initialInstitutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={institutionFilter === 'all'}>
              <SelectTrigger><SelectValue placeholder="Filter by department..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                 {departmentsForFilter.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <Avatar className={cn("border-2", getRoleBorderColor(user.role))}>
                    <AvatarImage src={user.profileImage} alt={user.name} data-ai-hint="profile picture" />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>{user.institutionName}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleUpgradeClick(user)} disabled={user.role === 'server'}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Upgrade
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isUpgradeDialogOpen} onOpenChange={closeUpgradeDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Upgrade User Role</DialogTitle>
                <DialogDescription>
                    Securely change the role for {userToUpgrade?.name}.
                </DialogDescription>
            </DialogHeader>
            {!isCodeVerified ? (
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                        <ShieldAlert className="h-5 w-5" />
                        <p className="text-sm font-medium">Enter the server secret code to proceed.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secret-code">Secret Code</Label>
                        <Input 
                            id="secret-code"
                            type="password"
                            value={secretCode}
                            onChange={e => setSecretCode(e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-role">Current Role</Label>
                        <Input id="current-role" value={userToUpgrade?.role} disabled className="capitalize" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-role">New Role</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger id="new-role">
                                <SelectValue placeholder="Select new role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={closeUpgradeDialog}>Cancel</Button>
                {!isCodeVerified ? (
                    <Button onClick={handleVerifyCode}>Verify Code</Button>
                ) : (
                    <Button onClick={handleRoleUpgrade} disabled={!newRole || newRole === userToUpgrade?.role}>Upgrade Role</Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
