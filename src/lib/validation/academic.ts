import { z } from "zod";

export const classInputSchema = z.object({
  name: z.string().trim().min(1, "Class name is required.").max(60),
  organizationId: z.string().min(1, "Select an organization."),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Use the YYYY-YY academic year format."),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer.")
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const classUpdateSchema = classInputSchema.omit({ organizationId: true });

export const sectionInputSchema = z.object({
  classId: z.string().min(1, "Select a class."),
  name: z.string().trim().min(1, "Section name is required.").max(40),
  description: z
    .string()
    .trim()
    .max(200, "Description must be 200 characters or fewer.")
    .optional(),
});

export const sectionUpdateSchema = sectionInputSchema.omit({ classId: true });

export type ClassFormValues = z.infer<typeof classInputSchema>;
export type ClassUpdateFormValues = z.infer<typeof classUpdateSchema>;
export type SectionFormValues = z.infer<typeof sectionInputSchema>;
export type SectionUpdateFormValues = z.infer<typeof sectionUpdateSchema>;
