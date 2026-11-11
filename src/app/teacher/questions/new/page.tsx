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

export default function NewQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [inputFormat, setInputFormat] = React.useState("");
  const [outputFormat, setOutputFormat] = React.useState("");
  const [constraints, setConstraints] = React.useState("");
  const [topic, setTopic] = React.useState("Algorithms");
  const [difficulty, setDifficulty] = React.useState("EASY");
  const [marks, setMarks] = React.useState("10");

  const [testCases, setTestCases] = React.useState<TestCaseRow[]>([
    { input: "3 5\n", expectedOutput: "8\n", isHidden: false, isSample: true },
    { input: "10 20\n", expectedOutput: "30\n", isHidden: true, isSample: false },
  ]);

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
    if (!title || !description) {
      toast.error("Please enter a title and problem description");
      return;
    }
    setSaving(true);
    try {
      await backendRequest("/api/questions", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          inputFormat,
          outputFormat,
          constraints,
          topic,
          difficulty,
          marks: Number(marks),
          status: "PUBLISHED",
          testCases,
        }),
      });
      toast.success("Question and test cases saved.");
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
        <h2 className="text-2xl font-bold tracking-tight">Create Programming Problem</h2>
        <p className="text-muted-foreground text-sm">
          Define problem requirements, I/O formats, visible sample test cases, and hidden grading
          cases.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Problem Details</CardTitle>
            <CardDescription>Statement, difficulty, and constraints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Problem Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Find the Longest Substring Without Repeating Characters"
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
                  placeholder="e.g. Arrays, Strings, Math"
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
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Problem Description *</Label>
              <textarea
                id="desc"
                rows={4}
                className="border-input bg-secondary/60 w-full rounded-xl border p-3 text-sm"
                placeholder="Explain the problem statement clearly..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Cases</CardTitle>
              <CardDescription>
                Sample test cases are visible in the Student IDE; hidden cases run on evaluation.
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
