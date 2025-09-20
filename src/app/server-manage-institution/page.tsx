import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServerManageInstitutionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Institutions</h1>
        <Card>
          <CardHeader>
            <CardTitle>Institution Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Here you can create and manage institutions.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
