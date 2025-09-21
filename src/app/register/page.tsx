
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import type { Institution, Department } from "@/lib/types"
import { getInstitutions } from "@/services/institution-service"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

const PasswordStrengthIndicator = ({ password }: { password?: string }) => {
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return (score / 5) * 100;
  };

  const strength = getStrength();
  const color = strength < 40 ? "bg-red-500" : strength < 80 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div>
        <Progress value={strength} className={`h-1 ${color}`} />
        <p className="text-xs mt-1">
            {strength < 40 && "Weak"}
            {strength >= 40 && strength < 80 && "Medium"}
            {strength >= 80 && "Strong"}
        </p>
    </div>
  );
};


export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [secretCode, setSecretCode] = useState("");
    const [isRegistered, setIsRegistered] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchInstitutions = async () => {
            const data = await getInstitutions();
            setInstitutions(data);
        };
        fetchInstitutions();
    }, []);

    useEffect(() => {
        if (selectedInstitution) {
            const institution = institutions.find(inst => inst.id === selectedInstitution);
            setDepartments(institution ? institution.departments : []);
            setSelectedDepartment(null);
        } else {
            setDepartments([]);
        }
    }, [selectedInstitution, institutions]);
    
    const handleRegister = () => {
        // Basic validation
        if (!name || !email || !password || !selectedInstitution || !selectedDepartment || !secretCode) {
            toast({
                title: "Registration Failed",
                description: "Please fill out all fields.",
                variant: "destructive"
            });
            return;
        }
        
        // Find role from secret code
        const institution = institutions.find(inst => inst.id === selectedInstitution);
        const department = institution?.departments.find(dept => dept.id === selectedDepartment);
        
        let role = "";
        if (department) {
            if (department.secretCodes.student === secretCode) role = "student";
            else if (department.secretCodes.teacher === secretCode) role = "teacher";
            else if (department.secretCodes.admin === secretCode) role = "admin";
        }
        
        if (!role) {
             toast({
                title: "Invalid Secret Code",
                description: "The secret code is not valid for the selected department.",
                variant: "destructive"
            });
            return;
        }

        // In a real app, you would save the new user to your database.
        // For this demo, we'll just show a success message.
        console.log({ name, email, password, institution: selectedInstitution, department: selectedDepartment, role });
        
        setIsRegistered(true);
    };
    
    if (isRegistered) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl sm:text-3xl flex items-center justify-center gap-2"><CheckCircle className="text-green-500" />Registration Successful!</CardTitle>
                        <CardDescription>
                            Your account is pending activation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertTitle>Activation Link Sent</AlertTitle>
                            <AlertDescription>
                                We've sent an activation link to <strong>{email}</strong>. Please check your inbox (and spam folder) to activate your account.
                            </AlertDescription>
                        </Alert>
                         <Button asChild className="mt-6 w-full">
                            <Link href="/login">
                                Back to Login
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Create Your Account</CardTitle>
            <CardDescription>
                Fill in the details below to register.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="John Doe" required className="pl-10" value={name} onChange={e => setName(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="m@example.com" required className="pl-10" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} required className="pl-10 pr-10" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                       {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </button>
                </div>
                <PasswordStrengthIndicator password={password} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Select onValueChange={setSelectedInstitution} value={selectedInstitution || undefined}>
                        <SelectTrigger id="institution">
                            <SelectValue placeholder="Select institution" />
                        </SelectTrigger>
                        <SelectContent>
                            {institutions.map(inst => (
                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={setSelectedDepartment} value={selectedDepartment || undefined} disabled={!selectedInstitution}>
                        <SelectTrigger id="department">
                            <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="secret-code">Secret Code</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="secret-code" placeholder="Enter your role's secret code" required className="pl-10" value={secretCode} onChange={e => setSecretCode(e.target.value)} />
                </div>
            </div>
            <Button onClick={handleRegister} className="w-full">
                Register
            </Button>
        </CardContent>
        <div className="mt-4 text-center text-sm p-6 pt-0">
            Already have an account?{" "}
            <Link href="/login" className="underline">
                Login
            </Link>
        </div>
        </Card>
    </div>
  )
}

    