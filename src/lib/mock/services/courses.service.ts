import type { Course, CourseDetails, CourseInput, CourseQuery, Paginated } from "@/types";
import type { CourseService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { courseInputSchema } from "../../validation/course";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import { recordAudit, toCourseDetails } from "../helpers";

function courseAccessors(course: Course) {
  return {
    title: course.title,
    publicId: course.publicId,
    category: course.category,
    language: course.language,
    difficulty: course.difficulty,
    status: course.status,
    version: course.version,
    createdAt: course.createdAt,
  };
}

function buildQuery(db: MockDatabase, query: CourseQuery): Paginated<Course> {
  const rows = db.courses.filter((course) => {
    if (query.language && query.language !== "ALL" && course.language !== query.language)
      return false;
    if (query.difficulty && query.difficulty !== "ALL" && course.difficulty !== query.difficulty) {
      return false;
    }
    if (query.status && query.status !== "ALL" && course.status !== query.status) return false;
    return matchesSearch(
      [course.title, course.publicId, course.category, course.description],
      query.search,
    );
  });
  const sorted = sortByKey(rows, query.sortBy, query.sortDir, courseAccessors);
  return paginate(sorted, query);
}

function assertUniqueTitle(db: MockDatabase, title: string, excludeId?: string) {
  const duplicate = db.courses.find(
    (course) => course.id !== excludeId && course.title.toLowerCase() === title.toLowerCase(),
  );
  if (duplicate) {
    throw new ApiError(ERROR_CODES.DUPLICATE, "A course with that title already exists.", {
      fieldErrors: { title: "This course title is already in use." },
    });
  }
}

export const courseService: CourseService = {
  async list(query: CourseQuery = {}): Promise<Paginated<Course>> {
    return mockRequest("loading courses", () => buildQuery(getDb(), query));
  },

  async getById(courseId: string): Promise<CourseDetails> {
    return mockRequest("loading the course", () => {
      const db = getDb();
      const course = db.courses.find((item) => item.id === courseId);
      if (!course) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "Course was not found.", { status: 404 });
      }
      return toCourseDetails(db, course);
    });
  },

  async listOptions(): Promise<Course[]> {
    return mockRequest("loading course options", () =>
      getDb()
        .courses.filter((course) => course.status === "ACTIVE")
        .sort((a, b) => a.title.localeCompare(b.title)),
    );
  },

  async create(input: CourseInput): Promise<Course> {
    return mockRequest("creating the course", () => {
      const values = validateInput(courseInputSchema, input);
      return mutateDb((db) => {
        assertUniqueTitle(db, values.title);
        const timestamp = new Date().toISOString();
        const course: Course = {
          id: createId(),
          publicId: nextPublicId(db, "courses", "CRS"),
          title: values.title,
          description: values.description,
          category: values.category,
          language: values.language,
          difficulty: values.difficulty,
          status: values.status,
          version: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.courses.push(course);
        recordAudit(db, {
          action: "COURSE_CREATED",
          entityType: "COURSE",
          entityId: course.id,
          entityLabel: course.title,
          metadata: { language: course.language, difficulty: course.difficulty },
        });
        return course;
      });
    });
  },

  async update(courseId: string, input: CourseInput): Promise<Course> {
    return mockRequest("updating the course", () => {
      const values = validateInput(courseInputSchema, input);
      return mutateDb((db) => {
        const course = db.courses.find((item) => item.id === courseId);
        if (!course) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Course was not found.", { status: 404 });
        }
        if (course.status === "ARCHIVED") {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            "Archived courses are read-only. Restore the course before editing it.",
            { status: 409 },
          );
        }
        assertUniqueTitle(db, values.title, courseId);
        Object.assign(course, values, {
          version: course.version + 1,
          updatedAt: new Date().toISOString(),
        });
        recordAudit(db, {
          action: "COURSE_UPDATED",
          entityType: "COURSE",
          entityId: course.id,
          entityLabel: course.title,
          metadata: { version: course.version },
        });
        return course;
      });
    });
  },

  async setStatus(courseId: string, status: Course["status"]): Promise<Course> {
    return mockRequest("updating the course status", () =>
      mutateDb((db) => {
        const course = db.courses.find((item) => item.id === courseId);
        if (!course) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Course was not found.", { status: 404 });
        }
        course.status = status;
        course.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action:
            status === "ARCHIVED"
              ? "COURSE_ARCHIVED"
              : status === "ACTIVE"
                ? "COURSE_ACTIVATED"
                : "COURSE_UPDATED",
          entityType: "COURSE",
          entityId: course.id,
          entityLabel: course.title,
          metadata: { status },
        });
        return course;
      }),
    );
  },
};
