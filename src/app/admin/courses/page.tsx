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
import { useCourses, useDebouncedValue } from "@/lib/hooks/use-platform-data";
import { cn, downloadCsv } from "@/lib/utils";
import {
  COURSE_STATUS_LABELS,
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  type Course,
  type CourseDifficulty,
  type CourseStatus,
  type ProgrammingLanguage,
  type SelectOption,
  type SortDirection,
} from "@/types";

const LANGUAGE_OPTIONS: SelectOption[] = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const DIFFICULTY_OPTIONS: SelectOption[] = Object.entries(DIFFICULTY_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const STATUS_OPTIONS: SelectOption[] = Object.entries(COURSE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const columns: DataTableColumn<Course>[] = [
  {
    id: "course",
    header: "Course",
    meta: { sortKey: "title", headerClassName: "min-w-[260px]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.title}</p>
        <p className="text-muted-foreground truncate text-xs">{row.original.publicId}</p>
      </div>
    ),
  },
  {
    id: "scope",
    header: "Scope",
    cell: ({ row }) => {
      const isFree = row.original.isPlatformCourse || row.original.organizationId === null;
      return <StatusBadge status={isFree ? "PLATFORM_FREE" : "SCHOOL"} />;
    },
  },
  {
    id: "category",
    header: "Category",
    meta: { sortKey: "category" },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.category}</span>
    ),
  },
  {
    id: "language",
    header: "Language",
    meta: { sortKey: "language" },
    cell: ({ row }) => <span className="text-sm">{LANGUAGE_LABELS[row.original.language]}</span>,
  },
  {
    id: "difficulty",
    header: "Difficulty",
    meta: { sortKey: "difficulty" },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {DIFFICULTY_LABELS[row.original.difficulty]}
      </span>
    ),
  },
  {
    id: "version",
    header: "Version",
    meta: { sortKey: "version", className: "tabular-nums" },
    cell: ({ row }) => `v${row.original.version}`,
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

export default function CoursesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [scopeFilter, setScopeFilter] = React.useState<"ALL" | "PLATFORM_FREE" | "SCHOOL">("ALL");
  const [language, setLanguage] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<string | undefined>("title");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      language: (language || "ALL") as ProgrammingLanguage | "ALL",
      difficulty: (difficulty || "ALL") as CourseDifficulty | "ALL",
      status: (status || "ALL") as CourseStatus | "ALL",
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, language, difficulty, status, page, pageSize, sortBy, sortDir],
  );

  const courses = useCourses(query);

  const filteredItems = React.useMemo(() => {
    const items = courses.data?.items ?? [];
    if (scopeFilter === "ALL") return items;
    return items.filter((course) => {
      const isFree = course.isPlatformCourse || course.organizationId === null;
      return scopeFilter === "PLATFORM_FREE" ? isFree : !isFree;
    });
  }, [courses.data?.items, scopeFilter]);

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.courses.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `courses-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Public ID",
          "Title",
          "Category",
          "Language",
          "Difficulty",
          "Version",
          "Status",
          "Created",
        ],
        result.items.map((course) => [
          course.publicId,
          course.title,
          course.category,
          LANGUAGE_LABELS[course.language],
          DIFFICULTY_LABELS[course.difficulty],
          course.version,
          course.status,
          course.createdAt,
        ]),
      );
      toast.success(`Exported ${result.items.length} courses.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || language || difficulty || status || scopeFilter !== "ALL");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course catalog"
        title="Courses"
        description="Manage Platform Free courses and school-specific courses. Courses must be active before they can be allocated."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
              <Link href="/admin/courses/new">
                <Plus className="size-4" />
                New course
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "ALL" as const, label: "All Courses" },
          { key: "PLATFORM_FREE" as const, label: "Platform Free Courses" },
          { key: "SCHOOL" as const, label: "School Courses" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setScopeFilter(tab.key)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
              scopeFilter === tab.key
                ? "lp-gradient-bg border-transparent text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search course title, ID, category or description…"
      >
        <FilterSelect
          label="Language"
          value={language}
          onChange={(value) => {
            setLanguage(value);
            setPage(1);
          }}
          options={LANGUAGE_OPTIONS}
          allLabel="All languages"
        />
        <FilterSelect
          label="Difficulty"
          value={difficulty}
          onChange={(value) => {
            setDifficulty(value);
            setPage(1);
          }}
          options={DIFFICULTY_OPTIONS}
          allLabel="All levels"
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
        data={filteredItems}
        loading={courses.isLoading}
        error={courses.error}
        onRetry={() => void courses.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={(course) => router.push(`/admin/courses/${course.id}`)}
        getRowId={(course) => course.id}
        emptyTitle={hasFilters ? "No matching courses" : "No courses yet"}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Create the first course for the platform catalog."
        }
        emptyAction={
          <Button asChild size="sm">
            <Link href="/admin/courses/new">
              <Plus className="size-4" />
              New course
            </Link>
          </Button>
        }
        footer={
          courses.data ? (
            <TablePagination
              meta={courses.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="courses"
            />
          ) : undefined
        }
      />
    </div>
  );
}
