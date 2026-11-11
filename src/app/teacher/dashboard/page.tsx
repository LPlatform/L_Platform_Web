"use client";

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { useSession } from "@/components/admin/session-provider";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { backendRequest } from "@/lib/api/client";
import { formatRelative } from "@/lib/dates";

type TeacherSummary = {
  assignedSectionsCount: number;
  assignedStudentCount: number;
  activeAssignmentsCount: number;
  totalSubmissionsCount: number;
};

type LearningClass = {
  id: string;
  joinCode: string;
  sectionName: string;
  className: string;
  academicYear: string;
  studentCount: number;
  maxStudents: number;
  teachers: Array<{ id: string; name: string; teacherRole: "PRIMARY" | "CO_TEACHER" }>;
  courses: Array<{ id: string; title: string }>;
};

type RecentSubmission = {
  id: string;
  studentName?: string;
  questionTitle?: string;
  language?: string;
  status?: string;
  submittedAt?: string;
};

type PendingReview = {
  attemptId: string;
  assessmentTitle: string;
  answerId: string;
  maxMarks: number;
};

export default function TeacherDashboardPage() {
  const { session } = useSession();
  const [summary, setSummary] = React.useState<TeacherSummary | null>(null);
  const [classes, setClasses] = React.useState<LearningClass[]>([]);
  const [submissions, setSubmissions] = React.useState<RecentSubmission[]>([]);
  const [reviews, setReviews] = React.useState<PendingReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      backendRequest<TeacherSummary>("/api/dashboard/teacher"),
      backendRequest<{ items: LearningClass[] }>("/api/learning/classes").catch(() => ({
        items: [],
      })),
      backendRequest<{ items: RecentSubmission[] }>("/api/submissions?page=1&pageSize=5").catch(
        () => ({ items: [] }),
      ),
      backendRequest<PendingReview[]>("/api/teacher/assessment-reviews").catch(() => []),
    ])
      .then(([sum, cls, subs, revs]) => {
        if (!active) return;
        setSummary(sum);
        setClasses(cls.items ?? []);
        setSubmissions(subs.items ?? []);
        setReviews(Array.isArray(revs) ? revs : []);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load teacher dashboard");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const todayFormatted = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {session.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your classes, coding assignments, written assessments, and AI Readiness lessons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium">
            <CalendarDays className="text-primary size-4" aria-hidden />
            {todayFormatted}
          </span>
          <Button variant="outline" asChild>
            <Link href="/teacher/assessments/new">
              <ClipboardCheck className="size-4" />
              New Assessment
            </Link>
          </Button>
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/assignments/new">
              <Plus className="size-4" />
              New Assignment
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <section
        aria-label="Teaching statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="My Classes & Sections"
          value={summary?.assignedSectionsCount ?? 0}
          hint="Active teaching assignments"
          icon={Users}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Enrolled Students"
          value={summary?.assignedStudentCount ?? 0}
          hint="Students across your sections"
          icon={GraduationCap}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Active Assignments"
          value={summary?.activeAssignmentsCount ?? 0}
          hint="Published coding problem sets"
          icon={Code2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Submissions & Reviews"
          value={summary?.totalSubmissionsCount ?? 0}
          hint={`${reviews.length} written answers awaiting review`}
          icon={CheckCircle2}
          tone="warning"
          loading={loading}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>My Classes & Sections</CardTitle>
              <CardDescription>
                Active classes where you serve as Primary Teacher or Co-Teacher
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher/sections">
                View all
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <EmptyState
                title="No classes assigned yet"
                description="Ask your organization administrator to assign you to a class section."
                icon={Users}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {classes.slice(0, 4).map((cls) => {
                  const myRole =
                    cls.teachers.find((t) => t.id === session.userId)?.teacherRole ?? "CO_TEACHER";
                  return (
                    <div
                      key={cls.id}
                      className="border-border bg-secondary/40 hover:border-primary/40 flex flex-col justify-between rounded-xl border p-4 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/teacher/sections/${cls.id}`}
                            className="hover:text-primary font-semibold transition-colors"
                          >
                            {cls.className} · {cls.sectionName}
                          </Link>
                          <StatusBadge status={myRole} />
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {cls.studentCount} / {cls.maxStudents} students · {cls.courses.length}{" "}
                          course(s)
                        </p>
                      </div>
                      <div className="border-border/60 mt-4 flex items-center justify-between border-t pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(cls.joinCode);
                            toast.success(`Copied class join code ${cls.joinCode}`);
                          }}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs"
                        >
                          <Copy className="size-3" />
                          {cls.joinCode}
                        </button>
                        <Link
                          href={`/teacher/sections/${cls.id}`}
                          className="text-primary text-xs font-medium hover:underline"
                        >
                          Open class →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Pending Rubric Grading</CardTitle>
                <CardDescription>Written answers waiting for manual review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/teacher/assessments">
                  Assessments
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  All submitted assessments are reviewed.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {reviews.slice(0, 4).map((rev) => (
                    <li
                      key={rev.answerId}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{rev.assessmentTitle}</p>
                        <p className="text-muted-foreground text-xs">Max marks: {rev.maxMarks}</p>
                      </div>
                      <Badge variant="warning">Review</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5">
              {[
                { href: "/teacher/ai-readiness", label: "Lesson Manager", icon: Sparkles },
                { href: "/teacher/questions/new", label: "Add Question", icon: Code2 },
                { href: "/teacher/courses", label: "Course Catalog", icon: BookOpen },
                { href: "/teacher/submissions", label: "Submissions", icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-border bg-secondary/50 hover:border-primary/40 flex items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors"
                  >
                    <Icon className="text-primary size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2">
          <div>
            <CardTitle>Recent Coding Submissions</CardTitle>
            <CardDescription>Latest student work across your assigned sections</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/submissions">
              Review all
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No coding submissions recorded yet.</p>
          ) : (
            <ul className="divide-border divide-y">
              {submissions.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {sub.studentName ?? "Student"} — {sub.questionTitle ?? "Problem"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {sub.language ?? "Code"} ·{" "}
                      {sub.submittedAt ? formatRelative(sub.submittedAt) : "Recently"}
                    </p>
                  </div>
                  <StatusBadge status={sub.status ?? "PENDING"} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
