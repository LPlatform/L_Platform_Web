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
import { useClasses, useCreateSection, useUpdateSection } from "@/lib/hooks/use-platform-data";
import { sectionInputSchema, type SectionFormValues } from "@/lib/validation/academic";
import type { SectionWithStats } from "@/types";

export function SectionForm({
  mode,
  section,
  defaultClassId,
}: {
  mode: "create" | "edit";
  section?: SectionWithStats;
  defaultClassId?: string;
}) {
  const router = useRouter();
  const initialClassId = section?.classId ?? defaultClassId ?? "";
  const [selectedClassId, setSelectedClassId] = React.useState(initialClassId);
  const classes = useClasses({
    page: 1,
    pageSize: 100,
    status: mode === "create" ? "ACTIVE" : "ALL",
    sortBy: "name",
    sortDir: "asc",
  });
  const createSection = useCreateSection(selectedClassId);
  const updateSection = useUpdateSection(section?.id ?? "");
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionInputSchema),
    defaultValues: {
      classId: initialClassId,
      name: section?.name ?? "",
      description: section?.description ?? "",
    },
  });

  async function onSubmit(values: SectionFormValues) {
    setFormError(null);
    const payload = {
      name: values.name,
      description: values.description ?? "",
    };

    try {
      const saved =
        mode === "create"
          ? await createSection.mutateAsync({ ...payload, classId: values.classId })
          : await updateSection.mutateAsync(payload);
      toast.success(mode === "create" ? "Section created." : "Section details updated.");
      router.push(`/admin/sections/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) {
            setError(field as keyof SectionFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = isSubmitting || createSection.isPending || updateSection.isPending;

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
          {formError && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
            >
              {formError}
            </div>
          )}

          <FormSection
            title="Section details"
            description="Sections split a class into groups that students and teachers are assigned to."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {mode === "create" ? (
                <FormField
                  label="Class"
                  htmlFor="classId"
                  error={errors.classId?.message}
                  hint="Only active classes in active organizations can receive sections."
                  required
                >
                  <NativeSelect
                    id="classId"
                    {...register("classId", {
                      onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
                        setSelectedClassId(event.target.value),
                    })}
                    aria-invalid={Boolean(errors.classId)}
                    disabled={classes.isLoading}
                  >
                    <option value="">Select a class</option>
                    {(classes.data?.items ?? []).map((academicClass) => (
                      <option key={academicClass.id} value={academicClass.id}>
                        {academicClass.name} · {academicClass.organizationName} (
                        {academicClass.academicYear})
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              ) : (
                <>
                  <input type="hidden" {...register("classId")} />
                  <div className="space-y-2">
                    <p className="text-sm leading-none font-medium">Class</p>
                    <p className="text-muted-foreground flex h-9 items-center text-sm">
                      {section?.className ?? "—"}
                      {section?.organizationName ? ` · ${section.organizationName}` : ""}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Sections cannot be moved to another class.
                    </p>
                  </div>
                </>
              )}

              <FormField
                label="Section name"
                htmlFor="name"
                error={errors.name?.message}
                hint="Section names must be unique within a class."
                required
              >
                <Input
                  id="name"
                  placeholder="e.g. Section A"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="description"
                error={errors.description?.message}
                hint="Optional. Shown to administrators on the section page."
                className="sm:col-span-2"
              >
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Any timetable or grouping notes."
                  {...register("description")}
                  aria-invalid={Boolean(errors.description)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {mode === "create" ? "Create section" : "Save changes"}
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
}
