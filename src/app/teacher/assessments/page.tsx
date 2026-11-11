"use client";

import { CheckCircle2, ClipboardCheck, Clock, Eye, Plus, Send, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { backendRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface AssessmentSummary {
  id: string;
  courseTitle: string;
  moduleId: string;
  title: string;
  status: string;
  totalMarks: number;
  passingMarks: number | null;
  durationMinutes: number | null;
  questionCount: number;
  assignedSections: Array<{ sectionId: string; sectionName: string; className: string }>;
  attemptCount: number;
  pendingReviewCount: number;
}

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = React.useState<AssessmentSummary[]>([]);
  const [pendingTotal, setPendingTotal] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [asmtRes, revRes] = await Promise.all([
        backendRequest<{ items: AssessmentSummary[] }>("/api/assessments"),
        backendRequest<Array<{ answerId: string }>>("/api/teacher/assessment-reviews").catch(
          () => [],
        ),
      ]);
      setAssessments(asmtRes.items ?? []);
      setPendingTotal(Array.isArray(revRes) ? revRes.length : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handlePublish(id: string) {
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(id)}/publish`, {
        method: "PATCH",
      });
      toast.success("Assessment published.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish assessment");
    }
  }

  const filtered = React.useMemo(() => {
    if (statusFilter === "ALL") return assessments;
    return assessments.filter((a) => a.status === statusFilter);
  }, [assessments, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authoring & Grading"
        title="Assessments"
        description="Build module quizzes and written rubric assessments, assign them to your classes, grade open-ended answers, and release scores."
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/assessments/new">
              <Plus className="size-4" />
              Create Assessment
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Assessments"
          value={assessments.length}
          icon={ClipboardCheck}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Published"
          value={assessments.filter((a) => a.status === "PUBLISHED").length}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Total Attempts"
          value={assessments.reduce((s, a) => s + a.attemptCount, 0)}
          icon={Users}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Answers Awaiting Review"
          value={pendingTotal}
          hint="Manual rubric grading needed"
          icon={Clock}
          tone="warning"
          loading={loading}
        />
      </section>

      <div className="flex flex-wrap gap-2">
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
            {tab === "ALL"
              ? `All (${assessments.length})`
              : tab === "PUBLISHED"
                ? "Published"
                : "Draft"}
          </button>
        ))}
      </div>

      {error ? (
        <div className="surface">
          <ErrorState message={error} onRetry={() => void loadData()} />
        </div>
      ) : !loading && filtered.length === 0 ? (
        <div className="surface">
          <EmptyState
            title="No assessments found"
            description="Create a module quiz or written assessment for your classes."
            icon={ClipboardCheck}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Course Assessments</CardTitle>
            <CardDescription>
              Open an assessment to assign sections or grade written responses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Pass / Total</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((asmt) => (
                  <TableRow key={asmt.id}>
                    <TableCell>
                      <p className="font-semibold">{asmt.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {asmt.courseTitle} · {asmt.moduleId}
                      </p>
                    </TableCell>
                    <TableCell className="tabular-nums">{asmt.questionCount}</TableCell>
                    <TableCell className="tabular-nums">
                      {asmt.passingMarks ?? 0} / {asmt.totalMarks} pts
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {asmt.assignedSections.length === 0 ? (
                          <span className="text-muted-foreground text-xs">Unassigned</span>
                        ) : (
                          asmt.assignedSections.map((sec) => (
                            <Badge key={sec.sectionId} variant="secondary">
                              {sec.className} {sec.sectionName}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <span>{asmt.attemptCount}</span>
                      {asmt.pendingReviewCount > 0 && (
                        <Badge variant="warning" className="ml-2">
                          {asmt.pendingReviewCount} review
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={asmt.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {asmt.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handlePublish(asmt.id)}
                          >
                            <Send className="size-3.5" />
                            Publish
                          </Button>
                        )}
                        <Button size="sm" asChild>
                          <Link href={`/teacher/assessments/${asmt.id}`}>
                            <Eye className="size-3.5" />
                            Open & Grade
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
