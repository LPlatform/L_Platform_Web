import type {
  Paginated,
  Section,
  SectionInput,
  SectionQuery,
  SectionRoster,
  SectionWithStats,
} from "@/types";
import type { SectionService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { parseCsv, recordsFromCsv } from "../../csv";
import { sectionInputSchema, sectionUpdateSchema } from "../../validation/academic";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import {
  assertClass,
  assertOrganization,
  assertSection,
  recordAudit,
  toSectionWithStats,
  toUserWithOrganization,
} from "../helpers";

function sectionAccessors(item: SectionWithStats) {
  return {
    name: item.name,
    publicId: item.publicId,
    className: item.className,
    organization: item.organizationName,
    students: item.studentCount,
    teachers: item.teacherCount,
    status: item.status,
    createdAt: item.createdAt,
  };
}

function assertUniqueSectionName(
  db: MockDatabase,
  classId: string,
  name: string,
  excludeId?: string,
) {
  const duplicate = db.sections.find(
    (section) =>
      section.classId === classId &&
      section.id !== excludeId &&
      section.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) {
    throw new ApiError(ERROR_CODES.DUPLICATE, "That section name already exists in this class.", {
      fieldErrors: { name: "Section names must be unique within a class." },
    });
  }
}

function buildQuery(db: MockDatabase, query: SectionQuery): Paginated<SectionWithStats> {
  const rows = db.sections
    .filter((section) => {
      if (query.classId && query.classId !== "ALL" && section.classId !== query.classId)
        return false;
      if (
        query.organizationId &&
        query.organizationId !== "ALL" &&
        section.organizationId !== query.organizationId
      ) {
        return false;
      }
      if (query.status && query.status !== "ALL" && section.status !== query.status) return false;
      const withStats = toSectionWithStats(db, section);
      return matchesSearch(
        [section.name, section.publicId, withStats.className, withStats.organizationName],
        query.search,
      );
    })
    .map((section) => toSectionWithStats(db, section));
  const sorted = sortByKey(rows, query.sortBy, query.sortDir, sectionAccessors);
  return paginate(sorted, query);
}

function assignStudentsInternal(
  db: MockDatabase,
  section: Section,
  studentIds: string[],
): { assigned: number; skipped: number } {
  const organization = assertOrganization(db, section.organizationId);
  if (organization.status !== "ACTIVE") {
    throw new ApiError(
      ERROR_CODES.ORGANIZATION_INACTIVE,
      "Students cannot be assigned within an inactive organization.",
      { status: 409 },
    );
  }
  if (section.status !== "ACTIVE") {
    throw new ApiError(ERROR_CODES.CONFLICT, "Archived sections cannot receive students.", {
      status: 409,
    });
  }
  const sectionsInClass = new Set(
    db.sections.filter((item) => item.classId === section.classId).map((item) => item.id),
  );
  let assigned = 0;
  let skipped = 0;
  const timestamp = new Date().toISOString();
  for (const studentId of new Set(studentIds)) {
    const student = db.users.find((user) => user.id === studentId);
    const alreadyInSection = db.sectionStudents.some(
      (record) => record.sectionId === section.id && record.studentId === studentId,
    );
    const alreadyInClass = db.sectionStudents.some(
      (record) =>
        record.studentId === studentId &&
        sectionsInClass.has(record.sectionId) &&
        record.sectionId !== section.id,
    );
    if (
      !student ||
      student.role !== "STUDENT" ||
      student.status !== "ACTIVE" ||
      student.organizationId !== section.organizationId ||
      alreadyInSection ||
      alreadyInClass
    ) {
      skipped += 1;
      continue;
    }
    db.sectionStudents.push({
      id: createId(),
      sectionId: section.id,
      studentId,
      assignedAt: timestamp,
    });
    assigned += 1;
  }
  if (assigned > 0) {
    recordAudit(db, {
      action: "STUDENT_ASSIGNED",
      entityType: "SECTION",
      entityId: section.id,
      entityLabel: `${section.name} · ${db.classes.find((item) => item.id === section.classId)?.name ?? "Class"}`,
      organizationId: section.organizationId,
      metadata: { students: assigned, skipped },
    });
  }
  return { assigned, skipped };
}

function assignTeachersInternal(
  db: MockDatabase,
  section: Section,
  teacherIds: string[],
): { assigned: number; skipped: number } {
  const organization = assertOrganization(db, section.organizationId);
  if (organization.status !== "ACTIVE") {
    throw new ApiError(
      ERROR_CODES.ORGANIZATION_INACTIVE,
      "Teachers cannot be assigned within an inactive organization.",
      { status: 409 },
    );
  }
  let assigned = 0;
  let skipped = 0;
  const timestamp = new Date().toISOString();
  for (const teacherId of new Set(teacherIds)) {
    const teacher = db.users.find((user) => user.id === teacherId);
    const exists = db.sectionTeachers.some(
      (record) => record.sectionId === section.id && record.teacherId === teacherId,
    );
    if (
      !teacher ||
      teacher.role !== "TEACHER" ||
      teacher.status !== "ACTIVE" ||
      teacher.organizationId !== section.organizationId ||
      exists
    ) {
      skipped += 1;
      continue;
    }
    db.sectionTeachers.push({
      id: createId(),
      sectionId: section.id,
      teacherId,
      assignedAt: timestamp,
    });
    assigned += 1;
  }
  if (assigned > 0) {
    recordAudit(db, {
      action: "TEACHER_ASSIGNED",
      entityType: "SECTION",
      entityId: section.id,
      entityLabel: section.name,
      organizationId: section.organizationId,
      metadata: { teachers: assigned, skipped },
    });
  }
  return { assigned, skipped };
}

export const sectionService: SectionService = {
  async list(query: SectionQuery = {}): Promise<Paginated<SectionWithStats>> {
    return mockRequest("loading sections", () => buildQuery(getDb(), query));
  },

  async getById(sectionId: string): Promise<SectionWithStats> {
    return mockRequest("loading the section", () => {
      const db = getDb();
      const section = db.sections.find((item) => item.id === sectionId);
      if (!section) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "Section was not found.", { status: 404 });
      }
      return toSectionWithStats(db, section);
    });
  },

  async getRoster(sectionId: string): Promise<SectionRoster> {
    return mockRequest("loading the section roster", () => {
      const db = getDb();
      assertSection(db, sectionId);
      const studentIds = new Set(
        db.sectionStudents
          .filter((record) => record.sectionId === sectionId)
          .map((record) => record.studentId),
      );
      const teacherIds = new Set(
        db.sectionTeachers
          .filter((record) => record.sectionId === sectionId)
          .map((record) => record.teacherId),
      );
      return {
        students: db.users
          .filter((user) => studentIds.has(user.id))
          .map((user) => toUserWithOrganization(db, user)),
        teachers: db.users
          .filter((user) => teacherIds.has(user.id))
          .map((user) => toUserWithOrganization(db, user)),
        capacity: 60,
      };
    });
  },

  async create(classId: string, input: SectionInput): Promise<Section> {
    return mockRequest("creating the section", () => {
      const values = validateInput(sectionInputSchema, { ...input, classId });
      return mutateDb((db) => {
        const academicClass = assertClass(db, values.classId);
        const organization = assertOrganization(db, academicClass.organizationId);
        if (organization.status !== "ACTIVE") {
          throw new ApiError(
            ERROR_CODES.ORGANIZATION_INACTIVE,
            "Sections cannot be created in an inactive organization.",
            { status: 409 },
          );
        }
        if (academicClass.status !== "ACTIVE") {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            "Sections cannot be created in an inactive class.",
            {
              status: 409,
            },
          );
        }
        assertUniqueSectionName(db, academicClass.id, values.name);
        const timestamp = new Date().toISOString();
        const section: Section = {
          id: createId(),
          publicId: nextPublicId(db, "sections", "SEC"),
          classId: academicClass.id,
          organizationId: organization.id,
          name: values.name,
          description: values.description ?? "",
          status: "ACTIVE",
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.sections.push(section);
        recordAudit(db, {
          action: "SECTION_CREATED",
          entityType: "SECTION",
          entityId: section.id,
          entityLabel: `${section.name} · ${academicClass.name}`,
          organizationId: organization.id,
        });
        return section;
      });
    });
  },

  async update(sectionId: string, input: Omit<SectionInput, "classId">): Promise<Section> {
    return mockRequest("updating the section", () => {
      const values = validateInput(sectionUpdateSchema, input);
      return mutateDb((db) => {
        const section = assertSection(db, sectionId);
        assertUniqueSectionName(db, section.classId, values.name, sectionId);
        section.name = values.name;
        section.description = values.description ?? "";
        section.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action: "SECTION_UPDATED",
          entityType: "SECTION",
          entityId: section.id,
          entityLabel: section.name,
          organizationId: section.organizationId,
        });
        return section;
      });
    });
  },

  async setStatus(sectionId: string, status: "ACTIVE" | "ARCHIVED"): Promise<Section> {
    return mockRequest(`${status === "ARCHIVED" ? "archiving" : "restoring"} the section`, () =>
      mutateDb((db) => {
        const section = assertSection(db, sectionId);
        section.status = status;
        section.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action: status === "ARCHIVED" ? "SECTION_ARCHIVED" : "SECTION_UPDATED",
          entityType: "SECTION",
          entityId: section.id,
          entityLabel: section.name,
          organizationId: section.organizationId,
          metadata: { status },
        });
        return section;
      }),
    );
  },

  async assignStudents(sectionId: string, studentIds: string[]) {
    return mockRequest("assigning students", () =>
      mutateDb((db) => {
        const section = assertSection(db, sectionId);
        return assignStudentsInternal(db, section, studentIds);
      }),
    );
  },

  async removeStudent(sectionId: string, studentId: string): Promise<void> {
    return mockRequest("removing the student", () =>
      mutateDb((db) => {
        const section = assertSection(db, sectionId);
        const index = db.sectionStudents.findIndex(
          (record) => record.sectionId === sectionId && record.studentId === studentId,
        );
        if (index === -1) {
          throw new ApiError(
            ERROR_CODES.NOT_FOUND,
            "That student is not assigned to this section.",
            { status: 404 },
          );
        }
        db.sectionStudents.splice(index, 1);
        recordAudit(db, {
          action: "STUDENT_REMOVED",
          entityType: "SECTION",
          entityId: section.id,
          entityLabel: section.name,
          organizationId: section.organizationId,
          metadata: { students: 1 },
        });
      }),
    );
  },

  async assignTeachers(sectionId: string, teacherIds: string[]) {
    return mockRequest("assigning teachers", () =>
      mutateDb((db) => {
        const section = assertSection(db, sectionId);
        return assignTeachersInternal(db, section, teacherIds);
      }),
    );
  },

  async removeTeacher(sectionId: string, teacherId: string): Promise<void> {
    return mockRequest("removing the teacher", () =>
      mutateDb((db) => {
        const section = assertSection(db, sectionId);
        const index = db.sectionTeachers.findIndex(
          (record) => record.sectionId === sectionId && record.teacherId === teacherId,
        );
        if (index === -1) {
          throw new ApiError(
            ERROR_CODES.NOT_FOUND,
            "That teacher is not assigned to this section.",
            { status: 404 },
          );
        }
        db.sectionTeachers.splice(index, 1);
        recordAudit(db, {
          action: "TEACHER_REMOVED",
          entityType: "SECTION",
          entityId: section.id,
          entityLabel: section.name,
          organizationId: section.organizationId,
        });
      }),
    );
  },

  async bulkAssignStudents(sectionId: string, csvText: string, organizationId: string) {
    return mockRequest("importing section students", () => {
      const parsed = parseCsv(csvText);
      const records = recordsFromCsv(parsed);
      return mutateDb((db) => {
        const section = assertSection(db, sectionId);
        if (section.organizationId !== organizationId) {
          throw new ApiError(
            ERROR_CODES.CROSS_ORGANIZATION,
            "The section does not belong to the selected organization.",
            { status: 403 },
          );
        }
        const studentIds: string[] = [];
        const errors: string[] = [];
        records.forEach((record, index) => {
          const email = record.email?.trim().toLowerCase();
          const username = record.username?.trim().toLowerCase();
          if (!email && !username) {
            errors.push(`Row ${index + 2}: email or username is required.`);
            return;
          }
          const student = db.users.find(
            (user) =>
              user.role === "STUDENT" &&
              user.organizationId === organizationId &&
              ((email && user.email?.toLowerCase() === email) ||
                (username && user.username?.toLowerCase() === username)),
          );
          if (!student) {
            errors.push(`Row ${index + 2}: no student found in this organization.`);
            return;
          }
          studentIds.push(student.id);
        });
        const outcome = assignStudentsInternal(db, section, studentIds);
        return { ...outcome, errors };
      });
    });
  },
};
