"use client";

import { Eye } from "lucide-react";
import * as React from "react";
import { backendRequest } from "@/lib/api/client";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    backendRequest<{ items: Array<Record<string, unknown>> }>("/api/submissions?page=1&pageSize=100")
      .then(({ items }) => setSubmissions((items ?? []).map((item) => ({
        id: String(item.id), studentName: String(item.studentName ?? "Unknown"), studentEmail: String(item.studentEmail ?? ""),
        questionTitle: String(item.questionTitle ?? "Unknown question"), language: String(item.language ?? ""),
        status: String(item.status ?? "PENDING"), score: typeof item.score === "number" ? item.score : null,
        submittedAt: item.submittedAt ? new Date(String(item.submittedAt)).toLocaleString() : "—",
        code: String(item.code ?? ""), testCasesPassed: Number(item.passedTestCases ?? 0), totalTestCases: Number(item.totalTestCases ?? 0),
      }))))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load submissions"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Submission Review</h2>
        <p className="text-muted-foreground text-sm">
          Review submitted source code. Evaluation remains pending until an isolated execution worker is available.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Student Submissions</CardTitle>
          <CardDescription>Filtered to your assigned sections and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p role="alert" className="mb-4 text-sm text-destructive">Could not load submissions: {error}</p>}
          {!error && submissions.length === 0 && <p className="mb-4 text-sm text-muted-foreground">No submissions are available yet.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{sub.studentName}</p>
                    <p className="text-muted-foreground text-xs">{sub.studentEmail}</p>
                  </TableCell>
                  <TableCell className="font-medium">{sub.questionTitle}</TableCell>
                  <TableCell className="font-mono text-xs">{sub.language}</TableCell>
                  <TableCell>
                    <Badge
                      variant={sub.status === "COMPLETED" ? "default" : "secondary"}
                      className={sub.status === "COMPLETED" ? "bg-emerald-600" : ""}
                    >
                      {sub.status === "PENDING" ? "PENDING • NOT EVALUATED" : sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{sub.score == null ? "Pending" : `${sub.score}%`}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{sub.submittedAt}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedSub(sub)}>
                      <Eye className="mr-1.5 size-3.5" />
                      Inspect Code
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Code Inspection Modal */}
      {selectedSub && (
        <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSub.studentName} â€” {selectedSub.questionTitle}
              </DialogTitle>
              <DialogDescription>
                {selectedSub.language} Â· Score: {selectedSub.score}% ({selectedSub.testCasesPassed}/
                {selectedSub.totalTestCases} test cases passed)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-muted border-border overflow-x-auto rounded-lg border p-4">
                <pre className="font-mono text-xs leading-relaxed">{selectedSub.code}</pre>
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
