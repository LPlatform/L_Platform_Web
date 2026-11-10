"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
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

  const questions = [
    {
      id: "qst-sum-001",
      title: "Sum of Two Integers",
      topic: "Basic Arithmetic",
      difficulty: "EASY",
      supportedLanguages: ["PYTHON", "JAVA", "CPP"],
      marks: 10,
      testCaseCount: 4,
      sampleCases: 2,
      hiddenCases: 2,
    },
    {
      id: "qst-max-002",
      title: "Find Maximum Element",
      topic: "Arrays & Iteration",
      difficulty: "EASY",
      supportedLanguages: ["PYTHON", "JAVA", "CPP"],
      marks: 10,
      testCaseCount: 2,
      sampleCases: 1,
      hiddenCases: 1,
    },
    {
      id: "qst-pal-003",
      title: "Valid Palindrome",
      topic: "Strings",
      difficulty: "MEDIUM",
      supportedLanguages: ["PYTHON", "JAVA", "CPP"],
      marks: 20,
      testCaseCount: 5,
      sampleCases: 2,
      hiddenCases: 3,
    },
  ];

  const filtered = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase()),
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
                    {q.supportedLanguages.join(", ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {q.testCaseCount} ({q.sampleCases} sample, {q.hiddenCases} hidden)
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
