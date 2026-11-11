"use client";

import { ArrowUpRight, BookOpen, Copy, Search, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { useSession } from "@/components/admin/session-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { backendRequest } from "@/lib/api/client";

interface TeacherClassCard {
  id: string;
  joinCode: string;
  sectionName: string;
  classId: string;
  className: string;
  grade: string;
  academicYear: string;
  organizationName: string;
  maxStudents: number;
  studentCount: number;
  teachers: Array<{
    id: string;
    name: string;
    email: string | null;
    teacherRole: "PRIMARY" | "CO_TEACHER";
  }>;
  courses: Array<{
    id: string;
    title: string;
    language: string;
  }>;
}

export default function TeacherSectionsPage() {
  const { session } = useSession();
  const [classes, setClasses] = React.useState<TeacherClassCard[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    backendRequest<{ items: TeacherClassCard[] }>("/api/learning/classes")
      .then((res) => setClasses(res.items ?? []))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load classes"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.className.toLowerCase().includes(q) ||
        c.sectionName.toLowerCase().includes(q) ||
        c.joinCode.toLowerCase().includes(q),
    );
  }, [classes, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Classroom management"
        title="My Classes"
        description="View your assigned classes and sections, copy student invitation codes, and inspect rosters and allocated courses."
      />

      <div className="relative max-w-md">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search class, section or join code..."
          className="bg-card pl-9"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface">
          <EmptyState
            title="No assigned classes"
            description="No active classes match your account or search filter."
            icon={Users}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cls) => {
            const myRole =
              cls.teachers.find((t) => t.id === session.userId)?.teacherRole ?? "CO_TEACHER";
            const primaryTeacher = cls.teachers.find((t) => t.teacherRole === "PRIMARY");
            return (
              <Card
                key={cls.id}
                className="hover:border-primary/40 flex flex-col justify-between transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        {cls.className} · {cls.sectionName}
                      </CardTitle>
                      <CardDescription>
                        {cls.academicYear || "Active Term"} · {cls.organizationName}
                      </CardDescription>
                    </div>
                    <StatusBadge status={myRole} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="border-border bg-secondary/50 rounded-xl border p-3">
                      <p className="text-muted-foreground">Students</p>
                      <p className="mt-1 text-base font-bold tabular-nums">
                        {cls.studentCount} / {cls.maxStudents}
                      </p>
                    </div>
                    <div className="border-border bg-secondary/50 rounded-xl border p-3">
                      <p className="text-muted-foreground">Co-Teaching</p>
                      <p className="mt-1 text-base font-bold tabular-nums">
                        {cls.teachers.length} teacher{cls.teachers.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  {primaryTeacher && (
                    <p className="text-muted-foreground text-xs">
                      Primary Teacher:{" "}
                      <span className="text-foreground font-medium">{primaryTeacher.name}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {cls.courses.length === 0 ? (
                      <Badge variant="outline">No allocated courses</Badge>
                    ) : (
                      cls.courses.slice(0, 3).map((course) => (
                        <Badge key={course.id} variant="secondary">
                          <BookOpen className="size-3" />
                          {course.title}
                        </Badge>
                      ))
                    )}
                  </div>

                  <div className="border-border flex items-center justify-between border-t pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(cls.joinCode);
                        toast.success(`Copied join code ${cls.joinCode}`);
                      }}
                      className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-colors"
                    >
                      <Copy className="size-3" />
                      {cls.joinCode}
                    </button>
                    <Button size="sm" asChild>
                      <Link href={`/teacher/sections/${cls.id}`}>
                        Open Class
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
