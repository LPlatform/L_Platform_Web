"use client";

import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FilterSelect, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";
import { services, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { useDebouncedValue, useOrganizations } from "@/lib/hooks/use-platform-data";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import { downloadCsv } from "@/lib/utils";
import type { OrganizationType, OrganizationWithStats, SelectOption, SortDirection } from "@/types";

const TYPE_OPTIONS: SelectOption[] = Object.entries(ORGANIZATION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const columns: DataTableColumn<OrganizationWithStats>[] = [
  {
    id: "organization",
    header: "Organization",
    meta: { sortKey: "name", headerClassName: "min-w-[240px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {row.original.publicId} · {row.original.slug}
        </p>
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    meta: { sortKey: "type" },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {ORGANIZATION_TYPE_LABELS[row.original.type]}
      </span>
    ),
  },
  {
    id: "location",
    header: "Location",
    meta: { sortKey: "city" },
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.city}</p>
        <p className="text-muted-foreground text-xs">{row.original.state}</p>
      </div>
    ),
  },
  {
    id: "students",
    header: "Students",
    meta: { sortKey: "students", className: "tabular-nums" },
    cell: ({ row }) => row.original.stats.studentCount,
  },
  {
    id: "teachers",
    header: "Teachers",
    meta: { sortKey: "teachers", className: "tabular-nums" },
    cell: ({ row }) => row.original.stats.teacherCount,
  },
  {
    id: "classes",
    header: "Classes",
    meta: { sortKey: "classes", className: "tabular-nums" },
    cell: ({ row }) => row.original.stats.classCount,
  },
  {
    id: "status",
    header: "Status",
    meta: { sortKey: "status" },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "createdAt",
    header: "Created",
    meta: { sortKey: "createdAt" },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

export default function OrganizationsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [type, setType] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("createdAt");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: (status || "ALL") as "ACTIVE" | "INACTIVE" | "ALL",
      type: (type || "ALL") as OrganizationType | "ALL",
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, status, type, page, pageSize, sortBy, sortDir],
  );

  const organizations = useOrganizations(query);

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.organizations.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `organizations-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "Name",
          "Slug",
          "Type",
          "Contact",
          "Email",
          "City",
          "State",
          "Students",
          "Teachers",
          "Classes",
          "Status",
        ],
        result.items.map((organization) => [
          organization.publicId,
          organization.name,
          organization.slug,
          ORGANIZATION_TYPE_LABELS[organization.type],
          organization.contactName,
          organization.contactEmail,
          organization.city,
          organization.state,
          organization.stats.studentCount,
          organization.stats.teacherCount,
          organization.stats.classCount,
          organization.status,
        ]),
      );
      toast.success(`Exported ${result.items.length} organizations.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization management"
        title="Organizations"
        description="Institutions that deliver courses through the platform. Select an organization to review its people, classes and activity."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export CSV"}
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

      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search name, contact, city or slug…"
      >
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
        <FilterSelect
          label="Type"
          value={type}
          onChange={(value) => {
            setType(value);
            setPage(1);
          }}
          options={TYPE_OPTIONS}
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        data={organizations.data?.items ?? []}
        loading={organizations.isLoading}
        error={organizations.error}
        onRetry={() => void organizations.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={(organization) => router.push(`/admin/organizations/${organization.id}`)}
        getRowId={(organization) => organization.id}
        emptyTitle={search || status || type ? "No matching organizations" : "No organizations yet"}
        emptyDescription={
          search || status || type
            ? "Adjust the search terms or filters and try again."
            : "Create the first organization to begin onboarding people."
        }
        emptyAction={
          <Button asChild size="sm">
            <Link href="/admin/organizations/new">
              <Plus className="size-4" />
              New organization
            </Link>
          </Button>
        }
        footer={
          organizations.data ? (
            <TablePagination
              meta={organizations.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="organizations"
            />
          ) : undefined
        }
      />
    </div>
  );
}
