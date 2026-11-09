"use client";

import { CourseForm } from "@/components/admin/course-form";
import { PageHeader } from "@/components/admin/page-header";

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course catalog"
        title="New course"
        description="Create a catalog entry. New courses start in whichever status you select and must be active before they can be allocated."
      />
      <CourseForm mode="create" />
    </div>
  );
}
