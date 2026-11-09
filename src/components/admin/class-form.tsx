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
import { academicYearOptions, currentAcademicYear } from "@/lib/dates";
import {
  useCreateClass,
  useOrganizationOptions,
  useUpdateClass,
} from "@/lib/hooks/use-platform-data";
import { classInputSchema, type ClassFormValues } from "@/lib/validation/academic";
import type { AcademicClassWithStats } from "@/types";

export function ClassForm({
  mode,
  academicClass,
  defaultOrganizationId,
}: {
  mode: "create" | "edit";
  academicClass?: AcademicClassWithStats;
  defaultOrganizationId?: string;
}) {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass(academicClass?.id ?? "");
  const [formError, setFormError] = React.useState<string | null>(null);

  const yearOptions = React.useMemo(() => {
    const options = academicYearOptions();
    const existing = academicClass?.academicYear;
    return existing && !options.includes(existing) ? [existing, ...options] : options;
  }, [academicClass?.academicYear]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classInputSchema),
    defaultValues: {
      name: academicClass?.name ?? "",
      organizationId: academicClass?.organizationId ?? defaultOrganizationId ?? "",
      academicYear: academicClass?.academicYear ?? currentAcademicYear(),
      description: academicClass?.description ?? "",
      status: academicClass?.status ?? "ACTIVE",
    },
  });

  async function onSubmit(values: ClassFormValues) {
    setFormError(null);
    const payload = {
      name: values.name,
      academicYear: values.academicYear,
      description: values.description ?? "",
      status: values.status,
    };

    try {
      const saved =
        mode === "create"
          ? await createClass.mutateAsync({
              ...payload,
              organizationId: values.organizationId,
            })
          : await updateClass.mutateAsync(payload);
      toast.success(mode === "create" ? "Class created." : "Class details updated.");
      router.push(`/admin/classes/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) {
            setError(field as keyof ClassFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = isSubmitting || createClass.isPending || updateClass.isPending;

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
            title="Class details"
            description="A class groups the sections that follow the same academic year within an organization."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Class name" htmlFor="name" error={errors.name?.message} required>
                <Input
                  id="name"
                  placeholder="e.g. Class 8"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
              </FormField>

              {mode === "create" ? (
                <FormField
                  label="Organization"
                  htmlFor="organizationId"
                  error={errors.organizationId?.message}
                  required
                >
                  <NativeSelect
                    id="organizationId"
                    {...register("organizationId")}
                    aria-invalid={Boolean(errors.organizationId)}
                    disabled={organizations.isLoading}
                  >
                    <option value="">Select an organization</option>
                    {(organizations.data ?? []).map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name} ({organization.publicId})
                        {organization.status === "INACTIVE" ? " — inactive" : ""}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              ) : (
                <>
                  <input type="hidden" {...register("organizationId")} />
                  <div className="space-y-2">
                    <p className="text-sm leading-none font-medium">Organization</p>
                    <p className="text-muted-foreground flex h-9 items-center text-sm">
                      {academicClass?.organizationName ?? "—"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Classes cannot be moved between organizations.
                    </p>
                  </div>
                </>
              )}

              <FormField
                label="Academic year"
                htmlFor="academicYear"
                error={errors.academicYear?.message}
                hint="Use the YYYY-YY format, for example 2026-27."
                required
              >
                <NativeSelect
                  id="academicYear"
                  {...register("academicYear")}
                  aria-invalid={Boolean(errors.academicYear)}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>

              <FormField label="Class status" htmlFor="status" error={errors.status?.message}>
                <NativeSelect id="status" {...register("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </NativeSelect>
              </FormField>

              <FormField
                label="Description"
                htmlFor="description"
                error={errors.description?.message}
                hint="Optional. Shown to administrators on the class page."
                className="sm:col-span-2"
              >
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="What this class covers and who it is for."
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
              {mode === "create" ? "Create class" : "Save changes"}
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
}
