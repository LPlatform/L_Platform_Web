import type { OnboardingPoint, ReportDefinition, ReportId, ReportRow } from "@/types";
import type { ReportsService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { lastMonthKeys, monthKey, monthLabel } from "../../dates";
import { getDb } from "../db";
import { affectedStudentIds, effectiveAllocationStatus } from "../helpers";
import type { MockDatabase } from "../db";

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: "School",
  COLLEGE: "College",
  COACHING_INSTITUTE: "Coaching Institute",
  TRAINING_INSTITUTE: "Training Institute",
  OTHER: "Other",
};

function buildOrganizationStudentRows(db: MockDatabase): ReportRow[] {
  return db.organizations
    .map((organization) => {
      const students = db.users.filter(
        (user) => user.organizationId === organization.id && user.role === "STUDENT",
      );
      return {
        key: organization.id,
        label: organization.name,
        secondary: `${TYPE_LABELS[organization.type] ?? organization.type} · ${organization.city}`,
        values: {
          students: students.length,
          active: students.filter((student) => student.status === "ACTIVE").length,
          inactive: students.filter((student) => student.status === "INACTIVE").length,
        },
      };
    })
    .sort((a, b) => Number(b.values.students) - Number(a.values.students));
}

function buildOrganizationTeacherRows(db: MockDatabase): ReportRow[] {
  return db.organizations
    .map((organization) => {
      const teachers = db.users.filter(
        (user) => user.organizationId === organization.id && user.role === "TEACHER",
      );
      return {
        key: organization.id,
        label: organization.name,
        secondary: `${TYPE_LABELS[organization.type] ?? organization.type} · ${organization.city}`,
        values: {
          teachers: teachers.length,
          active: teachers.filter((teacher) => teacher.status === "ACTIVE").length,
          inactive: teachers.filter((teacher) => teacher.status === "INACTIVE").length,
          sections: db.sectionTeachers.filter((record) =>
            teachers.some((teacher) => teacher.id === record.teacherId),
          ).length,
        },
      };
    })
    .sort((a, b) => Number(b.values.teachers) - Number(a.values.teachers));
}

function buildClassRows(db: MockDatabase): ReportRow[] {
  return db.classes
    .map((academicClass) => {
      const sectionIds = new Set(
        db.sections
          .filter((section) => section.classId === academicClass.id)
          .map((section) => section.id),
      );
      const studentIds = new Set(
        db.sectionStudents
          .filter((record) => sectionIds.has(record.sectionId))
          .map((record) => record.studentId),
      );
      const organization = db.organizations.find(
        (item) => item.id === academicClass.organizationId,
      );
      return {
        key: academicClass.id,
        label: `${organization?.name ?? "Unknown organization"} · ${academicClass.name}`,
        secondary: academicClass.academicYear,
        values: {
          students: studentIds.size,
          sections: sectionIds.size,
          teachers: new Set(
            db.sectionTeachers
              .filter((record) => sectionIds.has(record.sectionId))
              .map((record) => record.teacherId),
          ).size,
        },
      };
    })
    .sort((a, b) => Number(b.values.students) - Number(a.values.students));
}

function buildAllocationRows(db: MockDatabase): ReportRow[] {
  return db.courses
    .map((course) => {
      const allocations = db.allocations.filter((allocation) => allocation.courseId === course.id);
      const active = allocations.filter(
        (allocation) => effectiveAllocationStatus(allocation) === "ACTIVE",
      );
      const reach = new Set<string>();
      active.forEach((allocation) => {
        affectedStudentIds(db, allocation).forEach((studentId) => reach.add(studentId));
      });
      return {
        key: course.id,
        label: course.title,
        secondary: course.language,
        values: {
          allocations: allocations.length,
          active: active.length,
          students: reach.size,
        },
      };
    })
    .sort((a, b) => Number(b.values.active) - Number(a.values.active));
}

function buildOnboardingRows(db: MockDatabase): ReportRow[] {
  const months = lastMonthKeys(9);
  return months.map((key) => {
    const students = db.users.filter(
      (user) => user.role === "STUDENT" && monthKey(user.createdAt) === key,
    ).length;
    const teachers = db.users.filter(
      (user) => user.role === "TEACHER" && monthKey(user.createdAt) === key,
    ).length;
    return {
      key,
      label: monthLabel(key),
      values: { students, teachers, total: students + teachers },
    };
  });
}

function buildOrganizationStatusRows(db: MockDatabase): ReportRow[] {
  const types = ["SCHOOL", "COLLEGE", "COACHING_INSTITUTE", "TRAINING_INSTITUTE", "OTHER"];
  return types.map((type) => {
    const organizations = db.organizations.filter((organization) => organization.type === type);
    return {
      key: type,
      label: TYPE_LABELS[type] ?? type,
      values: {
        active: organizations.filter((organization) => organization.status === "ACTIVE").length,
        inactive: organizations.filter((organization) => organization.status === "INACTIVE").length,
        total: organizations.length,
      },
    };
  });
}

function definitions(db: MockDatabase): ReportDefinition[] {
  const generatedAt = new Date().toISOString();
  return [
    {
      id: "organization-students",
      title: "Organization-wise student count",
      description: "Student membership by organization, split by account status.",
      columns: [
        { key: "students", label: "Students", align: "right" },
        { key: "active", label: "Active", align: "right" },
        { key: "inactive", label: "Inactive", align: "right" },
      ],
      rows: buildOrganizationStudentRows(db),
      generatedAt,
    },
    {
      id: "organization-teachers",
      title: "Organization-wise teacher count",
      description: "Teacher membership and section assignments by organization.",
      columns: [
        { key: "teachers", label: "Teachers", align: "right" },
        { key: "active", label: "Active", align: "right" },
        { key: "inactive", label: "Inactive", align: "right" },
        { key: "sections", label: "Section assignments", align: "right" },
      ],
      rows: buildOrganizationTeacherRows(db),
      generatedAt,
    },
    {
      id: "class-distribution",
      title: "Class-wise student distribution",
      description: "Section and teacher coverage for every academic class.",
      columns: [
        { key: "students", label: "Students", align: "right" },
        { key: "sections", label: "Sections", align: "right" },
        { key: "teachers", label: "Teachers", align: "right" },
      ],
      rows: buildClassRows(db),
      generatedAt,
    },
    {
      id: "allocation-statistics",
      title: "Course allocation statistics",
      description: "Allocation counts and effective student reach per course.",
      columns: [
        { key: "allocations", label: "Allocations", align: "right" },
        { key: "active", label: "Active", align: "right" },
        { key: "students", label: "Students reached", align: "right" },
      ],
      rows: buildAllocationRows(db),
      generatedAt,
    },
    {
      id: "onboarding-statistics",
      title: "User onboarding statistics",
      description: "New students and teachers onboarded over the last nine months.",
      columns: [
        { key: "students", label: "Students", align: "right" },
        { key: "teachers", label: "Teachers", align: "right" },
        { key: "total", label: "Total", align: "right" },
      ],
      rows: buildOnboardingRows(db),
      generatedAt,
    },
    {
      id: "organization-status",
      title: "Active and inactive organizations",
      description: "Organization status distribution by organization type.",
      columns: [
        { key: "active", label: "Active", align: "right" },
        { key: "inactive", label: "Inactive", align: "right" },
        { key: "total", label: "Total", align: "right" },
      ],
      rows: buildOrganizationStatusRows(db),
      generatedAt,
    },
  ];
}

export const reportsService: ReportsService = {
  async list(): Promise<ReportDefinition[]> {
    return mockRequest("generating reports", () => definitions(getDb()));
  },

  async getById(reportId: ReportId): Promise<ReportDefinition> {
    return mockRequest("generating the report", () => {
      const report = definitions(getDb()).find((item) => item.id === reportId);
      if (!report) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "Report was not found.", { status: 404 });
      }
      return report;
    });
  },

  async getOnboardingSeries(): Promise<OnboardingPoint[]> {
    return mockRequest("loading onboarding statistics", () => {
      const db = getDb();
      return buildOnboardingRows(db).map((row) => ({
        month: String(row.label),
        students: Number(row.values.students ?? 0),
        teachers: Number(row.values.teachers ?? 0),
      }));
    });
  },
};
