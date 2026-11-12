"use client";

import { CheckCircle2, Code2, Eye, Lock, Plus, Send, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
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
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type AssignmentRow = {
  id: string;
  title: string;
  assignmentType?: string;
  sectionName: string;
  className?: string;
  totalMarks: number;
  questionCount: number;
  submissionCount: number;
  status: string;
  dueDate: string;
};

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PUBLISHED" | "DRAFT" | "CLOSED">(
    "ALL",
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const loadAssignments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await backendRequest<{ items: AssignmentRow[] }>(
        "/api/assignments?page=1&pageSize=100",
      );
      setAssignments(result.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleStatusChange(id: string, nextStatus: "PUBLISHED" | "CLOSED") {
    setBusyId(id);
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
      toast.success(nextStatus === "PUBLISHED" ? "Assignment published." : "Assignment closed.");
      await loadAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update assignment");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = React.useMemo(() => {
    if (statusFilter === "ALL") return assignments;
    return assignments.filter((a) => a.status === statusFilter);
  }, [assignments, statusFilter]);

  const publishedCount = assignments.filter((a) => a.status === "PUBLISHED").length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authoring"
        title="Assignment Management"
        description="Create coding assignments for your sections, publish problem sets, and track student submissions."
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/assignments/new">
              <Plus className="size-4" />
              Create Assignment
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Assignments"
          value={assignments.length}
          icon={Code2}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Published"
          value={publishedCount}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Student Submissions"
          value={totalSubmissions}
          icon={Users}
          tone="info"
          loading={loading}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "PUBLISHED", "DRAFT", "CLOSED"] as const).map((tab) => (
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
              ? `All (${assignments.length})`
              : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>Track deadlines, problem counts, and submissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p role="alert" className="text-destructive p-4 text-sm">
              Could not load assignments: {error}
            </p>
          )}
          {!loading && !error && filtered.length === 0 ? (
            <EmptyState
              title="No assignments found"
              description="Create your first coding assignment to distribute problems to students."
              icon={Code2}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((asg) => (
                  <TableRow key={asg.id}>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/teacher/assignments/${encodeURIComponent(asg.id)}`}
                        className="hover:text-primary transition-colors"
                      >
                        {asg.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {asg.assignmentType || "PROGRAMMING"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asg.className ? `${asg.className} · ` : ""}
                      {asg.sectionName}
                    </TableCell>
                    <TableCell className="tabular-nums">{asg.questionCount} questions</TableCell>
                    <TableCell className="tabular-nums">{asg.totalMarks} pts</TableCell>
                    <TableCell className="tabular-nums">{asg.submissionCount} submitted</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {asg.dueDate ? formatDate(asg.dueDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={asg.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/teacher/assignments/${encodeURIComponent(asg.id)}`}>
                            <Eye className="size-3.5" />
                            Manage
                          </Link>
                        </Button>
                        {asg.status !== "PUBLISHED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === asg.id}
                            onClick={() => void handleStatusChange(asg.id, "PUBLISHED")}
                          >
                            <Send className="size-3.5" />
                            Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === asg.id}
                            onClick={() => void handleStatusChange(asg.id, "CLOSED")}
                          >
                            <Lock className="size-3.5" />
                            Close
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
