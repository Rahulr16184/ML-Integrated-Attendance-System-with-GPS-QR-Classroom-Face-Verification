
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";

export default function IdCardPage() {
  const user = {
    name: "Student User",
    role: "Student",
    id: "STU-E12345",
    dob: "15-08-2002",
    institution: "Global Tech Academy",
    department: "Computer Science",
    profileImage: "https://picsum.photos/seed/1/200/200",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STU-E12345",
  };

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center bg-muted/40 min-h-full">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden border-primary border-2">
        <CardHeader className="bg-primary text-primary-foreground text-center p-4">
          <CardTitle className="text-2xl font-bold tracking-wider">{user.institution}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32 border-4 border-primary/50">
            <AvatarImage src={user.profileImage} alt={user.name} data-ai-hint="profile picture"/>
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-primary font-semibold">{user.role}</p>
          </div>
          <div className="w-full text-sm space-y-2 pt-4 border-t">
             <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">ID:</span>
                <span className="font-mono">{user.id}</span>
             </div>
             <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">DOB:</span>
                <span>{user.dob}</span>
             </div>
             <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Dept:</span>
                <span className="text-right">{user.department}</span>
             </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 flex justify-center">
            <Image src={user.qrCode} alt="QR Code" width={100} height={100} data-ai-hint="qr code"/>
        </CardFooter>
      </Card>
    </div>
  );
}
