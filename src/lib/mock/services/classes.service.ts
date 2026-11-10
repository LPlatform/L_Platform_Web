import type {
  AcademicClass,
  AcademicClassWithStats,
  ClassInput,
  ClassQuery,
  EntityStatus,
  Paginated,
} from "@/types";
import type { ClassService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { classInputSchema, classUpdateSchema } from "../../validation/academic";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import { assertOrganization, recordAudit, toClassWithStats } from "../helpers";

function classAccessors(item: AcademicClassWithStats) {
  return {
    name: item.name,
    publicId: item.publicId,
    organization: item.organizationName,
    academicYear: item.academicYear,
    sections: item.sectionCount,
    students: item.studentCount,
    teachers: item.teacherCount,
    courses: item.courseCount,
    status: item.status,
    createdAt: item.createdAt,
  };
}

function assertUniqueClassName(
  db: MockDatabase,
  organizationId: string,
  name: string,
  academicYear: string,
  excludeId?: string,
) {
  const duplicate = db.classes.find(
    (item) =>
      item.organizationId === organizationId &&
      item.id !== excludeId &&
      item.academicYear === academicYear &&
      item.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) {
    throw new ApiError(
      ERROR_CODES.DUPLICATE,
      "A class with that name already exists for this academic year.",
      { fieldErrors: { name: "This class already exists for the selected academic year." } },
    );
  }
}

function buildQuery(db: MockDatabase, query: ClassQuery): Paginated<AcademicClassWithStats> {
  const rows = db.classes
    .filter((item) => {
      if (
        query.organizationId &&
        query.organizationId !== "ALL" &&
        item.organizationId !== query.organizationId
      ) {
        return false;
      }
      if (query.status && query.status !== "ALL" && item.status !== query.status) return false;
      if (
        query.academicYear &&
        query.academicYear !== "ALL" &&
        item.academicYear !== query.academicYear
      ) {
        return false;
      }
      const withStats = toClassWithStats(db, item);
      return matchesSearch(
        [item.name, item.publicId, item.academicYear, withStats.organizationName],
        query.search,
      );
    })
    .map((item) => toClassWithStats(db, item));
  const sorted = sortByKey(rows, query.sortBy, query.sortDir, classAccessors);
  return paginate(sorted, query);
}

export const classService: ClassService = {
  async list(query: ClassQuery = {}): Promise<Paginated<AcademicClassWithStats>> {
    return mockRequest("loading classes", () => buildQuery(getDb(), query));
  },

  async getById(classId: string): Promise<AcademicClassWithStats> {
    return mockRequest("loading the class", () => {
      const db = getDb();
      const item = db.classes.find((academicClass) => academicClass.id === classId);
      if (!item) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "Class was not found.", { status: 404 });
      }
      return toClassWithStats(db, item);
    });
  },

  async listOptions(organizationId: string): Promise<AcademicClass[]> {
    return mockRequest("loading class options", () =>
      getDb()
        .classes.filter(
          (item) => item.organizationId === organizationId && item.status === "ACTIVE",
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  },

  async create(input: ClassInput): Promise<AcademicClass> {
    return mockRequest("creating the class", () => {
      const values = validateInput(classInputSchema, input);
      return mutateDb((db) => {
        const organization = assertOrganization(db, values.organizationId);
        if (organization.status !== "ACTIVE") {
          throw new ApiError(
            ERROR_CODES.ORGANIZATION_INACTIVE,
            "Classes cannot be created in an inactive organization.",
            { status: 409 },
          );
        }
        assertUniqueClassName(db, organization.id, values.name, values.academicYear);
        const timestamp = new Date().toISOString();
        const academicClass: AcademicClass = {
          id: createId(),
          publicId: nextPublicId(db, "classes", "CLS"),
          organizationId: organization.id,
          name: values.name,
          academicYear: values.academicYear,
          description: values.description ?? "",
          status: values.status,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.classes.push(academicClass);
        recordAudit(db, {
          action: "CLASS_CREATED",
          entityType: "CLASS",
          entityId: academicClass.id,
          entityLabel: `${academicClass.name} · ${organization.name}`,
          organizationId: organization.id,
          metadata: { academicYear: academicClass.academicYear },
        });
        return academicClass;
      });
    });
  },

  async update(classId: string, input: Omit<ClassInput, "organizationId">): Promise<AcademicClass> {
    return mockRequest("updating the class", () => {
      const values = validateInput(classUpdateSchema, input);
      return mutateDb((db) => {
        const academicClass = db.classes.find((item) => item.id === classId);
        if (!academicClass) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Class was not found.", { status: 404 });
        }
        assertUniqueClassName(
          db,
          academicClass.organizationId,
          values.name,
          values.academicYear,
          classId,
        );
        Object.assign(academicClass, {
          name: values.name,
          academicYear: values.academicYear,
          description: values.description ?? "",
          status: values.status,
          updatedAt: new Date().toISOString(),
        });
        recordAudit(db, {
          action: "CLASS_UPDATED",
          entityType: "CLASS",
          entityId: academicClass.id,
          entityLabel: academicClass.name,
          organizationId: academicClass.organizationId,
        });
        return academicClass;
      });
    });
  },

  async setStatus(classId: string, status: EntityStatus): Promise<AcademicClass> {
    return mockRequest(`${status === "ACTIVE" ? "activating" : "deactivating"} the class`, () =>
      mutateDb((db) => {
        const academicClass = db.classes.find((item) => item.id === classId);
        if (!academicClass) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Class was not found.", { status: 404 });
        }
        if (status === "ACTIVE") {
          const organization = assertOrganization(db, academicClass.organizationId);
          if (organization.status !== "ACTIVE") {
            throw new ApiError(
              ERROR_CODES.ORGANIZATION_INACTIVE,
              "The organization is inactive. Activate it before activating its classes.",
              { status: 409 },
            );
          }
        }
        academicClass.status = status;
        academicClass.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action: status === "ACTIVE" ? "CLASS_ACTIVATED" : "CLASS_DEACTIVATED",
          entityType: "CLASS",
          entityId: academicClass.id,
          entityLabel: academicClass.name,
          organizationId: academicClass.organizationId,
        });
        return academicClass;
      }),
    );
  },
};
