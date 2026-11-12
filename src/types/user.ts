import type { EntityStatus, PageQuery } from "./common";

export type UserRole =
  | "PLATFORM_OWNER"
  | "PLATFORM_DEVELOPER"
  | "PLATFORM_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "TEACHER"
  | "STUDENT";

export const ROLE_LABELS: Record<UserRole, string> = {
  PLATFORM_OWNER: "Platform Owner",
  PLATFORM_DEVELOPER: "Platform Developer",
  PLATFORM_ADMIN: "Platform Admin",
  ORGANIZATION_ADMIN: "Organization Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export interface PlatformPermission {
  id: string;
  label: string;
  description: string;
}

export interface User {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string | null;
  role: UserRole;
  organizationId: string | null;
  status: EntityStatus;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
}

export interface UserWithOrganization extends User {
  organizationName: string | null;
  sectionCount: number;
}

export interface UserQuery extends PageQuery {
  role?: UserRole | "ALL";
  status?: EntityStatus | "ALL";
  organizationId?: string | "ALL";
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  status: EntityStatus;
  username?: string;
}

export interface StudentInput {
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
  organizationId: string;
}

export interface CsvUserRow {
  row: number;
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
  role: "TEACHER" | "STUDENT";
  organizationPublicId: string;
  errors: string[];
  status: "VALID" | "INVALID" | "DUPLICATE";
}

export interface CsvImportPreview {
  fileName: string;
  rows: CsvUserRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
  };
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  users: User[];
}
