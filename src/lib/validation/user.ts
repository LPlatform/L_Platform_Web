import { z } from "zod";

const nameField = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(60, `${label} is too long.`);

export const userInputSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: z.string().trim().email("Enter a valid email address."),
    role: z.enum(["PLATFORM_ADMIN", "ORGANIZATION_ADMIN", "TEACHER", "STUDENT"]),
    organizationId: z.string().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    username: z.string().trim().max(40).optional(),
  })
  .superRefine((value, context) => {
    if (value.role === "PLATFORM_ADMIN" && value.organizationId !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message: "Platform administrators do not belong to an organization.",
      });
    }
    if (value.role !== "PLATFORM_ADMIN" && !value.organizationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message: "Select the organization for this user.",
      });
    }
  });

export const userUpdateSchema = userInputSchema
  .innerType()
  .omit({ role: true })
  .superRefine((value, context) => {
    if (!value.organizationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message: "Select the organization for this user.",
      });
    }
  });

export const studentInputSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: z.string().trim().email("Enter a valid email address.").or(z.literal("")),
    username: z
      .string()
      .trim()
      .max(40)
      .regex(
        /^[A-Za-z0-9._-]*$/,
        "Username can use letters, numbers, dots, underscores and hyphens.",
      )
      .or(z.literal("")),
    organizationId: z.string().min(1, "Select an organization."),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.username) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Provide an email address or a school-issued username.",
      });
    }
  });

export const csvUserRowSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: z.string().trim().email("Invalid email.").optional(),
    username: z.string().trim().min(1).max(40).optional(),
    role: z.enum(["TEACHER", "STUDENT"]),
    organizationPublicId: z.string().trim().min(1, "Organization ID is required."),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.username) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email or username is required.",
      });
    }
  });

export const bulkStudentCsvSchema = z.object({
  email: z.string().trim().email().optional(),
  username: z.string().trim().min(1).max(40).optional(),
});

export type UserFormValues = z.infer<typeof userInputSchema>;
export type StudentFormValues = z.infer<typeof studentInputSchema>;
