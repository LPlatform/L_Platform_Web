"use client";

import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock,
  Mail,
  Pencil,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { PermissionList } from "@/components/admin/permission-list";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/dates";
import {
  useSetAdministratorStatus,
  useSetUserStatus,
  useUser,
} from "@/lib/hooks/use-platform-data";
import { ROLE_LABELS } from "@/types";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default function UserDetailsPage() {
  const params = useParams<{ userId: string }>();
  const user = useUser(params.userId);
  const setUserStatus = useSetUserStatus();
  const setAdministratorStatus = useSetAdministratorStatus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const data = user.data;
  const isActive = data?.status === "ACTIVE";
  const isPlatformAdmin = data?.role === "PLATFORM_ADMIN";
  const isAdministrator = data?.role === "ORGANIZATION_ADMIN";

  if (user.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (user.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="User profile" eyebrow="User management" />
        <div className="surface">
          <ErrorState message={getErrorMessage(user.error)} onRetry={() => void user.refetch()} />
        </div>
      </div>
    );
  }

  async function toggleStatus(target: NonNullable<typeof data>) {
    if (isAdministrator) {
      await setAdministratorStatus.mutateAsync({
        id: target.id,
        status: isActive ? "INACTIVE" : "ACTIVE",
      });
    } else {
      await setUserStatus.mutateAsync({
        id: target.id,
        status: isActive ? "INACTIVE" : "ACTIVE",
      });
    }
    toast.success(isActive ? "Account deactivated." : "Account activated.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.publicId}
        title={`${data.firstName} ${data.lastName}`}
        description={`${ROLE_LABELS[data.role]}${data.organizationName ? ` at ${data.organizationName}` : " · Platform-wide access"}`}
        actions={
          <>
            {!isPlatformAdmin && (
              <Button variant="outline" asChild>
                <Link href={`/admin/users/${data.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit user
                </Link>
              </Button>
            )}
            <Button variant={isActive ? "outline" : "default"} onClick={() => setConfirmOpen(true)}>
              {isActive ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <UserAvatar
                  firstName={data.firstName}
                  lastName={data.lastName}
                  size="lg"
                  className="size-16 text-lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">
                    {data.firstName} {data.lastName}
                  </h2>
                  <p className="text-muted-foreground truncate text-sm">
                    {data.email ?? "No email address"}
                    {data.username ? ` · @${data.username}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{ROLE_LABELS[data.role]}</Badge>
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              </div>

              <dl className="border-border mt-6 grid gap-5 border-t pt-5 sm:grid-cols-2">
                <DetailRow label="Email">
                  {data.email ? (
                    <a
                      href={`mailto:${data.email}`}
                      className="text-primary inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Mail className="size-3.5" aria-hidden />
                      {data.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </DetailRow>
                <DetailRow label="Username">
                  {data.username ? (
                    `@${data.username}`
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </DetailRow>
                <DetailRow label="Public ID">{data.publicId}</DetailRow>
                <DetailRow label="Organization">
                  {data.organizationName && data.organizationId ? (
                    <Link
                      href={`/admin/organizations/${data.organizationId}`}
                      className="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      {data.organizationName}
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  ) : (
                    "Platform-wide"
                  )}
                </DetailRow>
                <DetailRow label="Sections">
                  <span className="inline-flex items-center gap-1.5">
                    <School className="text-muted-foreground size-3.5" aria-hidden />
                    {data.sectionCount} active {data.sectionCount === 1 ? "section" : "sections"}
                  </span>
                </DetailRow>
                <DetailRow label="Last active">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="text-muted-foreground size-3.5" aria-hidden />
                    {formatRelative(data.lastActiveAt)}
                  </span>
                </DetailRow>
                <DetailRow label="Created">{formatDateTime(data.createdAt)}</DetailRow>
                <DetailRow label="Updated">{formatDateTime(data.updatedAt)}</DetailRow>
              </dl>
            </CardContent>
          </Card>

          {isAdministrator && <PermissionList />}

          {isPlatformAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Platform administrator</CardTitle>
                <CardDescription>
                  This account has platform-wide access and is not tied to a single organization.
                  Platform administrator accounts are managed outside organization administration.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
                <ShieldCheck className="size-4" aria-hidden />
                Editing platform administrator details is disabled in this demo.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <UserRound className="text-muted-foreground size-4" aria-hidden />
                <span>{ROLE_LABELS[data.role]}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {data.role === "STUDENT"
                  ? "Students access courses allocated to their section and organization."
                  : data.role === "TEACHER"
                    ? "Teachers support the sections they are assigned to and their allocated courses."
                    : data.role === "ORGANIZATION_ADMIN"
                      ? "Organization administrators manage records scoped to their own organization."
                      : "Platform administrators manage every organization and platform configuration."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account status</CardTitle>
              <CardDescription>
                {isActive
                  ? "The account can sign in and appears in assignment pickers."
                  : "The account is disabled. Historical records remain intact."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={isActive ? "destructive" : "default"}
                className="w-full"
                onClick={() => setConfirmOpen(true)}
              >
                {isActive ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {isActive ? "Deactivate account" : "Activate account"}
              </Button>
            </CardContent>
          </Card>

          {data.organizationId && (
            <Card>
              <CardHeader>
                <CardTitle>Audit history</CardTitle>
                <CardDescription>
                  Changes are recorded in the organization audit log.
                </CardDescription>
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
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? "Deactivate this account?" : "Activate this account?"}
        description={
          isActive
            ? "The user will no longer be able to sign in or be assigned to new sections. They are removed from active assignment lists. This does not delete any records."
            : "The user will regain access according to their role and organization scope."
        }
        confirmLabel={isActive ? "Deactivate account" : "Activate account"}
        tone={isActive ? "destructive" : "default"}
        onConfirm={() => toggleStatus(data)}
      />
    </div>
  );
}
