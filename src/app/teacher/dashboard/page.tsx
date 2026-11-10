"use client";

import { CheckCircle2, Code2, GraduationCap, Plus, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useSession } from "@/components/admin/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeacherDashboardPage() {
  const { session } = useSession();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {session.name}</h2>
          <p className="text-muted-foreground text-sm">
            Manage your classroom sections, programming questions, and student assignment
            submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/teacher/questions/new">
              <Plus className="mr-2 size-4" />
              New Question
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Link href="/teacher/assignments/new">
              <Plus className="mr-2 size-4" />
              Create Assignment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Sections</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-muted-foreground text-xs">Section A, Section B</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <GraduationCap className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-muted-foreground text-xs">Across Grade 10 cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Question Bank</CardTitle>
            <Code2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-muted-foreground text-xs">Python, Java, and C++</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-muted-foreground text-xs">85% passing rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments & Recent Submissions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Assignments</CardTitle>
              <CardDescription>Assignments currently open for student submission</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/assignments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-sm font-semibold">Homework 1 — Python Basics</h4>
                  <p className="text-muted-foreground text-xs">Grade 10 · Section A</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-emerald-600">
                    Published
                  </Badge>
                  <p className="text-muted-foreground mt-1 text-xs">Due in 5 days</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-sm font-semibold">Lab 2 — Arithmetic & Loops</h4>
                  <p className="text-muted-foreground text-xs">Grade 10 · Section B</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-emerald-600">
                    Published
                  </Badge>
                  <p className="text-muted-foreground mt-1 text-xs">Due in 10 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Evaluated student solutions from your classes</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/submissions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-sm font-medium">Alice Walker</p>
                  <p className="text-muted-foreground text-xs">Sum of Two Integers (Python)</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-emerald-600">
                    PASS (100%)
                  </Badge>
                  <p className="text-muted-foreground mt-1 text-xs">10 mins ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-sm font-medium">Bob Smith</p>
                  <p className="text-muted-foreground text-xs">Find Maximum Element (Python)</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">FAIL (50%)</Badge>
                  <p className="text-muted-foreground mt-1 text-xs">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
