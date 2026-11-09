import type { PageQuery } from "./common";
import type { CourseAllocationSummary } from "./allocation";

export type ProgrammingLanguage = "PYTHON" | "JAVA" | "CPP";
export type CourseDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  PYTHON: "Python",
  JAVA: "Java",
  CPP: "C++",
};

export const DIFFICULTY_LABELS: Record<CourseDifficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export interface Course {
  id: string;
  publicId: string;
  title: string;
  description: string;
  category: string;
  language: ProgrammingLanguage;
  difficulty: CourseDifficulty;
  status: CourseStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetails extends Course {
  allocationCount: number;
  studentReach: number;
  allocations: CourseAllocationSummary[];
}

export interface CourseQuery extends PageQuery {
  language?: ProgrammingLanguage | "ALL";
  difficulty?: CourseDifficulty | "ALL";
  status?: CourseStatus | "ALL";
}

export interface CourseInput {
  title: string;
  description: string;
  category: string;
  language: ProgrammingLanguage;
  difficulty: CourseDifficulty;
  status: CourseStatus;
}
