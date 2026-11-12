export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    code: string,
    message: string,
    options: { status?: number; fieldErrors?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? 400;
    this.fieldErrors = options.fieldErrors;
  }
}

export const ERROR_CODES = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  DUPLICATE: "DUPLICATE",
  CONFLICT: "CONFLICT",
  ORGANIZATION_INACTIVE: "ORGANIZATION_INACTIVE",
  CROSS_ORGANIZATION: "CROSS_ORGANIZATION",
  COURSE_UNAVAILABLE: "COURSE_UNAVAILABLE",
  DUPLICATE_ALLOCATION: "DUPLICATE_ALLOCATION",
  MOCK_UNAVAILABLE: "MOCK_UNAVAILABLE",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
} as const;

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
