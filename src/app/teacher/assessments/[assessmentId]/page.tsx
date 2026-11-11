"use client";

import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock, Plus, Send, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { backendRequest } from "@/lib/api/client";
import { formatDateTime } from "@/lib/dates";

interface AssessmentDetail {
  id: string;
  courseTitle: string;
  moduleId: string;
  title: string;
  instructions: string;
  status: string;
  totalMarks: number;
  passingMarks: number | null;
  durationMinutes: number | null;
  attemptLimit: number;
  questions: Array<{
    id: string;
    title: string;
    questionType: string;
    marks: number;
  }>;
  assignments: Array<{
    assignmentId: string;
    sectionId: string;
    sectionName: string;
    className: string;
    dueAt: string | null;
    status: string;
  }>;
  attempts: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string | null;
    status: string;
    score: number | null;
    totalMarks: number;
    submittedAt: string | null;
    releasedAt: string | null;
  }>;
}

interface PendingReviewAnswer {
  attemptId: string;
  assessmentTitle: string;
  studentId: string;
  answerId: string;
  questionId: string;
  question: string;
  response: unknown;
  rubric: unknown;
  maxMarks: number;
}

interface SectionOption {
  id: string;
  sectionName: string;
  className: string;
}

export default function TeacherAssessmentDetailPage() {
  const params = useParams<{ assessmentId: string }>();
  const [data, setData] = React.useState<AssessmentDetail | null>(null);
  const [pendingReviews, setPendingReviews] = React.useState<PendingReviewAnswer[]>([]);
  const [sections, setSections] = React.useState<SectionOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [sectionId, setSectionId] = React.useState("");
  const [gradingTarget, setGradingTarget] = React.useState<PendingReviewAnswer | null>(null);
  const [marksAwarded, setMarksAwarded] = React.useState("0");
  const [feedback, setFeedback] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, reviews, classesRes] = await Promise.all([
        backendRequest<AssessmentDetail>(
          `/api/assessments/${encodeURIComponent(params.assessmentId)}`,
        ),
        backendRequest<PendingReviewAnswer[]>("/api/teacher/assessment-reviews").catch(() => []),
        backendRequest<{ items: SectionOption[] }>("/api/learning/classes").catch(() => ({
          items: [],
        })),
      ]);
      setData(detail);
      const attemptIds = new Set(detail.attempts.map((a) => a.id));
      setPendingReviews(
        (Array.isArray(reviews) ? reviews : []).filter((r) => attemptIds.has(r.attemptId)),
      );
      setSections(classesRes.items ?? []);
      const firstSection = classesRes.items?.[0];
      if (firstSection) setSectionId((prev) => prev || firstSection.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assessment");
    } finally {
      setLoading(false);
    }
  }, [params.assessmentId]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handlePublish() {
    if (!data) return;
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(data.id)}/publish`, {
        method: "PATCH",
      });
      toast.success("Assessment published.");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish assessment");
    }
  }

  async function handleAssign() {
    if (!data || !sectionId) return;
    setSubmitting(true);
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(data.id)}/assign`, {
        method: "POST",
        body: JSON.stringify({ sectionId }),
      });
      toast.success("Assigned to section.");
      setAssignOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign section");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGradeSubmit() {
    if (!gradingTarget) return;
    setSubmitting(true);
    try {
      await backendRequest(
        `/api/teacher/assessment-answers/${encodeURIComponent(gradingTarget.answerId)}/review`,
        {
          method: "POST",
          body: JSON.stringify({
            marksAwarded: Number(marksAwarded),
            feedback: feedback.trim(),
          }),
        },
      );
      toast.success("Written answer graded.");
      setGradingTarget(null);
      setFeedback("");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save grade");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRelease(attemptId: string) {
    try {
      await backendRequest(
        `/api/teacher/assessment-attempts/${encodeURIComponent(attemptId)}/release`,
        { method: "POST" },
      );
      toast.success("Score and feedback released to student.");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not release score");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment" eyebrow="Authoring & Grading" />
        <div className="surface">
          <ErrorState message={error || "Assessment not found"} onRetry={() => void loadAll()} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${data.courseTitle} · ${data.moduleId}`}
        title={data.title}
        description={
          data.instructions ||
          "Review student attempts, grade written responses, and release results."
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/teacher/assessments">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            {data.status === "DRAFT" && (
              <Button variant="outline" onClick={() => void handlePublish()}>
                <Send className="size-4" />
                Publish
              </Button>
            )}
            <Button
              className="lp-gradient-bg border-0 text-white hover:opacity-95"
              onClick={() => setAssignOpen(true)}
            >
              <Plus className="size-4" />
              Assign Section
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Questions"
          value={data.questions.length}
          icon={ClipboardCheck}
          tone="violet"
        />
        <StatCard
          label="Total Marks"
          value={data.totalMarks}
          hint={`Pass: ${data.passingMarks ?? 0}`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Assigned Sections"
          value={data.assignments.length}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Pending Rubric Reviews"
          value={pendingReviews.length}
          icon={Clock}
          tone="warning"
        />
      </section>

      {pendingReviews.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle>Written Answers Awaiting Rubric Review ({pendingReviews.length})</CardTitle>
            <CardDescription>
              Grade open-ended answers before releasing attempt scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.map((rev) => {
              const student = data.attempts.find((a) => a.id === rev.attemptId);
              return (
                <div
                  key={rev.answerId}
                  className="border-border bg-secondary/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold">
                      {student?.studentName ?? rev.studentId} · Max {rev.maxMarks} marks
                    </p>
                    <p className="text-muted-foreground text-xs">{rev.question}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setGradingTarget(rev);
                      setMarksAwarded(
                        String(Math.min(rev.maxMarks, Math.ceil(rev.maxMarks * 0.7))),
                      );
                      setFeedback("");
                    }}
                  >
                    Grade Answer
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
          <CardDescription>
            Release graded attempts so students can inspect feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    No attempts submitted yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.attempts.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell>
                      <p className="font-medium">{att.studentName}</p>
                      <p className="text-muted-foreground text-xs">{att.studentEmail || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={att.status} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {att.score !== null ? `${att.score} / ${att.totalMarks}` : "Pending"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {att.submittedAt ? formatDateTime(att.submittedAt) : "In progress"}
                    </TableCell>
                    <TableCell className="text-right">
                      {att.status === "GRADED" ? (
                        <Button size="sm" onClick={() => void handleRelease(att.id)}>
                          <CheckCircle2 className="size-3.5" />
                          Release Score
                        </Button>
                      ) : att.status === "RELEASED" ? (
                        <Badge variant="success">Released</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Section</DialogTitle>
            <DialogDescription>
              Select one of your classes to receive this assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="teacher-assign-sec">Class Section</Label>
            <NativeSelect
              id="teacher-assign-sec"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.className} · {sec.sectionName}
                </option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!sectionId || submitting} onClick={() => void handleAssign()}>
              Assign Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(gradingTarget)}
        onOpenChange={(open) => !open && setGradingTarget(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rubric Grading (Max {gradingTarget?.maxMarks} marks)</DialogTitle>
            <DialogDescription>{gradingTarget?.question}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="border-border bg-secondary/50 rounded-xl border p-3.5 text-sm">
              <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                Student Response
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {typeof gradingTarget?.response === "string"
                  ? gradingTarget.response
                  : JSON.stringify(gradingTarget?.response ?? "", null, 2)}
              </p>
            </div>
            {gradingTarget?.rubric ? (
              <div className="border-border bg-secondary/30 rounded-xl border p-3.5 text-xs">
                <p className="text-muted-foreground mb-1 font-semibold uppercase">Rubric Guide</p>
                <pre className="font-sans whitespace-pre-wrap">
                  {typeof gradingTarget.rubric === "string"
                    ? gradingTarget.rubric
                    : JSON.stringify(gradingTarget.rubric, null, 2)}
                </pre>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="grade-marks">Marks Awarded (0–{gradingTarget?.maxMarks})</Label>
                <Input
                  id="grade-marks"
                  type="number"
                  min={0}
                  max={gradingTarget?.maxMarks ?? 10}
                  value={marksAwarded}
                  onChange={(e) => setMarksAwarded(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="grade-feedback">Teacher Feedback</Label>
              <textarea
                id="grade-feedback"
                rows={3}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                placeholder="Constructive feedback shown once score is released..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradingTarget(null)}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={() => void handleGradeSubmit()}>
              {submitting ? "Saving…" : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
