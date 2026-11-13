"use client";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ErrorState } from "@/components/admin/error-state";
import { FormActions, FormField, FormSection } from "@/components/admin/form";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage, isApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";
import { useResetDemoData, useSettings, useUpdateSettings } from "@/lib/hooks/use-platform-data";
import { cn } from "@/lib/utils";
import { settingsSchema, type SettingsFormValues } from "@/lib/validation/settings";
import type { PlatformSettings } from "@/types";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "America/New_York", label: "America/New_York (ET)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AET)" },
  { value: "UTC", label: "UTC" },
];

const NOTIFICATIONS: Array<{
  key: keyof SettingsFormValues["notifications"];
  label: string;
  description: string;
}> = [
  {
    key: "organizationCreated",
    label: "Organization created",
    description: "Notify the platform team when a new organization is onboarded.",
  },
  {
    key: "invitationAccepted",
    label: "Invitation accepted",
    description: "Notify administrators when an invited member joins.",
  },
  {
    key: "allocationExpiring",
    label: "Allocation expiring",
    description: "Alert before a course allocation reaches its end date.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description: "Store weekly Monday activity summary preference in platform settings.",
  },
];

const SHOW_DEMO_RESET =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_RESET === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_RESET !== "false");

export default function SettingsPage() {
  const settings = useSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Configure platform identity, notification preferences, administrator profile and session policy. Changes are saved to the backend."
        actions={
          <Badge variant="muted">
            {process.env.NODE_ENV === "production"
              ? "Production environment"
              : "Development environment"}
          </Badge>
        }
      />

      {settings.isLoading ? (
        <Card className="max-w-4xl">
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : settings.error ? (
        <Card className="max-w-4xl">
          <ErrorState
            title="Settings could not be loaded"
            message={getErrorMessage(settings.error)}
            onRetry={() => void settings.refetch()}
          />
        </Card>
      ) : settings.data ? (
        <SettingsForm settings={settings.data} />
      ) : null}
    </div>
  );
}

function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const { setTheme } = useTheme();
  const updateSettings = useUpdateSettings();
  const resetDemoData = useResetDemoData();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof settingsSchema>, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  React.useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const pending = isSubmitting || updateSettings.isPending;

  async function onSubmit(values: SettingsFormValues) {
    setFormError(null);
    try {
      const saved = await updateSettings.mutateAsync({ ...values, updatedAt: settings.updatedAt });
      setTheme(saved.theme);
      reset(saved);
      toast.success("Settings saved.");
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof SettingsFormValues, { message });
        }
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function handleReset() {
    await resetDemoData.mutateAsync();
    toast.success("Baseline demo data seeded. Existing records were kept.");
    setResetOpen(false);
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
            {formError && (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
              >
                {formError}
              </p>
            )}

            <FormSection
              title="Platform identity"
              description="How the platform presents itself to administrators."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Platform name"
                  htmlFor="platformName"
                  error={errors.platformName?.message}
                  required
                >
                  <Input
                    id="platformName"
                    {...register("platformName")}
                    aria-invalid={Boolean(errors.platformName)}
                  />
                </FormField>
                <FormField
                  label="Timezone"
                  htmlFor="timezone"
                  error={errors.timezone?.message}
                  hint="Used to interpret allocation and report dates."
                  required
                >
                  <NativeSelect
                    id="timezone"
                    {...register("timezone")}
                    aria-invalid={Boolean(errors.timezone)}
                  >
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField
                  label="Date format"
                  htmlFor="dateFormat"
                  error={errors.dateFormat?.message}
                >
                  <NativeSelect id="dateFormat" {...register("dateFormat")}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </NativeSelect>
                </FormField>
                <FormField
                  label="Appearance"
                  htmlFor="theme"
                  error={errors.theme?.message}
                  hint="Applied immediately after saving."
                >
                  <NativeSelect id="theme" {...register("theme")}>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </NativeSelect>
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Notifications"
              description="Choose which platform events would generate notifications. Delivery is simulated."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {NOTIFICATIONS.map((notification) => (
                  <Controller
                    key={notification.key}
                    control={control}
                    name={`notifications.${notification.key}`}
                    render={({ field }) => (
                      <ToggleRow
                        id={`notification-${notification.key}`}
                        label={notification.label}
                        description={notification.description}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                ))}
              </div>
            </FormSection>

            <FormSection
              title="Administrator profile"
              description="The signed-in platform administrator's contact details."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="First name"
                  htmlFor="adminFirstName"
                  error={errors.adminProfile?.firstName?.message}
                  required
                >
                  <Input
                    id="adminFirstName"
                    {...register("adminProfile.firstName")}
                    aria-invalid={Boolean(errors.adminProfile?.firstName)}
                  />
                </FormField>
                <FormField
                  label="Last name"
                  htmlFor="adminLastName"
                  error={errors.adminProfile?.lastName?.message}
                  required
                >
                  <Input
                    id="adminLastName"
                    {...register("adminProfile.lastName")}
                    aria-invalid={Boolean(errors.adminProfile?.lastName)}
                  />
                </FormField>
                <FormField
                  label="Email"
                  htmlFor="adminEmail"
                  error={errors.adminProfile?.email?.message}
                  required
                >
                  <Input
                    id="adminEmail"
                    type="email"
                    {...register("adminProfile.email")}
                    aria-invalid={Boolean(errors.adminProfile?.email)}
                  />
                </FormField>
                <FormField
                  label="Job title"
                  htmlFor="adminJobTitle"
                  error={errors.adminProfile?.jobTitle?.message}
                >
                  <Input
                    id="adminJobTitle"
                    {...register("adminProfile.jobTitle")}
                    aria-invalid={Boolean(errors.adminProfile?.jobTitle)}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Session preferences"
              description="Policy for the demo administrator session."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Idle timeout (minutes)"
                  htmlFor="idleTimeoutMinutes"
                  error={errors.sessionPreferences?.idleTimeoutMinutes?.message}
                  hint="Between 5 and 240 minutes."
                  required
                >
                  <Input
                    id="idleTimeoutMinutes"
                    type="number"
                    min={5}
                    max={240}
                    step={5}
                    {...register("sessionPreferences.idleTimeoutMinutes", {
                      valueAsNumber: true,
                    })}
                    aria-invalid={Boolean(errors.sessionPreferences?.idleTimeoutMinutes)}
                  />
                </FormField>
                <Controller
                  control={control}
                  name="sessionPreferences.requireReauthentication"
                  render={({ field }) => (
                    <ToggleRow
                      id="requireReauthentication"
                      label="Require re-authentication"
                      description="Ask for credentials again before sensitive changes."
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="self-end"
                    />
                  )}
                />
              </div>
            </FormSection>

            <FormActions>
              <p className="text-muted-foreground mr-auto self-center text-xs">
                Last updated {formatDateTime(settings.updatedAt)}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => reset(settings)}
              >
                Reset form
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-4" aria-hidden />
                )}
                Save settings
              </Button>
            </FormActions>
          </form>
        </CardContent>
      </Card>

      {SHOW_DEMO_RESET && (
        <>
          <Card className="border-destructive/30 max-w-4xl">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Seed baseline demo data</p>
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                  Add the baseline development organizations, users, classes, courses and
                  assignments. Existing records are preserved; this does not erase your data.
                </p>
              </div>
              <Button variant="outline" onClick={() => setResetOpen(true)}>
                <RotateCcw className="size-4" />
                Seed demo data
              </Button>
            </CardContent>
          </Card>

          <ConfirmDialog
            open={resetOpen}
            onOpenChange={setResetOpen}
            title="Seed baseline demo data?"
            description="Baseline records will be added where missing. Existing records and settings are preserved."
            confirmLabel="Seed demo data"
            tone="default"
            onConfirm={handleReset}
          />
        </>
      )}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border flex items-start justify-between gap-4 rounded-lg border p-3",
        className,
      )}
    >
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
