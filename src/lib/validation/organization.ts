import { z } from "zod";

export const organizationTypeValues = [
  "SCHOOL",
  "COLLEGE",
  "COACHING_INSTITUTE",
  "TRAINING_INSTITUTE",
  "OTHER",
] as const;

const organizationBaseSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters.").max(120),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
  type: z.enum(organizationTypeValues, { message: "Select an organization type." }),
  contactName: z.string().trim().min(2, "Contact person is required.").max(100),
  contactEmail: z.string().trim().email("Enter a valid contact email."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20)
    .regex(/^\+?[0-9\s-]+$/, "Phone can contain digits, spaces, hyphens and an optional +."),
  address: z.string().trim().min(5, "Address is required.").max(200),
  city: z.string().trim().min(2, "City is required.").max(80),
  state: z.string().trim().min(2, "State is required.").max(80),
  country: z.string().trim().min(2, "Country is required.").max(80),
  postalCode: z
    .string()
    .trim()
    .min(4, "Enter a valid postal code.")
    .max(10)
    .regex(/^[A-Za-z0-9\s-]+$/, "Postal code contains invalid characters."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const organizationInputSchema = organizationBaseSchema.extend({
  initialAdministratorEmail: z.string().trim().email("Enter a valid administrator email."),
});

export const organizationUpdateSchema = organizationBaseSchema;

export type OrganizationFormValues = z.infer<typeof organizationInputSchema>;
export type OrganizationUpdateFormValues = z.infer<typeof organizationUpdateSchema>;
