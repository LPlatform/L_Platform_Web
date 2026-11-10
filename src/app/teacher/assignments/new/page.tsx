"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewAssignmentPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [sectionId, setSectionId] = React.useState("sec-grade10a-001");
  const [instructions, setInstructions] = React.useState("");
  const [dueDate, setDueDate] = React.useState("2026-11-25T23:59");
  const [selectedQuestions, setSelectedQuestions] = React.useState<string[]>([
    "qst-sum-001",
    "qst-max-002",
  ]);

  const availableQuestions = [
    { id: "qst-sum-001", title: "Sum of Two Integers", difficulty: "EASY", marks: 10 },
    { id: "qst-max-002", title: "Find Maximum Element", difficulty: "EASY", marks: 10 },
    { id: "qst-pal-003", title: "Valid Palindrome", difficulty: "MEDIUM", marks: 20 },
  ];

  function toggleQuestion(id: string) {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((q) => q !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || selectedQuestions.length === 0) {
      toast.error("Please provide an assignment title and select at least one question");
      return;
    }
    toast.success("Assignment published successfully!");
    router.push("/teacher/assignments");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/teacher/assignments">
            <ArrowLeft className="mr-2 size-4" />
            Back to Assignments
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create & Publish Assignment</h2>
        <p className="text-muted-foreground text-sm">
          Assign programming problems to a class section and specify submission deadlines.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Target class, schedule, and guidelines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Homework 2: Conditionals & Loops"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="section">Target Section *</Label>
                <select
                  id="section"
                  className="border-input bg-background rounded-md border px-3 py-2 text-sm"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  <option value="sec-grade10a-001">Grade 10 · Section A</option>
                  <option value="sec-grade10b-002">Grade 10 · Section B</option>
                </select>
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
              <Label htmlFor="instructions">Instructions & Guidelines</Label>
              <textarea
                id="instructions"
                rows={3}
                className="border-input bg-background w-full rounded-md border p-3 text-sm"
                placeholder="Provide submission guidelines and rules..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Problems</CardTitle>
            <CardDescription>
              Choose questions from the question bank for this assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableQuestions.map((q) => {
              const selected = selectedQuestions.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                    selected
                      ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleQuestion(q.id)}
                      className="size-4"
                    />
                    <div>
                      <p className="text-sm font-medium">{q.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {q.difficulty} · {q.marks} points
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">{q.marks} pts</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/teacher/assignments">Cancel</Link>
          </Button>
          <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
            Publish Assignment
          </Button>
        </div>
      </form>
    </div>
  );
}
