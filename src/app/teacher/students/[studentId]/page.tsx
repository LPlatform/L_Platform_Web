"use client";

import { ArrowLeft, BookOpen, ClipboardCheck, Code2, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, formatDateTime } from "@/lib/dates";

interface StudentProfileResponse {
  student: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    organizationName: string;
    createdAt: string;
  };
  sections: Array<{
    id: string;
    sectionName: string;
    className: string;
    academicYear: string;
    joinedAt: string;
  }>;
  lessonsCompleted: number;
  submissions: Array<{
    id: string;
    assignmentTitle: string;
    questionTitle: string;
    language: string;
    status: string;
    score: number | null;
    submittedAt: string;
  }>;
  assessmentAttempts: Array<{
    id: string;
    assessmentId: string;
    assessmentTitle: string;
    status: string;
    score: number | null;
    totalMarks: number;
    submittedAt: string | null;
  }>;
}

export default function TeacherStudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const [data, setData] = React.useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendRequest<StudentProfileResponse>(
        `/api/teacher/students/${encodeURIComponent(params.studentId)}/profile`,
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load student profile");
    } finally {
      setLoading(false);
    }
  }, [params.studentId]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Profile" eyebrow="Classroom" />
        <div className="surface">
          <ErrorState
            message={error || "Student profile unavailable"}
            onRetry={() => void loadProfile()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.student.organizationName}
        title={data.student.name}
        description={`${data.student.email || "No email"} · Joined ${formatDate(data.student.createdAt)}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/teacher/students">
              <ArrowLeft className="size-4" />
              Back to Students
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={data.student.status} />
        {data.sections.map((sec) => (
          <Badge key={sec.id} variant="secondary">
            {sec.className} · {sec.sectionName}
          </Badge>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enrolled Sections"
          value={data.sections.length}
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Lessons Completed"
          value={data.lessonsCompleted}
          hint="Course progress tracking"
          icon={BookOpen}
          tone="success"
        />
        <StatCard
          label="Coding Submissions"
          value={data.submissions.length}
          icon={Code2}
          tone="info"
        />
        <StatCard
          label="Assessment Attempts"
          value={data.assessmentAttempts.length}
          icon={ClipboardCheck}
          tone="warning"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Attempts</CardTitle>
            <CardDescription>Course assessment results and grading status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assessmentAttempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                      No assessment attempts yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.assessmentAttempts.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell>
                        <Link
                          href={`/teacher/assessments/${att.assessmentId}`}
                          className="hover:text-primary font-medium"
                        >
                          {att.assessmentTitle}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {att.submittedAt ? formatDateTime(att.submittedAt) : "In progress"}
                        </p>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {att.score !== null ? `${att.score} / ${att.totalMarks}` : "Pending"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={att.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coding Submissions</CardTitle>
            <CardDescription>Recent code submissions in your sections</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                      No coding submissions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <p className="font-medium">{sub.questionTitle}</p>
                        <p className="text-muted-foreground text-xs">{sub.assignmentTitle}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{sub.language}</TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
