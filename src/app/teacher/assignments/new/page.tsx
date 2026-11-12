"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
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

type SectionOption = {
  id: string;
  name?: string;
  className?: string;
};

type QuestionOption = {
  id: string;
  title: string;
  topic?: string;
  difficulty?: string;
  questionType?: string;
  courseModuleId?: string | null;
  marks?: number;
};

type ModuleOption = {
  id: string;
  title: string;
  moduleNumber?: number;
};

const ASSIGNMENT_TYPES = [
  { value: "PROGRAMMING", label: "Programming / Coding" },
  { value: "CONCEPTUAL", label: "Conceptual / Quiz" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "CASE_STUDY", label: "Case Study" },
  { value: "PRACTICAL", label: "Practical Lab" },
  { value: "PROJECT", label: "Project Milestone" },
  { value: "FILE_SUBMISSION", label: "File Submission" },
] as const;

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

const PAGE_SIZE = 25;

export default function NewAssignmentPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [assignmentType, setAssignmentType] = React.useState<string>("PROGRAMMING");
  const [sectionId, setSectionId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [attachmentInstructions, setAttachmentInstructions] = React.useState("");
  const [allowFileUpload, setAllowFileUpload] = React.useState(false);
  const [maxFileSizeMb, setMaxFileSizeMb] = React.useState("10");
  const [allowResubmit, setAllowResubmit] = React.useState(true);
  const [dueDate, setDueDate] = React.useState("2026-11-25T23:59");

  const [selectedQuestions, setSelectedQuestions] = React.useState<string[]>([]);
  const [marksByQuestion, setMarksByQuestion] = React.useState<Record<string, number>>({});

  const [sections, setSections] = React.useState<SectionOption[]>([]);
  const [availableQuestions, setAvailableQuestions] = React.useState<QuestionOption[]>([]);
  const [modules, setModules] = React.useState<ModuleOption[]>([]);

  const [search, setSearch] = React.useState("");
  const [moduleFilter, setModuleFilter] = React.useState("ALL");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);

  const [savingMode, setSavingMode] = React.useState<"DRAFT" | "PUBLISHED" | null>(null);

  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [sectionList, firstQuestionsPage, courseRes] = await Promise.all([
          backendRequest<{ items: SectionOption[] }>("/api/sections?page=1&pageSize=100"),
          backendRequest<{ items: QuestionOption[]; totalPages?: number }>(
            "/api/questions?page=1&pageSize=500",
          ),
          backendRequest<{ modules?: ModuleOption[] }>("/api/learning/ai-readiness").catch(() => ({
            modules: [],
          })),
        ]);

        let allQuestions = firstQuestionsPage.items ?? [];
        const totalPages = Math.max(1, firstQuestionsPage.totalPages ?? 1);
        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              backendRequest<{ items: QuestionOption[] }>(
                `/api/questions?page=${i + 2}&pageSize=500`,
              ),
            ),
          );
          for (const res of rest) {
            allQuestions = [...allQuestions, ...(res.items ?? [])];
          }
        }
        if (!active) return;
        setSections(sectionList.items ?? []);
        setSectionId(sectionList.items?.[0]?.id ?? "");
        setAvailableQuestions(allQuestions);
        setModules(courseRes.modules ?? []);
      } catch (cause: unknown) {
        if (!active) return;
        toast.error(cause instanceof Error ? cause.message : "Could not load Backend data.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (assignmentType === "FILE_SUBMISSION") {
      setAllowFileUpload(true);
    }
  }, [assignmentType]);

  const filteredQuestions = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableQuestions.filter((item) => {
      if (difficultyFilter !== "ALL" && item.difficulty !== difficultyFilter) return false;
      if (typeFilter !== "ALL" && (item.questionType || "PROGRAMMING") !== typeFilter) {
        return false;
      }
      if (moduleFilter === "NONE" && item.courseModuleId) return false;
      if (
        moduleFilter !== "ALL" &&
        moduleFilter !== "NONE" &&
        item.courseModuleId !== moduleFilter
      ) {
        return false;
      }
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || (item.topic ?? "").toLowerCase().includes(q);
    });
  }, [availableQuestions, search, moduleFilter, typeFilter, difficultyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedQuestions = React.useMemo(
    () => filteredQuestions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredQuestions, safePage],
  );

  function toggleQuestion(q: QuestionOption) {
    if (selectedQuestions.includes(q.id)) {
      setSelectedQuestions((prev) => prev.filter((id) => id !== q.id));
    } else {
      setSelectedQuestions((prev) => [...prev, q.id]);
      setMarksByQuestion((prev) => ({
        ...prev,
        [q.id]: prev[q.id] ?? q.marks ?? 10,
      }));
    }
  }

  function updateMarks(qId: string, value: string) {
    const num = Math.max(1, Number(value) || 1);
    setMarksByQuestion((prev) => ({ ...prev, [qId]: num }));
  }

  const totalMarks = selectedQuestions.reduce((sum, id) => {
    const q = availableQuestions.find((item) => item.id === id);
    return sum + (marksByQuestion[id] ?? q?.marks ?? 10);
  }, 0);

  async function saveAssignment(targetStatus: "DRAFT" | "PUBLISHED") {
    if (!title.trim() || selectedQuestions.length === 0) {
      toast.error("Please provide an assignment title and select at least one question");
      return;
    }
    if (!sectionId) {
      toast.error("No section is available to this account.");
      return;
    }
    setSavingMode(targetStatus);
    try {
      const questionsPayload = selectedQuestions.map((qId, idx) => {
        const found = availableQuestions.find((item) => item.id === qId);
        return {
          questionId: qId,
          marks: marksByQuestion[qId] ?? found?.marks ?? 10,
          orderNum: idx + 1,
        };
      });

      await backendRequest<{ id: string }>("/api/assignments", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          assignmentType,
          sectionId,
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          attachmentInstructions:
            allowFileUpload || attachmentInstructions.trim()
              ? attachmentInstructions.trim() || "Upload supporting deliverable if requested."
              : null,
          maxFileSizeMb: Math.max(1, Number(maxFileSizeMb) || 10),
          allowResubmit,
          dueDate,
          totalMarks,
          questions: questionsPayload,
          status: targetStatus,
        }),
      });
      toast.success(
        targetStatus === "PUBLISHED"
          ? "Assignment created and published."
          : "Assignment draft saved.",
      );
      router.push("/teacher/assignments");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "The Backend did not save the assignment.",
      );
    } finally {
      setSavingMode(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/assignments">
            <ArrowLeft className="size-4" />
            Back to Assignments
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Assignment</h2>
        <p className="text-muted-foreground text-sm">
          Build programming, conceptual, case study, practical, or file-submission assignments from
          any number of Question Bank items.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void saveAssignment("PUBLISHED");
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Type, target class section, schedule, and guidelines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Module 6 Ethics & ML Case Study"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignmentType">Assignment Type *</Label>
                <NativeSelect
                  id="assignmentType"
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                >
                  {ASSIGNMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="section">Target Section *</Label>
                <NativeSelect
                  id="section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.className ? `${section.className} · ` : ""}
                      {section.name ?? section.id}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Overview / Description</Label>
              <Input
                id="description"
                placeholder="Brief summary shown in student assignment list"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions & Guidelines</Label>
              <textarea
                id="instructions"
                rows={3}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                placeholder="Provide submission guidelines, rubric expectations, or coding instructions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="border-border bg-secondary/30 grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={allowFileUpload}
                  onChange={(e) => setAllowFileUpload(e.target.checked)}
                  className="size-4 accent-violet-500"
                />
                Accept file attachments
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={allowResubmit}
                  onChange={(e) => setAllowResubmit(e.target.checked)}
                  className="size-4 accent-violet-500"
                />
                Allow resubmissions
              </label>
              <div className="flex items-center gap-2">
                <Label htmlFor="maxFileSizeMb" className="text-xs whitespace-nowrap">
                  Max File (MB)
                </Label>
                <Input
                  id="maxFileSizeMb"
                  type="number"
                  min={1}
                  max={50}
                  value={maxFileSizeMb}
                  onChange={(e) => setMaxFileSizeMb(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            {allowFileUpload && (
              <div className="grid gap-2">
                <Label htmlFor="attachmentInstructions">Attachment Instructions</Label>
                <Input
                  id="attachmentInstructions"
                  placeholder="e.g. Attach PDF report or Jupyter notebook summary"
                  value={attachmentInstructions}
                  onChange={(e) => setAttachmentInstructions(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>
                  Select Questions ({selectedQuestions.length} selected · {totalMarks} total pts)
                </CardTitle>
                <CardDescription>
                  Filter and select any combination of Question Bank items (
                  {availableQuestions.length} available)
                </CardDescription>
              </div>
              {selectedQuestions.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedQuestions([])}
                >
                  Clear Selection
                </Button>
              )}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="bg-card pl-8"
                />
              </div>

              <NativeSelect
                aria-label="Filter by AI Readiness module"
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All modules</option>
                <option value="NONE">Standalone / Programming</option>
                {modules.map((m, idx) => (
                  <option key={m.id} value={m.id}>
                    M{m.moduleNumber ?? idx + 1}: {m.title}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                aria-label="Filter by question type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All types</option>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                aria-label="Filter by difficulty"
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </NativeSelect>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {paginatedQuestions.map((q) => {
              const selected = selectedQuestions.includes(q.id);
              const qMarks = marksByQuestion[q.id] ?? q.marks ?? 10;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/40 hover:border-primary/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(q)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="size-4 shrink-0 accent-violet-500"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{q.title}</p>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {q.questionType || "PROGRAMMING"}
                        </Badge>
                        <span>{q.difficulty || "MEDIUM"}</span>
                        {q.topic && <span>· {q.topic}</span>}
                      </div>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {selected ? (
                      <>
                        <Label htmlFor={`marks-${q.id}`} className="text-muted-foreground text-xs">
                          Pts:
                        </Label>
                        <Input
                          id={`marks-${q.id}`}
                          type="number"
                          min={1}
                          value={qMarks}
                          onChange={(e) => updateMarks(q.id, e.target.value)}
                          className="h-8 w-20 text-xs tabular-nums"
                        />
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                        {q.marks ?? 10} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No questions match the current filters.
              </p>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground text-xs">
                  Showing {paginatedQuestions.length} of {filteredQuestions.length} questions · Page{" "}
                  {safePage} / {totalPages}
                </span>
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
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/teacher/assignments">Cancel</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={savingMode !== null}
            onClick={() => void saveAssignment("DRAFT")}
          >
            {savingMode === "DRAFT" ? "Saving Draft…" : "Save as Draft"}
          </Button>
          <Button
            type="submit"
            disabled={savingMode !== null}
            className="lp-gradient-bg border-0 text-white hover:opacity-95"
          >
            {savingMode === "PUBLISHED" ? "Publishing…" : "Publish Assignment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
