"use client";

import { Ban, Download, Mail, MoreHorizontal, Plus, RotateCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { InvitationDialog } from "@/components/admin/invitation-dialog";
import { FilterSelect, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { services, getErrorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/dates";
import {
  useDebouncedValue,
  useInvitations,
  useOrganizationOptions,
  useResendInvitation,
  useRevokeInvitation,
} from "@/lib/hooks/use-platform-data";
import { downloadCsv } from "@/lib/utils";
import {
  ROLE_LABELS,
  type Invitation,
  type InvitationStatus,
  type SelectOption,
  type SortDirection,
  type UserRole,
} from "@/types";

const ROLE_OPTIONS: SelectOption[] = ["ORGANIZATION_ADMIN", "TEACHER", "STUDENT"].map((role) => ({
  value: role,
  label: ROLE_LABELS[role as UserRole],
}));

const STATUS_OPTIONS: SelectOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

function isResendable(invitation: Invitation) {
  return invitation.status === "PENDING" || invitation.status === "EXPIRED";
}

function isRevokable(invitation: Invitation) {
  return invitation.status === "PENDING" || invitation.status === "EXPIRED";
}

export default function InvitationsPage() {
  const organizations = useOrganizationOptions();
  const resendInvitation = useResendInvitation();
  const revokeInvitation = useRevokeInvitation();

  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("invitedAt");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [resendTarget, setResendTarget] = React.useState<Invitation | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<Invitation | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  React.useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("organizationId");
    if (value) setOrganizationId(value);
  }, []);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: (role || "ALL") as UserRole | "ALL",
      status: (status || "ALL") as InvitationStatus | "ALL",
      organizationId: (organizationId || "ALL") as string,
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, role, status, organizationId, page, pageSize, sortBy, sortDir],
  );

  const invitations = useInvitations(query);

  const organizationOptions: SelectOption[] = React.useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  );

  const columns = React.useMemo<DataTableColumn<Invitation>[]>(
    () => [
      {
        id: "recipient",
        header: "Recipient",
        meta: { sortKey: "recipient", headerClassName: "min-w-[220px]" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.recipient}</p>
            <p className="text-muted-foreground truncate text-xs">
              {row.original.channel === "EMAIL" ? "Email" : "Username"} · {row.original.publicId}
            </p>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        meta: { sortKey: "role" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{ROLE_LABELS[row.original.role]}</span>
        ),
      },
      {
        id: "organization",
        header: "Organization",
        meta: { sortKey: "organization" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.organizationName ?? "Platform-wide"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "invited",
        header: "Invited",
        meta: { sortKey: "invitedAt" },
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="text-sm">{formatRelative(row.original.invitedAt)}</p>
            <p className="text-muted-foreground text-xs">
              Last sent {formatRelative(row.original.lastSentAt)}
            </p>
          </div>
        ),
      },
      {
        id: "expires",
        header: "Expires",
        meta: { sortKey: "expiresAt" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            {formatDate(row.original.expiresAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        meta: { headerClassName: "w-12", className: "text-right" },
        cell: ({ row }) => {
          const invitation = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Actions for ${invitation.recipient}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={!isResendable(invitation)}
                    onSelect={() => setResendTarget(invitation)}
                  >
                    <RotateCw />
                    Resend invitation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    destructive
                    disabled={!isRevokable(invitation)}
                    onSelect={() => setRevokeTarget(invitation)}
                  >
                    <Ban />
                    Revoke invitation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.invitations.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `invitations-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "Recipient",
          "Channel",
          "Role",
          "Organization",
          "Status",
          "Invited at",
          "Expires at",
          "Last sent at",
        ],
        result.items.map((invitation) => [
          invitation.publicId,
          invitation.recipient,
          invitation.channel,
          ROLE_LABELS[invitation.role],
          invitation.organizationName ?? "",
          invitation.status,
          invitation.invitedAt,
          invitation.expiresAt,
          invitation.lastSentAt,
        ]),
      );
      toast.success(`Exported ${result.items.length} invitations.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || role || status || organizationId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access requests"
        title="Invitations"
        description="Invitations reserve a seat for an administrator, teacher or student. Records are stored in the backend; email delivery is not configured."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New invitation
            </Button>
          </>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search recipient, organization or ID…"
      >
        <FilterSelect
          label="Role"
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
          options={ROLE_OPTIONS}
          allLabel="All roles"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          allLabel="All statuses"
        />
        <FilterSelect
          label="Organization"
          value={organizationId}
          onChange={(value) => {
            setOrganizationId(value);
            setPage(1);
          }}
          options={organizationOptions}
          allLabel="All organizations"
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        data={invitations.data?.items ?? []}
        loading={invitations.isLoading}
        error={invitations.error}
        onRetry={() => void invitations.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        getRowId={(invitation) => invitation.id}
        emptyTitle={hasFilters ? "No matching invitations" : "No invitations yet"}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Invite the first administrator, teacher or student to an organization."
        }
        emptyAction={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New invitation
          </Button>
        }
        footer={
          invitations.data ? (
            <TablePagination
              meta={invitations.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="invitations"
            />
          ) : undefined
        }
      />

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <Mail className="size-3.5" aria-hidden />
        Invitation records are stored in the backend. Email delivery is not configured.
      </p>

      <InvitationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultOrganizationId={organizationId || undefined}
      />

      <ConfirmDialog
        open={Boolean(resendTarget)}
        onOpenChange={(open) => {
          if (!open) setResendTarget(null);
        }}
        title="Resend invitation?"
        description={
          resendTarget
            ? `A new 7-day window is applied for ${resendTarget.recipient}. Email delivery is disabled in local mode.`
            : undefined
        }
        confirmLabel="Resend invitation"
        onConfirm={async () => {
          if (!resendTarget) return;
          await resendInvitation.mutateAsync(resendTarget.id);
          toast.success("Invitation expiry extended (local mode — email transport disabled).");
          setResendTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke invitation?"
        description={
          revokeTarget
            ? `The invitation for ${revokeTarget.recipient} will no longer be usable. This cannot be undone.`
            : undefined
        }
        confirmLabel="Revoke invitation"
        tone="destructive"
        onConfirm={async () => {
          if (!revokeTarget) return;
          await revokeInvitation.mutateAsync(revokeTarget.id);
          toast.success("Invitation revoked.");
          setRevokeTarget(null);
        }}
      />
    </div>
  );
}
