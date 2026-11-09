"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { PageHeader } from "@/components/admin/page-header";
import { SectionForm } from "@/components/admin/section-form";
import { Skeleton } from "@/components/ui/skeleton";

function NewSectionForm() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId") ?? undefined;

  return <SectionForm mode="create" defaultClassId={classId} />;
}

export default function NewSectionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic structure"
        title="New section"
        description="Sections belong to a class. Students and teachers are assigned after the section is created."
      />
      <React.Suspense
        fallback={
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        }
      >
        <NewSectionForm />
      </React.Suspense>
    </div>
  );
}
