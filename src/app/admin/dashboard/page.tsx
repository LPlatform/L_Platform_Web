"use client";

import { API_BASE as API_BASE_URL } from "@/lib/api/base";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Database,
  GraduationCap,
  Plus,
  RefreshCw,
  Server,
  Terminal,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  DonutDistributionChart,
  OrganizationDistributionChart,
  StudentGrowthChart,
} from "@/components/admin/charts";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { useSession } from "@/components/admin/session-provider";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/dates";
import {
  useDashboardSummary,
  useOrganizationDistribution,
  useRecentActivity,
  useRecentOrganizations,
  useStudentGrowth,
} from "@/lib/hooks/use-platform-data";
import { AUDIT_ACTION_LABELS, ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import { cn, initials } from "@/lib/utils";

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { session } = useSession();
  const summary = useDashboardSummary();
  const growth = useStudentGrowth();
  const distribution = useOrganizationDistribution();
  const recentOrganizations = useRecentOrganizations();
  const recentActivity = useRecentActivity();

  const [health, setHealth] = React.useState<{
    checked: boolean;
    apiUp: boolean;
    dbStatus: string;
  }>({ checked: false, apiUp: false, dbStatus: "checking" });

  React.useEffect(() => {
    let active = true;
    const apiBase = API_BASE_URL;
    fetch(`${apiBase}/ready`, { credentials: "include" })
      .then(async (res) => {
        const payload = (await res.json().catch(() => ({}))) as { database?: string };
        if (active) {
          setHealth({
            checked: true,
            apiUp: res.ok,
            dbStatus: payload.database === "connected" ? "connected" : "unavailable",
          });
        }
      })
      .catch(() => {
        if (active) setHealth({ checked: true, apiUp: false, dbStatus: "unreachable" });
      });
    return () => {
      active = false;
    };
  }, []);

  const summaryData = summary.data;
  const studentSeries = React.useMemo(
    () => (growth.data ?? []).map((pt) => pt.value),
    [growth.data],
  );
  const teacherSeries = React.useMemo(
    () => (growth.data ?? []).map((pt) => pt.secondary ?? 0),
    [growth.data],
  );

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

  const userDonutData = React.useMemo(() => {
    const students = summaryData?.totalStudents ?? 0;
    const teachers = summaryData?.totalTeachers ?? 0;
    return [
      { name: "Students", value: students, color: "#7c3aed" },
      { name: "Teachers", value: teachers, color: "#3b82f6" },
    ];
  }, [summaryData]);

  return (
    <div className="space-y-6">
      {/* Greeting Header Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()}, {session.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here is your live operational overview across L_Platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium">
            <CalendarDays className="text-primary size-4" aria-hidden />
            {todayFormatted}
          </span>
          <Button variant="outline" asChild>
            <Link href="/admin/reports">
              <BarChart3 className="size-4" />
              Reports
            </Link>
          </Button>
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/admin/organizations/new">
              <Plus className="size-4" />
              Create Organization
            </Link>
          </Button>
        </div>
      </div>

      {summary.isError && (
        <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-destructive text-sm font-medium">
              Dashboard data could not be loaded.
            </p>
            <p className="text-muted-foreground text-sm">{getErrorMessage(summary.error)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void summary.refetch()}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <section
        aria-label="Platform statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Organizations"
          value={summaryData?.activeOrganizations ?? 0}
          hint={`${summaryData?.totalOrganizations ?? 0} registered schools`}
          icon={Building2}
          tone="violet"
          loading={summary.isLoading}
        />
        <StatCard
          label="Students"
          value={summaryData?.totalStudents ?? 0}
          hint={`${summaryData?.totalClasses ?? 0} classes across platform`}
          sparkline={studentSeries}
          icon={GraduationCap}
          tone="info"
          loading={summary.isLoading}
        />
        <StatCard
          label="Teachers"
          value={summaryData?.totalTeachers ?? 0}
          hint={`${summaryData?.totalCourses ?? 0} active & draft courses`}
          sparkline={teacherSeries}
          icon={Users}
          tone="success"
          loading={summary.isLoading}
        />
        <StatCard
          label="Course Allocations"
          value={summaryData?.activeAllocations ?? 0}
          hint={`${summaryData?.pendingInvitations ?? 0} pending invitations`}
          icon={CalendarClock}
          tone="warning"
          loading={summary.isLoading}
        />
      </section>

      {/* Main Analytics + Right Quick Actions & Status */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {/* Growth & User Distribution */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Platform Growth</CardTitle>
                  <CardDescription>
                    Student and teacher enrollment trend over the last 9 months.
                  </CardDescription>
                </div>
                <span className="bg-secondary text-muted-foreground rounded-lg px-2.5 py-1 text-xs font-medium">
                  Last 9 Months
                </span>
              </CardHeader>
              <CardContent>
                {growth.isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : growth.isError ? (
                  <ErrorState
                    message={getErrorMessage(growth.error)}
                    onRetry={() => void growth.refetch()}
                    className="py-10"
                  />
                ) : (
                  <div>
                    <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-5 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-violet-500" aria-hidden />
                        Students
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-blue-500" aria-hidden />
                        Teachers
                      </span>
                    </div>
                    <StudentGrowthChart data={growth.data ?? []} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Active learners and instructors by role.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {summary.isLoading ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : (
                  <DonutDistributionChart
                    data={userDonutData}
                    centerValue={(
                      (summaryData?.totalStudents ?? 0) + (summaryData?.totalTeachers ?? 0)
                    ).toLocaleString()}
                    centerLabel="Total Users"
                  />
                )}
              </CardContent>
            </Card>
          </section>

          {/* Bottom Panels: Recent Organizations, Recent Activity, Organization Distribution */}
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle>Recent Organizations</CardTitle>
                  <CardDescription>Institutions active on L_Platform.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/organizations">
                    View all
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrganizations.isLoading ? (
                  <ListSkeleton />
                ) : recentOrganizations.isError ? (
                  <ErrorState
                    message={getErrorMessage(recentOrganizations.error)}
                    onRetry={() => void recentOrganizations.refetch()}
                    className="py-8"
                  />
                ) : recentOrganizations.data && recentOrganizations.data.length > 0 ? (
                  <ul className="divide-border/70 divide-y">
                    {recentOrganizations.data.map((organization) => (
                      <li key={organization.id}>
                        <Link
                          href={`/admin/organizations/${organization.id}`}
                          className="hover:bg-secondary/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
                        >
                          <span
                            aria-hidden
                            className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                          >
                            {initials(organization.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {organization.name}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {ORGANIZATION_TYPE_LABELS[organization.type]} · {organization.city}
                            </span>
                          </span>
                          <StatusBadge status={organization.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No organizations"
                    description="Create the first organization to get started."
                    icon={Building2}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest audit actions across the platform.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/audit-logs">
                    View all
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivity.isLoading ? (
                  <ListSkeleton rows={5} />
                ) : recentActivity.isError ? (
                  <ErrorState
                    message={getErrorMessage(recentActivity.error)}
                    onRetry={() => void recentActivity.refetch()}
                    className="py-8"
                  />
                ) : recentActivity.data && recentActivity.data.length > 0 ? (
                  <ol className="border-border relative space-y-4 border-l pl-4">
                    {recentActivity.data.map((entry) => (
                      <li key={entry.id} className="relative">
                        <span
                          aria-hidden
                          className="bg-primary ring-card absolute top-1.5 -left-[21px] size-2 rounded-full ring-4"
                        />
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{entry.actorName}</span>{" "}
                          <span className="text-muted-foreground">
                            {(AUDIT_ACTION_LABELS[entry.action] ?? entry.action).toLowerCase()}
                          </span>
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {entry.entityLabel} · {formatRelative(entry.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState
                    title="No activity yet"
                    description="Changes will appear here as the platform is used."
                    icon={Activity}
                  />
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Organization Headcount</CardTitle>
              <CardDescription>Student and teacher membership per organization.</CardDescription>
            </CardHeader>
            <CardContent>
              {distribution.isLoading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : distribution.isError ? (
                <ErrorState
                  message={getErrorMessage(distribution.error)}
                  onRetry={() => void distribution.refetch()}
                  className="py-8"
                />
              ) : distribution.data && distribution.data.length > 0 ? (
                <OrganizationDistributionChart data={distribution.data} />
              ) : (
                <EmptyState
                  title="No organizations yet"
                  description="Distribution appears once organizations are registered."
                  icon={Building2}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Utility Rail */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Jump to common administrative tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/admin/organizations/new", label: "Create Organization", icon: Building2 },
                { href: "/admin/users/new", label: "Add User", icon: UserPlus },
                { href: "/admin/classes", label: "Manage Classes", icon: GraduationCap },
                { href: "/admin/courses", label: "Course Catalog", icon: BookOpen },
                { href: "/admin/assessments", label: "Assessments", icon: ClipboardCheck },
                { href: "/admin/assignments", label: "Assignments", icon: Code2 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-border bg-secondary/50 hover:border-primary/40 hover:bg-secondary flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="text-primary size-4" aria-hidden />
                      <span>{item.label}</span>
                    </span>
                    <ArrowUpRight className="text-muted-foreground size-3.5" aria-hidden />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">System Status</CardTitle>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    health.apiUp
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-300",
                  )}
                >
                  <CheckCircle2 className="size-3" aria-hidden />
                  {health.checked ? (health.apiUp ? "Online" : "Degraded") : "Checking..."}
                </span>
              </div>
              <CardDescription>Live backend & persistence checks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="border-border bg-secondary/40 flex items-center justify-between rounded-xl border px-3 py-2.5">
                <span className="flex items-center gap-2 font-medium">
                  <Server className="text-primary size-3.5" aria-hidden />
                  Backend API
                </span>
                <span className={health.apiUp ? "text-emerald-400" : "text-amber-300"}>
                  {health.checked ? (health.apiUp ? "Operational" : "Offline") : "Checking..."}
                </span>
              </div>
              <div className="border-border bg-secondary/40 flex items-center justify-between rounded-xl border px-3 py-2.5">
                <span className="flex items-center gap-2 font-medium">
                  <Database className="size-3.5 text-blue-400" aria-hidden />
                  PostgreSQL
                </span>
                <span
                  className={
                    health.dbStatus === "connected" ? "text-emerald-400" : "text-amber-300"
                  }
                >
                  {health.dbStatus}
                </span>
              </div>
              <div className="border-border bg-secondary/40 flex items-center justify-between rounded-xl border px-3 py-2.5">
                <span className="flex items-center gap-2 font-medium">
                  <Terminal className="size-3.5 text-amber-400" aria-hidden />
                  Code Evaluator
                </span>
                <span className="text-muted-foreground">Queue / Worker</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
