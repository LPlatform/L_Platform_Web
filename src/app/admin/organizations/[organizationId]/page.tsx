"use client";

import {
  ArrowUpRight,
  Ban,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ScrollText,
  ShieldCheck,
  Users,
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
import { formatDate, formatRelative } from "@/lib/dates";
import {
  useAuditLogs,
  useOrganization,
  useSetOrganizationStatus,
} from "@/lib/hooks/use-platform-data";
import { AUDIT_ACTION_LABELS, ORGANIZATION_TYPE_LABELS } from "@/lib/labels";

export default function OrganizationDetailsPage() {
  const params = useParams<{ organizationId: string }>();
  const organization = useOrganization(params.organizationId);
  const audit = useAuditLogs({
    organizationId: params.organizationId,
    page: 1,
    pageSize: 6,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const setStatus = useSetOrganizationStatus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const data = organization.data;
  const isActive = data?.status === "ACTIVE";

  if (organization.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (organization.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organization" eyebrow="Organization management" />
        <div className="surface">
          <ErrorState
            message={getErrorMessage(organization.error)}
            onRetry={() => void organization.refetch()}
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
        description={`${ORGANIZATION_TYPE_LABELS[data.type]} · ${data.city}, ${data.state}, ${data.country}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/organizations/${data.id}/edit`}>
                <Pencil className="size-4" />
                Edit details
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
        <Badge variant="outline">{ORGANIZATION_TYPE_LABELS[data.type]}</Badge>
        <span className="text-muted-foreground text-xs">
          Created {formatDate(data.createdAt)} · Updated {formatRelative(data.updatedAt)}
        </span>
      </div>

      <section
        aria-label="Organization statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Students"
          value={data.stats.studentCount}
          hint="Active learners"
          icon={GraduationCap}
          tone="success"
        />
        <StatCard
          label="Teachers"
          value={data.stats.teacherCount}
          hint="Teaching accounts"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Classes"
          value={data.stats.classCount}
          hint={`${data.stats.courseCount} allocated courses`}
          icon={BookOpen}
          tone="violet"
        />
        <StatCard
          label="Administrators"
          value={data.stats.administratorCount}
          hint="Organization admins"
          icon={ShieldCheck}
          tone="primary"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Primary contact</CardTitle>
              <CardDescription>Point of contact for this institution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Contact
                </p>
                <p className="mt-1 font-medium">{data.contactName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <a
                  href={`mailto:${data.contactEmail}`}
                  className="text-primary truncate hover:underline"
                >
                  {data.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span>{data.phone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 text-sm">
              <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <address className="text-muted-foreground leading-relaxed not-italic">
                {data.address}
                <br />
                {data.city}, {data.state} {data.postalCode}
                <br />
                {data.country}
              </address>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick access</CardTitle>
              <CardDescription>Scoped administration for this organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  href: `/admin/users?organizationId=${data.id}`,
                  label: "People",
                  description: "Members and invitations",
                  icon: Users,
                },
                {
                  href: `/admin/classes?organizationId=${data.id}`,
                  label: "Classes",
                  description: "Academic structure",
                  icon: BookOpen,
                },
                {
                  href: `/admin/allocations?organizationId=${data.id}`,
                  label: "Allocations",
                  description: "Course access and schedules",
                  icon: CalendarClock,
                },
                {
                  href: `/admin/audit-logs?organizationId=${data.id}`,
                  label: "Audit log",
                  description: "Full change history",
                  icon: ScrollText,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group hover:bg-muted/60 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                  >
                    <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="text-muted-foreground block text-xs">
                        {item.description}
                      </span>
                    </span>
                    <ArrowUpRight className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest audited changes for this organization.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/audit-logs?organizationId=${data.id}`}>
                Full log
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {audit.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <Skeleton className="size-2 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : audit.isError ? (
              <ErrorState
                message={getErrorMessage(audit.error)}
                onRetry={() => void audit.refetch()}
                className="py-10"
              />
            ) : audit.data && audit.data.items.length > 0 ? (
              <ol className="border-border relative space-y-5 border-l pl-5">
                {audit.data.items.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden
                      className="bg-primary ring-card absolute top-1.5 -left-[25px] size-2 rounded-full ring-4"
                    />
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{entry.actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {AUDIT_ACTION_LABELS[entry.action].toLowerCase()}
                      </span>{" "}
                      <span className="font-medium">{entry.entityLabel}</span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatRelative(entry.createdAt)} · {entry.correlationId}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No audited activity for this organization yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? "Deactivate organization?" : "Activate organization?"}
        description={
          isActive
            ? "Inactive organizations cannot receive new users, classes or allocations. Existing records remain available for review."
            : "Activating the organization allows new users, classes and course allocations to be created."
        }
        confirmLabel={isActive ? "Deactivate organization" : "Activate organization"}
        tone={isActive ? "destructive" : "default"}
        onConfirm={async () => {
          await setStatus.mutateAsync({
            id: data.id,
            status: isActive ? "INACTIVE" : "ACTIVE",
          });
          toast.success(isActive ? "Organization deactivated." : "Organization activated.");
        }}
      />
    </div>
  );
}
