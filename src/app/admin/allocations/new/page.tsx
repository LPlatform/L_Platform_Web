"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { AllocationForm } from "@/components/admin/allocation-form";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";

function NewAllocationForm() {
  const searchParams = useSearchParams();

  return (
    <AllocationForm
      defaultCourseId={searchParams.get("courseId") ?? undefined}
      defaultOrganizationId={searchParams.get("organizationId") ?? undefined}
      defaultClassId={searchParams.get("classId") ?? undefined}
      defaultSectionId={searchParams.get("sectionId") ?? undefined}
    />
  );
}

export default function NewAllocationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course access"
        title="New course allocation"
        description="Choose a course and the scope that should receive access. The allocation is reviewed before it is created."
      />
      <React.Suspense
        fallback={
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        }
      >
        <NewAllocationForm />
      </React.Suspense>
    </div>
  );
}
