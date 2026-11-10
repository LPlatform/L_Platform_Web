import { z } from "zod";

export const allocationInputSchema = z
  .object({
    courseId: z.string().min(1, "Select a course."),
    organizationId: z.string().min(1, "Select an organization."),
    scope: z.enum(["ORGANIZATION", "CLASS", "SECTION"]),
    classId: z.string().nullable(),
    sectionId: z.string().nullable(),
    startDate: z.string().min(1, "Select a start date."),
    endDate: z.string().min(1, "Select an end date."),
    accessEnabled: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.scope !== "ORGANIZATION" && !value.classId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classId"],
        message: "Select a class for this allocation scope.",
      });
    }
    if (value.scope === "SECTION" && !value.sectionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionId"],
        message: "Select a section for this allocation scope.",
      });
    }
    if (value.startDate && value.endDate && value.endDate <= value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date.",
      });
    }
  });

export const allocationUpdateSchema = z
  .object({
    startDate: z.string().min(1, "Select a start date."),
    endDate: z.string().min(1, "Select an end date."),
    accessEnabled: z.boolean(),
  })
  .refine((value) => value.endDate > value.startDate, {
    path: ["endDate"],
    message: "End date must be after the start date.",
  });

export type AllocationFormValues = z.infer<typeof allocationInputSchema>;
export type AllocationUpdateFormValues = z.infer<typeof allocationUpdateSchema>;
