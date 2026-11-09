import { z } from "zod";

export const settingsSchema = z.object({
  platformName: z.string().trim().min(2, "Platform name is required.").max(60),
  timezone: z.string().min(1, "Select a timezone."),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]),
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    organizationCreated: z.boolean(),
    invitationAccepted: z.boolean(),
    allocationExpiring: z.boolean(),
    weeklyDigest: z.boolean(),
  }),
  adminProfile: z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().trim().email("Enter a valid email address."),
    jobTitle: z.string().trim().max(80),
  }),
  sessionPreferences: z.object({
    idleTimeoutMinutes: z.coerce.number().min(5, "Minimum timeout is 5 minutes.").max(240),
    requireReauthentication: z.boolean(),
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
