import type { EntityStatus, PageQuery } from "./common";

export type OrganizationType =
  "SCHOOL" | "COLLEGE" | "COACHING_INSTITUTE" | "TRAINING_INSTITUTE" | "OTHER";

export interface Organization {
  id: string;
  publicId: string;
  name: string;
  slug: string;
  type: OrganizationType;
  contactName: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationStats {
  teacherCount: number;
  studentCount: number;
  classCount: number;
  courseCount: number;
  administratorCount: number;
}

export interface OrganizationWithStats extends Organization {
  stats: OrganizationStats;
}

export interface OrganizationQuery extends PageQuery {
  status?: EntityStatus | "ALL";
  type?: OrganizationType | "ALL";
}

export interface OrganizationInput {
  name: string;
  slug: string;
  type: OrganizationType;
  contactName: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  initialAdministratorEmail: string;
  status: EntityStatus;
}

export type OrganizationUpdateInput = Omit<OrganizationInput, "initialAdministratorEmail">;
