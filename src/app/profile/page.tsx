import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://picsum.photos/seed/1/200/200" alt="User avatar" data-ai-hint="profile picture" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">Admin</h2>
              <p className="text-muted-foreground">admin@gmail.com</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium">Role</h3>
            <p className="text-muted-foreground">Administrator</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
