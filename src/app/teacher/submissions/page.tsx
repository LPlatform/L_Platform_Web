"use client";

import { ClipboardCheck, Download, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface SubmissionItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: string;
  studentName: string;
  studentEmail: string;
  questionTitle: string;
  questionType: string;
  language: string;
  status: string;
  score: number | null;
  teacherFeedback: string;
  feedbackReleased: boolean;
  submittedAt: string;
  code: string;
  textResponse: string;
  responseData: unknown;
  attachmentName: string;
  attachmentUrl: string;
  testCasesPassed: number;
  totalTestCases: number;
}

function TeacherSubmissionsContent() {
  const searchParams = useSearchParams();
  const assignmentFilter = searchParams.get("assignmentId") || "";

  const [selectedSub, setSelectedSub] = React.useState<SubmissionItem | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "PENDING" | "GRADED" | "COMPLETED"
  >("ALL");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Grading modal state
  const [scoreInput, setScoreInput] = React.useState("");
  const [feedbackInput, setFeedbackInput] = React.useState("");
  const [releaseFeedback, setReleaseFeedback] = React.useState(true);
  const [grading, setGrading] = React.useState(false);

  const loadSubmissions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = assignmentFilter
        ? `/api/submissions?page=1&pageSize=100&assignmentId=${encodeURIComponent(assignmentFilter)}`
        : "/api/submissions?page=1&pageSize=100";
      const { items } = await backendRequest<{ items: Array<Record<string, unknown>> }>(url);
      setSubmissions(
        (items ?? []).map((item) => ({
          id: String(item.id),
          assignmentId: String(item.assignmentId ?? ""),
          assignmentTitle: String(item.assignmentTitle ?? "Assignment"),
          assignmentType: String(item.assignmentType ?? "PROGRAMMING"),
          studentName: String(item.studentName ?? "Unknown"),
          studentEmail: String(item.studentEmail ?? ""),
          questionTitle: String(item.questionTitle ?? "Unknown question"),
          questionType: String(item.questionType ?? "PROGRAMMING"),
          language: String(item.language ?? ""),
          status: String(item.status ?? "PENDING"),
          score: typeof item.score === "number" ? item.score : null,
          teacherFeedback: String(item.teacherFeedback ?? ""),
          feedbackReleased: Boolean(item.feedbackReleased || item.feedbackReleasedAt),
          submittedAt: item.submittedAt ? new Date(String(item.submittedAt)).toLocaleString() : "—",
          code: String(item.code ?? ""),
          textResponse: String(item.textResponse ?? ""),
          responseData: item.responseData ?? null,
          attachmentName: String(item.attachmentName ?? ""),
          attachmentUrl: String(item.attachmentUrl ?? ""),
          testCasesPassed: Number(item.passedTestCases ?? 0),
          totalTestCases: Number(item.totalTestCases ?? 0),
        })),
      );
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not load submissions");
    } finally {
      setLoading(false);
    }
  }, [assignmentFilter]);

  React.useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  function openSubmissionModal(sub: SubmissionItem) {
    setSelectedSub(sub);
    setScoreInput(sub.score == null ? "" : String(sub.score));
    setFeedbackInput(sub.teacherFeedback || "");
    setReleaseFeedback(true);
  }

  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSub) return;
    const numericScore = scoreInput.trim() === "" ? undefined : Number(scoreInput);
    if (numericScore !== undefined && (Number.isNaN(numericScore) || numericScore < 0)) {
      toast.error("Please enter a valid non-negative score.");
      return;
    }

    setGrading(true);
    try {
      const updated = await backendRequest<{
        score: number | null;
        teacherFeedback: string | null;
        feedbackReleased: boolean;
        status: string;
      }>(`/api/submissions/${encodeURIComponent(selectedSub.id)}/grade`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(numericScore !== undefined ? { score: numericScore } : {}),
          teacherFeedback: feedbackInput.trim(),
          releaseFeedback,
        }),
      });

      toast.success(
        releaseFeedback
          ? "Submission graded and feedback released to student."
          : "Grade saved (hidden from student until released).",
      );
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === selectedSub.id
            ? {
                ...item,
                score: updated.score,
                teacherFeedback: updated.teacherFeedback ?? "",
                feedbackReleased: Boolean(updated.feedbackReleased),
                status: updated.status || "GRADED",
              }
            : item,
        ),
      );
      setSelectedSub(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to save grade");
    } finally {
      setGrading(false);
    }
  }

  async function handleDownloadAttachment(sub: SubmissionItem) {
    try {
      const signed = await backendRequest<{
        uploadUrl: string;
        headers?: Record<string, string>;
      }>(`/api/submissions/${encodeURIComponent(sub.id)}/attachment-download`);
      const res = await fetch(signed.uploadUrl, {
        headers: signed.headers ?? {},
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = sub.attachmentName || "submission-attachment";
      link.click();
      URL.revokeObjectURL(href);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not authorize attachment download.",
      );
    }
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.questionTitle.toLowerCase().includes(q) ||
        s.assignmentTitle.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q)
      );
    });
  }, [submissions, statusFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Grading"
        title="Submission Review"
        description={
          assignmentFilter
            ? `Inspecting student submissions for assignment ${assignmentFilter}.`
            : "Inspect programming code, written answers, and uploaded deliverables; grade and release teacher feedback."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {assignmentFilter && (
              <Button variant="outline" asChild>
                <Link href="/teacher/submissions">Show All Assignments</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/teacher/assessments">
                <ClipboardCheck className="size-4" />
                Written Assessment Grading
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "GRADED", "COMPLETED"] as const).map((tab) => (
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
                ? `All (${submissions.length})`
                : tab === "PENDING"
                  ? "Pending Review"
                  : tab === "GRADED"
                    ? "Graded"
                    : "Completed"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, assignment, or question..."
            className="bg-card pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>Scoped to your assigned class sections</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p role="alert" className="text-destructive p-4 text-sm">
              Could not load submissions: {error}
            </p>
          )}
          {!loading && !error && filtered.length === 0 ? (
            <EmptyState
              title="No matching submissions"
              description="Student submissions from the Student Desktop Application appear here."
              icon={Eye}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score & Feedback</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{sub.studentName}</p>
                      <p className="text-muted-foreground text-xs">{sub.studentEmail}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{sub.assignmentTitle}</p>
                      <Badge variant="outline" className="mt-0.5 text-[10px]">
                        {sub.assignmentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{sub.questionTitle}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {sub.language || sub.questionType}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tabular-nums">
                          {sub.score == null ? "Unscored" : `${sub.score} pts`}
                        </span>
                        <div>
                          <Badge variant={sub.feedbackReleased ? "success" : "secondary"}>
                            {sub.feedbackReleased ? "Released" : "Hidden"}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {sub.submittedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openSubmissionModal(sub)}>
                        <Eye className="size-3.5" />
                        Inspect & Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedSub && (
        <Dialog open={Boolean(selectedSub)} onOpenChange={() => setSelectedSub(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSub.studentName} — {selectedSub.questionTitle}
              </DialogTitle>
              <DialogDescription>
                {selectedSub.assignmentTitle} ({selectedSub.assignmentType}) ·{" "}
                {selectedSub.language || selectedSub.questionType} · Submitted{" "}
                {selectedSub.submittedAt}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {selectedSub.code && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Submitted Code ({selectedSub.language || "SOURCE"})
                  </p>
                  <div className="border-border bg-secondary/70 max-h-64 overflow-auto rounded-xl border p-4">
                    <pre className="font-mono text-xs leading-relaxed text-slate-100">
                      {selectedSub.code}
                    </pre>
                  </div>
                </div>
              )}

              {selectedSub.textResponse && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Written Response
                  </p>
                  <div className="border-border bg-secondary/50 max-h-56 overflow-auto rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedSub.textResponse}
                  </div>
                </div>
              )}

              {selectedSub.responseData !== null && selectedSub.responseData !== undefined && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Structured Response Data
                  </p>
                  <div className="border-border bg-secondary/40 max-h-40 overflow-auto rounded-xl border p-3 font-mono text-xs">
                    {JSON.stringify(selectedSub.responseData, null, 2)}
                  </div>
                </div>
              )}

              {(selectedSub.attachmentName || selectedSub.attachmentUrl) && (
                <div className="border-border bg-secondary/30 flex items-center justify-between rounded-xl border p-3 text-xs">
                  <span>
                    Attachment:{" "}
                    <strong className="text-foreground">
                      {selectedSub.attachmentName || "Uploaded file"}
                    </strong>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDownloadAttachment(selectedSub)}
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              )}

              {!selectedSub.code &&
                !selectedSub.textResponse &&
                !selectedSub.responseData &&
                !selectedSub.attachmentName && (
                  <p className="text-muted-foreground text-xs">
                    No code, text, or attachment body was attached to this submission record.
                  </p>
                )}

              <form
                onSubmit={handleSaveGrade}
                className="border-border bg-secondary/20 space-y-3 rounded-xl border p-4"
              >
                <p className="text-xs font-semibold uppercase">Teacher Grading & Feedback</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="submissionScore">Score (marks)</Label>
                    <Input
                      id="submissionScore"
                      type="number"
                      min={0}
                      placeholder="e.g. 8"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={releaseFeedback}
                        onChange={(e) => setReleaseFeedback(e.target.checked)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      Release score and feedback to student
                    </label>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="teacherFeedback">Teacher Feedback</Label>
                  <textarea
                    id="teacherFeedback"
                    rows={3}
                    className="border-input bg-background w-full rounded-xl border p-3 text-sm"
                    placeholder="Provide constructive evaluation notes..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setSelectedSub(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={grading}
                    className="lp-gradient-bg border-0 text-white hover:opacity-95"
                  >
                    {grading ? "Saving Grade…" : "Save Grade & Feedback"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function TeacherSubmissionsPage() {
  return (
    <React.Suspense
      fallback={<div className="text-muted-foreground p-6 text-sm">Loading submissions…</div>}
    >
      <TeacherSubmissionsContent />
    </React.Suspense>
  );
}
