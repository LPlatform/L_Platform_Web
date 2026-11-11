"use client";

import { CheckCircle2, Code2, Download, FileCheck2, Lock, Send, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";
import { backendRequest } from "@/lib/api/client";
import { formatDate } from "@/lib/dates";
import { useDebouncedValue } from "@/lib/hooks/use-platform-data";
import { cn, downloadCsv } from "@/lib/utils";

interface AdminAssignmentRow {
  id: string;
  title: string;
  sectionId: string;
  sectionName: string;
  className: string;
  questionCount: number;
  submissionCount: number;
  totalMarks: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export default function AdminAssignmentsPage() {
  const [items, setItems] = React.useState<AdminAssignmentRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PUBLISHED" | "DRAFT" | "CLOSED">(
    "ALL",
  );
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const loadAssignments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await backendRequest<{
        items: AdminAssignmentRow[];
        total: number;
      }>(`/api/assignments?${params.toString()}`);
      setItems(res.items ?? []);
      setTotal(res.total ?? (res.items?.length || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assignments");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, debouncedSearch]);

  React.useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleStatusChange(id: string, nextStatus: "PUBLISHED" | "CLOSED") {
    setUpdatingId(id);
    try {
      if (nextStatus === "PUBLISHED") {
        await backendRequest(`/api/assignments/${encodeURIComponent(id)}/publish`, {
          method: "PATCH",
        });
      } else {
        await backendRequest(`/api/assignments/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
      }
      toast.success(
        nextStatus === "PUBLISHED" ? "Assignment published to students." : "Assignment closed.",
      );
      await loadAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update assignment status");
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: DataTableColumn<AdminAssignmentRow>[] = [
    {
      id: "title",
      header: "Assignment",
      meta: { headerClassName: "min-w-[240px]" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground truncate text-xs">{row.original.id}</p>
        </div>
      ),
    },
    {
      id: "section",
      header: "Class & Section",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.original.sectionName}</p>
          <p className="text-muted-foreground truncate text-xs">{row.original.className}</p>
        </div>
      ),
    },
    {
      id: "questions",
      header: "Problems",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => `${row.original.questionCount} problems`,
    },
    {
      id: "marks",
      header: "Marks",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => `${row.original.totalMarks} pts`,
    },
    {
      id: "submissions",
      header: "Submissions",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => `${row.original.submissionCount} students`,
    },
    {
      id: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {row.original.dueDate ? formatDate(row.original.dueDate) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const busy = updatingId === row.original.id;
        return (
          <div className="flex items-center gap-1.5">
            {row.original.status !== "PUBLISHED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleStatusChange(row.original.id, "PUBLISHED");
                }}
              >
                <Send className="size-3.5" />
                Publish
              </Button>
            )}
            {row.original.status === "PUBLISHED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleStatusChange(row.original.id, "CLOSED");
                }}
              >
                <Lock className="size-3.5" />
                Close
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const publishedCount = items.filter((a) => a.status === "PUBLISHED").length;
  const draftCount = items.filter((a) => a.status === "DRAFT").length;
  const totalSubmissions = items.reduce((sum, a) => sum + (a.submissionCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Assignments"
        description="Monitor programming assignments across all sections, inspect submission volume, and manage publication status."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  `assignments-${new Date().toISOString().slice(0, 10)}.csv`,
                  ["ID", "Title", "Class", "Section", "Problems", "Marks", "Submissions", "Status"],
                  items.map((a) => [
                    a.id,
                    a.title,
                    a.className,
                    a.sectionName,
                    a.questionCount,
                    a.totalMarks,
                    a.submissionCount,
                    a.status,
                  ]),
                );
                toast.success(`Exported ${items.length} assignments.`);
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
              <Link href="/teacher/assignments/new">Create via Teacher Console</Link>
            </Button>
          </>
        }
      />

      <section
        aria-label="Assignment statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Visible Assignments"
          value={total}
          hint="Matching current filter"
          icon={Code2}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Published"
          value={publishedCount}
          hint="Active for student submission"
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Drafts"
          value={draftCount}
          hint="Pending publication"
          icon={FileCheck2}
          tone="warning"
          loading={loading}
        />
        <StatCard
          label="Student Submissions"
          value={totalSubmissions}
          hint="Across listed assignments"
          icon={Users}
          tone="info"
          loading={loading}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "PUBLISHED", "DRAFT", "CLOSED"] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
              statusFilter === st
                ? "lp-gradient-bg border-transparent text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {st === "ALL" ? "All Assignments" : st.charAt(0) + st.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search assignment title…"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        error={error ? new Error(error) : undefined}
        onRetry={() => void loadAssignments()}
        getRowId={(row) => row.id}
        emptyTitle="No assignments found"
        emptyDescription="Assignments created for organization sections will appear here."
        footer={
          total > 0 ? (
            <TablePagination
              meta={{
                page,
                pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
              }}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="assignments"
            />
          ) : undefined
        }
      />
    </div>
  );
}
