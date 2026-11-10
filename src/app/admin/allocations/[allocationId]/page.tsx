"use client";

import {
  ArchiveX,
  ArrowUpRight,
  CalendarClock,
  GraduationCap,
  KeyRound,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
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
import { useAllocation, useRevokeAllocation } from "@/lib/hooks/use-platform-data";
import { ALLOCATION_SCOPE_LABELS } from "@/lib/labels";
import { LANGUAGE_LABELS, type CourseAllocationSummary } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function targetNodes(allocation: CourseAllocationSummary) {
  if (allocation.scope === "SECTION" && allocation.sectionId) {
    return (
      <>
        <Link
          href={`/admin/classes/${allocation.classId}`}
          className="text-primary hover:underline"
        >
          {allocation.className ?? "Class"}
        </Link>
        <span className="text-muted-foreground"> · </span>
        <Link
          href={`/admin/sections/${allocation.sectionId}`}
          className="text-primary hover:underline"
        >
          {allocation.sectionName ?? "Section"}
        </Link>
      </>
    );
  }
  if (allocation.scope === "CLASS" && allocation.classId) {
    return (
      <Link href={`/admin/classes/${allocation.classId}`} className="text-primary hover:underline">
        {allocation.className ?? "Class"}
      </Link>
    );
  }
  return <span>All classes in {allocation.organizationName}</span>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default function AllocationDetailsPage() {
  const params = useParams<{ allocationId: string }>();
  const allocationQuery = useAllocation(params.allocationId);
  const revokeAllocation = useRevokeAllocation();
  const [revokeOpen, setRevokeOpen] = React.useState(false);

  const data = allocationQuery.data;
  const isRevoked = Boolean(data?.revokedAt);

  if (allocationQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (allocationQuery.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Course allocation" eyebrow="Course access" />
        <div className="surface">
          <ErrorState
            message={getErrorMessage(allocationQuery.error)}
            onRetry={() => void allocationQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  const scheduleDays = Math.max(
    0,
    Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / DAY_MS),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.publicId}
        title={data.courseTitle}
        description={`${LANGUAGE_LABELS[data.courseLanguage]} · ${data.organizationName} · ${ALLOCATION_SCOPE_LABELS[data.scope]}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/courses/${data.courseId}`}>
                <ArrowUpRight className="size-4" />
                View course
              </Link>
            </Button>
            {!isRevoked && (
              <Button variant="outline" asChild>
                <Link href={`/admin/allocations/${data.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit schedule
                </Link>
              </Button>
            )}
            {!isRevoked && (
              <Button variant="destructive" onClick={() => setRevokeOpen(true)}>
                <ArchiveX className="size-4" />
                Revoke allocation
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={data.status} />
        <Badge variant="outline">{ALLOCATION_SCOPE_LABELS[data.scope]}</Badge>
        <Badge variant={data.accessEnabled ? "success" : "muted"}>
          {data.accessEnabled ? "Access enabled" : "Access off"}
        </Badge>
        <span className="text-muted-foreground text-xs">
          Created {formatDate(data.createdAt)} · Updated {formatRelative(data.updatedAt)}
        </span>
      </div>

      {isRevoked && (
        <div className="rounded-lg border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          This allocation was revoked on {formatDateTime(data.revokedAt)}. Learners no longer
          receive course access from it. Create a new allocation to restore access.
        </div>
      )}

      <section aria-label="Allocation statistics" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Students reached"
          value={data.affectedStudentCount}
          hint="Active learners in scope"
          icon={GraduationCap}
          tone="success"
        />
        <StatCard
          label="Access"
          value={data.accessEnabled ? "Enabled" : "Off"}
          hint="Learner access flag"
          icon={KeyRound}
          tone={data.accessEnabled ? "info" : "warning"}
        />
        <StatCard
          label="Schedule"
          value={`${scheduleDays} days`}
          hint={`${formatDate(data.startDate)} – ${formatDate(data.endDate)}`}
          icon={CalendarClock}
          tone="violet"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Allocation details</CardTitle>
            <CardDescription>
              Course access is scoped to this target for the scheduled window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailRow label="Course">
                <Link
                  href={`/admin/courses/${data.courseId}`}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {data.courseTitle}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </DetailRow>
              <DetailRow label="Organization">
                <Link
                  href={`/admin/organizations/${data.organizationId}`}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {data.organizationName}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </DetailRow>
              <DetailRow label="Scope">{ALLOCATION_SCOPE_LABELS[data.scope]}</DetailRow>
              <DetailRow label="Target">{targetNodes(data)}</DetailRow>
              <DetailRow label="Start date">{formatDate(data.startDate)}</DetailRow>
              <DetailRow label="End date">{formatDate(data.endDate)}</DetailRow>
              <DetailRow label="Access">{data.accessEnabled ? "Granted" : "Withheld"}</DetailRow>
              <DetailRow label="Public ID">{data.publicId}</DetailRow>
              <DetailRow label="Created">{formatDateTime(data.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(data.updatedAt)}</DetailRow>
              {data.revokedAt && (
                <DetailRow label="Revoked">{formatDateTime(data.revokedAt)}</DetailRow>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access enforcement</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm leading-relaxed">
              <p>
                The mock service calculates affected students from the section, class or
                organization scope.
              </p>
              <p>
                These rules are simulated in the browser. A production backend must enforce course
                access on every request.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Allocation changes are recorded in the audit log.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/audit-logs?organizationId=${data.organizationId}`}>
                  Open audit log
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke this course allocation?"
        description="Learners in this scope lose access immediately and the allocation cannot be edited afterwards. The record stays in history. Create a new allocation to restore access."
        confirmLabel="Revoke allocation"
        tone="destructive"
        onConfirm={async () => {
          await revokeAllocation.mutateAsync(data.id);
          toast.success("Course allocation revoked.");
        }}
      />
    </div>
  );
}
