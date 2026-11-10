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
import { academicYearOptions, formatDate } from "@/lib/dates";
import {
  useClasses,
  useDebouncedValue,
  useOrganizationOptions,
} from "@/lib/hooks/use-platform-data";
import { downloadCsv } from "@/lib/utils";
import type { AcademicClassWithStats, EntityStatus, SelectOption, SortDirection } from "@/types";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const columns: DataTableColumn<AcademicClassWithStats>[] = [
  {
    id: "class",
    header: "Class",
    meta: { sortKey: "name", headerClassName: "min-w-[200px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="text-muted-foreground truncate text-xs">{row.original.publicId}</p>
      </div>
    ),
  },
  {
    id: "organization",
    header: "Organization",
    meta: { sortKey: "organization" },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.organizationName}</span>
    ),
  },
  {
    id: "academicYear",
    header: "Academic year",
    meta: { sortKey: "academicYear" },
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">{row.original.academicYear}</span>
    ),
  },
  {
    id: "sections",
    header: "Sections",
    meta: { sortKey: "sections", className: "tabular-nums" },
    cell: ({ row }) => row.original.sectionCount,
  },
  {
    id: "students",
    header: "Students",
    meta: { sortKey: "students", className: "tabular-nums" },
    cell: ({ row }) => row.original.studentCount,
  },
  {
    id: "teachers",
    header: "Teachers",
    meta: { sortKey: "teachers", className: "tabular-nums" },
    cell: ({ row }) => row.original.teacherCount,
  },
  {
    id: "courses",
    header: "Courses",
    meta: { sortKey: "courses", className: "tabular-nums" },
    cell: ({ row }) => row.original.courseCount,
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

export default function ClassesPage() {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const [search, setSearch] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("name");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  React.useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("organizationId");
    if (value) setOrganizationId(value);
  }, []);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      organizationId: (organizationId || "ALL") as string,
      academicYear: (academicYear || "ALL") as string,
      status: (status || "ALL") as EntityStatus | "ALL",
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, organizationId, academicYear, status, page, pageSize, sortBy, sortDir],
  );

  const classes = useClasses(query);

  const organizationOptions: SelectOption[] = React.useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  );

  const yearOptions: SelectOption[] = React.useMemo(
    () => academicYearOptions().map((year) => ({ value: year, label: year })),
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
      const result = await services.classes.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `classes-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "Class",
          "Organization",
          "Academic year",
          "Sections",
          "Students",
          "Teachers",
          "Courses",
          "Status",
        ],
        result.items.map((academicClass) => [
          academicClass.publicId,
          academicClass.name,
          academicClass.organizationName,
          academicClass.academicYear,
          academicClass.sectionCount,
          academicClass.studentCount,
          academicClass.teacherCount,
          academicClass.courseCount,
          academicClass.status,
        ]),
      );
      toast.success(`Exported ${classes.data?.meta.total ?? result.items.length} classes.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || organizationId || academicYear || status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic structure"
        title="Classes"
        description="Academic classes group sections for an organization and academic year. Open a class to review its sections, students and allocated courses."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button asChild>
              <Link href="/admin/classes/new">
                <Plus className="size-4" />
                New class
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
        searchPlaceholder="Search class name, ID or organization…"
      >
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
        <FilterSelect
          label="Year"
          value={academicYear}
          onChange={(value) => {
            setAcademicYear(value);
            setPage(1);
          }}
          options={yearOptions}
          allLabel="All years"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        data={classes.data?.items ?? []}
        loading={classes.isLoading}
        error={classes.error}
        onRetry={() => void classes.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={(academicClass) => router.push(`/admin/classes/${academicClass.id}`)}
        getRowId={(academicClass) => academicClass.id}
        emptyTitle={hasFilters ? "No matching classes" : "No classes yet"}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Create a class to start building sections for an organization."
        }
        emptyAction={
          <Button asChild size="sm">
            <Link href="/admin/classes/new">
              <Plus className="size-4" />
              New class
            </Link>
          </Button>
        }
        footer={
          classes.data ? (
            <TablePagination
              meta={classes.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="classes"
            />
          ) : undefined
        }
      />
    </div>
  );
}
