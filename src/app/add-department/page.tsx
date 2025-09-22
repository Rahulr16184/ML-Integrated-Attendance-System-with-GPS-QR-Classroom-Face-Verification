
"use client";

import { useState } from "react";
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
import { createDepartment, getInstitutions } from "@/services/institution-service";
import { useEffect } from "react";
import type { Institution } from "@/lib/types";
import { PlusCircle } from "lucide-react";

export default function AddDepartmentPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchInstitutions() {
      const data = await getInstitutions();
      setInstitutions(data);
    }
    fetchInstitutions();
  }, []);

  const handleSubmit = async () => {
    if (!selectedInstitution || !departmentName) {
      toast({
        title: "Missing Information",
        description: "Please select an institution and enter a department name.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
        await createDepartment(selectedInstitution, departmentName);
        toast({
            title: "Success",
            description: `Department "${departmentName}" created successfully.`
        });
        setDepartmentName("");
    } catch (error) {
        console.error(error)
        toast({
            title: "Error",
            description: "Failed to create department. Please try again.",
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
          <CardTitle>Add New Department</CardTitle>
          <CardDescription>
            Select an institution and enter the name for the new department.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Select onValueChange={setSelectedInstitution} value={selectedInstitution}>
              <SelectTrigger id="institution">
                <SelectValue placeholder="Select an institution" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department-name">Department Name</Label>
            <Input
              id="department-name"
              placeholder="e.g., Artificial Intelligence"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Creating..." : "Create Department"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
