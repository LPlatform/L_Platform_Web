"use client";

import {
  Archive,
  ArrowUpRight,
  GraduationCap,
  Pencil,
  RotateCcw,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import {
  AssignStudentsDialog,
  AssignTeachersDialog,
  BulkStudentImportDialog,
} from "@/components/admin/section-roster-dialogs";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/dates";
import {
  useAssignStudents,
  useAssignTeachers,
  useRemoveStudent,
  useRemoveTeacher,
  useSection,
  useSectionRoster,
  useSetSectionStatus,
} from "@/lib/hooks/use-platform-data";
import type { UserWithOrganization } from "@/types";

type RemoveTarget = {
  kind: "STUDENT" | "TEACHER";
  id: string;
  name: string;
};

export default function SectionDetailsPage() {
  const params = useParams<{ sectionId: string }>();
  const router = useRouter();
  const sectionQuery = useSection(params.sectionId);
  const roster = useSectionRoster(params.sectionId);
  const setStatus = useSetSectionStatus();
  const assignStudents = useAssignStudents(params.sectionId);
  const assignTeachers = useAssignTeachers(params.sectionId);
  const removeStudent = useRemoveStudent(params.sectionId);
  const removeTeacher = useRemoveTeacher(params.sectionId);

  const [studentsOpen, setStudentsOpen] = React.useState(false);
  const [teachersOpen, setTeachersOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<RemoveTarget | null>(null);

  const data = sectionQuery.data;
  const isArchived = data?.status === "ARCHIVED";
  const students = roster.data?.students ?? [];
  const teachers = roster.data?.teachers ?? [];
  const capacity = roster.data?.capacity ?? 60;
  const studentCount = students.length || data?.studentCount || 0;
  const capacityPercent = Math.min(100, Math.round((studentCount / capacity) * 100));

  const studentColumns = React.useMemo<DataTableColumn<UserWithOrganization>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        meta: { headerClassName: "min-w-[200px]" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate font-medium">
                {row.original.firstName} {row.original.lastName}
              </p>
              <p className="text-muted-foreground truncate text-xs">{row.original.publicId}</p>
            </div>
          </div>
        ),
      },
      {
        id: "identity",
        header: "Identity",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.email ?? "No email"}</p>
            {row.original.username && (
              <p className="text-muted-foreground truncate text-xs">@{row.original.username}</p>
            )}
          </div>
        ),
      },
      {
        id: "sections",
        header: "Sections",
        meta: { className: "tabular-nums" },
        cell: ({ row }) => row.original.sectionCount,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        meta: { className: "w-12 text-right" },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${row.original.firstName} ${row.original.lastName} from this section`}
            disabled={isArchived}
            onClick={(event) => {
              event.stopPropagation();
              setRemoveTarget({
                kind: "STUDENT",
                id: row.original.id,
                name: `${row.original.firstName} ${row.original.lastName}`,
              });
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <X className="size-4" />
          </Button>
        ),
      },
    ],
    [isArchived],
  );

  if (sectionQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (sectionQuery.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Section" eyebrow="Academic structure" />
        <div className="surface">
          <ErrorState
            message={getErrorMessage(sectionQuery.error)}
            onRetry={() => void sectionQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.publicId}
        title={data.name}
        description={`${data.className} · ${data.organizationName}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/sections/${data.id}/edit`}>
                <Pencil className="size-4" />
                Edit section
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setArchiveOpen(true)}>
              {isArchived ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
              {isArchived ? "Restore section" : "Archive section"}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={data.status} />
        {data.joinCode && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(data.joinCode || "");
              toast.success(`Copied join code ${data.joinCode}`);
            }}
            className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold transition-colors"
            title="Click to copy student join code"
          >
            Join code: {data.joinCode}
          </button>
        )}
        <Link
          href={`/admin/classes/${data.classId}`}
          className="text-primary text-sm font-medium hover:underline"
        >
          {data.className}
        </Link>
        <Link
          href={`/admin/organizations/${data.organizationId}`}
          className="text-muted-foreground hover:text-foreground text-sm hover:underline"
        >
          {data.organizationName}
        </Link>
        <span className="text-muted-foreground text-xs">
          Created {formatDate(data.createdAt)} · Updated {formatRelative(data.updatedAt)}
        </span>
      </div>

      {isArchived && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          This section is archived. Roster changes are disabled until it is restored, and archived
          sections cannot receive course allocations.
        </div>
      )}

      <section aria-label="Section statistics" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Students"
          value={studentCount}
          hint={`${Math.max(capacity - studentCount, 0)} seats available`}
          icon={GraduationCap}
          tone="success"
        />
        <StatCard
          label="Teachers"
          value={teachers.length || data.teacherCount}
          hint="Assigned to this section"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Roster capacity"
          value={capacity}
          hint="Maximum students in this section"
          icon={Users}
          tone="violet"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Students must belong to the organization and may join one section per class.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isArchived}
                title={isArchived ? "Restore the section to change the roster." : undefined}
                onClick={() => setBulkOpen(true)}
              >
                <Upload className="size-4" />
                Bulk CSV
              </Button>
              <Button
                size="sm"
                disabled={isArchived}
                title={isArchived ? "Restore the section to change the roster." : undefined}
                onClick={() => setStudentsOpen(true)}
              >
                <UserPlus className="size-4" />
                Assign students
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                  {studentCount} of {capacity} seats filled
                </span>
                <span>{capacityPercent}%</span>
              </div>
              <div
                className="bg-muted h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={studentCount}
                aria-valuemin={0}
                aria-valuemax={capacity}
                aria-label="Section roster capacity"
              >
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>

            <DataTable
              columns={studentColumns}
              data={students}
              loading={roster.isLoading}
              error={roster.error}
              onRetry={() => void roster.refetch()}
              onRowClick={(student) => router.push(`/admin/users/${student.id}`)}
              getRowId={(student) => student.id}
              emptyTitle="No students assigned"
              emptyDescription="Assign students individually or import a CSV of emails and usernames."
              emptyAction={
                <Button size="sm" disabled={isArchived} onClick={() => setStudentsOpen(true)}>
                  <UserPlus className="size-4" />
                  Assign students
                </Button>
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Teachers</CardTitle>
                <CardDescription>Staff teaching this section.</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isArchived}
                onClick={() => setTeachersOpen(true)}
              >
                <UserPlus className="size-4" />
                Assign
              </Button>
            </CardHeader>
            <CardContent>
              {roster.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : roster.isError ? (
                <ErrorState
                  message={getErrorMessage(roster.error)}
                  onRetry={() => void roster.refetch()}
                  className="py-8"
                />
              ) : teachers.length === 0 ? (
                <EmptyState
                  title="No teachers assigned"
                  description="Assign at least one teacher to the section."
                  className="py-8"
                />
              ) : (
                <ul className="divide-border/70 divide-y">
                  {teachers.map((teacher) => (
                    <li
                      key={teacher.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <UserAvatar
                        firstName={teacher.firstName}
                        lastName={teacher.lastName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          {teacher.teacherRole && <StatusBadge status={teacher.teacherRole} />}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">
                          {teacher.email ??
                            (teacher.username ? `@${teacher.username}` : teacher.publicId)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${teacher.firstName} ${teacher.lastName} from this section`}
                        disabled={isArchived}
                        onClick={() =>
                          setRemoveTarget({
                            kind: "TEACHER",
                            id: teacher.id,
                            name: `${teacher.firstName} ${teacher.lastName}`,
                          })
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Description
                </p>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  {data.description || "No description has been added for this section."}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Class
                </p>
                <Link
                  href={`/admin/classes/${data.classId}`}
                  className="text-primary mt-1 inline-flex items-center gap-1 hover:underline"
                >
                  {data.className}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Organization
                </p>
                <Link
                  href={`/admin/organizations/${data.organizationId}`}
                  className="text-primary mt-1 inline-flex items-center gap-1 hover:underline"
                >
                  {data.organizationName}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{data.publicId}</Badge>
                <Badge variant={isArchived ? "muted" : "success"}>
                  {isArchived ? "Archived" : "Accepting assignments"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {studentsOpen && (
        <AssignStudentsDialog
          open={studentsOpen}
          onOpenChange={setStudentsOpen}
          organizationId={data.organizationId}
          currentIds={students.map((student) => student.id)}
          onAssign={(ids) => assignStudents.mutateAsync(ids)}
        />
      )}

      {teachersOpen && (
        <AssignTeachersDialog
          open={teachersOpen}
          onOpenChange={setTeachersOpen}
          organizationId={data.organizationId}
          currentIds={teachers.map((teacher) => teacher.id)}
          onAssign={(ids) => assignTeachers.mutateAsync(ids)}
        />
      )}

      {bulkOpen && (
        <BulkStudentImportDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          sectionId={data.id}
          organizationId={data.organizationId}
        />
      )}

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? "Restore this section?" : "Archive this section?"}
        description={
          isArchived
            ? "Restoring the section allows new students and teachers to be assigned again."
            : "Archived sections cannot receive students, teachers or new course allocations. Existing records remain available."
        }
        confirmLabel={isArchived ? "Restore section" : "Archive section"}
        tone={isArchived ? "default" : "destructive"}
        onConfirm={async () => {
          await setStatus.mutateAsync({
            id: data.id,
            status: isArchived ? "ACTIVE" : "ARCHIVED",
          });
          toast.success(isArchived ? "Section restored." : "Section archived.");
        }}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title={`Remove ${removeTarget?.name ?? "person"}?`}
        description="The person is removed from this section only. Their account and other assignments are not affected."
        confirmLabel="Remove"
        tone="destructive"
        onConfirm={async () => {
          if (!removeTarget) return;
          if (removeTarget.kind === "STUDENT") {
            await removeStudent.mutateAsync(removeTarget.id);
          } else {
            await removeTeacher.mutateAsync(removeTarget.id);
          }
          toast.success(
            removeTarget.kind === "STUDENT"
              ? "Student removed from the section."
              : "Teacher removed from the section.",
          );
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}
