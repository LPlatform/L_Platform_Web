"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { SectionForm } from "@/components/admin/section-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { useSection } from "@/lib/hooks/use-platform-data";

export default function EditSectionPage() {
  const params = useParams<{ sectionId: string }>();
  const sectionQuery = useSection(params.sectionId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic structure"
        title={sectionQuery.data ? `Edit ${sectionQuery.data.name}` : "Edit section"}
        description="Update the section name or description. Sections cannot be moved to another class."
      />

      {sectionQuery.isLoading ? (
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : sectionQuery.isError || !sectionQuery.data ? (
        <div className="surface">
          <ErrorState
            message={getErrorMessage(sectionQuery.error)}
            onRetry={() => void sectionQuery.refetch()}
          />
        </div>
      ) : (
        <SectionForm mode="edit" section={sectionQuery.data} />
      )}
    </div>
  );
}
