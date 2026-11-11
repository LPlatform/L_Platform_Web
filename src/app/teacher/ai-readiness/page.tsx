"use client";

import { BookOpen, CheckCircle2, ClipboardCheck, Layers, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Lesson = { title: string; content: string; activity: string };
type Module = {
  id: string;
  title: string;
  sourcePages: string;
  introduction: string;
  objectives: string[];
  concepts: string[];
  lessons: Lesson[];
  revisionNotes: string[];
  practice: string[];
};
type CoursePayload = {
  title: string;
  description: string;
  attribution: string;
  modules: Module[];
};

export default function TeacherAiReadinessLessonManagerPage() {
  const [course, setCourse] = React.useState<CoursePayload | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadCourse = React.useCallback(() => {
    setError(null);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${apiBase}/api/learning/ai-readiness`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Course request failed (${response.status})`);
        return (await response.json()) as CoursePayload;
      })
      .then((value) => {
        setCourse(value);
        setSelectedId((prev) => prev ?? value.modules[0]?.id ?? null);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Could not load course content.");
      });
  }, []);

  React.useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const selected = course?.modules.find((module) => module.id === selectedId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Interactive curriculum"
        title={course?.title ?? "AI Readiness Course"}
        description={
          course?.description ??
          "Structured teacher lesson plans, classroom activities, revision notes, and handbook references."
        }
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/assessments/new">
              <ClipboardCheck className="size-4" />
              Create Module Assessment
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="surface">
          <ErrorState message={error} onRetry={loadCourse} />
        </div>
      ) : !course ? (
        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <Skeleton className="h-[460px] rounded-xl" />
          <Skeleton className="h-[460px] rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="text-primary size-4" />
                Course Modules ({course.modules.length})
              </CardTitle>
              <CardDescription>Select a module to inspect lessons & activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {course.modules.map((module, index) => {
                const active = selectedId === module.id;
                return (
                  <button
                    key={module.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(module.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition-all",
                      active
                        ? "lp-gradient-bg border-transparent text-white shadow-md shadow-violet-950/30"
                        : "border-border bg-secondary/40 text-foreground hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                        active ? "bg-white/20 text-white" : "bg-primary/15 text-primary",
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-semibold">{module.title}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px]",
                          active ? "text-white/80" : "text-muted-foreground",
                        )}
                      >
                        {module.lessons.length} lessons · Handbook {module.sourcePages}
                      </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selected && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="violet">
                      <Sparkles className="size-3" />
                      Handbook pp. {selected.sourcePages}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {selected.lessons.length} structured lessons
                    </span>
                  </div>
                  <CardTitle className="pt-1 text-2xl">{selected.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {selected.introduction}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="border-border bg-secondary/40 rounded-xl border p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      Learning Objectives
                    </h3>
                    <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
                      {selected.objectives.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-border bg-secondary/40 rounded-xl border p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <BookOpen className="text-primary size-4" />
                      Key Concepts
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.concepts.map((concept) => (
                        <Badge key={concept} variant="secondary">
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {selected.lessons.map((lesson, idx) => (
                  <Card key={lesson.title}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                          {idx + 1}
                        </span>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {lesson.content}
                      </p>
                      <div className="border-primary/25 bg-primary/10 rounded-xl border p-3.5 text-xs">
                        <p className="text-primary mb-1 flex items-center gap-1.5 font-semibold">
                          <Lightbulb className="size-3.5" />
                          Classroom Activity
                        </p>
                        <p className="text-foreground leading-relaxed">{lesson.activity}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Revision Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
                      {selected.revisionNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Practice & Discussion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
                      {selected.practice.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <p className="text-muted-foreground text-xs">{course.attribution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
