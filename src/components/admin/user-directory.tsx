"use client";

import { Download, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { CsvImportDialog } from "@/components/admin/csv-import-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FilterSelect, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Button } from "@/components/ui/button";
import { services, getErrorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/dates";
import { useDebouncedValue, useOrganizationOptions, useUsers } from "@/lib/hooks/use-platform-data";
import { downloadCsv } from "@/lib/utils";
import {
  ROLE_LABELS,
  type EntityStatus,
  type SelectOption,
  type SortDirection,
  type UserRole,
  type UserWithOrganization,
} from "@/types";

const ROLE_OPTIONS: SelectOption[] = [
  "PLATFORM_ADMIN",
  "ORGANIZATION_ADMIN",
  "TEACHER",
  "STUDENT",
].map((role) => ({ value: role, label: ROLE_LABELS[role as UserRole] }));

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export interface UserDirectoryProps {
  eyebrow: string;
  title: string;
  description: string;
  fixedRole?: UserRole;
  showRole?: boolean;
  createLabel: string;
  createHref: string;
  allowImport?: boolean;
  emptyTitle?: string;
}

export function UserDirectory({
  eyebrow,
  title,
  description,
  fixedRole,
  showRole = true,
  createLabel,
  createHref,
  allowImport = false,
  emptyTitle = "No users found",
}: UserDirectoryProps) {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("name");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");
  const [importOpen, setImportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  React.useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("organizationId");
    if (value) setOrganizationId(value);
  }, []);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: (fixedRole ?? (role || "ALL")) as UserRole | "ALL",
      status: (status || "ALL") as EntityStatus | "ALL",
      organizationId: (organizationId || "ALL") as string,
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, fixedRole, role, status, organizationId, page, pageSize, sortBy, sortDir],
  );

  const users = useUsers(query);

  const organizationOptions: SelectOption[] = React.useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  );

  const columns = React.useMemo<DataTableColumn<UserWithOrganization>[]>(() => {
    const base: DataTableColumn<UserWithOrganization>[] = [
      {
        id: "person",
        header: "Person",
        meta: { sortKey: "name", headerClassName: "min-w-[220px]" },
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
        meta: { sortKey: "email" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.email ?? "No email"}</p>
            {row.original.username && (
              <p className="text-muted-foreground truncate text-xs">@{row.original.username}</p>
            )}
          </div>
        ),
      },
    ];

    if (showRole) {
      base.push({
        id: "role",
        header: "Role",
        meta: { sortKey: "role" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{ROLE_LABELS[row.original.role]}</span>
        ),
      });
    }

    base.push(
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
        id: "sections",
        header: fixedRole === "TEACHER" ? "Sections taught" : "Sections",
        meta: { className: "tabular-nums" },
        cell: ({ row }) => row.original.sectionCount,
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "lastActive",
        header: "Last active",
        meta: { sortKey: "lastActiveAt" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{formatRelative(row.original.lastActiveAt)}</p>
            <p className="text-muted-foreground text-xs">
              Joined {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
      },
    );

    return base;
  }, [fixedRole, showRole]);

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.users.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `users-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "First name",
          "Last name",
          "Email",
          "Username",
          "Role",
          "Organization",
          "Sections",
          "Status",
          "Created",
        ],
        result.items.map((user) => [
          user.publicId,
          user.firstName,
          user.lastName,
          user.email ?? "",
          user.username ?? "",
          ROLE_LABELS[user.role],
          user.organizationName ?? "",
          user.sectionCount,
          user.status,
          user.createdAt,
        ]),
      );
      toast.success(`Exported ${result.items.length} users.`);
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
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            {allowImport && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Import CSV
              </Button>
            )}
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
            <Button asChild>
              <Link href={createHref}>
                <Plus className="size-4" />
                {createLabel}
              </Link>
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
        searchPlaceholder="Search name, email, username or ID…"
      >
        {!fixedRole && (
          <FilterSelect
            label="Role"
            value={role}
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
          />
        )}
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
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
        data={users.data?.items ?? []}
        loading={users.isLoading}
        error={users.error}
        onRetry={() => void users.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        getRowId={(user) => user.id}
        emptyTitle={hasFilters ? "No matching users" : emptyTitle}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Create an account to add the first person."
        }
        emptyAction={
          <Button asChild size="sm">
            <Link href={createHref}>
              <Plus className="size-4" />
              {createLabel}
            </Link>
          </Button>
        }
        footer={
          users.data ? (
            <TablePagination
              meta={users.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="users"
            />
          ) : undefined
        }
      />

      {allowImport && (
        <CsvImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          defaultOrganizationPublicId={
            organizationId
              ? organizations.data?.find((item) => item.id === organizationId)?.publicId
              : undefined
          }
        />
      )}
    </div>
  );
}
