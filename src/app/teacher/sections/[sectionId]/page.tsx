"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Code2,
  Copy,
  GraduationCap,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface RosterMember {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string | null;
  status: string;
  teacherRole?: "PRIMARY" | "CO_TEACHER";
}

interface SectionInfo {
  id: string;
  joinCode: string;
  sectionName: string;
  className: string;
  academicYear: string;
  organizationName: string;
  maxStudents: number;
  studentCount: number;
  courses: Array<{ id: string; title: string; language: string }>;
}

interface AssignmentRow {
  id: string;
  title: string;
  status: string;
  totalMarks: number;
  dueDate: string;
  submissionCount: number;
}

interface AssessmentRow {
  id: string;
  title: string;
  courseTitle: string;
  status: string;
  totalMarks: number;
  assignedSections: Array<{ sectionId: string; dueAt: string | null }>;
}

type TabKey = "overview" | "students" | "teachers" | "courses" | "assignments";

export default function TeacherSectionDetailPage() {
  const params = useParams<{ sectionId: string }>();
  const [tab, setTab] = React.useState<TabKey>("overview");
  const [sectionInfo, setSectionInfo] = React.useState<SectionInfo | null>(null);
  const [students, setStudents] = React.useState<RosterMember[]>([]);
  const [teachers, setTeachers] = React.useState<RosterMember[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [assessments, setAssessments] = React.useState<AssessmentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, rosterRes, asgRes, asmtRes] = await Promise.all([
        backendRequest<{ items: SectionInfo[] }>("/api/learning/classes"),
        backendRequest<{ students: RosterMember[]; teachers: RosterMember[] }>(
          `/api/sections/${encodeURIComponent(params.sectionId)}/roster`,
        ),
        backendRequest<{ items: AssignmentRow[] }>(
          `/api/assignments?sectionId=${encodeURIComponent(params.sectionId)}&page=1&pageSize=100`,
        ),
        backendRequest<{ items: AssessmentRow[] }>("/api/assessments").catch(() => ({ items: [] })),
      ]);
      const match = (classesRes.items ?? []).find((c) => c.id === params.sectionId) ?? null;
      setSectionInfo(match);
      setStudents(rosterRes.students ?? []);
      setTeachers(rosterRes.teachers ?? []);
      setAssignments(asgRes.items ?? []);
      setAssessments(
        (asmtRes.items ?? []).filter((a) =>
          a.assignedSections.some((s) => s.sectionId === params.sectionId),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load class details");
    } finally {
      setLoading(false);
    }
  }, [params.sectionId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Details" eyebrow="My Classes" />
        <div className="surface">
          <ErrorState message={error} onRetry={() => void loadData()} />
        </div>
      </div>
    );
  }

  const joinCode = sectionInfo?.joinCode || params.sectionId.toUpperCase();
  const title = sectionInfo
    ? `${sectionInfo.className} · ${sectionInfo.sectionName}`
    : `Section ${params.sectionId}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={sectionInfo?.organizationName || "Assigned Class"}
        title={title}
        description={
          sectionInfo
            ? `${sectionInfo.academicYear || "Current academic term"} · Invite students using join code ${joinCode}`
            : "Class section roster, courses, and assignments."
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/teacher/sections">
                <ArrowLeft className="size-4" />
                Back to Classes
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard?.writeText(joinCode);
                toast.success(`Copied join code ${joinCode}`);
              }}
            >
              <Copy className="size-4" />
              Copy Code: {joinCode}
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={students.length}
          hint={`Capacity: ${sectionInfo?.maxStudents ?? 60}`}
          icon={GraduationCap}
          tone="violet"
        />
        <StatCard
          label="Teachers"
          value={teachers.length}
          hint="1 Primary + Co-teachers"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Courses"
          value={sectionInfo?.courses.length ?? 0}
          icon={BookOpen}
          tone="success"
        />
        <StatCard
          label="Work Items"
          value={assignments.length + assessments.length}
          hint={`${assignments.length} coding · ${assessments.length} assessments`}
          icon={ClipboardCheck}
          tone="warning"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "overview", label: "Overview" },
            { key: "students", label: `Students (${students.length})` },
            { key: "teachers", label: `Teachers (${teachers.length})` },
            { key: "courses", label: `Courses (${sectionInfo?.courses.length ?? 0})` },
            {
              key: "assignments",
              label: `Assignments & Assessments (${assignments.length + assessments.length})`,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
              tab === item.key
                ? "lp-gradient-bg border-transparent text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Team</CardTitle>
              <CardDescription>Primary instructor and co-teachers assigned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="border-border bg-secondary/40 flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar firstName={t.firstName} lastName={t.lastName} size="sm" />
                    <div>
                      <p className="text-sm font-medium">
                        {t.firstName} {t.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">{t.email || t.publicId}</p>
                    </div>
                  </div>
                  <StatusBadge status={t.teacherRole ?? "CO_TEACHER"} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Invitation Code</CardTitle>
              <CardDescription>
                Share this code so students in your school can join directly from the Student App.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-primary/30 bg-primary/10 flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Join Code</p>
                  <p className="text-primary mt-0.5 font-mono text-xl font-bold tracking-wider">
                    {joinCode}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(joinCode);
                    toast.success(`Copied join code ${joinCode}`);
                  }}
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/teacher/assignments/new">
                    <Code2 className="size-4" />
                    New Assignment
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/teacher/assessments/new">
                    <ClipboardCheck className="size-4" />
                    New Assessment
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "students" && (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
            <CardDescription>
              Click a student to open their detailed progress profile
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Identity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                      No students enrolled in this section yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((st) => (
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
                        <StatusBadge status={st.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/teacher/students/${st.id}`}>
                            View Progress
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "teachers" && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Teachers</CardTitle>
            <CardDescription>
              Exactly one Primary Teacher and optional Co-Teachers assigned to this section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="border-border bg-secondary/40 flex items-center justify-between rounded-xl border p-3.5"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar firstName={t.firstName} lastName={t.lastName} size="sm" />
                  <div>
                    <p className="font-medium">
                      {t.firstName} {t.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">{t.email || t.publicId}</p>
                  </div>
                </div>
                <StatusBadge status={t.teacherRole ?? "CO_TEACHER"} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "courses" && (
        <Card>
          <CardHeader>
            <CardTitle>Allocated Courses</CardTitle>
            <CardDescription>Courses enabled for this class section</CardDescription>
          </CardHeader>
          <CardContent>
            {!sectionInfo || sectionInfo.courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No section-specific courses allocated yet. Students still have access to Platform
                Free courses.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sectionInfo.courses.map((course) => (
                  <div
                    key={course.id}
                    className="border-border bg-secondary/40 flex items-center justify-between rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="text-muted-foreground text-xs">{course.language}</p>
                    </div>
                    {course.id === "crs-ai-readiness-001" && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/teacher/ai-readiness">Open Lessons</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "assignments" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Coding Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No coding assignments in this section.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-muted-foreground text-xs">
                          Due {formatDate(a.dueDate)} · {a.submissionCount} submitted
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No assessments assigned yet.</p>
              ) : (
                <ul className="divide-border divide-y">
                  {assessments.map((asmt) => (
                    <li key={asmt.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <Link
                          href={`/teacher/assessments/${asmt.id}`}
                          className="hover:text-primary font-medium"
                        >
                          {asmt.title}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {asmt.courseTitle} · {asmt.totalMarks} marks
                        </p>
                      </div>
                      <Badge variant="outline">{asmt.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
