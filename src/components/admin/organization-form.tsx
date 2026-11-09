"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormActions, FormField, FormSection } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage, isApiError } from "@/lib/api";
import { useCreateOrganization, useUpdateOrganization } from "@/lib/hooks/use-platform-data";
import { organizationUpdateSchema } from "@/lib/validation/organization";
import { slugify } from "@/lib/utils";
import type { OrganizationWithStats } from "@/types";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/labels";

type OrganizationFormValues = z.infer<typeof organizationUpdateSchema> & {
  initialAdministratorEmail?: string;
};

const TYPE_OPTIONS = Object.entries(ORGANIZATION_TYPE_LABELS) as Array<
  [keyof typeof ORGANIZATION_TYPE_LABELS, string]
>;

function buildSchema(mode: "create" | "edit") {
  return organizationUpdateSchema
    .extend({ initialAdministratorEmail: z.string().trim().optional() })
    .superRefine((value, context) => {
      if (mode !== "create") return;
      const parsed = z.string().email().safeParse(value.initialAdministratorEmail);
      if (!parsed.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["initialAdministratorEmail"],
          message: "Enter a valid administrator email.",
        });
      }
    });
}

export function OrganizationForm({
  mode,
  organization,
}: {
  mode: "create" | "edit";
  organization?: OrganizationWithStats;
}) {
  const router = useRouter();
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization(organization?.id ?? "");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [slugEdited, setSlugEdited] = React.useState(false);

  const schema = React.useMemo(() => buildSchema(mode), [mode]);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      type: organization?.type ?? "SCHOOL",
      contactName: organization?.contactName ?? "",
      contactEmail: organization?.contactEmail ?? "",
      phone: organization?.phone ?? "",
      address: organization?.address ?? "",
      city: organization?.city ?? "",
      state: organization?.state ?? "",
      country: organization?.country ?? "India",
      postalCode: organization?.postalCode ?? "",
      status: organization?.status ?? "ACTIVE",
      initialAdministratorEmail: "",
    },
  });

  const nameValue = watch("name");
  const slugRegistration = register("slug", {
    onChange: () => setSlugEdited(true),
  });

  React.useEffect(() => {
    if (mode !== "create" || slugEdited) return;
    setValue("slug", slugify(nameValue));
  }, [nameValue, mode, slugEdited, setValue]);

  async function onSubmit(values: OrganizationFormValues) {
    setFormError(null);
    const base = {
      name: values.name,
      slug: values.slug,
      type: values.type,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      phone: values.phone,
      address: values.address,
      city: values.city,
      state: values.state,
      country: values.country,
      postalCode: values.postalCode,
      status: values.status,
    };

    try {
      const saved =
        mode === "create"
          ? await createOrganization.mutateAsync({
              ...base,
              initialAdministratorEmail: values.initialAdministratorEmail ?? "",
            })
          : await updateOrganization.mutateAsync(base);
      toast.success(mode === "create" ? "Organization created." : "Organization details updated.");
      router.push(`/admin/organizations/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in base || field === "initialAdministratorEmail") {
            setError(field as keyof OrganizationFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = isSubmitting || createOrganization.isPending || updateOrganization.isPending;

  return (
    <Card className="max-w-4xl">
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
            title="Organization details"
            description="Identity and status of the institution on the platform."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Organization name"
                htmlFor="name"
                error={errors.name?.message}
                required
              >
                <Input
                  id="name"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </FormField>
              <FormField
                label="Slug"
                htmlFor="slug"
                error={errors.slug?.message}
                hint="Used in URLs and imported user rows. Lowercase letters, numbers and hyphens."
                required
              >
                <Input
                  id="slug"
                  {...slugRegistration}
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={errors.slug ? "slug-error" : "slug-hint"}
                />
              </FormField>
              <FormField
                label="Organization type"
                htmlFor="type"
                error={errors.type?.message}
                required
              >
                <NativeSelect id="type" {...register("type")} aria-invalid={Boolean(errors.type)}>
                  {TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Status" htmlFor="status" error={errors.status?.message}>
                <NativeSelect id="status" {...register("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </NativeSelect>
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="Primary contact"
            description="The person the platform team can reach about this institution."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Contact name"
                htmlFor="contactName"
                error={errors.contactName?.message}
                required
              >
                <Input
                  id="contactName"
                  {...register("contactName")}
                  aria-invalid={Boolean(errors.contactName)}
                />
              </FormField>
              <FormField
                label="Contact email"
                htmlFor="contactEmail"
                error={errors.contactEmail?.message}
                required
              >
                <Input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                  aria-invalid={Boolean(errors.contactEmail)}
                />
              </FormField>
              <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                  aria-invalid={Boolean(errors.phone)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Location" description="Where the institution is based.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Address"
                htmlFor="address"
                error={errors.address?.message}
                className="sm:col-span-2"
                required
              >
                <Textarea
                  id="address"
                  rows={2}
                  {...register("address")}
                  aria-invalid={Boolean(errors.address)}
                />
              </FormField>
              <FormField label="City" htmlFor="city" error={errors.city?.message} required>
                <Input id="city" {...register("city")} aria-invalid={Boolean(errors.city)} />
              </FormField>
              <FormField label="State" htmlFor="state" error={errors.state?.message} required>
                <Input id="state" {...register("state")} aria-invalid={Boolean(errors.state)} />
              </FormField>
              <FormField label="Country" htmlFor="country" error={errors.country?.message} required>
                <Input
                  id="country"
                  {...register("country")}
                  aria-invalid={Boolean(errors.country)}
                />
              </FormField>
              <FormField
                label="Postal code"
                htmlFor="postalCode"
                error={errors.postalCode?.message}
                required
              >
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  aria-invalid={Boolean(errors.postalCode)}
                />
              </FormField>
            </div>
          </FormSection>

          {mode === "create" && (
            <FormSection
              title="Initial administrator"
              description="An invitation is created for this address. No email is sent in this mock environment."
            >
              <div className="sm:max-w-md">
                <FormField
                  label="Administrator email"
                  htmlFor="initialAdministratorEmail"
                  error={errors.initialAdministratorEmail?.message}
                  hint="The invitation appears under Invitations with Pending status."
                  required
                >
                  <Input
                    id="initialAdministratorEmail"
                    type="email"
                    placeholder="principal@organization.edu"
                    {...register("initialAdministratorEmail")}
                    aria-invalid={Boolean(errors.initialAdministratorEmail)}
                  />
                </FormField>
              </div>
            </FormSection>
          )}

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
              {mode === "create" ? "Create organization" : "Save changes"}
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
}
