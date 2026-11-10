"use client";

import { Eye } from "lucide-react";
import * as React from "react";
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
  status: "PASS" | "FAIL" | "TIMEOUT" | "RUNTIME_ERROR";
  score: number;
  submittedAt: string;
  code: string;
  testCasesPassed: number;
  totalTestCases: number;
}

export default function TeacherSubmissionsPage() {
  const [selectedSub, setSelectedSub] = React.useState<SubmissionItem | null>(null);

  const submissions: SubmissionItem[] = [
    {
      id: "sub-001",
      studentName: "Alice Walker",
      studentEmail: "student1@riverside.edu",
      questionTitle: "Sum of Two Integers",
      language: "PYTHON",
      status: "PASS",
      score: 100,
      testCasesPassed: 4,
      totalTestCases: 4,
      submittedAt: "10 minutes ago",
      code: `import sys\n\ndef main():\n    line = sys.stdin.read().strip()\n    if line:\n        a, b = map(int, line.split())\n        print(a + b)\n\nif __name__ == '__main__':\n    main()`,
    },
    {
      id: "sub-002",
      studentName: "Bob Smith",
      studentEmail: "student2@riverside.edu",
      questionTitle: "Find Maximum Element",
      language: "PYTHON",
      status: "FAIL",
      score: 50,
      testCasesPassed: 1,
      totalTestCases: 2,
      submittedAt: "1 hour ago",
      code: `import sys\n\ndef main():\n    lines = sys.stdin.read().strip().split('\\n')\n    # Incomplete logic for negative numbers\n    nums = list(map(int, lines[1].split()))\n    print(max(0, max(nums)))\n\nif __name__ == '__main__':\n    main()`,
    },
    {
      id: "sub-003",
      studentName: "Charlie Davis",
      studentEmail: "charlie@riverside.edu",
      questionTitle: "Sum of Two Integers",
      language: "CPP",
      status: "PASS",
      score: 100,
      testCasesPassed: 4,
      totalTestCases: 4,
      submittedAt: "3 hours ago",
      code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Submission Review</h2>
        <p className="text-muted-foreground text-sm">
          Inspect student code submissions, review automated evaluation scores, and verify test case
          pass rates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Student Submissions</CardTitle>
          <CardDescription>Filtered to your assigned sections and assignments</CardDescription>
        </CardHeader>
        <CardContent>
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
                      variant={sub.status === "PASS" ? "default" : "destructive"}
                      className={sub.status === "PASS" ? "bg-emerald-600" : ""}
                    >
                      {sub.status} ({sub.testCasesPassed}/{sub.totalTestCases})
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{sub.score}%</TableCell>
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
                {selectedSub.studentName} — {selectedSub.questionTitle}
              </DialogTitle>
              <DialogDescription>
                {selectedSub.language} · Score: {selectedSub.score}% ({selectedSub.testCasesPassed}/
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
