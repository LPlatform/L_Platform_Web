"use client";

import { useParams } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { useCourse } from "@/lib/hooks/use-platform-data";

export default function EditCoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseQuery = useCourse(params.courseId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course catalog"
        title={courseQuery.data ? `Edit ${courseQuery.data.title}` : "Edit course"}
        description="Saving a course increments its version in the catalog."
      />

      {courseQuery.isLoading ? (
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : courseQuery.isError || !courseQuery.data ? (
        <div className="surface">
          <ErrorState
            message={getErrorMessage(courseQuery.error)}
            onRetry={() => void courseQuery.refetch()}
          />
        </div>
      ) : (
        <CourseForm mode="edit" course={courseQuery.data} />
      )}
    </div>
  );
}
