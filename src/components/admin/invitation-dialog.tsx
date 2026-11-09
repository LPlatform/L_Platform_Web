"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage, isApiError } from "@/lib/api";
import { useCreateInvitation, useOrganizationOptions } from "@/lib/hooks/use-platform-data";
import { invitationInputSchema, type InvitationFormValues } from "@/lib/validation/invitation";
import { ROLE_LABELS } from "@/types";

const INVITABLE_ROLES: InvitationFormValues["role"][] = [
  "ORGANIZATION_ADMIN",
  "TEACHER",
  "STUDENT",
];

export function InvitationDialog({
  open,
  onOpenChange,
  defaultOrganizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrganizationId?: string;
}) {
  const organizations = useOrganizationOptions();
  const createInvitation = useCreateInvitation();
  const [formError, setFormError] = React.useState<string | null>(null);

  const initialValues = React.useMemo<InvitationFormValues>(
    () => ({
      recipient: "",
      channel: "EMAIL",
      role: "STUDENT",
      organizationId: defaultOrganizationId ?? "",
    }),
    [defaultOrganizationId],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationInputSchema),
    defaultValues: initialValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(initialValues);
      setFormError(null);
    }
  }, [open, initialValues, reset]);

  const channel = watch("channel");
  const pending = isSubmitting || createInvitation.isPending;

  async function onSubmit(values: InvitationFormValues) {
    setFormError(null);
    try {
      const invitation = await createInvitation.mutateAsync(values);
      toast.success(
        `Invitation created for ${invitation.recipient}. No email was sent in this mock environment.`,
      );
      onOpenChange(false);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in initialValues) {
            setError(field as keyof InvitationFormValues, { message });
          }
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new member</DialogTitle>
          <DialogDescription>
            Create a mock invitation for an organization admin, teacher or student. Nothing is sent
            by email or message in this build.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
            >
              {formError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Channel"
              htmlFor="invitation-channel"
              error={errors.channel?.message}
              required
            >
              <NativeSelect
                id="invitation-channel"
                {...register("channel")}
                aria-invalid={Boolean(errors.channel)}
              >
                <option value="EMAIL">Email address</option>
                <option value="USERNAME">Username</option>
              </NativeSelect>
            </FormField>

            <FormField label="Role" htmlFor="invitation-role" error={errors.role?.message} required>
              <NativeSelect
                id="invitation-role"
                {...register("role")}
                aria-invalid={Boolean(errors.role)}
              >
                {INVITABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>

          <FormField
            label={channel === "USERNAME" ? "Username" : "Email address"}
            htmlFor="invitation-recipient"
            error={errors.recipient?.message}
            hint={
              channel === "USERNAME"
                ? "Letters, numbers, dots, underscores and hyphens."
                : "The address the invitation is addressed to. No email is sent."
            }
            required
          >
            <Input
              id="invitation-recipient"
              type={channel === "USERNAME" ? "text" : "email"}
              placeholder={channel === "USERNAME" ? "new.teacher" : "person@organization.edu"}
              autoComplete="off"
              {...register("recipient")}
              aria-invalid={Boolean(errors.recipient)}
              aria-describedby={errors.recipient ? "invitation-recipient-error" : undefined}
            />
          </FormField>

          <FormField
            label="Organization"
            htmlFor="invitation-organization"
            error={errors.organizationId?.message}
            hint="Invitations are only valid for active organizations."
            required
          >
            <NativeSelect
              id="invitation-organization"
              {...register("organizationId")}
              aria-invalid={Boolean(errors.organizationId)}
            >
              <option value="">Select an organization</option>
              {(organizations.data ?? []).map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              Create invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
