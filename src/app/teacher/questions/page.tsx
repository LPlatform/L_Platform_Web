"use client";

import { ChevronLeft, ChevronRight, Code2, Eye, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
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
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { backendRequest } from "@/lib/api/client";

type QuestionOptionItem = {
  id: string;
  optionText: string;
  orderNum: number;
  isCorrect?: boolean;
};

type TestCaseItem = {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  isSample?: boolean;
};

type QuestionRubric = {
  criteria?: string[];
  expectedPoints?: string[];
  sampleAnswer?: string;
};

type QuestionRow = {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  questionType?: string;
  courseModuleId?: string | null;
  supportedLanguages?: string[];
  marks?: number;
  testCaseCount?: number;
  sourcePage?: string | null;
  sourceReference?: string | null;
  learningObjective?: string | null;
  explanation?: string | null;
  answerKey?: unknown;
  rubric?: QuestionRubric | null;
  options?: QuestionOptionItem[];
  testCases?: TestCaseItem[];
};

type ModuleOption = {
  id: string;
  title: string;
  moduleNumber?: number;
};

const PAGE_SIZE = 25;

const QUESTION_TYPES = [
  "PROGRAMMING",
  "CODE",
  "SINGLE_MCQ",
  "MULTI_SELECT",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SHORT_ANSWER",
  "LONG_CASE",
  "PRACTICAL",
];

function TeacherQuestionsContent() {
  const searchParams = useSearchParams();
  const initialModule = searchParams.get("courseModuleId") || "ALL";

  const [search, setSearch] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("ALL");
  const [questionType, setQuestionType] = React.useState("ALL");
  const [courseModuleId, setCourseModuleId] = React.useState(initialModule);
  const [page, setPage] = React.useState(1);

  const [questions, setQuestions] = React.useState<QuestionRow[]>([]);
  const [modules, setModules] = React.useState<ModuleOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [previewQuestion, setPreviewQuestion] = React.useState<QuestionRow | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    const paramModule = searchParams.get("courseModuleId");
    if (paramModule) {
      setCourseModuleId(paramModule);
      setPage(1);
    }
  }, [searchParams]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    async function load() {
      try {
        const [firstPage, courseRes] = await Promise.all([
          backendRequest<{ items: QuestionRow[]; totalPages?: number }>(
            "/api/questions?page=1&pageSize=500",
          ),
          backendRequest<{ modules?: ModuleOption[] }>("/api/learning/ai-readiness").catch(() => ({
            modules: [],
          })),
        ]);

        let allItems = firstPage.items ?? [];
        const totalPages = Math.max(1, firstPage.totalPages ?? 1);
        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              backendRequest<{ items: QuestionRow[] }>(`/api/questions?page=${i + 2}&pageSize=500`),
            ),
          );
          for (const res of rest) {
            allItems = [...allItems, ...(res.items ?? [])];
          }
        }
        if (!active) return;
        setQuestions(allItems);
        setModules(courseRes.modules ?? []);
        setError(null);
      } catch (cause: unknown) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load questions");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const moduleLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    modules.forEach((m, idx) => {
      map.set(m.id, `Module ${m.moduleNumber ?? idx + 1}: ${m.title}`);
    });
    return map;
  }, [modules]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (difficulty !== "ALL" && q.difficulty !== difficulty) return false;
      if (questionType !== "ALL" && (q.questionType || "PROGRAMMING") !== questionType) {
        return false;
      }
      if (courseModuleId === "NONE" && q.courseModuleId) return false;
      if (
        courseModuleId !== "ALL" &&
        courseModuleId !== "NONE" &&
        q.courseModuleId !== courseModuleId
      ) {
        return false;
      }
      if (!term) return true;
      return (
        q.title.toLowerCase().includes(term) ||
        (q.topic ?? "").toLowerCase().includes(term) ||
        (q.description ?? "").toLowerCase().includes(term) ||
        (q.sourceReference ?? "").toLowerCase().includes(term)
      );
    });
  }, [questions, difficulty, questionType, courseModuleId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = React.useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  async function openPreview(q: QuestionRow) {
    setPreviewQuestion(q);
    setPreviewLoading(true);
    try {
      const detail = await backendRequest<QuestionRow>(
        `/api/questions/${encodeURIComponent(q.id)}`,
      );
      setPreviewQuestion(detail);
    } catch {
      // Keep summary data if detail request fails
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authoring"
        title="Question Bank"
        description="Browse AI Readiness curriculum questions, coding tasks, case studies, and reusable assessment items."
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/questions/new">
              <Plus className="size-4" />
              Add New Question
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            placeholder="Search by title, topic, or reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-card pl-9"
          />
        </div>

        <NativeSelect
          aria-label="Filter by module"
          value={courseModuleId}
          onChange={(e) => {
            setCourseModuleId(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All modules & coding tasks</option>
          <option value="NONE">Standalone / Programming tasks</option>
          {modules.map((m, idx) => (
            <option key={m.id} value={m.id}>
              Module {m.moduleNumber ?? idx + 1} — {m.title}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filter by question type"
          value={questionType}
          onChange={(e) => {
            setQuestionType(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All question types</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </NativeSelect>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              {loading ? "All Questions (Loading…)" : `All Questions (${filtered.length})`}
            </CardTitle>
            <CardDescription>
              {loading
                ? "Fetching Question Bank from backend…"
                : `Showing ${filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} matching questions`}
            </CardDescription>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                Page {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p role="alert" className="text-destructive p-4 text-sm">
              {error}
            </p>
          )}
          {!loading && !error && filtered.length === 0 ? (
            <EmptyState
              title="No questions found"
              description="Add a question or adjust your module, type, or search filters."
              icon={Code2}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Topic / Module</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead className="text-right">Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((q) => {
                  const qType = q.questionType || "PROGRAMMING";
                  const modLabel = q.courseModuleId
                    ? (moduleLabelMap.get(q.courseModuleId) ?? q.courseModuleId)
                    : null;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-xs">
                        <button
                          type="button"
                          onClick={() => void openPreview(q)}
                          className="hover:text-primary text-left font-semibold transition-colors"
                        >
                          {q.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {qType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="secondary">{q.topic || "General"}</Badge>
                          {modLabel && (
                            <p className="text-muted-foreground line-clamp-1 text-[11px]">
                              {modLabel}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            q.difficulty === "EASY"
                              ? "success"
                              : q.difficulty === "HARD"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {q.difficulty || "MEDIUM"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {qType === "PROGRAMMING" || qType === "CODE"
                          ? `${q.testCaseCount ?? 0} test cases`
                          : (q.options?.length ?? 0) > 0
                            ? `${q.options?.length} options`
                            : q.sourcePage
                              ? `Handbook p. ${q.sourcePage}`
                              : "Written / Rubric"}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {q.marks ?? 10} pts
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void openPreview(q)}
                        >
                          <Eye className="size-3.5" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewQuestion && (
        <Dialog open={Boolean(previewQuestion)} onOpenChange={() => setPreviewQuestion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewQuestion.title}</DialogTitle>
              <DialogDescription>
                {previewQuestion.questionType || "PROGRAMMING"} ·{" "}
                {previewQuestion.difficulty || "MEDIUM"} · {previewQuestion.marks ?? 10} marks
                {previewQuestion.sourceReference ? ` · ${previewQuestion.sourceReference}` : ""}
              </DialogDescription>
            </DialogHeader>
            {previewLoading ? (
              <p className="text-muted-foreground py-4 text-sm">Loading full question details…</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="border-border bg-secondary/40 rounded-xl border p-4">
                  <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                    Prompt
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {previewQuestion.description || "No description provided."}
                  </p>
                </div>

                {previewQuestion.learningObjective && (
                  <div className="text-xs">
                    <span className="font-semibold">Learning Objective: </span>
                    <span className="text-muted-foreground">
                      {previewQuestion.learningObjective}
                    </span>
                  </div>
                )}

                {Array.isArray(previewQuestion.options) && previewQuestion.options.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase">Options</p>
                    {previewQuestion.options.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                          opt.isCorrect
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                            : "border-border bg-secondary/30"
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + idx)}. {opt.optionText}
                        </span>
                        {opt.isCorrect && (
                          <Badge variant="success" className="text-[10px]">
                            Correct
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {previewQuestion.answerKey !== undefined && previewQuestion.answerKey !== null && (
                  <div className="border-border bg-secondary/30 rounded-xl border p-3 text-xs">
                    <p className="mb-1 font-semibold uppercase">Answer Key</p>
                    <p className="text-muted-foreground font-mono">
                      {typeof previewQuestion.answerKey === "string"
                        ? previewQuestion.answerKey
                        : JSON.stringify(previewQuestion.answerKey)}
                    </p>
                  </div>
                )}

                {previewQuestion.rubric && (
                  <div className="border-border bg-secondary/30 space-y-2 rounded-xl border p-3 text-xs">
                    <p className="font-semibold uppercase">Grading Rubric</p>
                    {Array.isArray(previewQuestion.rubric.criteria) &&
                      previewQuestion.rubric.criteria.length > 0 && (
                        <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                          {previewQuestion.rubric.criteria.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      )}
                    {Array.isArray(previewQuestion.rubric.expectedPoints) &&
                      previewQuestion.rubric.expectedPoints.length > 0 && (
                        <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                          {previewQuestion.rubric.expectedPoints.map((pt) => (
                            <li key={pt}>{pt}</li>
                          ))}
                        </ul>
                      )}
                    {previewQuestion.rubric.sampleAnswer && (
                      <p className="text-muted-foreground">
                        <span className="text-foreground font-semibold">Sample Answer: </span>
                        {previewQuestion.rubric.sampleAnswer}
                      </p>
                    )}
                  </div>
                )}

                {Array.isArray(previewQuestion.testCases) &&
                  previewQuestion.testCases.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase">
                        Test Cases ({previewQuestion.testCases.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {previewQuestion.testCases.slice(0, 6).map((tc, i) => (
                          <div
                            key={tc.id || i}
                            className="border-border bg-secondary/30 rounded-lg border p-2.5 font-mono text-[11px]"
                          >
                            <p className="text-muted-foreground mb-1">
                              #{i + 1} · {tc.isHidden ? "Hidden" : "Sample"}
                            </p>
                            <p>In: {JSON.stringify(tc.input)}</p>
                            <p>Out: {JSON.stringify(tc.expectedOutput)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {previewQuestion.explanation && (
                  <div className="border-primary/25 bg-primary/10 rounded-xl border p-3 text-xs">
                    <p className="text-primary mb-1 font-semibold uppercase">Explanation</p>
                    <p className="leading-relaxed">{previewQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function TeacherQuestionsPage() {
  return (
    <React.Suspense
      fallback={<div className="text-muted-foreground p-6 text-sm">Loading Question Bank…</div>}
    >
      <TeacherQuestionsContent />
    </React.Suspense>
  );
}
