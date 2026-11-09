"use client";

import { useParams } from "next/navigation";
import { AllocationEditForm } from "@/components/admin/allocation-form";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { useAllocation } from "@/lib/hooks/use-platform-data";

export default function EditAllocationPage() {
  const params = useParams<{ allocationId: string }>();
  const allocationQuery = useAllocation(params.allocationId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course access"
        title={
          allocationQuery.data ? `Edit ${allocationQuery.data.courseTitle}` : "Edit allocation"
        }
        description="Adjust the access window or withhold learner access. The course and scope cannot be changed after creation."
      />

      {allocationQuery.isLoading ? (
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : allocationQuery.isError || !allocationQuery.data ? (
        <div className="surface">
          <ErrorState
            message={getErrorMessage(allocationQuery.error)}
            onRetry={() => void allocationQuery.refetch()}
          />
        </div>
      ) : (
        <AllocationEditForm allocation={allocationQuery.data} />
      )}
    </div>
  );
}
