"use client";

import { ArrowUpRight, BookOpen, ClipboardCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { backendRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface CourseItem {
  id: string;
  publicId: string;
  title: string;
  category: string;
  description: string;
  language: string;
  difficulty: string;
  status: string;
  version: number;
  scopeType: "PLATFORM_FREE" | "SCHOOL";
  accessEnabled: boolean;
  hasInteractiveReader: boolean;
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = React.useState<CourseItem[]>([]);
  const [scopeTab, setScopeTab] = React.useState<"ALL" | "PLATFORM_FREE" | "SCHOOL">("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadCourses = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendRequest<{ items: CourseItem[] }>("/api/learning/courses");
      setCourses(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const filtered = React.useMemo(() => {
    if (scopeTab === "ALL") return courses;
    return courses.filter((c) => c.scopeType === scopeTab);
  }, [courses, scopeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curriculum"
        title="Courses"
        description="Browse platform-wide courses and school-allocated programming courses available to your sections."
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/assessments/new">
              <ClipboardCheck className="size-4" />
              Create Course Assessment
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "ALL", label: `All Courses (${courses.length})` },
            {
              key: "PLATFORM_FREE",
              label: `Platform Free (${courses.filter((c) => c.scopeType === "PLATFORM_FREE").length})`,
            },
            {
              key: "SCHOOL",
              label: `School Courses (${courses.filter((c) => c.scopeType === "SCHOOL").length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setScopeTab(tab.key)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
              scopeTab === tab.key
                ? "lp-gradient-bg border-transparent text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="surface">
          <ErrorState message={error} onRetry={() => void loadCourses()} />
        </div>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface">
          <EmptyState
            title="No courses in this view"
            description="Courses allocated to your school or published platform-wide appear here."
            icon={BookOpen}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={course.scopeType} />
                  <Badge variant="outline">
                    {course.language} · {course.difficulty}
                  </Badge>
                </div>
                <CardTitle className="pt-2 text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="border-border/60 flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground text-xs">
                  {course.category} · v{course.version}
                </span>
                <div className="flex items-center gap-2">
                  {course.hasInteractiveReader && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/teacher/ai-readiness">
                        <Sparkles className="size-3.5" />
                        Lesson Manager
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" asChild>
                    <Link href="/teacher/assessments/new">
                      Assess
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
