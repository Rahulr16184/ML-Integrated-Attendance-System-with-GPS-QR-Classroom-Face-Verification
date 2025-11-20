import { getAllUsers } from "@/services/user-service";
import { getInstitutions } from "@/services/institution-service";
import { UserManager } from "@/components/user-manager";

export default async function ServerManageUserPage() {
  const users = await getAllUsers();
  const institutions = await getInstitutions();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">Filter, view, and manage all users in the system.</p>
        </div>
        <UserManager initialUsers={users} initialInstitutions={institutions} />
      </main>
    </div>
  );
}
