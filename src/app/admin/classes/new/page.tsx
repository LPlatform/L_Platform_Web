"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { ClassForm } from "@/components/admin/class-form";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";

function NewClassForm() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId") ?? undefined;

  return <ClassForm mode="create" defaultOrganizationId={organizationId} />;
}

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic structure"
        title="New class"
        description="Classes belong to an organization and an academic year. Sections are created inside a class."
      />
      <React.Suspense
        fallback={
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        }
      >
        <NewClassForm />
      </React.Suspense>
    </div>
  );
}
