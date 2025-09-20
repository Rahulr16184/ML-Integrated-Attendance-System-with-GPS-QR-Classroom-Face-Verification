import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InstitutionManager } from "@/components/institution-manager";
import initialData from "@/lib/institutions.json";

export default function ServerManageInstitutionPage() {
  // In a real app, you'd fetch this data from a database.
  // For now, we're loading it from a local JSON file.
  const institutions = initialData.institutions;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Manage Institutions</h1>
            <p className="text-muted-foreground">Create and manage institutions, departments, and their access codes.</p>
        </div>
        <InstitutionManager initialInstitutions={institutions} />
      </main>
    </div>
  );
}
