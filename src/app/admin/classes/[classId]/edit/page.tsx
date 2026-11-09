"use client";

import { useParams } from "next/navigation";
import { ClassForm } from "@/components/admin/class-form";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { useClass } from "@/lib/hooks/use-platform-data";

export default function EditClassPage() {
  const params = useParams<{ classId: string }>();
  const classQuery = useClass(params.classId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic structure"
        title={classQuery.data ? `Edit ${classQuery.data.name}` : "Edit class"}
        description="Update the class name, academic year, description or status."
      />

      {classQuery.isLoading ? (
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : classQuery.isError || !classQuery.data ? (
        <div className="surface">
          <ErrorState
            message={getErrorMessage(classQuery.error)}
            onRetry={() => void classQuery.refetch()}
          />
        </div>
      ) : (
        <ClassForm mode="edit" academicClass={classQuery.data} />
      )}
    </div>
  );
}
