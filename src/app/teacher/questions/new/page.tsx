"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { backendRequest } from "@/lib/api/client";

interface TestCaseRow {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  isSample: boolean;
}

interface McqOptionRow {
  optionText: string;
  isCorrect: boolean;
}

interface ModuleOption {
  id: string;
  title: string;
  moduleNumber?: number;
}

type QuestionTypeValue =
  | "PROGRAMMING"
  | "CODE"
  | "SINGLE_MCQ"
  | "MULTI_SELECT"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "LONG_CASE"
  | "PRACTICAL";

export default function NewQuestionPage() {
  const router = useRouter();
  const [questionType, setQuestionType] = React.useState<QuestionTypeValue>("PROGRAMMING");
  const [courseModuleId, setCourseModuleId] = React.useState("");
  const [modules, setModules] = React.useState<ModuleOption[]>([]);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [inputFormat, setInputFormat] = React.useState("");
  const [outputFormat, setOutputFormat] = React.useState("");
  const [constraints, setConstraints] = React.useState("");
  const [topic, setTopic] = React.useState("Algorithms");
  const [difficulty, setDifficulty] = React.useState("EASY");
  const [marks, setMarks] = React.useState("10");
  const [explanation, setExplanation] = React.useState("");

  // Objective options (SINGLE_MCQ / MULTI_SELECT)
  const [options, setOptions] = React.useState<McqOptionRow[]>([
    { optionText: "", isCorrect: true },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);

  // TRUE_FALSE
  const [correctBoolean, setCorrectBoolean] = React.useState<boolean>(true);

  // FILL_BLANK
  const [acceptedAnswersText, setAcceptedAnswersText] = React.useState("");

  // SHORT_ANSWER / LONG_CASE / PRACTICAL
  const [rubricCriteriaText, setRubricCriteriaText] = React.useState("");
  const [sampleAnswer, setSampleAnswer] = React.useState("");

  const [testCases, setTestCases] = React.useState<TestCaseRow[]>([
    { input: "3 5\n", expectedOutput: "8\n", isHidden: false, isSample: true },
    { input: "10 20\n", expectedOutput: "30\n", isHidden: true, isSample: false },
  ]);

  React.useEffect(() => {
    backendRequest<{ modules?: ModuleOption[] }>("/api/learning/ai-readiness")
      .then((res) => setModules(res.modules ?? []))
      .catch(() => setModules([]));
  }, []);

  const isCodeType = questionType === "PROGRAMMING" || questionType === "CODE";
  const isOptionType = questionType === "SINGLE_MCQ" || questionType === "MULTI_SELECT";
  const isWrittenType =
    questionType === "SHORT_ANSWER" || questionType === "LONG_CASE" || questionType === "PRACTICAL";

  function addOption() {
    setOptions([...options, { optionText: "", isCorrect: false }]);
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOptionText(index: number, optionText: string) {
    setOptions(options.map((opt, i) => (i === index ? { ...opt, optionText } : opt)));
  }

  function toggleOptionCorrect(index: number) {
    if (questionType === "SINGLE_MCQ") {
      setOptions(options.map((opt, i) => ({ ...opt, isCorrect: i === index })));
    } else {
      setOptions(
        options.map((opt, i) => (i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt)),
      );
    }
  }

  function addTestCase() {
    setTestCases([
      ...testCases,
      { input: "", expectedOutput: "", isHidden: false, isSample: true },
    ]);
  }

  function removeTestCase(index: number) {
    setTestCases(testCases.filter((_, i) => i !== index));
  }

  function updateTestCase(index: number, field: keyof TestCaseRow, value: string | boolean) {
    const updated = [...testCases];
    const item = { ...updated[index] } as TestCaseRow;
    if (field === "input" && typeof value === "string") item.input = value;
    if (field === "expectedOutput" && typeof value === "string") item.expectedOutput = value;
    if (field === "isHidden" && typeof value === "boolean") item.isHidden = value;
    if (field === "isSample" && typeof value === "boolean") item.isSample = value;
    updated[index] = item;
    setTestCases(updated);
  }

  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please enter a title and question prompt");
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      questionType,
      courseModuleId: courseModuleId || null,
      topic: topic.trim() || "General",
      difficulty,
      marks: Math.max(1, Number(marks) || 10),
      explanation: explanation.trim() || null,
      status: "PUBLISHED",
    };

    if (isCodeType) {
      payload.inputFormat = inputFormat || null;
      payload.outputFormat = outputFormat || null;
      payload.constraints = constraints || null;
      payload.testCases = testCases;
    } else if (isOptionType) {
      const cleaned = options
        .map((opt, idx) => ({
          optionText: opt.optionText.trim(),
          orderNum: idx + 1,
          isCorrect: opt.isCorrect,
        }))
        .filter((opt) => opt.optionText.length > 0);
      if (cleaned.length < 2) {
        toast.error("Provide at least two answer options.");
        return;
      }
      if (!cleaned.some((opt) => opt.isCorrect)) {
        toast.error("Mark at least one option as correct.");
        return;
      }
      payload.options = cleaned;
    } else if (questionType === "TRUE_FALSE") {
      payload.options = [
        { optionText: "True", orderNum: 1, isCorrect: correctBoolean },
        { optionText: "False", orderNum: 2, isCorrect: !correctBoolean },
      ];
      payload.answerKey = { correctValue: correctBoolean };
    } else if (questionType === "FILL_BLANK") {
      const acceptedAnswers = acceptedAnswersText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (acceptedAnswers.length === 0) {
        toast.error("Enter at least one accepted answer (comma-separated).");
        return;
      }
      payload.answerKey = { acceptedAnswers, caseSensitive: false };
    } else if (isWrittenType) {
      const expectedPoints = rubricCriteriaText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const rubric = {
        criteria: expectedPoints.length > 0 ? expectedPoints : ["Concept accuracy and clarity"],
        expectedPoints,
        sampleAnswer: sampleAnswer.trim(),
      };
      payload.rubric = rubric;
      payload.answerKey = {
        rubric: rubric.criteria.join(" | "),
        expectedPoints: rubric.expectedPoints,
        sampleAnswer: rubric.sampleAnswer,
      };
    }

    setSaving(true);
    try {
      await backendRequest("/api/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Question saved to Question Bank.");
      router.push("/teacher/questions");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "The Backend did not save the question.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/questions">
            <ArrowLeft className="size-4" />
            Back to Questions
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Question</h2>
        <p className="text-muted-foreground text-sm">
          Author programming challenges, objective questions, case studies, or practical tasks for
          your Question Bank.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
            <CardDescription>Type, curriculum linkage, prompt, and grading value</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="questionType">Question Type *</Label>
                <NativeSelect
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionTypeValue)}
                >
                  <option value="PROGRAMMING">Programming / Coding</option>
                  <option value="CODE">Code Challenge (Typed CODE)</option>
                  <option value="SINGLE_MCQ">Single-Choice MCQ</option>
                  <option value="MULTI_SELECT">Multi-Select MCQ</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="FILL_BLANK">Fill in the Blank</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="LONG_CASE">Long Case Study</option>
                  <option value="PRACTICAL">Practical / Design Exercise</option>
                </NativeSelect>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="courseModuleId">AI Readiness Module (Optional)</Label>
                <NativeSelect
                  id="courseModuleId"
                  value={courseModuleId}
                  onChange={(e) => setCourseModuleId(e.target.value)}
                >
                  <option value="">General / Standalone Question</option>
                  {modules.map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      Module {m.moduleNumber ?? idx + 1} — {m.title}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Evaluating Precision vs Recall in Medical AI"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g. Arrays, Data Literacy, AI Ethics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <NativeSelect
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </NativeSelect>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  min={1}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Question Prompt / Problem Statement *</Label>
              <textarea
                id="desc"
                rows={4}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                placeholder="Explain the question prompt or scenario clearly..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {isCodeType && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="inputFormat">Input Format</Label>
                    <textarea
                      id="inputFormat"
                      rows={2}
                      className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                      placeholder="Describe standard input format..."
                      value={inputFormat}
                      onChange={(e) => setInputFormat(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="outputFormat">Output Format</Label>
                    <textarea
                      id="outputFormat"
                      rows={2}
                      className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                      placeholder="Describe expected output format..."
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="constraints">Constraints</Label>
                  <Input
                    id="constraints"
                    placeholder="e.g. 1 <= N <= 10^5"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="explanation">Explanation / Reference Notes</Label>
              <textarea
                id="explanation"
                rows={2}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                placeholder="Post-grading explanation shown in Teacher Review or Feedback..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {isOptionType && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Answer Options</CardTitle>
                <CardDescription>
                  {questionType === "SINGLE_MCQ"
                    ? "Select exactly one correct option."
                    : "Select all options that must be chosen for full marks."}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="size-4" />
                Add Option
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type={questionType === "SINGLE_MCQ" ? "radio" : "checkbox"}
                    name="correctOption"
                    checked={opt.isCorrect}
                    onChange={() => toggleOptionCorrect(idx)}
                    aria-label={`Mark option ${idx + 1} as correct`}
                    className="size-4 accent-violet-500"
                  />
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={opt.optionText}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeOption(idx)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {questionType === "TRUE_FALSE" && (
          <Card>
            <CardHeader>
              <CardTitle>Correct Statement Value</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="trueFalseValue"
                  checked={correctBoolean === true}
                  onChange={() => setCorrectBoolean(true)}
                  className="size-4 accent-violet-500"
                />
                True
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="trueFalseValue"
                  checked={correctBoolean === false}
                  onChange={() => setCorrectBoolean(false)}
                  className="size-4 accent-violet-500"
                />
                False
              </label>
            </CardContent>
          </Card>
        )}

        {questionType === "FILL_BLANK" && (
          <Card>
            <CardHeader>
              <CardTitle>Accepted Answers</CardTitle>
              <CardDescription>
                Comma-separated list of acceptable case-insensitive responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g. supervised learning, Supervised"
                value={acceptedAnswersText}
                onChange={(e) => setAcceptedAnswersText(e.target.value)}
                required
              />
            </CardContent>
          </Card>
        )}

        {isWrittenType && (
          <Card>
            <CardHeader>
              <CardTitle>Grading Rubric & Sample Answer</CardTitle>
              <CardDescription>Used during teacher review of student submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="rubricCriteria">Expected Rubric Points (one per line)</Label>
                <textarea
                  id="rubricCriteria"
                  rows={3}
                  className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                  placeholder={
                    "Defines precision vs recall accurately\nIdentifies false-negative clinical risk"
                  }
                  value={rubricCriteriaText}
                  onChange={(e) => setRubricCriteriaText(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sampleAnswer">Sample Reference Answer</Label>
                <textarea
                  id="sampleAnswer"
                  rows={3}
                  className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                  placeholder="Provide a benchmark response for teacher grading..."
                  value={sampleAnswer}
                  onChange={(e) => setSampleAnswer(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isCodeType && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Test Cases</CardTitle>
                <CardDescription>
                  Sample test cases are visible in the Student IDE; hidden cases are saved for
                  grading.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                <Plus className="size-4" />
                Add Test Case
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="border-border bg-secondary/30 space-y-3 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Test Case #{idx + 1}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={tc.isSample}
                          onChange={(e) => {
                            updateTestCase(idx, "isSample", e.target.checked);
                            if (e.target.checked) updateTestCase(idx, "isHidden", false);
                          }}
                        />
                        Sample (Visible)
                      </label>

                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) => {
                            updateTestCase(idx, "isHidden", e.target.checked);
                            if (e.target.checked) updateTestCase(idx, "isSample", false);
                          }}
                        />
                        Hidden (Grading)
                      </label>

                      {testCases.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeTestCase(idx)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1">
                      <Label className="text-xs">Standard Input</Label>
                      <textarea
                        rows={2}
                        className="border-input bg-background rounded-lg border p-2.5 font-mono text-xs"
                        placeholder="Input passed to stdin..."
                        value={tc.input}
                        onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-1">
                      <Label className="text-xs">Expected Output</Label>
                      <textarea
                        rows={2}
                        className="border-input bg-background rounded-lg border p-2.5 font-mono text-xs"
                        placeholder="Expected output on stdout..."
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(idx, "expectedOutput", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/teacher/questions">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="lp-gradient-bg border-0 text-white hover:opacity-95"
          >
            {saving ? "Saving…" : "Save Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}
