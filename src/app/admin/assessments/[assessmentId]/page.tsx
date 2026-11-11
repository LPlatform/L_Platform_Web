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
import { useSections } from "@/lib/hooks/use-platform-data";

interface AssessmentDetail {
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
  createdAt: string;
  questions: Array<{
    id: string;
    title: string;
    description: string;
    questionType: string;
    difficulty: string;
    topic: string;
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

export default function AdminAssessmentDetailPage() {
  const params = useParams<{ assessmentId: string }>();
  const [data, setData] = React.useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const sectionsQuery = useSections({ page: 1, pageSize: 100, status: "ACTIVE" });

  const loadDetail = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await backendRequest<AssessmentDetail>(
        `/api/assessments/${encodeURIComponent(params.assessmentId)}`,
      );
      setData(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assessment");
    } finally {
      setLoading(false);
    }
  }, [params.assessmentId]);

  React.useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function handlePublish() {
    if (!data) return;
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(data.id)}/publish`, {
        method: "PATCH",
      });
      toast.success("Assessment published.");
      await loadDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish assessment");
    }
  }

  async function handleAssign() {
    if (!data || !selectedSectionId) return;
    setSubmitting(true);
    try {
      await backendRequest(`/api/assessments/${encodeURIComponent(data.id)}/assign`, {
        method: "POST",
        body: JSON.stringify({ sectionId: selectedSectionId }),
      });
      toast.success("Section assigned to assessment.");
      setAssignOpen(false);
      await loadDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign section");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment" eyebrow="Academics" />
        <div className="surface">
          <ErrorState message={error || "Assessment not found"} onRetry={() => void loadDetail()} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${data.courseTitle} · ${data.moduleId}`}
        title={data.title}
        description={data.instructions || "No additional instructions provided."}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/assessments">
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
              onClick={() => {
                setSelectedSectionId(sectionsQuery.data?.items?.[0]?.id ?? "");
                setAssignOpen(true);
              }}
            >
              <Plus className="size-4" />
              Assign Section
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={data.status} />
        <Badge variant="outline">Attempts allowed: {data.attemptLimit}</Badge>
        <Badge variant="outline">
          Duration: {data.durationMinutes ? `${data.durationMinutes} min` : "Untimed"}
        </Badge>
      </div>

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
          hint={`Pass mark: ${data.passingMarks ?? 0}`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Assigned Sections"
          value={data.assignments.length}
          icon={Users}
          tone="info"
        />
        <StatCard label="Attempts" value={data.attempts.length} icon={Clock} tone="warning" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Question Blueprint</CardTitle>
            <CardDescription>{data.questions.length} linked questions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.questions.map((q, idx) => (
                  <TableRow key={q.id}>
                    <TableCell className="tabular-nums">{idx + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium">{q.title}</p>
                      <p className="text-muted-foreground text-xs">{q.topic}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{q.questionType}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{q.marks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Sections</CardTitle>
            <CardDescription>Sections with access to this assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {data.assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sections assigned yet.</p>
            ) : (
              <ul className="divide-border divide-y">
                {data.assignments.map((a) => (
                  <li
                    key={a.assignmentId}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {a.className} — {a.sectionName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {a.dueAt ? `Due ${formatDateTime(a.dueAt)}` : "No due date"}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
          <CardDescription>
            Submitted and in-progress attempts across scoped sections
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
                <TableHead>Released</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    No student attempts yet.
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
                    <TableCell className="text-muted-foreground text-xs">
                      {att.releasedAt ? formatDateTime(att.releasedAt) : "Not released"}
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
              Select an active section to assign this assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="detail-section-select">Section</Label>
            <NativeSelect
              id="detail-section-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <option value="">Select section…</option>
              {(sectionsQuery.data?.items ?? []).map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.className} — {sec.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!selectedSectionId || submitting} onClick={() => void handleAssign()}>
              {submitting ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
