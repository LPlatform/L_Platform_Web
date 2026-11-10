"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { backendRequest } from "@/lib/api/client";

type SectionRow = { id: string; name: string; className?: string; academicYear?: string; maxStudents?: number; enrolledCount?: number };
type StudentRow = { id: string; name?: string; firstName?: string; lastName?: string; email: string; status: string };

export default function TeacherSectionsPage() {
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [rosters, setRosters] = React.useState<Record<string, StudentRow[]>>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    backendRequest<{ items: SectionRow[] }>("/api/sections?page=1&pageSize=100")
      .then(async ({ items }) => {
        const assigned = items ?? [];
        setSections(assigned);
        const entries = await Promise.all(assigned.map(async (section) => {
          const roster = await backendRequest<{ students?: StudentRow[] }>(`/api/sections/${encodeURIComponent(section.id)}/roster`);
          return [section.id, roster.students ?? []] as const;
        }));
        setRosters(Object.fromEntries(entries));
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load assigned sections"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Assigned Sections</h2>
        <p className="text-muted-foreground text-sm">Sections and rosters returned for your authenticated teacher account.</p>
      </div>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      {sections.length === 0 && !error && <p className="text-muted-foreground text-sm">No sections are assigned to this account.</p>}
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle>{section.className ? `${section.className} · ` : ""}{section.name}</CardTitle><CardDescription>{section.academicYear || "Assigned section"}</CardDescription></div>
              <Badge variant="outline">{rosters[section.id]?.length ?? section.enrolledCount ?? 0} / {section.maxStudents ?? "—"} Students</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 border-b pb-2 text-xs font-medium"><span>Student</span><span>Email</span><span>Status</span></div>
            {(rosters[section.id] ?? []).map((student) => (
              <div key={student.id} className="grid grid-cols-3 border-b py-2 text-sm">
                <span>{student.name ?? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim()}</span><span>{student.email}</span><span>{student.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
