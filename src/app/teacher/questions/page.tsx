"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { backendRequest } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherQuestionsPage() {
  const [search, setSearch] = React.useState("");
  type QuestionRow = { id: string; title: string; topic?: string; difficulty?: string; supportedLanguages?: string[]; marks?: number; testCaseCount?: number };
  const [questions, setQuestions] = React.useState<QuestionRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    backendRequest<{ items: QuestionRow[] }>("/api/questions?page=1&pageSize=100")
      .then((result) => setQuestions(result.items ?? []))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load questions"));
  }, []);

  const filtered = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.topic ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Question Bank</h2>
          <p className="text-muted-foreground text-sm">
            Create programming problems, manage sample and hidden test cases, and reuse questions
            across assignments.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Link href="/teacher/questions/new">
            <Plus className="mr-2 size-4" />
            Add New Question
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Questions</CardTitle>
              <CardDescription>Browse existing coding challenges and test cases</CardDescription>
            </div>
            <div className="w-64">
              <Input
                placeholder="Search by title or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p role="alert" className="text-destructive mb-4 text-sm">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem Title</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Supported Languages</TableHead>
                <TableHead>Test Cases</TableHead>
                <TableHead>Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-semibold">{q.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{q.topic}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={q.difficulty === "EASY" ? "default" : "secondary"}
                      className={q.difficulty === "EASY" ? "bg-emerald-600" : ""}
                    >
                      {q.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {(q.supportedLanguages ?? []).join(", ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {q.testCaseCount ?? 0} test cases
                  </TableCell>
                  <TableCell className="font-medium">{q.marks} pts</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
