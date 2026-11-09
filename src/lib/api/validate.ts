import type { ZodType, z } from "zod";
import { ApiError, ERROR_CODES } from "./errors";

export function validateInput<T extends ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    throw new ApiError(ERROR_CODES.VALIDATION_FAILED, "Please review the highlighted fields.", {
      fieldErrors,
      status: 422,
    });
  }
  return result.data;
}
