"use client";

import { ClipboardCheck, Eye, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";
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
  studentName: string;
  studentEmail: string;
  questionTitle: string;
  language: string;
  status: string;
  score: number | null;
  submittedAt: string;
  code: string;
  testCasesPassed: number;
  totalTestCases: number;
}

export default function TeacherSubmissionsPage() {
  const [selectedSub, setSelectedSub] = React.useState<SubmissionItem | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    backendRequest<{ items: Array<Record<string, unknown>> }>(
      "/api/submissions?page=1&pageSize=100",
    )
      .then(({ items }) =>
        setSubmissions(
          (items ?? []).map((item) => ({
            id: String(item.id),
            studentName: String(item.studentName ?? "Unknown"),
            studentEmail: String(item.studentEmail ?? ""),
            questionTitle: String(item.questionTitle ?? "Unknown question"),
            language: String(item.language ?? ""),
            status: String(item.status ?? "PENDING"),
            score: typeof item.score === "number" ? item.score : null,
            submittedAt: item.submittedAt
              ? new Date(String(item.submittedAt)).toLocaleString()
              : "—",
            code: String(item.code ?? ""),
            testCasesPassed: Number(item.passedTestCases ?? 0),
            totalTestCases: Number(item.totalTestCases ?? 0),
          })),
        ),
      )
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load submissions"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.questionTitle.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q)
      );
    });
  }, [submissions, statusFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Grading"
        title="Submission Review"
        description="Inspect submitted student source code. Submissions remain pending evaluation until an isolated execution worker processes them."
        actions={
          <Button variant="outline" asChild>
            <Link href="/teacher/assessments">
              <ClipboardCheck className="size-4" />
              Written Assessment Grading
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "COMPLETED"] as const).map((tab) => (
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
                  ? "Pending Evaluation"
                  : "Evaluated"}
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
            placeholder="Search student or problem..."
            className="bg-card pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Code Submissions</CardTitle>
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
              description="Student code submissions from the Student App appear here."
              icon={Eye}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
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
                    <TableCell className="font-medium">{sub.questionTitle}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {sub.language}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {sub.score == null ? "Pending" : `${sub.score}%`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {sub.submittedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSub(sub)}>
                        <Eye className="size-3.5" />
                        Inspect Code
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
                {selectedSub.language} · Score:{" "}
                {selectedSub.score == null ? "Pending worker evaluation" : `${selectedSub.score}%`}{" "}
                ({selectedSub.testCasesPassed}/{selectedSub.totalTestCases} test cases)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="border-border bg-secondary/70 max-h-[420px] overflow-auto rounded-xl border p-4">
                <pre className="font-mono text-xs leading-relaxed text-slate-100">
                  {selectedSub.code}
                </pre>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedSub(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
