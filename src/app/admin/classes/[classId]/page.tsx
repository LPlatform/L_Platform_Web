"use client";

import {
  Ban,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Users,
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
import { formatDate, formatRelative } from "@/lib/dates";
import { useClass, useSections, useSetClassStatus } from "@/lib/hooks/use-platform-data";
import type { SectionWithStats } from "@/types";

const sectionColumns: DataTableColumn<SectionWithStats>[] = [
  {
    id: "section",
    header: "Section",
    meta: { headerClassName: "min-w-[180px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="text-muted-foreground truncate text-xs">{row.original.publicId}</p>
      </div>
    ),
  },
  {
    id: "students",
    header: "Students",
    meta: { className: "tabular-nums" },
    cell: ({ row }) => row.original.studentCount,
  },
  {
    id: "teachers",
    header: "Teachers",
    meta: { className: "tabular-nums" },
    cell: ({ row }) => row.original.teacherCount,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

export default function ClassDetailsPage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const classQuery = useClass(params.classId);
  const sections = useSections({
    classId: params.classId,
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDir: "asc",
  });
  const setStatus = useSetClassStatus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const data = classQuery.data;
  const isActive = data?.status === "ACTIVE";

  if (classQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (classQuery.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class" eyebrow="Academic structure" />
        <div className="surface">
          <ErrorState
            message={getErrorMessage(classQuery.error)}
            onRetry={() => void classQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  async function toggleStatus(target: NonNullable<typeof data>) {
    await setStatus.mutateAsync({
      id: target.id,
      status: isActive ? "INACTIVE" : "ACTIVE",
    });
    toast.success(isActive ? "Class deactivated." : "Class activated.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.publicId}
        title={data.name}
        description={`${data.organizationName} · Academic year ${data.academicYear}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/classes/${data.id}/edit`}>
                <Pencil className="size-4" />
                Edit class
              </Link>
            </Button>
            <Button variant={isActive ? "outline" : "default"} onClick={() => setConfirmOpen(true)}>
              {isActive ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={data.status} />
        <Badge variant="outline">{data.academicYear}</Badge>
        <Link
          href={`/admin/organizations/${data.organizationId}`}
          className="text-primary text-sm hover:underline"
        >
          {data.organizationName}
        </Link>
        <span className="text-muted-foreground text-xs">
          Created {formatDate(data.createdAt)} · Updated {formatRelative(data.updatedAt)}
        </span>
      </div>

      <section aria-label="Class statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sections"
          value={data.sectionCount}
          hint="Groups in this class"
          icon={Layers}
        />
        <StatCard
          label="Students"
          value={data.studentCount}
          hint="Active across sections"
          icon={GraduationCap}
          tone="success"
        />
        <StatCard
          label="Teachers"
          value={data.teacherCount}
          hint="Assigned to sections"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Courses"
          value={data.courseCount}
          hint="Allocated to this class"
          icon={BookOpen}
          tone="violet"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Class details</CardTitle>
            <CardDescription>Academic identity and organization scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Description
              </p>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                {data.description || "No description has been added for this class."}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Organization
              </p>
              <Link
                href={`/admin/organizations/${data.organizationId}`}
                className="text-primary mt-1 inline-block hover:underline"
              >
                {data.organizationName}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Academic year
              </p>
              <p className="mt-1">{data.academicYear}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Quick links
              </p>
              <div className="mt-1 flex flex-col gap-1">
                <Link
                  href={`/admin/users?organizationId=${data.organizationId}`}
                  className="text-primary hover:underline"
                >
                  Organization people
                </Link>
                <Link
                  href={`/admin/allocations?organizationId=${data.organizationId}`}
                  className="text-primary hover:underline"
                >
                  Course allocations
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Sections</CardTitle>
              <CardDescription>
                Sections split this class into groups for roster and allocation management.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/sections?classId=${data.id}`}>View all</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/admin/sections/new?classId=${data.id}`}>
                  <Plus className="size-4" />
                  Add section
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={sectionColumns}
              data={sections.data?.items ?? []}
              loading={sections.isLoading}
              error={sections.error}
              onRetry={() => void sections.refetch()}
              emptyTitle="No sections yet"
              emptyDescription="Add a section so students and teachers can be assigned."
              emptyAction={
                <Button size="sm" asChild>
                  <Link href={`/admin/sections/new?classId=${data.id}`}>
                    <Plus className="size-4" />
                    Add section
                  </Link>
                </Button>
              }
              onRowClick={(section) => router.push(`/admin/sections/${section.id}`)}
              getRowId={(section) => section.id}
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? "Deactivate this class?" : "Activate this class?"}
        description={
          isActive
            ? "Inactive classes cannot receive new sections. Existing sections, rosters and course allocations remain available."
            : "Activating the class allows new sections to be created. The organization must be active."
        }
        confirmLabel={isActive ? "Deactivate class" : "Activate class"}
        tone={isActive ? "destructive" : "default"}
        onConfirm={() => toggleStatus(data)}
      />
    </div>
  );
}
