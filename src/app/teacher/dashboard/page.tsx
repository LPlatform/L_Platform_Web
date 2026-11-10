"use client";

import { CheckCircle2, Code2, GraduationCap, Users } from "lucide-react";
import * as React from "react";
import { useSession } from "@/components/admin/session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendRequest } from "@/lib/api/client";

type TeacherSummary = {
  assignedSectionsCount: number;
  assignedStudentCount: number;
  activeAssignmentsCount: number;
  totalSubmissionsCount: number;
};

export default function TeacherDashboardPage() {
  const { session } = useSession();
  const [summary, setSummary] = React.useState<TeacherSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    backendRequest<TeacherSummary>("/api/dashboard/teacher")
      .then(setSummary)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load teacher dashboard"));
  }, []);

  const cards = [
    { title: "Assigned Sections", value: summary?.assignedSectionsCount, icon: Users },
    { title: "Enrolled Students", value: summary?.assignedStudentCount, icon: GraduationCap },
    { title: "Active Assignments", value: summary?.activeAssignmentsCount, icon: Code2 },
    { title: "Submissions", value: summary?.totalSubmissionsCount, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {session.name}</h2>
        <p className="text-muted-foreground text-sm">Live classroom totals from the Backend.</p>
      </div>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value ?? "—"}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
