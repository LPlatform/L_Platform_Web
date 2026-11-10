import type { AllocationScope, AuditAction, AuditEntityType, OrganizationType } from "@/types";

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  SCHOOL: "School",
  COLLEGE: "College",
  COACHING_INSTITUTE: "Coaching institute",
  TRAINING_INSTITUTE: "Training institute",
  OTHER: "Other",
};

export const ALLOCATION_SCOPE_LABELS: Record<AllocationScope, string> = {
  ORGANIZATION: "Whole organization",
  CLASS: "Class",
  SECTION: "Section",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  ORGANIZATION_CREATED: "Organization created",
  ORGANIZATION_UPDATED: "Organization updated",
  ORGANIZATION_ACTIVATED: "Organization activated",
  ORGANIZATION_DEACTIVATED: "Organization deactivated",
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_ACTIVATED: "User activated",
  USER_DEACTIVATED: "User deactivated",
  USERS_IMPORTED: "Users imported",
  INVITATION_CREATED: "Invitation created",
  INVITATION_RESENT: "Invitation resent",
  INVITATION_REVOKED: "Invitation revoked",
  CLASS_CREATED: "Class created",
  CLASS_UPDATED: "Class updated",
  CLASS_ACTIVATED: "Class activated",
  CLASS_DEACTIVATED: "Class deactivated",
  SECTION_CREATED: "Section created",
  SECTION_UPDATED: "Section updated",
  SECTION_ARCHIVED: "Section archived",
  STUDENT_ASSIGNED: "Student assigned",
  STUDENT_REMOVED: "Student removed",
  TEACHER_ASSIGNED: "Teacher assigned",
  TEACHER_REMOVED: "Teacher removed",
  COURSE_CREATED: "Course created",
  COURSE_UPDATED: "Course updated",
  COURSE_ACTIVATED: "Course activated",
  COURSE_ARCHIVED: "Course archived",
  COURSE_ALLOCATED: "Course allocated",
  ALLOCATION_UPDATED: "Allocation updated",
  COURSE_ALLOCATION_REVOKED: "Allocation revoked",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  ORGANIZATION: "Organization",
  USER: "User",
  INVITATION: "Invitation",
  CLASS: "Class",
  SECTION: "Section",
  COURSE: "Course",
  ALLOCATION: "Allocation",
  SYSTEM: "System",
};
