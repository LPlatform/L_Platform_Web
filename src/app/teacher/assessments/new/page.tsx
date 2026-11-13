"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { backendRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface CourseOption {
  id: string;
  title: string;
}

interface QuestionOption {
  id: string;
  title: string;
  questionType?: string;
  difficulty?: string;
  topic?: string;
  courseModuleId?: string | null;
  marks?: number;
}

interface SectionOption {
  id: string;
  sectionName: string;
  className: string;
}

const DEFAULT_MODULES = [
  { id: "m1-ai-foundations", label: "Module 1 — Introduction to Artificial Intelligence" },
  { id: "m2-ai-careers", label: "Module 2 — Careers and Opportunities in AI" },
  { id: "m3-python", label: "Module 3 — Python Programming" },
  { id: "m4-capstone", label: "Module 4 — Introduction to Capstone Projects" },
  { id: "m5-data-literacy", label: "Module 5 — Data Literacy" },
  { id: "m6-machine-learning", label: "Module 6 — Machine Learning Algorithms" },
  { id: "m7-language-nlp", label: "Module 7 — Linguistics and Natural Language Processing" },
  { id: "m8-ai-ethics", label: "Module 8 — AI Ethics and Values" },
];

export default function NewAssessmentWizardPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  const [courses, setCourses] = React.useState<CourseOption[]>([]);
  const [questions, setQuestions] = React.useState<QuestionOption[]>([]);
  const [sections, setSections] = React.useState<SectionOption[]>([]);
  const [modules, setModules] = React.useState(DEFAULT_MODULES);

  const [courseId, setCourseId] = React.useState("");
  const [moduleId, setModuleId] = React.useState(DEFAULT_MODULES[0]?.id ?? "m1-ai-foundations");
  const [title, setTitle] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState("30");
  const [attemptLimit, setAttemptLimit] = React.useState("1");
  const [selectedQuestionIds, setSelectedQuestionIds] = React.useState<string[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<string[]>([]);
  const [dueAt, setDueAt] = React.useState("");
  const [publishNow, setPublishNow] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [qSearch, setQSearch] = React.useState("");
  const [qModuleFilter, setQModuleFilter] = React.useState("ALL");
  const [qTypeFilter, setQTypeFilter] = React.useState("ALL");
  const [qDifficultyFilter, setQDifficultyFilter] = React.useState("ALL");
  const [qPage, setQPage] = React.useState(1);

  React.useEffect(() => {
    let active = true;
    async function load() {
      const [cRes, qFirst, sRes, aiCourse] = await Promise.all([
        backendRequest<{ items: CourseOption[] }>("/api/learning/courses").catch(() => ({
          items: [],
        })),
        backendRequest<{ items: QuestionOption[]; totalPages?: number }>(
          "/api/questions?page=1&pageSize=500",
        ).catch(() => ({ items: [], totalPages: 1 })),
        backendRequest<{ items: SectionOption[] }>("/api/learning/classes").catch(() => ({
          items: [],
        })),
        backendRequest<{ modules?: Array<{ id: string; title: string }> }>(
          "/api/learning/ai-readiness",
        ).catch(() => ({ modules: [] })),
      ]);

      let allQuestions = qFirst.items ?? [];
      const totalPages = Math.max(1, qFirst.totalPages ?? 1);
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            backendRequest<{ items: QuestionOption[] }>(
              `/api/questions?page=${i + 2}&pageSize=500`,
            ).catch(() => ({ items: [] })),
          ),
        );
        for (const res of rest) {
          allQuestions = [...allQuestions, ...(res.items ?? [])];
        }
      }

      if (!active) return;
      const cList = cRes.items ?? [];
      setCourses(cList);
      if (cList[0]) setCourseId(cList[0].id);
      setQuestions(allQuestions);
      setSections(sRes.items ?? []);
      if (sRes.items?.[0]) setSelectedSectionIds([sRes.items[0].id]);
      if (Array.isArray(aiCourse.modules) && aiCourse.modules.length > 0) {
        const mapped = aiCourse.modules.map((m, idx) => ({
          id: m.id,
          label: `Module ${idx + 1} — ${m.title}`,
        }));
        setModules(mapped);
        if (mapped[0]) setModuleId(mapped[0].id);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSection(id: string) {
    setSelectedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  const totalMarks = selectedQuestionIds.reduce((sum, id) => {
    const q = questions.find((item) => item.id === id);
    return sum + (q?.marks ?? 10);
  }, 0);

  const filteredQuestions = React.useMemo(() => {
    const term = qSearch.trim().toLowerCase();
    return questions.filter((q) => {
      if (qDifficultyFilter !== "ALL" && q.difficulty !== qDifficultyFilter) return false;
      if (qTypeFilter !== "ALL" && (q.questionType || "PROGRAMMING") !== qTypeFilter) return false;
      if (qModuleFilter === "NONE" && q.courseModuleId) return false;
      if (
        qModuleFilter !== "ALL" &&
        qModuleFilter !== "NONE" &&
        q.courseModuleId !== qModuleFilter
      ) {
        return false;
      }
      if (!term) return true;
      return q.title.toLowerCase().includes(term) || (q.topic ?? "").toLowerCase().includes(term);
    });
  }, [questions, qSearch, qModuleFilter, qTypeFilter, qDifficultyFilter]);

  const qTotalPages = Math.max(1, Math.ceil(filteredQuestions.length / 25));
  const safeQPage = Math.min(qPage, qTotalPages);
  const paginatedQuestions = React.useMemo(
    () => filteredQuestions.slice((safeQPage - 1) * 25, safeQPage * 25),
    [filteredQuestions, safeQPage],
  );

  async function handleSubmit() {
    if (!title.trim() || !courseId || !moduleId.trim() || selectedQuestionIds.length === 0) {
      toast.error("Please fill assessment details and choose at least one question.");
      return;
    }
    setSaving(true);
    try {
      const created = await backendRequest<{ id: string }>("/api/assessments", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          moduleId: moduleId.trim(),
          title: title.trim(),
          instructions: instructions.trim(),
          durationMinutes: Number(durationMinutes) || 30,
          attemptLimit: Math.max(1, Number(attemptLimit) || 1),
          status: publishNow ? "PUBLISHED" : "DRAFT",
          questionIds: selectedQuestionIds,
          sectionIds: publishNow ? selectedSectionIds : [],
          dueAt: dueAt || null,
        }),
      });
      toast.success("Assessment saved.");
      router.push(`/teacher/assessments/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create assessment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/assessments">
            <ArrowLeft className="size-4" />
            Back to Assessments
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessment Builder Wizard</h1>
        <p className="text-muted-foreground text-sm">
          Configure assessment metadata, select questions, and assign to your classes in 3 steps.
        </p>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1 as const, label: "1. Metadata & Module" },
          { num: 2 as const, label: `2. Questions (${selectedQuestionIds.length})` },
          { num: 3 as const, label: "3. Assign & Publish" },
        ].map((item) => (
          <button
            key={item.num}
            type="button"
            onClick={() => setStep(item.num)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-all",
              step === item.num
                ? "lp-gradient-bg border-transparent text-white shadow-sm"
                : step > item.num
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Metadata & Target Course</CardTitle>
            <CardDescription>Title, course linkage, duration, and attempts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="asmt-course">Course *</Label>
                <NativeSelect
                  id="asmt-course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="asmt-module">Module *</Label>
                <NativeSelect
                  id="asmt-module"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="asmt-title">Assessment Title *</Label>
              <Input
                id="asmt-title"
                placeholder="e.g. Module 2 Checkpoint Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="asmt-dur">Duration (minutes)</Label>
                <Input
                  id="asmt-dur"
                  type="number"
                  min={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="asmt-limit">Attempt Limit</Label>
                <Input
                  id="asmt-limit"
                  type="number"
                  min={1}
                  value={attemptLimit}
                  onChange={(e) => setAttemptLimit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="asmt-inst">Instructions</Label>
              <textarea
                id="asmt-inst"
                rows={3}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                placeholder="Instructions shown to students before starting..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    toast.error("Enter an assessment title before proceeding.");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next: Select Questions
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Step 2: Select Questions ({selectedQuestionIds.length})</CardTitle>
                <CardDescription>
                  Total Score Blueprint: {totalMarks} marks · {questions.length} bank questions
                  loaded
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {moduleId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQModuleFilter(moduleId);
                      setQPage(1);
                    }}
                  >
                    Filter to Target Module
                  </Button>
                )}
                {qModuleFilter !== "ALL" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setQModuleFilter("ALL");
                      setQPage(1);
                    }}
                  >
                    Show All Modules
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  placeholder="Search questions..."
                  value={qSearch}
                  onChange={(e) => {
                    setQSearch(e.target.value);
                    setQPage(1);
                  }}
                  className="bg-card pl-8"
                />
              </div>

              <NativeSelect
                aria-label="Filter by module"
                value={qModuleFilter}
                onChange={(e) => {
                  setQModuleFilter(e.target.value);
                  setQPage(1);
                }}
              >
                <option value="ALL">All modules</option>
                <option value="NONE">Standalone / Programming</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                aria-label="Filter by question type"
                value={qTypeFilter}
                onChange={(e) => {
                  setQTypeFilter(e.target.value);
                  setQPage(1);
                }}
              >
                <option value="ALL">All types</option>
                {[
                  "PROGRAMMING",
                  "CODE",
                  "SINGLE_MCQ",
                  "MULTI_SELECT",
                  "TRUE_FALSE",
                  "FILL_BLANK",
                  "SHORT_ANSWER",
                  "LONG_CASE",
                  "PRACTICAL",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                aria-label="Filter by difficulty"
                value={qDifficultyFilter}
                onChange={(e) => {
                  setQDifficultyFilter(e.target.value);
                  setQPage(1);
                }}
              >
                <option value="ALL">All difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </NativeSelect>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No questions found matching your filters.
              </p>
            ) : (
              <div className="space-y-2.5">
                {paginatedQuestions.map((q) => {
                  const active = selectedQuestionIds.includes(q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => toggleQuestion(q.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/40 hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={active}
                          readOnly
                          className="size-4 accent-[var(--primary)]"
                        />
                        <div>
                          <p className="text-sm font-medium">{q.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {q.questionType || "QUESTION"} · {q.topic || "General"} ·{" "}
                            {q.difficulty || "MEDIUM"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{q.marks ?? 10} pts</Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {qTotalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground text-xs">
                  Showing {paginatedQuestions.length} of {filteredQuestions.length} · Page{" "}
                  {safeQPage} / {qTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeQPage <= 1}
                    onClick={() => setQPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeQPage >= qTotalPages}
                    onClick={() => setQPage((p) => Math.min(qTotalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Previous
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (selectedQuestionIds.length === 0) {
                    toast.error("Select at least one question.");
                    return;
                  }
                  setStep(3);
                }}
              >
                Next: Assign & Review
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Assign Sections & Publish</CardTitle>
            <CardDescription>Review blueprint summary and target sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="border-border bg-secondary/40 grid gap-3 rounded-xl border p-4 text-xs sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Title</p>
                <p className="mt-1 text-sm font-semibold">{title}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Questions / Marks</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedQuestionIds.length} questions · {totalMarks} pts
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration / Attempts</p>
                <p className="mt-1 text-sm font-semibold">
                  {durationMinutes} min · {attemptLimit} attempt(s)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="publish-now"
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              <Label htmlFor="publish-now">Publish assessment and assign to sections now</Label>
            </div>

            {publishNow && (
              <div className="space-y-3">
                <Label>Target Sections</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sections.map((sec) => {
                    const checked = selectedSectionIds.includes(sec.id);
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-medium transition-all",
                          checked
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary/40",
                        )}
                      >
                        <input type="checkbox" checked={checked} readOnly className="size-4" />
                        <span>
                          {sec.className} · {sec.sectionName}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid max-w-xs gap-1.5">
                  <Label htmlFor="asmt-due">Optional Due Date</Label>
                  <Input
                    id="asmt-due"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Previous
              </Button>
              <Button
                type="button"
                disabled={saving}
                className="lp-gradient-bg border-0 text-white hover:opacity-95"
                onClick={() => void handleSubmit()}
              >
                {publishNow ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <ClipboardCheck className="size-4" />
                )}
                {saving ? "Saving…" : publishNow ? "Create & Publish Assessment" : "Save as Draft"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
