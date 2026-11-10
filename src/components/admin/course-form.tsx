"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormActions, FormField, FormSection } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage, isApiError } from "@/lib/api";
import { useCreateCourse, useUpdateCourse } from "@/lib/hooks/use-platform-data";
import { courseInputSchema, type CourseFormValues } from "@/lib/validation/course";
import { COURSE_STATUS_LABELS, DIFFICULTY_LABELS, LANGUAGE_LABELS, type Course } from "@/types";

const CATEGORY_SUGGESTIONS = [
  "Programming fundamentals",
  "Web development",
  "Data structures",
  "Algorithms",
  "Databases",
  "Artificial intelligence",
];

export function CourseForm({ mode, course }: { mode: "create" | "edit"; course?: Course }) {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(course?.id ?? "");
  const [formError, setFormError] = React.useState<string | null>(null);
  const readOnly = mode === "edit" && course?.status === "ARCHIVED";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseInputSchema),
    defaultValues: {
      title: course?.title ?? "",
      description: course?.description ?? "",
      category: course?.category ?? "",
      language: course?.language ?? "PYTHON",
      difficulty: course?.difficulty ?? "BEGINNER",
      status: course?.status ?? "DRAFT",
    },
  });

  async function onSubmit(values: CourseFormValues) {
    setFormError(null);
    try {
      const saved =
        mode === "create"
          ? await createCourse.mutateAsync(values)
          : await updateCourse.mutateAsync(values);
      toast.success(mode === "create" ? "Course created." : "Course details updated.");
      router.push(`/admin/courses/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) {
            setError(field as keyof CourseFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = isSubmitting || createCourse.isPending || updateCourse.isPending;

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
          {readOnly && (
            <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Archived courses are read-only. Restore the course to draft before editing it.
            </p>
          )}
          {formError && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
            >
              {formError}
            </div>
          )}

          <fieldset disabled={readOnly} className="m-0 space-y-8 border-0 p-0">
            <FormSection
              title="Course content"
              description="The catalog entry students and administrators see."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Course title"
                  htmlFor="title"
                  error={errors.title?.message}
                  className="sm:col-span-2"
                  required
                >
                  <Input
                    id="title"
                    placeholder="e.g. Python Web Foundations"
                    {...register("title")}
                    aria-invalid={Boolean(errors.title)}
                  />
                </FormField>

                <FormField
                  label="Category"
                  htmlFor="category"
                  error={errors.category?.message}
                  hint="Group courses in the catalog."
                  required
                >
                  <Input
                    id="category"
                    list="course-category-suggestions"
                    placeholder="e.g. Programming fundamentals"
                    {...register("category")}
                    aria-invalid={Boolean(errors.category)}
                  />
                  <datalist id="course-category-suggestions">
                    {CATEGORY_SUGGESTIONS.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </FormField>

                <FormField label="Status" htmlFor="status" error={errors.status?.message}>
                  <NativeSelect id="status" {...register("status")}>
                    {Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                <FormField
                  label="Description"
                  htmlFor="description"
                  error={errors.description?.message}
                  className="sm:col-span-2"
                  hint="At least 10 characters. Explain what learners will build."
                  required
                >
                  <Textarea
                    id="description"
                    rows={4}
                    {...register("description")}
                    aria-invalid={Boolean(errors.description)}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Delivery"
              description="Language and difficulty influence how the course is presented."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Programming language"
                  htmlFor="language"
                  error={errors.language?.message}
                  required
                >
                  <NativeSelect
                    id="language"
                    {...register("language")}
                    aria-invalid={Boolean(errors.language)}
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField
                  label="Difficulty"
                  htmlFor="difficulty"
                  error={errors.difficulty?.message}
                  required
                >
                  <NativeSelect
                    id="difficulty"
                    {...register("difficulty")}
                    aria-invalid={Boolean(errors.difficulty)}
                  >
                    {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              </div>
            </FormSection>
          </fieldset>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || readOnly}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {mode === "create" ? "Create course" : "Save changes"}
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
}
