
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getInstitutions } from "@/services/institution-service";
import { updateUser, getUserData } from "@/services/user-service";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { Department } from "@/lib/types";
import { KeyRound, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JoinDepartmentPage() {
  const { userProfile, setUserProfile, loading: userLoading } = useUserProfile();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDepartments() {
      if (userProfile) {
        const institutions = await getInstitutions();
        const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
        if (currentInstitution) {
          // Filter out the department the user is already in
          const availableDepts = currentInstitution.departments.filter(dept => dept.id !== userProfile.departmentId);
          setDepartments(availableDepts);
        }
      }
    }
    fetchDepartments();
  }, [userProfile]);

  const handleSubmit = async () => {
    if (!selectedDepartmentId || !secretCode || !userProfile?.role || !userProfile.uid) {
      toast({
        title: "Missing Information",
        description: "Please select a department and enter the secret code.",
        variant: "destructive",
      });
      return;
    }

    const selectedDept = departments.find(d => d.id === selectedDepartmentId);
    if (!selectedDept) {
      toast({ title: "Error", description: "Selected department not found.", variant: "destructive" });
      return;
    }

    // Determine the correct secret code for the user's role
    const correctSecretCode = selectedDept.secretCodes[userProfile.role as keyof typeof selectedDept.secretCodes];

    if (secretCode !== correctSecretCode) {
      toast({
        title: "Invalid Secret Code",
        description: "The secret code is incorrect for your role in the selected department.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update the user's department in the database
      const newDepartmentData = {
        departmentId: selectedDept.id,
        departmentName: selectedDept.name,
      };
      await updateUser(userProfile.uid, newDepartmentData);

      // Update local state
      if (setUserProfile) {
        setUserProfile(prev => prev ? { ...prev, ...newDepartmentData } : null);
      }
      
      toast({
        title: "Success",
        description: `You have successfully joined the "${selectedDept.name}" department.`,
      });

      // Clear fields and redirect
      setSelectedDepartmentId("");
      setSecretCode("");
      router.push(`/${userProfile.role}-dashboard`);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to join department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Join a New Department</CardTitle>
          <CardDescription>
            Select a department you wish to join and enter its secret code. This will change your current department.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department">Available Departments</Label>
            <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={userLoading || departments.length === 0}>
              <SelectTrigger id="department">
                <SelectValue placeholder={userLoading ? "Loading..." : (departments.length === 0 ? "No other departments available" : "Select a department to join")} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-code">Department Secret Code</Label>
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="secret-code"
                  type="password"
                  placeholder="Enter the secret code for your role"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="pl-10"
                />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading || userLoading || !selectedDepartmentId || !secretCode} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            {isLoading ? "Joining..." : "Join Department"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
