
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkingDaysPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Working Days</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Working Days</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where the functionality to manage working days will be.</p>
        </CardContent>
      </Card>
    </div>
  );
}
