import type { PageQuery } from "./common";
import type { ProgrammingLanguage } from "./course";

export type AllocationScope = "ORGANIZATION" | "CLASS" | "SECTION";
export type AllocationStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED" | "REVOKED";

export interface CourseAllocation {
  id: string;
  publicId: string;
  courseId: string;
  organizationId: string;
  classId: string | null;
  sectionId: string | null;
  scope: AllocationScope;
  startDate: string;
  endDate: string;
  accessEnabled: boolean;
  status: AllocationStatus;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAllocationSummary extends CourseAllocation {
  courseTitle: string;
  courseLanguage: ProgrammingLanguage;
  organizationName: string;
  className: string | null;
  sectionName: string | null;
  affectedStudentCount: number;
}

export interface AllocationQuery extends PageQuery {
  organizationId?: string | "ALL";
  courseId?: string | "ALL";
  status?: AllocationStatus | "ALL";
  scope?: AllocationScope | "ALL";
}

export interface AllocationInput {
  courseId: string;
  organizationId: string;
  classId: string | null;
  sectionId: string | null;
  startDate: string;
  endDate: string;
  accessEnabled: boolean;
}

export interface AllocationUpdateInput {
  startDate: string;
  endDate: string;
  accessEnabled: boolean;
}
