"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherAssignmentsPage() {
  const assignments = [
    {
      id: "asg-python-hw1",
      title: "Homework 1 — Python Basics",
      sectionName: "Section A · Grade 10",
      totalMarks: 20,
      questionCount: 2,
      submissionCount: 18,
      status: "PUBLISHED",
      dueDate: "2026-11-24",
    },
    {
      id: "asg-python-hw2",
      title: "Lab 2 — Arithmetic & Loops",
      sectionName: "Section B · Grade 10",
      totalMarks: 30,
      questionCount: 3,
      submissionCount: 10,
      status: "PUBLISHED",
      dueDate: "2026-11-30",
    },
    {
      id: "asg-python-hw3",
      title: "Quiz 1 — Functions & Scope",
      sectionName: "Section A · Grade 10",
      totalMarks: 25,
      questionCount: 2,
      submissionCount: 0,
      status: "DRAFT",
      dueDate: "2026-12-05",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignment Management</h2>
          <p className="text-muted-foreground text-sm">
            Publish coding assignments to your sections, configure problem sets, and review student
            progress.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Link href="/teacher/assignments/new">
            <Plus className="mr-2 size-4" />
            Create Assignment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            Track status, deadlines, and submissions across sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment Title</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((asg) => (
                <TableRow key={asg.id}>
                  <TableCell className="font-semibold">{asg.title}</TableCell>
                  <TableCell className="text-muted-foreground">{asg.sectionName}</TableCell>
                  <TableCell>{asg.questionCount} problems</TableCell>
                  <TableCell>{asg.totalMarks} pts</TableCell>
                  <TableCell>{asg.submissionCount} submitted</TableCell>
                  <TableCell className="text-xs">{asg.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={asg.status === "PUBLISHED" ? "default" : "secondary"}
                      className={asg.status === "PUBLISHED" ? "bg-emerald-600" : ""}
                    >
                      {asg.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
