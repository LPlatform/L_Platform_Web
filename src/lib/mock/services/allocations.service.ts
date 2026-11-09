import type {
  AllocationInput,
  AllocationQuery,
  AllocationUpdateInput,
  CourseAllocation,
  CourseAllocationSummary,
  Paginated,
} from "@/types";
import type { AllocationService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { allocationInputSchema, allocationUpdateSchema } from "../../validation/allocation";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import {
  assertActiveOrganization,
  assertClass,
  assertCourse,
  assertSection,
  assertSameOrganization,
  effectiveAllocationStatus,
  recordAudit,
  toAllocationSummary,
} from "../helpers";

function summaryAccessors(item: CourseAllocationSummary) {
  return {
    course: item.courseTitle,
    organization: item.organizationName,
    scope: item.scope,
    status: item.status,
    students: item.affectedStudentCount,
    startDate: item.startDate,
    endDate: item.endDate,
    createdAt: item.createdAt,
  };
}

function buildQuery(db: MockDatabase, query: AllocationQuery): Paginated<CourseAllocationSummary> {
  const rows = db.allocations
    .map((allocation) => toAllocationSummary(db, allocation))
    .filter((allocation) => {
      if (
        query.organizationId &&
        query.organizationId !== "ALL" &&
        allocation.organizationId !== query.organizationId
      ) {
        return false;
      }
      if (query.courseId && query.courseId !== "ALL" && allocation.courseId !== query.courseId) {
        return false;
      }
      if (query.status && query.status !== "ALL" && allocation.status !== query.status)
        return false;
      if (query.scope && query.scope !== "ALL" && allocation.scope !== query.scope) return false;
      return matchesSearch(
        [
          allocation.courseTitle,
          allocation.organizationName,
          allocation.className,
          allocation.sectionName,
          allocation.publicId,
        ],
        query.search,
      );
    });
  const sorted = sortByKey(rows, query.sortBy, query.sortDir, summaryAccessors);
  return paginate(sorted, query);
}

function assertDuplicate(
  db: MockDatabase,
  input: {
    courseId: string;
    organizationId: string;
    classId: string | null;
    sectionId: string | null;
  },
  excludeId?: string,
) {
  const duplicate = db.allocations.find(
    (allocation) =>
      allocation.id !== excludeId &&
      allocation.courseId === input.courseId &&
      allocation.organizationId === input.organizationId &&
      allocation.classId === input.classId &&
      allocation.sectionId === input.sectionId &&
      effectiveAllocationStatus(allocation) !== "REVOKED" &&
      effectiveAllocationStatus(allocation) !== "EXPIRED",
  );
  if (duplicate) {
    throw new ApiError(
      ERROR_CODES.DUPLICATE_ALLOCATION,
      "An active or scheduled allocation already exists for this course and target.",
      { status: 409 },
    );
  }
}

export const allocationService: AllocationService = {
  async list(query: AllocationQuery = {}): Promise<Paginated<CourseAllocationSummary>> {
    return mockRequest("loading course allocations", () => buildQuery(getDb(), query));
  },

  async getById(allocationId: string): Promise<CourseAllocationSummary> {
    return mockRequest("loading the allocation", () => {
      const db = getDb();
      const allocation = db.allocations.find((item) => item.id === allocationId);
      if (!allocation) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "Course allocation was not found.", {
          status: 404,
        });
      }
      return toAllocationSummary(db, allocation);
    });
  },

  async create(input: AllocationInput): Promise<CourseAllocationSummary> {
    return mockRequest("creating the allocation", () => {
      const scopeValues = validateInput(allocationInputSchema, {
        ...input,
        scope: input.sectionId ? "SECTION" : input.classId ? "CLASS" : "ORGANIZATION",
      });
      return mutateDb((db) => {
        const course = assertCourse(db, scopeValues.courseId);
        if (course.status !== "ACTIVE") {
          throw new ApiError(
            ERROR_CODES.COURSE_UNAVAILABLE,
            "Only active courses can be allocated. Activate the course first.",
            { status: 409 },
          );
        }
        const organization = assertActiveOrganization(db, scopeValues.organizationId);

        let classId: string | null = null;
        let sectionId: string | null = null;
        if (scopeValues.classId) {
          const academicClass = assertClass(db, scopeValues.classId);
          assertSameOrganization(academicClass.organizationId, organization.id);
          if (academicClass.status !== "ACTIVE") {
            throw new ApiError(
              ERROR_CODES.CONFLICT,
              "Courses cannot be newly allocated to an inactive class.",
              { status: 409 },
            );
          }
          classId = academicClass.id;
        }
        if (scopeValues.sectionId) {
          const section = assertSection(db, scopeValues.sectionId);
          assertSameOrganization(section.organizationId, organization.id);
          assertSameOrganization(section.classId, classId);
          if (section.status !== "ACTIVE") {
            throw new ApiError(
              ERROR_CODES.CONFLICT,
              "Courses cannot be newly allocated to an archived section.",
              { status: 409 },
            );
          }
          sectionId = section.id;
        }

        assertDuplicate(db, {
          courseId: course.id,
          organizationId: organization.id,
          classId,
          sectionId,
        });

        const timestamp = new Date().toISOString();
        const allocation: CourseAllocation = {
          id: createId(),
          publicId: nextPublicId(db, "allocations", "ALL"),
          courseId: course.id,
          organizationId: organization.id,
          classId,
          sectionId,
          scope: sectionId ? "SECTION" : classId ? "CLASS" : "ORGANIZATION",
          startDate: scopeValues.startDate,
          endDate: scopeValues.endDate,
          accessEnabled: scopeValues.accessEnabled,
          status: "SCHEDULED",
          revokedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        allocation.status = effectiveAllocationStatus(allocation);
        db.allocations.push(allocation);
        recordAudit(db, {
          action: "COURSE_ALLOCATED",
          entityType: "ALLOCATION",
          entityId: allocation.id,
          entityLabel: `${course.title} · ${organization.name}`,
          organizationId: organization.id,
          metadata: { scope: allocation.scope, courseId: course.id },
        });
        return toAllocationSummary(db, allocation);
      });
    });
  },

  async update(
    allocationId: string,
    input: AllocationUpdateInput,
  ): Promise<CourseAllocationSummary> {
    return mockRequest("updating the allocation", () => {
      const values = validateInput(allocationUpdateSchema, input);
      return mutateDb((db) => {
        const allocation = db.allocations.find((item) => item.id === allocationId);
        if (!allocation) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Course allocation was not found.", {
            status: 404,
          });
        }
        if (allocation.revokedAt) {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            "Revoked allocations cannot be edited. Create a new allocation instead.",
            { status: 409 },
          );
        }
        allocation.startDate = values.startDate;
        allocation.endDate = values.endDate;
        allocation.accessEnabled = values.accessEnabled;
        allocation.status = effectiveAllocationStatus(allocation);
        allocation.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action: "ALLOCATION_UPDATED",
          entityType: "ALLOCATION",
          entityId: allocation.id,
          entityLabel: allocation.publicId,
          organizationId: allocation.organizationId,
        });
        return toAllocationSummary(db, allocation);
      });
    });
  },

  async revoke(allocationId: string): Promise<CourseAllocationSummary> {
    return mockRequest("revoking the allocation", () =>
      mutateDb((db) => {
        const allocation = db.allocations.find((item) => item.id === allocationId);
        if (!allocation) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Course allocation was not found.", {
            status: 404,
          });
        }
        if (allocation.revokedAt) {
          throw new ApiError(ERROR_CODES.CONFLICT, "This allocation is already revoked.", {
            status: 409,
          });
        }
        allocation.revokedAt = new Date().toISOString();
        allocation.accessEnabled = false;
        allocation.status = "REVOKED";
        allocation.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action: "COURSE_ALLOCATION_REVOKED",
          entityType: "ALLOCATION",
          entityId: allocation.id,
          entityLabel: allocation.publicId,
          organizationId: allocation.organizationId,
        });
        return toAllocationSummary(db, allocation);
      }),
    );
  },
};
