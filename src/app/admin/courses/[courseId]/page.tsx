"use client";

import {
  Archive,
  CalendarClock,
  CheckCircle2,
  GitBranch,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime, formatRelative } from "@/lib/dates";
import { useCourse, useSetCourseStatus } from "@/lib/hooks/use-platform-data";
import { ALLOCATION_SCOPE_LABELS } from "@/lib/labels";
import {
  COURSE_STATUS_LABELS,
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  type CourseAllocationSummary,
  type CourseStatus,
} from "@/types";

function allocationTarget(allocation: CourseAllocationSummary): string {
  if (allocation.scope === "SECTION") {
    return `${allocation.className ?? "Class"} · ${allocation.sectionName ?? "Section"}`;
  }
  if (allocation.scope === "CLASS") return allocation.className ?? "Class";
  return "All classes";
}

const allocationColumns: DataTableColumn<CourseAllocationSummary>[] = [
  {
    id: "target",
    header: "Allocation target",
    meta: { headerClassName: "min-w-[220px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.organizationName}</p>
        <p className="text-muted-foreground truncate text-xs">{allocationTarget(row.original)}</p>
      </div>
    ),
  },
  {
    id: "scope",
    header: "Scope",
    cell: ({ row }) => (
      <Badge variant="outline">{ALLOCATION_SCOPE_LABELS[row.original.scope]}</Badge>
    ),
  },
  {
    id: "students",
    header: "Students",
    meta: { className: "tabular-nums" },
    cell: ({ row }) => row.original.affectedStudentCount,
  },
  {
    id: "dates",
    header: "Schedule",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDate(row.original.startDate)} – {formatDate(row.original.endDate)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function CourseDetailsPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseQuery = useCourse(params.courseId);
  const setStatus = useSetCourseStatus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const data = courseQuery.data;

  if (courseQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (courseQuery.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Course" eyebrow="Course catalog" />
        <div className="surface">
          <ErrorState
            message={getErrorMessage(courseQuery.error)}
            onRetry={() => void courseQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  const lifecycle =
    data.status === "ACTIVE"
      ? {
          label: "Archive course",
          next: "ARCHIVED" as CourseStatus,
          icon: Archive,
          title: "Archive this course?",
          description:
            "Archived courses cannot be edited or newly allocated. Existing allocations remain available for review.",
          tone: "destructive" as const,
        }
      : data.status === "ARCHIVED"
        ? {
            label: "Restore as draft",
            next: "DRAFT" as CourseStatus,
            icon: RotateCcw,
            title: "Restore this course?",
            description: "The course returns to draft, where it can be edited and activated again.",
            tone: "default" as const,
          }
        : {
            label: "Activate course",
            next: "ACTIVE" as CourseStatus,
            icon: CheckCircle2,
            title: "Activate this course?",
            description: "Active courses can be allocated to organizations, classes and sections.",
            tone: "default" as const,
          };
  const LifecycleIcon = lifecycle.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.publicId}
        title={data.title}
        description={`${data.category} · ${LANGUAGE_LABELS[data.language]} · ${DIFFICULTY_LABELS[data.difficulty]}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/courses/${data.id}/edit`}>
                <Pencil className="size-4" />
                Edit course
              </Link>
            </Button>
            <Button
              variant={lifecycle.tone === "destructive" ? "outline" : "default"}
              onClick={() => setConfirmOpen(true)}
            >
              <LifecycleIcon className="size-4" />
              {lifecycle.label}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={data.status} />
        <Badge variant="outline">v{data.version}</Badge>
        <Badge variant="secondary">{LANGUAGE_LABELS[data.language]}</Badge>
        <Badge variant="secondary">{DIFFICULTY_LABELS[data.difficulty]}</Badge>
        <span className="text-muted-foreground text-xs">
          Created {formatDate(data.createdAt)} · Updated {formatRelative(data.updatedAt)}
        </span>
      </div>

      <section aria-label="Course statistics" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Allocations"
          value={data.allocationCount}
          hint="Across every scope"
          icon={CalendarClock}
          tone="violet"
        />
        <StatCard
          label="Student reach"
          value={data.studentReach}
          hint="Active allocations only"
          icon={GraduationCap}
          tone="success"
        />
        <StatCard
          label="Catalog version"
          value={`v${data.version}`}
          hint="Increments on each edit"
          icon={GitBranch}
          tone="info"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Course allocations</CardTitle>
              <CardDescription>
                Organizations, classes and sections that can currently access this course.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/allocations?courseId=${data.id}`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={allocationColumns}
              data={data.allocations}
              onRowClick={(allocation) => router.push(`/admin/allocations/${allocation.id}`)}
              getRowId={(allocation) => allocation.id}
              emptyTitle="Not allocated yet"
              emptyDescription="Allocate this course to an organization, class or section to grant access."
              emptyAction={
                data.status === "ACTIVE" ? (
                  <Button size="sm" asChild>
                    <Link href={`/admin/allocations/new?courseId=${data.id}`}>
                      <Plus className="size-4" />
                      Allocate course
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled>
                    <Plus className="size-4" />
                    Allocate course
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalog details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Description
                </p>
                <p className="text-muted-foreground mt-1 leading-relaxed">{data.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Category
                  </p>
                  <p className="mt-1">{data.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Status
                  </p>
                  <p className="mt-1">{COURSE_STATUS_LABELS[data.status]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Language
                  </p>
                  <p className="mt-1">{LANGUAGE_LABELS[data.language]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Difficulty
                  </p>
                  <p className="mt-1">{DIFFICULTY_LABELS[data.difficulty]}</p>
                </div>
              </div>
              <div className="border-border text-muted-foreground border-t pt-3 text-xs">
                <p>Created {formatDateTime(data.createdAt)}</p>
                <p>Updated {formatDateTime(data.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocate this course</CardTitle>
              <CardDescription>
                Course access is granted through scoped allocations rather than direct assignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.status === "ACTIVE" ? (
                <Button className="w-full" asChild>
                  <Link href={`/admin/allocations/new?courseId=${data.id}`}>
                    <Plus className="size-4" />
                    New allocation
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  <Plus className="size-4" />
                  New allocation
                </Button>
              )}
              {data.status !== "ACTIVE" && (
                <p className="text-muted-foreground text-xs">
                  Activate the course before creating new allocations.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={lifecycle.title}
        description={lifecycle.description}
        confirmLabel={lifecycle.label}
        tone={lifecycle.tone}
        onConfirm={async () => {
          await setStatus.mutateAsync({ id: data.id, status: lifecycle.next });
          toast.success(
            `Course ${lifecycle.next === "ARCHIVED" ? "archived" : lifecycle.next === "ACTIVE" ? "activated" : "restored as draft"}.`,
          );
        }}
      />
    </div>
  );
}
