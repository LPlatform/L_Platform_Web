import type { PageQuery } from "./common";

export type AuditAction =
  | "ORGANIZATION_CREATED"
  | "ORGANIZATION_UPDATED"
  | "ORGANIZATION_ACTIVATED"
  | "ORGANIZATION_DEACTIVATED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "USERS_IMPORTED"
  | "INVITATION_CREATED"
  | "INVITATION_RESENT"
  | "INVITATION_REVOKED"
  | "CLASS_CREATED"
  | "CLASS_UPDATED"
  | "CLASS_ACTIVATED"
  | "CLASS_DEACTIVATED"
  | "SECTION_CREATED"
  | "SECTION_UPDATED"
  | "SECTION_ARCHIVED"
  | "STUDENT_ASSIGNED"
  | "STUDENT_REMOVED"
  | "TEACHER_ASSIGNED"
  | "TEACHER_REMOVED"
  | "COURSE_CREATED"
  | "COURSE_UPDATED"
  | "COURSE_ACTIVATED"
  | "COURSE_ARCHIVED"
  | "COURSE_ALLOCATED"
  | "ALLOCATION_UPDATED"
  | "COURSE_ALLOCATION_REVOKED";

export type AuditEntityType =
  "ORGANIZATION" | "USER" | "INVITATION" | "CLASS" | "SECTION" | "COURSE" | "ALLOCATION" | "SYSTEM";

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  organizationId: string | null;
  organizationName: string | null;
  status: "SUCCESS" | "FAILURE";
  metadata: Record<string, string | number | boolean>;
  correlationId: string;
  createdAt: string;
}

export interface AuditQuery extends PageQuery {
  action?: string;
  organizationId?: string | "ALL";
  entityType?: AuditEntityType | "ALL";
}
