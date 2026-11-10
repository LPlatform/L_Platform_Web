"use client";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarClock,
  GraduationCap,
  Mail,
  Plus,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { OrganizationDistributionChart, StudentGrowthChart } from "@/components/admin/charts";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/dates";
import {
  useDashboardSummary,
  useOrganizationDistribution,
  useRecentActivity,
  useRecentInvitations,
  useRecentOrganizations,
  useStudentGrowth,
} from "@/lib/hooks/use-platform-data";
import { AUDIT_ACTION_LABELS, ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import { initials } from "@/lib/utils";
import { ROLE_LABELS } from "@/types";

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

export default function DashboardPage() {
  const summary = useDashboardSummary();
  const growth = useStudentGrowth();
  const distribution = useOrganizationDistribution();
  const recentOrganizations = useRecentOrganizations();
  const recentInvitations = useRecentInvitations();
  const recentActivity = useRecentActivity();

  const summaryData = summary.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Platform dashboard"
        description="A live view of organizations, people and course delivery across the platform."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/reports">
                <Activity className="size-4" />
                View reports
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/organizations/new">
                <Plus className="size-4" />
                New organization
              </Link>
            </Button>
          </>
        }
      />

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

      <section
        aria-label="Platform statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Organizations"
          value={summaryData?.activeOrganizations ?? 0}
          hint={`${summaryData?.totalOrganizations ?? 0} registered in total`}
          icon={Building2}
          tone="primary"
          loading={summary.isLoading}
        />
        <StatCard
          label="Students"
          value={summaryData?.totalStudents ?? 0}
          hint={`${summaryData?.totalClasses ?? 0} classes across the platform`}
          icon={GraduationCap}
          tone="success"
          loading={summary.isLoading}
        />
        <StatCard
          label="Teachers"
          value={summaryData?.totalTeachers ?? 0}
          hint={`${summaryData?.totalCourses ?? 0} non-archived courses`}
          icon={Users}
          tone="info"
          loading={summary.isLoading}
        />
        <StatCard
          label="Active allocations"
          value={summaryData?.activeAllocations ?? 0}
          hint={`${summaryData?.pendingInvitations ?? 0} invitations awaiting acceptance`}
          icon={CalendarClock}
          tone="violet"
          loading={summary.isLoading}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Student and teacher growth</CardTitle>
              <CardDescription>Active accounts created over the last nine months.</CardDescription>
            </div>
            <Badge variant="muted" className="shrink-0">
              9 months
            </Badge>
          </CardHeader>
          <CardContent>
            {growth.isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : growth.isError ? (
              <ErrorState
                message={getErrorMessage(growth.error)}
                onRetry={() => void growth.refetch()}
                className="py-10"
              />
            ) : (
              <div>
                <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="bg-chart-1 size-2 rounded-full" aria-hidden />
                    Students
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="bg-chart-2 h-0.5 w-4 rounded-full" aria-hidden />
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
            <CardTitle>Organization distribution</CardTitle>
            <CardDescription>Student and teacher count by organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {distribution.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
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
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Recent organizations</CardTitle>
              <CardDescription>Newest institutions on the platform.</CardDescription>
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
                      className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                    >
                      <span
                        aria-hidden
                        className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
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
              <CardTitle>Recent invitations</CardTitle>
              <CardDescription>Latest onboarding activity.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/invitations">
                View all
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvitations.isLoading ? (
              <ListSkeleton />
            ) : recentInvitations.isError ? (
              <ErrorState
                message={getErrorMessage(recentInvitations.error)}
                onRetry={() => void recentInvitations.refetch()}
                className="py-8"
              />
            ) : recentInvitations.data && recentInvitations.data.length > 0 ? (
              <ul className="divide-border/70 divide-y">
                {recentInvitations.data.map((invitation) => (
                  <li key={invitation.id} className="flex items-start gap-3 py-3">
                    <span
                      aria-hidden
                      className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
                    >
                      <Mail className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{invitation.recipient}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {ROLE_LABELS[invitation.role]}
                        {invitation.organizationName ? ` · ${invitation.organizationName}` : ""}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {formatRelative(invitation.invitedAt)}
                      </p>
                    </div>
                    <StatusBadge status={invitation.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No invitations"
                description="Invitations appear here when people are onboarded."
                icon={Mail}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Administrative changes across the platform.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/audit-logs">
                View log
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
                        {AUDIT_ACTION_LABELS[entry.action].toLowerCase()}
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

      <section aria-label="Quick links" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/admin/users",
            title: "Manage people",
            description: "Administrators, teachers and students.",
            icon: Users,
          },
          {
            href: "/admin/courses",
            title: "Course catalog",
            description: "Author and publish programming courses.",
            icon: BookOpen,
          },
          {
            href: "/admin/classes",
            title: "Academic structure",
            description: "Classes, sections and rosters.",
            icon: UserRound,
          },
          {
            href: "/admin/allocations",
            title: "Allocations",
            description: "Control course access by scope and date.",
            icon: CalendarClock,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="surface group hover:border-primary/40 hover:bg-accent/30 flex items-start gap-3 p-4 transition-colors"
            >
              <span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-medium">
                  {item.title}
                  <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-muted-foreground block text-xs leading-relaxed">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
