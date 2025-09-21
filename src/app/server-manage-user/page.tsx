import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServerManageUserPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Users</h1>
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Here you can manage and monitor users.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
