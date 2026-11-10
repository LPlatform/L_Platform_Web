import type {
  AcademicClass,
  AcademicClassWithStats,
  AllocationStatus,
  AuditAction,
  AuditEntityType,
  AuditLog,
  Course,
  CourseAllocation,
  CourseAllocationSummary,
  CourseDetails,
  Organization,
  OrganizationStats,
  OrganizationWithStats,
  Section,
  SectionWithStats,
  User,
  UserRole,
  UserWithOrganization,
} from "@/types";
import { ApiError, ERROR_CODES } from "../api/errors";
import type { MockDatabase } from "./db";
import { correlationId, createId } from "./db";
import { readSession } from "./session";

export function fullName(user: Pick<User, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function organizationName(db: MockDatabase, organizationId: string | null): string | null {
  if (!organizationId) return null;
  return db.organizations.find((organization) => organization.id === organizationId)?.name ?? null;
}

export function toUserWithOrganization(db: MockDatabase, user: User): UserWithOrganization {
  const sectionCount = db.sectionStudents.filter((record) => {
    if (record.studentId !== user.id) return false;
    const section = db.sections.find((item) => item.id === record.sectionId);
    return section?.status === "ACTIVE";
  }).length;
  return {
    ...user,
    organizationName: organizationName(db, user.organizationId),
    sectionCount,
  };
}

export function organizationStats(db: MockDatabase, organizationId: string): OrganizationStats {
  const orgUsers = db.users.filter((user) => user.organizationId === organizationId);
  const orgClasses = db.classes.filter((item) => item.organizationId === organizationId);
  const courseIds = new Set(
    db.allocations
      .filter((item) => item.organizationId === organizationId)
      .map((item) => item.courseId),
  );
  return {
    teacherCount: orgUsers.filter((user) => user.role === "TEACHER").length,
    studentCount: orgUsers.filter((user) => user.role === "STUDENT").length,
    classCount: orgClasses.length,
    courseCount: courseIds.size,
    administratorCount: orgUsers.filter((user) => user.role === "ORGANIZATION_ADMIN").length,
  };
}

export function toOrganizationWithStats(
  db: MockDatabase,
  organization: Organization,
): OrganizationWithStats {
  return { ...organization, stats: organizationStats(db, organization.id) };
}

export function sectionStudentCount(db: MockDatabase, sectionId: string): number {
  const studentIds = new Set(
    db.sectionStudents
      .filter((record) => record.sectionId === sectionId)
      .map((record) => record.studentId),
  );
  return db.users.filter(
    (user) => studentIds.has(user.id) && user.role === "STUDENT" && user.status === "ACTIVE",
  ).length;
}

export function className(db: MockDatabase, classId: string | null): string | null {
  if (!classId) return null;
  return db.classes.find((item) => item.id === classId)?.name ?? null;
}

export function toClassWithStats(
  db: MockDatabase,
  academicClass: AcademicClass,
): AcademicClassWithStats {
  const orgSections = db.sections.filter((section) => section.classId === academicClass.id);
  const sectionIds = new Set(orgSections.map((section) => section.id));
  const studentIds = new Set(
    db.sectionStudents
      .filter((record) => sectionIds.has(record.sectionId))
      .map((record) => record.studentId),
  );
  const teacherIds = new Set(
    db.sectionTeachers
      .filter((record) => sectionIds.has(record.sectionId))
      .map((record) => record.teacherId),
  );
  const courseIds = new Set(
    db.allocations
      .filter(
        (allocation) =>
          allocation.classId === academicClass.id ||
          (allocation.organizationId === academicClass.organizationId &&
            allocation.scope === "ORGANIZATION"),
      )
      .map((allocation) => allocation.courseId),
  );
  return {
    ...academicClass,
    organizationName: organizationName(db, academicClass.organizationId) ?? "Unknown organization",
    sectionCount: orgSections.length,
    studentCount: db.users.filter(
      (user) => studentIds.has(user.id) && user.role === "STUDENT" && user.status === "ACTIVE",
    ).length,
    teacherCount: teacherIds.size,
    courseCount: courseIds.size,
  };
}

export function toSectionWithStats(db: MockDatabase, section: Section): SectionWithStats {
  const teacherIds = new Set(
    db.sectionTeachers
      .filter((record) => record.sectionId === section.id)
      .map((record) => record.teacherId),
  );
  return {
    ...section,
    className: className(db, section.classId) ?? "Unknown class",
    organizationName: organizationName(db, section.organizationId) ?? "Unknown organization",
    studentCount: sectionStudentCount(db, section.id),
    teacherCount: teacherIds.size,
  };
}

export function effectiveAllocationStatus(allocation: CourseAllocation): AllocationStatus {
  if (allocation.revokedAt) return "REVOKED";
  const now = Date.now();
  if (new Date(allocation.endDate).getTime() < now) return "EXPIRED";
  if (new Date(allocation.startDate).getTime() > now) return "SCHEDULED";
  return "ACTIVE";
}

export function affectedStudentIds(db: MockDatabase, allocation: CourseAllocation): Set<string> {
  const activeStudents = db.users.filter(
    (user) => user.role === "STUDENT" && user.status === "ACTIVE",
  );
  if (allocation.scope === "SECTION" && allocation.sectionId) {
    const ids = new Set(
      db.sectionStudents
        .filter((record) => record.sectionId === allocation.sectionId)
        .map((record) => record.studentId),
    );
    return new Set(activeStudents.filter((user) => ids.has(user.id)).map((user) => user.id));
  }
  if (allocation.scope === "CLASS" && allocation.classId) {
    const sectionIds = new Set(
      db.sections
        .filter((section) => section.classId === allocation.classId)
        .map((section) => section.id),
    );
    const ids = new Set(
      db.sectionStudents
        .filter((record) => sectionIds.has(record.sectionId))
        .map((record) => record.studentId),
    );
    return new Set(activeStudents.filter((user) => ids.has(user.id)).map((user) => user.id));
  }
  return new Set(
    activeStudents
      .filter((user) => user.organizationId === allocation.organizationId)
      .map((user) => user.id),
  );
}

export function toAllocationSummary(
  db: MockDatabase,
  allocation: CourseAllocation,
): CourseAllocationSummary {
  const course = db.courses.find((item) => item.id === allocation.courseId);
  return {
    ...allocation,
    status: effectiveAllocationStatus(allocation),
    courseTitle: course?.title ?? "Unknown course",
    courseLanguage: course?.language ?? "PYTHON",
    organizationName: organizationName(db, allocation.organizationId) ?? "Unknown organization",
    className: className(db, allocation.classId),
    sectionName: allocation.sectionId
      ? (db.sections.find((section) => section.id === allocation.sectionId)?.name ?? null)
      : null,
    affectedStudentCount: affectedStudentIds(db, allocation).size,
  };
}

export function toCourseDetails(db: MockDatabase, course: Course): CourseDetails {
  const allocations = db.allocations
    .filter((allocation) => allocation.courseId === course.id)
    .map((allocation) => toAllocationSummary(db, allocation));
  const reach = new Set<string>();
  allocations
    .filter((allocation) => allocation.status === "ACTIVE")
    .forEach((allocation) => {
      affectedStudentIds(db, allocation).forEach((studentId) => reach.add(studentId));
    });
  return {
    ...course,
    allocationCount: allocations.length,
    studentReach: reach.size,
    allocations,
  };
}

export function notFound(entity: string): never {
  throw new ApiError(ERROR_CODES.NOT_FOUND, `${entity} was not found.`, { status: 404 });
}

export function assertOrganization(db: MockDatabase, organizationId: string): Organization {
  const organization = db.organizations.find((item) => item.id === organizationId);
  return organization ?? notFound("Organization");
}

export function assertActiveOrganization(db: MockDatabase, organizationId: string): Organization {
  const organization = assertOrganization(db, organizationId);
  if (organization.status !== "ACTIVE") {
    throw new ApiError(
      ERROR_CODES.ORGANIZATION_INACTIVE,
      "This organization is inactive and cannot receive new records or allocations.",
      { status: 409 },
    );
  }
  return organization;
}

export function assertClass(db: MockDatabase, classId: string): AcademicClass {
  const academicClass = db.classes.find((item) => item.id === classId);
  return academicClass ?? notFound("Class");
}

export function assertSection(db: MockDatabase, sectionId: string): Section {
  const section = db.sections.find((item) => item.id === sectionId);
  return section ?? notFound("Section");
}

export function assertCourse(db: MockDatabase, courseId: string): Course {
  const course = db.courses.find((item) => item.id === courseId);
  return course ?? notFound("Course");
}

export function assertUser(db: MockDatabase, userId: string): User {
  const user = db.users.find((item) => item.id === userId);
  return user ?? notFound("User");
}

export function assertRole(user: User, role: UserRole, message: string): void {
  if (user.role !== role) {
    throw new ApiError(ERROR_CODES.VALIDATION_FAILED, message);
  }
}

export function assertSameOrganization(...args: Array<string | null | undefined>): void {
  const values = args.filter((value): value is string => Boolean(value));
  if (new Set(values).size > 1) {
    throw new ApiError(
      ERROR_CODES.CROSS_ORGANIZATION,
      "Records from different organizations cannot be combined.",
      { status: 403 },
    );
  }
}

export function recordAudit(
  db: MockDatabase,
  input: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    entityLabel: string;
    organizationId?: string | null;
    metadata?: Record<string, string | number | boolean>;
  },
): AuditLog {
  const session = readSession();
  const actor =
    (session && db.users.find((user) => user.id === session.userId)) ??
    db.users.find((user) => user.role === "PLATFORM_ADMIN") ??
    db.users[0];
  const organization = input.organizationId
    ? db.organizations.find((item) => item.id === input.organizationId)
    : null;
  const entry: AuditLog = {
    id: createId(),
    actorId: actor?.id ?? "system",
    actorName: actor ? fullName(actor) : "System",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    organizationId: organization?.id ?? null,
    organizationName: organization?.name ?? null,
    status: "SUCCESS",
    metadata: input.metadata ?? {},
    correlationId: correlationId(),
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(entry);
  return entry;
}
