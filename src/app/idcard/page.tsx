
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Image from "next/image";

export default function IdCardPage() {
  const user = {
    name: "Student User",
    gender: "Male",
    mobile: "+1 987 654 321",
    email: "student@example.com",
    role: "Student",
    id: "STU-E12345",
    dob: "15-08-2002",
    institution: "Global Tech Academy",
    department: "Computer Science",
    rollNo: "22CS001",
    registerNo: "GTA22CS001",
    profileImage: "https://picsum.photos/seed/1/200/200",
  };

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center bg-muted/40 min-h-full">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between space-x-4 p-6">
            <CardTitle className="text-2xl font-bold tracking-wider">DIGITAL ID</CardTitle>
            <Image 
                src={user.profileImage} 
                alt={user.name} 
                width={80} 
                height={80} 
                className="rounded-lg object-cover"
                data-ai-hint="profile picture"
            />
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center">
            <p className="font-bold text-lg">{user.role || "--"}</p>
            <div className="w-full text-sm space-y-2 pt-4 mt-4 border-t">
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">NAME:</span>
                  <span className="font-medium break-words">{user.name || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">GENDER:</span>
                  <span>{user.gender || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">MOBILE NO:</span>
                  <span className="break-words">{user.mobile || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">MAIL ID:</span>
                  <span className="break-words">{user.email || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">INSTITUTION:</span>
                  <span className="break-words">{user.institution || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">DEPARTMENT:</span>
                  <span className="break-words">{user.department || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">ROLL NO:</span>
                  <span className="break-words">{user.rollNo || "--"}</span>
               </div>
               <div className="grid grid-cols-2 items-center text-left">
                  <span className="font-medium text-muted-foreground">REGISTER NO:</span>
                  <span className="break-words">{user.registerNo || "--"}</span>
               </div>
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-center">
            <p className="text-xs text-muted-foreground">Tracein digital id</p>
        </CardFooter>
      </Card>
    </div>
  );
}
