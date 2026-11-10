"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { backendRequest } from "@/lib/api/client";
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

export default function TeacherAssignmentsPage() {
  type AssignmentRow = { id: string; title: string; sectionName: string; totalMarks: number; questionCount: number; submissionCount: number; status: string; dueDate: string };
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    backendRequest<{ items: AssignmentRow[] }>("/api/assignments?page=1&pageSize=100")
      .then((result) => setAssignments(result.items ?? []))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load assignments"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignment Management</h2>
          <p className="text-muted-foreground text-sm">
            Publish coding assignments to your sections, configure problem sets, and review student
            progress.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Link href="/teacher/assignments/new">
            <Plus className="mr-2 size-4" />
            Create Assignment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            Track status, deadlines, and submissions across sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p role="alert" className="mb-4 text-sm text-destructive">Could not load assignments: {error}</p>}
          {!error && assignments.length === 0 && <p className="mb-4 text-sm text-muted-foreground">No assignments are available for your account yet.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment Title</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((asg) => (
                <TableRow key={asg.id}>
                  <TableCell className="font-semibold">{asg.title}</TableCell>
                  <TableCell className="text-muted-foreground">{asg.sectionName}</TableCell>
                  <TableCell>{asg.questionCount} problems</TableCell>
                  <TableCell>{asg.totalMarks} pts</TableCell>
                  <TableCell>{asg.submissionCount} submitted</TableCell>
                  <TableCell className="text-xs">{asg.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={asg.status === "PUBLISHED" ? "default" : "secondary"}
                      className={asg.status === "PUBLISHED" ? "bg-emerald-600" : ""}
                    >
                      {asg.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
