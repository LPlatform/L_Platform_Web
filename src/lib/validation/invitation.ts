import { z } from "zod";

export const invitationInputSchema = z
  .object({
    recipient: z.string().trim().min(3, "Enter an email address or username.").max(120),
    channel: z.enum(["EMAIL", "USERNAME"]),
    role: z.enum(["ORGANIZATION_ADMIN", "TEACHER", "STUDENT"], {
      message: "Select an invitation role.",
    }),
    organizationId: z.string().min(1, "Select an organization."),
  })
  .superRefine((value, context) => {
    if (value.channel === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.recipient)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: "Enter a valid email address.",
      });
    }
    if (value.channel === "USERNAME" && !/^[A-Za-z0-9._-]+$/.test(value.recipient)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: "Usernames can use letters, numbers, dots, underscores and hyphens.",
      });
    }
  });

export type InvitationFormValues = z.infer<typeof invitationInputSchema>;
