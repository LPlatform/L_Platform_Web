"use client";

import { CheckCircle2, ClipboardCheck, Clock, Eye, FileText, Send, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { backendRequest } from "@/lib/api/client";
import { useSections } from "@/lib/hooks/use-platform-data";
import { cn } from "@/lib/utils";

interface AssessmentSummaryRow {
  id: string;
  courseId: string;
  courseTitle: string;
  moduleId: string;
  title: string;
  instructions: string;
  status: string;
  totalMarks: number;
  passingMarks: number | null;
  durationMinutes: number | null;
  attemptLimit: number;
  questionCount: number;
  assignedSections: Array<{
    assignmentId: string;
    sectionId: string;
    sectionName: string;
    className: string;
    dueAt: string | null;
  }>;
  attemptCount: number;
  pendingReviewCount: number;
  createdAt: string;
}

export default function AdminAssessmentsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<AssessmentSummaryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [assignTarget, setAssignTarget] = React.useState<AssessmentSummaryRow | null>(null);
  const [selectedSectionId, setSelectedSectionId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const sectionsQuery = useSections({ page: 1, pageSize: 100, status: "ACTIVE" });

  const loadAssessments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendRequest<{ items: AssessmentSummaryRow[] }>("/api/assessments");
      setItems(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q) ||
        item.moduleId.toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  async function handlePublish(id: string) {
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(id)}/publish`, {
        method: "PATCH",
      });
      toast.success("Assessment published.");
      await loadAssessments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish assessment");
    }
  }

  async function handleAssignSection() {
    if (!assignTarget || !selectedSectionId) return;
    setSubmitting(true);
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(assignTarget.id)}/assign`, {
        method: "POST",
        body: JSON.stringify({ sectionId: selectedSectionId }),
      });
      toast.success("Assessment assigned to section.");
      setAssignTarget(null);
      setSelectedSectionId("");
      await loadAssessments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign section");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<AssessmentSummaryRow>[] = [
    {
      id: "title",
      header: "Assessment",
      meta: { headerClassName: "min-w-[240px]" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground truncate text-xs">
            {row.original.courseTitle} · {row.original.moduleId}
          </p>
        </div>
      ),
    },
    {
      id: "questions",
      header: "Questions",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => `${row.original.questionCount} questions`,
    },
    {
      id: "marks",
      header: "Marks",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => `${row.original.passingMarks ?? 0} / ${row.original.totalMarks} pass`,
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) =>
        row.original.durationMinutes ? `${row.original.durationMinutes} min` : "Untimed",
    },
    {
      id: "sections",
      header: "Assigned Sections",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => `${row.original.assignedSections.length} sections`,
    },
    {
      id: "attempts",
      header: "Attempts",
      meta: { className: "tabular-nums" },
      cell: ({ row }) => (
        <div>
          <span>{row.original.attemptCount} total</span>
          {row.original.pendingReviewCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              {row.original.pendingReviewCount} review
            </span>
          )}
        </div>
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/assessments/${row.original.id}`}>
              <Eye className="size-3.5" />
              Inspect
            </Link>
          </Button>
          {row.original.status === "DRAFT" ? (
            <Button size="sm" onClick={() => void handlePublish(row.original.id)}>
              <Send className="size-3.5" />
              Publish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setAssignTarget(row.original);
                setSelectedSectionId(sectionsQuery.data?.items?.[0]?.id ?? "");
              }}
            >
              Assign Section
            </Button>
          )}
        </div>
      ),
    },
  ];

  const publishedCount = items.filter((i) => i.status === "PUBLISHED").length;
  const totalAttempts = items.reduce((sum, i) => sum + i.attemptCount, 0);
  const pendingReview = items.reduce((sum, i) => sum + i.pendingReviewCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Assessments"
        description="Inspect course assessments, manage section assignments, and monitor attempts and pending reviews."
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/assessments/new">Build Assessment</Link>
          </Button>
        }
      />

      <section
        aria-label="Assessment statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total Assessments"
          value={items.length}
          hint="Configured across courses"
          icon={ClipboardCheck}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Published"
          value={publishedCount}
          hint="Available for assignment"
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Student Attempts"
          value={totalAttempts}
          hint="Completed & in-progress"
          icon={Users}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Pending Review"
          value={pendingReview}
          hint="Awaiting teacher rubric grading"
          icon={Clock}
          tone="warning"
          loading={loading}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "PUBLISHED", "DRAFT"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
              statusFilter === tab
                ? "lp-gradient-bg border-transparent text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "ALL" ? `All (${items.length})` : tab === "PUBLISHED" ? "Published" : "Draft"}
          </button>
        ))}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search assessment title, course or module…"
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error ? new Error(error) : undefined}
        onRetry={() => void loadAssessments()}
        onRowClick={(item) => router.push(`/admin/assessments/${item.id}`)}
        getRowId={(item) => item.id}
        emptyTitle="No assessments available"
        emptyDescription="Course assessments created by teachers or admins will appear here."
      />

      <Dialog open={Boolean(assignTarget)} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Assessment to Section</DialogTitle>
            <DialogDescription>
              Make <span className="font-semibold">{assignTarget?.title}</span> visible to students
              enrolled in the chosen active section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="assign-section-select">Section</Label>
            <NativeSelect
              id="assign-section-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <option value="">Select section…</option>
              {(sectionsQuery.data?.items ?? []).map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.className} — {sec.name} ({sec.organizationName})
                </option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedSectionId || submitting}
              onClick={() => void handleAssignSection()}
            >
              <FileText className="size-4" />
              {submitting ? "Assigning…" : "Assign Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
