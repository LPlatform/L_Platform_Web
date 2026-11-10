import type { EntityStatus, PageQuery } from "./common";
import type { UserWithOrganization } from "./user";

export type SectionStatus = "ACTIVE" | "ARCHIVED";

export interface AcademicClass {
  id: string;
  publicId: string;
  organizationId: string;
  name: string;
  academicYear: string;
  description: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClassWithStats extends AcademicClass {
  organizationName: string;
  sectionCount: number;
  studentCount: number;
  courseCount: number;
  teacherCount: number;
}

export interface ClassQuery extends PageQuery {
  organizationId?: string | "ALL";
  status?: EntityStatus | "ALL";
  academicYear?: string | "ALL";
}

export interface ClassInput {
  name: string;
  organizationId: string;
  academicYear: string;
  description: string;
  status: EntityStatus;
}

export interface Section {
  id: string;
  publicId: string;
  classId: string;
  organizationId: string;
  name: string;
  description: string;
  status: SectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SectionWithStats extends Section {
  className: string;
  organizationName: string;
  studentCount: number;
  teacherCount: number;
}

export interface SectionQuery extends PageQuery {
  classId?: string | "ALL";
  organizationId?: string | "ALL";
  status?: SectionStatus | "ALL";
}

export interface SectionInput {
  classId: string;
  name: string;
  description: string;
}

export interface SectionRoster {
  students: UserWithOrganization[];
  teachers: UserWithOrganization[];
  capacity: number;
}
