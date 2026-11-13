"use client";

import { ArrowLeft, ClipboardCheck, Lock, Save, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { backendRequest } from "@/lib/api/client";
import { formatDate } from "@/lib/dates";

type AssignmentQuestionDetail = {
  id: string;
  title: string;
  description?: string;
  questionType?: string;
  difficulty?: string;
  marks?: number;
  orderNum?: number;
};

type AssignmentDetail = {
  id: string;
  title: string;
  assignmentType?: string;
  description?: string | null;
  instructions?: string | null;
  attachmentInstructions?: string | null;
  maxFileSizeMb?: number | null;
  allowResubmit?: boolean;
  sectionName: string;
  className?: string;
  totalMarks: number;
  status: string;
  dueDate: string;
  questions?: AssignmentQuestionDetail[];
};

const ASSIGNMENT_TYPES = [
  "PROGRAMMING",
  "CONCEPTUAL",
  "SHORT_ANSWER",
  "CASE_STUDY",
  "PRACTICAL",
  "PROJECT",
  "FILE_SUBMISSION",
];

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params?.assignmentId;

  const [assignment, setAssignment] = React.useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editTitle, setEditTitle] = React.useState("");
  const [editType, setEditType] = React.useState("PROGRAMMING");
  const [editDueDate, setEditDueDate] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editInstructions, setEditInstructions] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadAssignment = React.useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await backendRequest<AssignmentDetail>(
        `/api/assignments/${encodeURIComponent(assignmentId)}`,
      );
      setAssignment(detail);
      setEditTitle(detail.title ?? "");
      setEditType(detail.assignmentType ?? "PROGRAMMING");
      setEditDueDate(toDatetimeLocalValue(detail.dueDate));
      setEditDescription(detail.description ?? "");
      setEditInstructions(detail.instructions ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load assignment details.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  React.useEffect(() => {
    void loadAssignment();
  }, [loadAssignment]);

  async function handleSaveEdits(e: React.FormEvent) {
    e.preventDefault();
    if (!assignmentId || !editTitle.trim()) return;
    setSaving(true);
    try {
      await backendRequest(`/api/assignments/${encodeURIComponent(assignmentId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim(),
          assignmentType: editType,
          dueDate: editDueDate || undefined,
          description: editDescription.trim() || null,
          instructions: editInstructions.trim() || null,
        }),
      });
      toast.success("Assignment updated.");
      await loadAssignment();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to save assignment changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(nextStatus: "PUBLISHED" | "CLOSED") {
    if (!assignmentId) return;
    setSaving(true);
    try {
      if (nextStatus === "PUBLISHED") {
        await backendRequest(`/api/assignments/${encodeURIComponent(assignmentId)}/publish`, {
          method: "PATCH",
        });
      } else {
        await backendRequest(`/api/assignments/${encodeURIComponent(assignmentId)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
      }
      toast.success(nextStatus === "PUBLISHED" ? "Assignment published." : "Assignment closed.");
      await loadAssignment();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAssignment} />;
  }

  if (loading || !assignment) {
    return <div className="text-muted-foreground p-6 text-sm">Loading assignment…</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/assignments">
            <ArrowLeft className="size-4" />
            Back to Assignments
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teacher/submissions?assignmentId=${encodeURIComponent(assignment.id)}`}>
              <ClipboardCheck className="size-4" />
              Review Submissions
            </Link>
          </Button>
          {assignment.status !== "PUBLISHED" ? (
            <Button
              size="sm"
              disabled={saving}
              onClick={() => void handleStatusChange("PUBLISHED")}
              className="lp-gradient-bg border-0 text-white hover:opacity-95"
            >
              <Send className="size-4" />
              Publish Assignment
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => void handleStatusChange("CLOSED")}
            >
              <Lock className="size-4" />
              Close Submissions
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        eyebrow={`${assignment.className ? `${assignment.className} · ` : ""}${assignment.sectionName}`}
        title={assignment.title}
        description={`Due ${assignment.dueDate ? formatDate(assignment.dueDate) : "—"} · ${assignment.totalMarks} total marks · ${(assignment.questions ?? []).length} questions`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline">{assignment.assignmentType || "PROGRAMMING"}</Badge>
            <StatusBadge status={assignment.status} />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Update Details & Instructions</CardTitle>
          <CardDescription>
            Edit deadline, assignment type, or guidance for students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveEdits} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="editTitle">Title *</Label>
                <Input
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="editType">Type</Label>
                <NativeSelect
                  id="editType"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  {ASSIGNMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="editDueDate">Due Date</Label>
                <Input
                  id="editDueDate"
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="editDescription">Description</Label>
                <Input
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="editInstructions">Instructions</Label>
              <textarea
                id="editInstructions"
                rows={3}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="size-4" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included Questions ({(assignment.questions ?? []).length})</CardTitle>
          <CardDescription>
            Ordered problems and tasks assigned to {assignment.sectionName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(assignment.questions ?? []).map((q, index) => (
            <div
              key={q.id}
              className="border-border bg-secondary/40 flex flex-col justify-between gap-2 rounded-xl border p-4 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/15 text-primary rounded-md px-2 py-0.5 text-xs font-bold">
                    Q{q.orderNum ?? index + 1}
                  </span>
                  <p className="text-sm font-semibold">{q.title}</p>
                </div>
                {q.description && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">{q.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="text-[11px]">
                  {q.questionType || "PROGRAMMING"}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {q.difficulty || "MEDIUM"}
                </Badge>
                <span className="text-sm font-semibold tabular-nums">{q.marks ?? 10} pts</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
