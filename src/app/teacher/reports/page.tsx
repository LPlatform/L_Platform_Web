"use client";

import { BarChart3, CheckCircle2, ClipboardCheck, Code2, Download, Users } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { downloadCsv } from "@/lib/utils";

interface TeacherClassSummary {
  id: string;
  className: string;
  sectionName: string;
  studentCount: number;
  maxStudents: number;
  courses: Array<{ id: string }>;
}

interface AssignmentSummary {
  id: string;
  title: string;
  sectionName: string;
  submissionCount: number;
  status: string;
}

interface AssessmentSummary {
  id: string;
  title: string;
  courseTitle: string;
  attemptCount: number;
  pendingReviewCount: number;
}

export default function TeacherReportsPage() {
  const [classes, setClasses] = React.useState<TeacherClassSummary[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentSummary[]>([]);
  const [assessments, setAssessments] = React.useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clsRes, asgRes, asmtRes] = await Promise.all([
        backendRequest<{ items: TeacherClassSummary[] }>("/api/learning/classes"),
        backendRequest<{ items: AssignmentSummary[] }>("/api/assignments?page=1&pageSize=100"),
        backendRequest<{ items: AssessmentSummary[] }>("/api/assessments"),
      ]);
      setClasses(clsRes.items ?? []);
      setAssignments(asgRes.items ?? []);
      setAssessments(asmtRes.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load teacher reports");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissionCount, 0);
  const totalAttempts = assessments.reduce((sum, a) => sum + a.attemptCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Teacher Reports"
        description="Live summary of class rosters, coding assignment submissions, and course assessment participation."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              downloadCsv(
                `teacher-report-${new Date().toISOString().slice(0, 10)}.csv`,
                ["Class", "Section", "Students", "Capacity", "Courses"],
                classes.map((c) => [
                  c.className,
                  c.sectionName,
                  c.studentCount,
                  c.maxStudents,
                  c.courses.length,
                ]),
              );
              toast.success("Downloaded class summary CSV.");
            }}
          >
            <Download className="size-4" />
            Export Class CSV
          </Button>
        }
      />

      {error ? (
        <div className="surface">
          <ErrorState message={error} onRetry={() => void loadReports()} />
        </div>
      ) : loading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Assigned Classes" value={classes.length} icon={Users} tone="violet" />
            <StatCard
              label="Enrolled Students"
              value={totalStudents}
              icon={BarChart3}
              tone="info"
            />
            <StatCard
              label="Coding Submissions"
              value={totalSubmissions}
              icon={Code2}
              tone="success"
            />
            <StatCard
              label="Assessment Attempts"
              value={totalAttempts}
              icon={ClipboardCheck}
              tone="warning"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Class Utilization</CardTitle>
                <CardDescription>Student enrollment against section capacity</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class · Section</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Courses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">
                          {cls.className} · {cls.sectionName}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {cls.studentCount} / {cls.maxStudents}
                        </TableCell>
                        <TableCell className="tabular-nums">{cls.courses.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment Completion</CardTitle>
                <CardDescription>Student attempts and open rubric reviews</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Pending Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell className="tabular-nums">{a.attemptCount}</TableCell>
                        <TableCell className="tabular-nums">
                          {a.pendingReviewCount > 0 ? (
                            <span className="font-semibold text-amber-400">
                              {a.pendingReviewCount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="size-3.5" />0
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
