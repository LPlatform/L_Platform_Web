"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormActions, FormField, FormSection } from "@/components/admin/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage, isApiError } from "@/lib/api";
import { todayInputValue } from "@/lib/dates";
import {
  useClassOptions,
  useCourseOptions,
  useCreateAllocation,
  useOrganizationOptions,
  useSections,
  useUpdateAllocation,
} from "@/lib/hooks/use-platform-data";
import { ALLOCATION_SCOPE_LABELS } from "@/lib/labels";
import {
  allocationInputSchema,
  allocationUpdateSchema,
  type AllocationFormValues,
  type AllocationUpdateFormValues,
} from "@/lib/validation/allocation";
import type { AllocationInput, AllocationScope, CourseAllocationSummary } from "@/types";

function defaultEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return todayInputValue(date);
}

function DateRangeFields({
  start,
  end,
  errors,
}: {
  start: UseFormRegisterReturn;
  end: UseFormRegisterReturn;
  errors: {
    startDate?: { message?: string };
    endDate?: { message?: string };
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Start date" htmlFor="startDate" error={errors.startDate?.message} required>
        <Input id="startDate" type="date" {...start} aria-invalid={Boolean(errors.startDate)} />
      </FormField>
      <FormField label="End date" htmlFor="endDate" error={errors.endDate?.message} required>
        <Input id="endDate" type="date" {...end} aria-invalid={Boolean(errors.endDate)} />
      </FormField>
    </div>
  );
}

function AccessField({
  registration,
  id = "accessEnabled",
}: {
  registration: UseFormRegisterReturn;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="border-border flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        className="border-input accent-primary mt-0.5 size-4 rounded"
        {...registration}
      />
      <span>
        <span className="block font-medium">Grant access immediately</span>
        <span className="text-muted-foreground block text-xs">
          When off, the allocation exists but learners cannot access the course until it is turned
          on.
        </span>
      </span>
    </label>
  );
}

export function AllocationForm({
  defaultCourseId,
  defaultOrganizationId,
  defaultClassId,
  defaultSectionId,
}: {
  defaultCourseId?: string;
  defaultOrganizationId?: string;
  defaultClassId?: string;
  defaultSectionId?: string;
}) {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const courses = useCourseOptions();
  const createAllocation = useCreateAllocation();
  const [review, setReview] = React.useState<AllocationInput | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const initialScope: AllocationScope = defaultSectionId
    ? "SECTION"
    : defaultClassId
      ? "CLASS"
      : "ORGANIZATION";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationInputSchema),
    defaultValues: {
      courseId: defaultCourseId ?? "",
      organizationId: defaultOrganizationId ?? "",
      scope: initialScope,
      classId: defaultClassId ?? "",
      sectionId: defaultSectionId ?? "",
      startDate: todayInputValue(),
      endDate: defaultEndDate(),
      accessEnabled: true,
    },
  });

  const scope = watch("scope");
  const organizationId = watch("organizationId");
  const classId = watch("classId");
  const courseId = watch("courseId");

  const classOptions = useClassOptions(organizationId);
  const sections = useSections({
    organizationId: (organizationId || "ALL") as string,
    classId: (classId || "ALL") as string,
    status: "ACTIVE",
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDir: "asc",
  });

  const selectedCourse = courses.data?.find((course) => course.id === review?.courseId);
  const selectedOrganization = organizations.data?.find(
    (organization) => organization.id === review?.organizationId,
  );
  const selectedClass = classOptions.data?.find((item) => item.id === review?.classId);
  const selectedSection = sections.data?.items.find((item) => item.id === review?.sectionId);
  const reviewScope: AllocationScope | null = review
    ? review.sectionId
      ? "SECTION"
      : review.classId
        ? "CLASS"
        : "ORGANIZATION"
    : null;

  const courseName = courses.data?.find((course) => course.id === courseId)?.title;

  function onSubmit(values: AllocationFormValues) {
    setFormError(null);
    setReview({
      courseId: values.courseId,
      organizationId: values.organizationId,
      classId: values.scope === "ORGANIZATION" ? null : values.classId || null,
      sectionId: values.scope === "SECTION" ? values.sectionId || null : null,
      startDate: values.startDate,
      endDate: values.endDate,
      accessEnabled: values.accessEnabled,
    });
  }

  async function handleConfirm() {
    if (!review) return;
    try {
      const saved = await createAllocation.mutateAsync(review);
      toast.success("Course allocation created.");
      setReview(null);
      router.push(`/admin/allocations/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in review) {
            setError(field as keyof AllocationFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
      setReview(null);
    }
  }

  const pending = isSubmitting || createAllocation.isPending;

  return (
    <>
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
              title="Course and organization"
              description="Only active courses and active organizations can receive new allocations."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Course"
                  htmlFor="courseId"
                  error={errors.courseId?.message}
                  hint={courseName ? `Selected: ${courseName}` : "Only active courses are listed."}
                  required
                >
                  <NativeSelect
                    id="courseId"
                    {...register("courseId")}
                    aria-invalid={Boolean(errors.courseId)}
                    disabled={courses.isLoading}
                  >
                    <option value="">Select a course</option>
                    {(courses.data ?? []).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.publicId})
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                <FormField
                  label="Organization"
                  htmlFor="organizationId"
                  error={errors.organizationId?.message}
                  required
                >
                  <NativeSelect
                    id="organizationId"
                    {...register("organizationId", {
                      onChange: () => {
                        setValue("classId", "");
                        setValue("sectionId", "");
                      },
                    })}
                    aria-invalid={Boolean(errors.organizationId)}
                    disabled={organizations.isLoading}
                  >
                    <option value="">Select an organization</option>
                    {(organizations.data ?? []).map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                        {organization.status === "INACTIVE" ? " — inactive" : ""}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Allocation scope"
              description="Choose how broadly this course should be available inside the organization."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Scope" htmlFor="scope" error={errors.scope?.message} required>
                  <NativeSelect
                    id="scope"
                    {...register("scope", {
                      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                        if (event.target.value === "ORGANIZATION") {
                          setValue("classId", "");
                          setValue("sectionId", "");
                        } else if (event.target.value === "CLASS") {
                          setValue("sectionId", "");
                        }
                      },
                    })}
                  >
                    <option value="ORGANIZATION">Whole organization</option>
                    <option value="CLASS">Specific class</option>
                    <option value="SECTION">Specific section</option>
                  </NativeSelect>
                </FormField>

                {scope !== "ORGANIZATION" && (
                  <FormField
                    label="Class"
                    htmlFor="classId"
                    error={errors.classId?.message}
                    hint="Only active classes in the selected organization."
                    required
                  >
                    <NativeSelect
                      id="classId"
                      {...register("classId", {
                        onChange: () => setValue("sectionId", ""),
                      })}
                      aria-invalid={Boolean(errors.classId)}
                      disabled={!organizationId || classOptions.isLoading}
                    >
                      <option value="">Select a class</option>
                      {(classOptions.data ?? []).map((academicClass) => (
                        <option key={academicClass.id} value={academicClass.id}>
                          {academicClass.name} ({academicClass.academicYear})
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                )}

                {scope === "SECTION" && (
                  <FormField
                    label="Section"
                    htmlFor="sectionId"
                    error={errors.sectionId?.message}
                    hint="Only active sections in the selected class."
                    required
                  >
                    <NativeSelect
                      id="sectionId"
                      {...register("sectionId")}
                      aria-invalid={Boolean(errors.sectionId)}
                      disabled={!classId || sections.isLoading}
                    >
                      <option value="">Select a section</option>
                      {(sections.data?.items ?? []).map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Schedule and access"
              description="Schedules determine when the allocation becomes active. Access can be withheld until the course is ready."
            >
              <div className="space-y-4">
                <DateRangeFields
                  start={register("startDate")}
                  end={register("endDate")}
                  errors={errors}
                />
                <AccessField registration={register("accessEnabled")} />
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
                Review allocation
              </Button>
            </FormActions>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(review)}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
        title="Confirm course allocation"
        description="Review the scope before creating the allocation. Student reach is calculated after the allocation is created."
        confirmLabel="Create allocation"
        onConfirm={handleConfirm}
      >
        {review && (
          <dl className="border-border bg-muted/30 space-y-2 rounded-lg border px-3 py-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Course</dt>
              <dd className="text-right font-medium">
                {selectedCourse?.title ?? courseName ?? "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="text-right font-medium">{selectedOrganization?.name ?? "—"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Scope</dt>
              <dd className="text-right">
                {reviewScope && (
                  <Badge variant="outline">{ALLOCATION_SCOPE_LABELS[reviewScope]}</Badge>
                )}
              </dd>
            </div>
            {review.classId && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Class</dt>
                <dd className="text-right font-medium">{selectedClass?.name ?? "—"}</dd>
              </div>
            )}
            {review.sectionId && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Section</dt>
                <dd className="text-right font-medium">{selectedSection?.name ?? "—"}</dd>
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Schedule</dt>
              <dd className="text-right">
                {review.startDate} → {review.endDate}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Access</dt>
              <dd className="text-right">
                {review.accessEnabled ? "Granted immediately" : "Withheld"}
              </dd>
            </div>
          </dl>
        )}
      </ConfirmDialog>
    </>
  );
}

export function AllocationEditForm({ allocation }: { allocation: CourseAllocationSummary }) {
  const router = useRouter();
  const updateAllocation = useUpdateAllocation(allocation.id);
  const [formError, setFormError] = React.useState<string | null>(null);
  const readOnly = Boolean(allocation.revokedAt);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AllocationUpdateFormValues>({
    resolver: zodResolver(allocationUpdateSchema),
    defaultValues: {
      startDate: allocation.startDate.slice(0, 10),
      endDate: allocation.endDate.slice(0, 10),
      accessEnabled: allocation.accessEnabled,
    },
  });

  async function onSubmit(values: AllocationUpdateFormValues) {
    setFormError(null);
    try {
      await updateAllocation.mutateAsync(values);
      toast.success("Allocation schedule updated.");
      router.push(`/admin/allocations/${allocation.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) {
            setError(field as keyof AllocationUpdateFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = isSubmitting || updateAllocation.isPending;

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
          {readOnly && (
            <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Revoked allocations cannot be edited. Create a new allocation instead.
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

          <dl className="border-border bg-muted/30 grid gap-3 rounded-lg border px-3 py-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">Course</dt>
              <dd className="mt-0.5 font-medium">{allocation.courseTitle}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                Organization
              </dt>
              <dd className="mt-0.5 font-medium">{allocation.organizationName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">Target</dt>
              <dd className="mt-0.5">
                {allocation.scope === "SECTION"
                  ? `${allocation.className ?? "Class"} · ${allocation.sectionName ?? "Section"}`
                  : allocation.scope === "CLASS"
                    ? (allocation.className ?? "Class")
                    : "Whole organization"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">Scope</dt>
              <dd className="mt-0.5">{ALLOCATION_SCOPE_LABELS[allocation.scope]}</dd>
            </div>
          </dl>

          <fieldset disabled={readOnly} className="m-0 space-y-6 border-0 p-0">
            <FormSection
              title="Schedule"
              description="Dates are interpreted in the platform timezone."
            >
              <DateRangeFields
                start={register("startDate")}
                end={register("endDate")}
                errors={errors}
              />
            </FormSection>

            <FormSection title="Access" description="Control whether learners can open the course.">
              <AccessField registration={register("accessEnabled")} />
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
              Save changes
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
}
