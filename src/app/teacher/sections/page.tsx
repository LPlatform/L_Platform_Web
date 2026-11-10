"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherSectionsPage() {
  const sections = [
    {
      id: "sec-grade10a-001",
      name: "Section A",
      className: "Grade 10",
      academicYear: "2026-2027",
      enrolledCount: 22,
      maxStudents: 35,
      students: [
        { id: "usr-s1", name: "Alice Walker", email: "student1@riverside.edu", status: "ACTIVE" },
        { id: "usr-s2", name: "Bob Smith", email: "student2@riverside.edu", status: "ACTIVE" },
        { id: "usr-s3", name: "Charlie Davis", email: "charlie@riverside.edu", status: "ACTIVE" },
      ],
    },
    {
      id: "sec-grade10b-002",
      name: "Section B",
      className: "Grade 10",
      academicYear: "2026-2027",
      enrolledCount: 20,
      maxStudents: 35,
      students: [
        { id: "usr-s4", name: "David Miller", email: "david@riverside.edu", status: "ACTIVE" },
        { id: "usr-s5", name: "Emma Wilson", email: "emma@riverside.edu", status: "ACTIVE" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Assigned Sections</h2>
        <p className="text-muted-foreground text-sm">
          Review classes, student rosters, and active enrollments under your instruction.
        </p>
      </div>

      <div className="grid gap-6">
        {sections.map((sec) => (
          <Card key={sec.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {sec.className} — {sec.name}
                  </CardTitle>
                  <CardDescription>Academic Year {sec.academicYear}</CardDescription>
                </div>
                <Badge variant="outline" className="text-sm">
                  {sec.enrolledCount} / {sec.maxStudents} Students
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sec.students.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell className="font-medium">{st.name}</TableCell>
                      <TableCell className="text-muted-foreground">{st.email}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-emerald-600">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
