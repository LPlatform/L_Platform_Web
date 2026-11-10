import { z } from "zod";

export const courseInputSchema = z.object({
  title: z.string().trim().min(3, "Course title must be at least 3 characters.").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(600, "Description must be 600 characters or fewer."),
  category: z.string().trim().min(2, "Category is required.").max(60),
  language: z.enum(["PYTHON", "JAVA", "CPP"], { message: "Select a programming language." }),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    message: "Select a difficulty.",
  }),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

export type CourseFormValues = z.infer<typeof courseInputSchema>;
