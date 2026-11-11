"use client";

import { Code2, Plus, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type QuestionRow = {
  id: string;
  title: string;
  topic?: string;
  difficulty?: string;
  questionType?: string;
  supportedLanguages?: string[];
  marks?: number;
  testCaseCount?: number;
};

export default function TeacherQuestionsPage() {
  const [search, setSearch] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("ALL");
  const [questions, setQuestions] = React.useState<QuestionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    backendRequest<{ items: QuestionRow[] }>("/api/questions?page=1&pageSize=100")
      .then((result) => setQuestions(result.items ?? []))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load questions"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = questions.filter((q) => {
    if (difficulty !== "ALL" && q.difficulty !== difficulty) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return q.title.toLowerCase().includes(term) || (q.topic ?? "").toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authoring"
        title="Question Bank"
        description="Create programming problems, configure sample and hidden test cases, and reuse questions across assignments."
        actions={
          <Button className="lp-gradient-bg border-0 text-white hover:opacity-95" asChild>
            <Link href="/teacher/questions/new">
              <Plus className="size-4" />
              Add New Question
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            placeholder="Search by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-9"
          />
        </div>
        <NativeSelect
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="sm:w-44"
        >
          <option value="ALL">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </NativeSelect>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Questions ({filtered.length})</CardTitle>
          <CardDescription>Coding challenges and assessment questions available</CardDescription>
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
              description="Add a programming problem or adjust your filters."
              icon={Code2}
            />
          ) : (
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
                      <Badge variant="outline">{q.topic || "General"}</Badge>
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
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {(q.supportedLanguages ?? []).join(", ") || "PYTHON, JAVA, CPP"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {q.testCaseCount ?? 0} test cases
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {q.marks ?? 10} pts
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
