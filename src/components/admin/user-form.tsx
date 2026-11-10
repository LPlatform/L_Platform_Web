"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormActions, FormField, FormSection } from "@/components/admin/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage, isApiError } from "@/lib/api";
import {
  useCreateAdministrator,
  useCreateUser,
  useOrganizationOptions,
  useUpdateAdministrator,
  useUpdateUser,
} from "@/lib/hooks/use-platform-data";
import { userInputSchema, type UserFormValues } from "@/lib/validation/user";
import type { UserRole, UserWithOrganization } from "@/types";
import { ROLE_LABELS } from "@/types";

const ASSIGNABLE_ROLES: UserRole[] = ["ORGANIZATION_ADMIN", "TEACHER", "STUDENT"];

export function UserForm({
  mode,
  variant = "user",
  user,
  defaultRole = "STUDENT",
}: {
  mode: "create" | "edit";
  variant?: "user" | "administrator";
  user?: UserWithOrganization;
  defaultRole?: UserRole;
}) {
  const router = useRouter();
  const organizations = useOrganizationOptions();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? "");
  const createAdministrator = useCreateAdministrator();
  const updateAdministrator = useUpdateAdministrator(user?.id ?? "");
  const [formError, setFormError] = React.useState<string | null>(null);

  const isAdministrator = variant === "administrator" || user?.role === "ORGANIZATION_ADMIN";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userInputSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      role: user?.role ?? (variant === "administrator" ? "ORGANIZATION_ADMIN" : defaultRole),
      organizationId: user?.organizationId ?? "",
      status: user?.status ?? "ACTIVE",
    },
  });

  async function onSubmit(values: UserFormValues) {
    setFormError(null);
    const role: UserRole = variant === "administrator" ? "ORGANIZATION_ADMIN" : values.role;

    try {
      if (mode === "create") {
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          username: values.username?.trim() || undefined,
          role,
          organizationId: values.organizationId || null,
          status: values.status,
        };
        const created =
          variant === "administrator"
            ? await createAdministrator.mutateAsync(payload)
            : await createUser.mutateAsync(payload);
        toast.success(variant === "administrator" ? "Administrator created." : "User created.");
        router.push(`/admin/users/${created.id}`);
        return;
      }

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        username: values.username?.trim() || undefined,
        organizationId: values.organizationId || null,
        status: values.status,
      };
      const saved = isAdministrator
        ? await updateAdministrator.mutateAsync(payload)
        : await updateUser.mutateAsync(payload);
      toast.success("User details updated.");
      router.push(`/admin/users/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) {
            setError(field as keyof UserFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending =
    isSubmitting ||
    createUser.isPending ||
    updateUser.isPending ||
    createAdministrator.isPending ||
    updateAdministrator.isPending;

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
            title="Personal details"
            description="Identity information for this account."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="First name"
                htmlFor="firstName"
                error={errors.firstName?.message}
                required
              >
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  {...register("firstName")}
                  aria-invalid={Boolean(errors.firstName)}
                />
              </FormField>
              <FormField
                label="Last name"
                htmlFor="lastName"
                error={errors.lastName?.message}
                required
              >
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  {...register("lastName")}
                  aria-invalid={Boolean(errors.lastName)}
                />
              </FormField>
              <FormField
                label="Email address"
                htmlFor="email"
                error={errors.email?.message}
                required
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                />
              </FormField>
              <FormField
                label="Username"
                htmlFor="username"
                error={errors.username?.message}
                hint="Optional. Students imported from CSV may use a username instead of an email."
              >
                <Input
                  id="username"
                  autoComplete="off"
                  placeholder="e.g. kabir.shah"
                  {...register("username")}
                  aria-invalid={Boolean(errors.username)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="Access and assignment"
            description="Role and organization determine which records this account can access."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm leading-none font-medium">Role</p>
                {variant === "administrator" || mode === "edit" ? (
                  <div className="flex h-9 items-center">
                    <Badge variant="secondary">
                      {
                        ROLE_LABELS[
                          variant === "administrator"
                            ? "ORGANIZATION_ADMIN"
                            : (user?.role ?? "STUDENT")
                        ]
                      }
                    </Badge>
                  </div>
                ) : (
                  <NativeSelect id="role" {...register("role")} aria-invalid={Boolean(errors.role)}>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
                {errors.role && (
                  <p role="alert" className="text-destructive text-sm">
                    {errors.role.message}
                  </p>
                )}
                {mode === "edit" && (
                  <p className="text-muted-foreground text-xs">
                    Roles cannot be changed after an account is created.
                  </p>
                )}
              </div>

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

              <FormField label="Account status" htmlFor="status" error={errors.status?.message}>
                <NativeSelect id="status" {...register("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </NativeSelect>
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
              {mode === "create" ? "Create account" : "Save changes"}
            </Button>
          </FormActions>
        </form>
      </CardContent>
    </Card>
  );
}
