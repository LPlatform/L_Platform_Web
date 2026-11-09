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
import {
  useClasses,
  useDebouncedValue,
  useOrganizationOptions,
  useSections,
} from "@/lib/hooks/use-platform-data";
import { downloadCsv } from "@/lib/utils";
import type { SectionStatus, SectionWithStats, SelectOption, SortDirection } from "@/types";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

const columns: DataTableColumn<SectionWithStats>[] = [
  {
    id: "section",
    header: "Section",
    meta: { sortKey: "name", headerClassName: "min-w-[180px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="text-muted-foreground truncate text-xs">{row.original.publicId}</p>
      </div>
    ),
  },
  {
    id: "class",
    header: "Class",
    meta: { sortKey: "className" },
    cell: ({ row }) => <span className="text-sm">{row.original.className}</span>,
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

export default function SectionsPage() {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const [search, setSearch] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState("");
  const [classId, setClassId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("name");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const organization = params.get("organizationId");
    const academicClass = params.get("classId");
    if (organization) setOrganizationId(organization);
    if (academicClass) setClassId(academicClass);
  }, []);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      organizationId: (organizationId || "ALL") as string,
      classId: (classId || "ALL") as string,
      status: (status || "ALL") as SectionStatus | "ALL",
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, organizationId, classId, status, page, pageSize, sortBy, sortDir],
  );

  const sections = useSections(query);
  const classOptions = useClasses({
    organizationId: (organizationId || "ALL") as string,
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDir: "asc",
  });

  const organizationOptions: SelectOption[] = React.useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  );

  const classes: SelectOption[] = React.useMemo(
    () =>
      (classOptions.data?.items ?? []).map((academicClass) => ({
        value: academicClass.id,
        label: `${academicClass.name} · ${academicClass.organizationName}`,
      })),
    [classOptions.data],
  );

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.sections.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `sections-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "Section",
          "Class",
          "Organization",
          "Students",
          "Teachers",
          "Status",
          "Created",
        ],
        result.items.map((section) => [
          section.publicId,
          section.name,
          section.className,
          section.organizationName,
          section.studentCount,
          section.teacherCount,
          section.status,
          section.createdAt,
        ]),
      );
      toast.success(`Exported ${result.items.length} sections.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || organizationId || classId || status);
  const createHref = classId ? `/admin/sections/new?classId=${classId}` : "/admin/sections/new";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic structure"
        title="Sections"
        description="Sections group students and teachers inside a class. Open a section to manage its roster, assign teachers or import students."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button asChild>
              <Link href={createHref}>
                <Plus className="size-4" />
                New section
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
        searchPlaceholder="Search section, ID, class or organization…"
      >
        <FilterSelect
          label="Organization"
          value={organizationId}
          onChange={(value) => {
            setOrganizationId(value);
            setClassId("");
            setPage(1);
          }}
          options={organizationOptions}
          allLabel="All organizations"
        />
        <FilterSelect
          label="Class"
          value={classId}
          onChange={(value) => {
            setClassId(value);
            setPage(1);
          }}
          options={classes}
          allLabel="All classes"
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
        data={sections.data?.items ?? []}
        loading={sections.isLoading}
        error={sections.error}
        onRetry={() => void sections.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={(section) => router.push(`/admin/sections/${section.id}`)}
        getRowId={(section) => section.id}
        emptyTitle={hasFilters ? "No matching sections" : "No sections yet"}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Create the first section for a class to start assigning people."
        }
        emptyAction={
          <Button asChild size="sm">
            <Link href={createHref}>
              <Plus className="size-4" />
              New section
            </Link>
          </Button>
        }
        footer={
          sections.data ? (
            <TablePagination
              meta={sections.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="sections"
            />
          ) : undefined
        }
      />
    </div>
  );
}
