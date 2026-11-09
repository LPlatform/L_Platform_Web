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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { services, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import {
  useAllocations,
  useCourseOptions,
  useDebouncedValue,
  useOrganizationOptions,
} from "@/lib/hooks/use-platform-data";
import { ALLOCATION_SCOPE_LABELS } from "@/lib/labels";
import { downloadCsv } from "@/lib/utils";
import type {
  AllocationScope,
  AllocationStatus,
  CourseAllocationSummary,
  SelectOption,
  SortDirection,
} from "@/types";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

const SCOPE_OPTIONS: SelectOption[] = Object.entries(ALLOCATION_SCOPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

function targetLabel(allocation: CourseAllocationSummary): string {
  if (allocation.scope === "SECTION") {
    return `${allocation.className ?? "Class"} · ${allocation.sectionName ?? "Section"}`;
  }
  if (allocation.scope === "CLASS") return allocation.className ?? "Class";
  return "All classes";
}

const columns: DataTableColumn<CourseAllocationSummary>[] = [
  {
    id: "course",
    header: "Course",
    meta: { sortKey: "course", headerClassName: "min-w-[220px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.courseTitle}</p>
        <p className="text-muted-foreground truncate text-xs">{row.original.publicId}</p>
      </div>
    ),
  },
  {
    id: "target",
    header: "Target",
    meta: { headerClassName: "min-w-[200px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.organizationName}</p>
        <p className="text-muted-foreground truncate text-xs">{targetLabel(row.original)}</p>
      </div>
    ),
  },
  {
    id: "scope",
    header: "Scope",
    meta: { sortKey: "scope" },
    cell: ({ row }) => (
      <Badge variant="outline">{ALLOCATION_SCOPE_LABELS[row.original.scope]}</Badge>
    ),
  },
  {
    id: "students",
    header: "Students",
    meta: { sortKey: "students", className: "tabular-nums" },
    cell: ({ row }) => row.original.affectedStudentCount,
  },
  {
    id: "schedule",
    header: "Schedule",
    meta: { sortKey: "startDate" },
    cell: ({ row }) => (
      <div className="text-sm whitespace-nowrap">
        <p>{formatDate(row.original.startDate)}</p>
        <p className="text-muted-foreground text-xs">to {formatDate(row.original.endDate)}</p>
      </div>
    ),
  },
  {
    id: "access",
    header: "Access",
    cell: ({ row }) => (
      <Badge variant={row.original.accessEnabled ? "success" : "muted"}>
        {row.original.accessEnabled ? "Enabled" : "Off"}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    meta: { sortKey: "status" },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function AllocationsPage() {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const courses = useCourseOptions();
  const [search, setSearch] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState("");
  const [courseId, setCourseId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("startDate");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const organization = params.get("organizationId");
    const course = params.get("courseId");
    if (organization) setOrganizationId(organization);
    if (course) setCourseId(course);
  }, []);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      organizationId: (organizationId || "ALL") as string,
      courseId: (courseId || "ALL") as string,
      status: (status || "ALL") as AllocationStatus | "ALL",
      scope: (scope || "ALL") as AllocationScope | "ALL",
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, organizationId, courseId, status, scope, page, pageSize, sortBy, sortDir],
  );

  const allocations = useAllocations(query);

  const organizationOptions: SelectOption[] = React.useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  );

  const courseOptions: SelectOption[] = React.useMemo(
    () =>
      (courses.data ?? []).map((course) => ({
        value: course.id,
        label: course.title,
      })),
    [courses.data],
  );

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.allocations.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `allocations-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "Course",
          "Organization",
          "Scope",
          "Target",
          "Students",
          "Start date",
          "End date",
          "Access",
          "Status",
        ],
        result.items.map((allocation) => [
          allocation.publicId,
          allocation.courseTitle,
          allocation.organizationName,
          ALLOCATION_SCOPE_LABELS[allocation.scope],
          targetLabel(allocation),
          allocation.affectedStudentCount,
          allocation.startDate,
          allocation.endDate,
          allocation.accessEnabled ? "Enabled" : "Off",
          allocation.status,
        ]),
      );
      toast.success(`Exported ${result.items.length} allocations.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || organizationId || courseId || status || scope);
  const createHref = courseId
    ? `/admin/allocations/new?courseId=${courseId}`
    : "/admin/allocations/new";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course access"
        title="Course allocations"
        description="Allocations grant course access to a whole organization, a class or a section for a date range. Revoking an allocation does not delete its history."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button asChild>
              <Link href={createHref}>
                <Plus className="size-4" />
                New allocation
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
        searchPlaceholder="Search course, organization, class, section or ID…"
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
          label="Course"
          value={courseId}
          onChange={(value) => {
            setCourseId(value);
            setPage(1);
          }}
          options={courseOptions}
          allLabel="All courses"
        />
        <FilterSelect
          label="Scope"
          value={scope}
          onChange={(value) => {
            setScope(value);
            setPage(1);
          }}
          options={SCOPE_OPTIONS}
          allLabel="All scopes"
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
        data={allocations.data?.items ?? []}
        loading={allocations.isLoading}
        error={allocations.error}
        onRetry={() => void allocations.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={(allocation) => router.push(`/admin/allocations/${allocation.id}`)}
        getRowId={(allocation) => allocation.id}
        emptyTitle={hasFilters ? "No matching allocations" : "No allocations yet"}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Allocate an active course to grant access to learners."
        }
        emptyAction={
          <Button asChild size="sm">
            <Link href={createHref}>
              <Plus className="size-4" />
              New allocation
            </Link>
          </Button>
        }
        footer={
          allocations.data ? (
            <TablePagination
              meta={allocations.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="allocations"
            />
          ) : undefined
        }
      />
    </div>
  );
}
