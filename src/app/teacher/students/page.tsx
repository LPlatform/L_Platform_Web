"use client";

import { ArrowUpRight, Download, Search, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { backendRequest } from "@/lib/api/client";
import { downloadCsv } from "@/lib/utils";

interface ClassOption {
  id: string;
  sectionName: string;
  className: string;
}

interface RosterStudent {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string | null;
  status: string;
}

interface StudentAggregate extends RosterStudent {
  sections: Array<{ id: string; label: string }>;
}

export default function TeacherStudentsPage() {
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [students, setStudents] = React.useState<StudentAggregate[]>([]);
  const [search, setSearch] = React.useState("");
  const [sectionFilter, setSectionFilter] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  const loadStudents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const classesRes = await backendRequest<{ items: ClassOption[] }>("/api/learning/classes");
      const assigned = classesRes.items ?? [];
      setClasses(assigned);

      const rosters = await Promise.all(
        assigned.map(async (cls) => {
          const res = await backendRequest<{ students: RosterStudent[] }>(
            `/api/sections/${encodeURIComponent(cls.id)}/roster`,
          );
          return { cls, roster: res.students ?? [] };
        }),
      );

      const map = new Map<string, StudentAggregate>();
      for (const { cls, roster } of rosters) {
        const label = `${cls.className} · ${cls.sectionName}`;
        for (const st of roster) {
          const existing = map.get(st.id);
          if (existing) {
            if (!existing.sections.some((s) => s.id === cls.id)) {
              existing.sections.push({ id: cls.id, label });
            }
          } else {
            map.set(st.id, {
              ...st,
              sections: [{ id: cls.id, label }],
            });
          }
        }
      }

      setStudents(Array.from(map.values()).sort((a, b) => a.firstName.localeCompare(b.firstName)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load students");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((st) => {
      if (sectionFilter !== "ALL" && !st.sections.some((s) => s.id === sectionFilter)) {
        return false;
      }
      if (!q) return true;
      const fullName = `${st.firstName} ${st.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (st.email ?? "").toLowerCase().includes(q) ||
        st.publicId.toLowerCase().includes(q)
      );
    });
  }, [students, search, sectionFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Classroom"
        title="Students"
        description="Students enrolled in your assigned class sections. Click any student to view their course progress, coding submissions, and assessments."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              downloadCsv(
                `my-students-${new Date().toISOString().slice(0, 10)}.csv`,
                ["ID", "Name", "Email", "Sections", "Status"],
                filtered.map((s) => [
                  s.publicId,
                  `${s.firstName} ${s.lastName}`.trim(),
                  s.email ?? "",
                  s.sections.map((sec) => sec.label).join("; "),
                  s.status,
                ]),
              );
              toast.success(`Exported ${filtered.length} students.`);
            }}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, ID or email..."
            className="bg-card pl-9"
          />
        </div>
        <NativeSelect
          aria-label="Filter by class section"
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="sm:w-64"
        >
          <option value="ALL">All my sections ({students.length})</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className} · {cls.sectionName}
            </option>
          ))}
        </NativeSelect>
      </div>

      {error ? (
        <div className="surface">
          <ErrorState message={error} onRetry={() => void loadStudents()} />
        </div>
      ) : loading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : filtered.length === 0 ? (
        <div className="surface">
          <EmptyState
            title="No students found"
            description="No students match your current search or section filter."
            icon={Users}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Roster</CardTitle>
            <CardDescription>{filtered.length} student(s) in scope</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email / Username</TableHead>
                  <TableHead>Enrolled Sections</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar firstName={st.firstName} lastName={st.lastName} size="sm" />
                        <div>
                          <p className="font-medium">
                            {st.firstName} {st.lastName}
                          </p>
                          <p className="text-muted-foreground text-xs">{st.publicId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {st.email || (st.username ? `@${st.username}` : "—")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {st.sections.map((sec) => (
                          <Badge key={sec.id} variant="secondary">
                            {sec.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={st.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/teacher/students/${st.id}`}>
                          View Profile
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
