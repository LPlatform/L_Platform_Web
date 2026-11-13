import { describe, expect, it } from "vitest";
import { classInputSchema, sectionInputSchema } from "./academic";
import { allocationInputSchema, allocationUpdateSchema } from "./allocation";
import { courseInputSchema } from "./course";
import { invitationInputSchema } from "./invitation";
import { organizationInputSchema } from "./organization";
import { settingsSchema } from "./settings";
import { userInputSchema } from "./user";

describe("invitationInputSchema", () => {
  const base = {
    recipient: "new.teacher@example.edu",
    channel: "EMAIL" as const,
    role: "TEACHER" as const,
    organizationId: "org-1",
  };

  it("accepts a valid email invitation", () => {
    expect(invitationInputSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an invalid email recipient", () => {
    const result = invitationInputSchema.safeParse({ ...base, recipient: "not-an-email" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["recipient"]);
    }
  });

  it("validates username invitations with the username pattern", () => {
    const valid = invitationInputSchema.safeParse({
      ...base,
      channel: "USERNAME",
      recipient: "new.teacher_01",
    });
    const invalid = invitationInputSchema.safeParse({
      ...base,
      channel: "USERNAME",
      recipient: "new teacher",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("rejects the platform administrator role", () => {
    const result = invitationInputSchema.safeParse({ ...base, role: "PLATFORM_ADMIN" });

    expect(result.success).toBe(false);
  });
});

describe("settingsSchema", () => {
  const base = {
    platformName: "L_Platform",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY" as const,
    theme: "system" as const,
    notifications: {
      organizationCreated: true,
      invitationAccepted: true,
      allocationExpiring: false,
      weeklyDigest: true,
    },
    adminProfile: {
      firstName: "Asha",
      lastName: "Verma",
      email: "asha@lplatform.dev",
      jobTitle: "Platform lead",
    },
    sessionPreferences: {
      idleTimeoutMinutes: 30,
      requireReauthentication: true,
    },
  };

  it("accepts a complete settings object", () => {
    expect(settingsSchema.safeParse(base).success).toBe(true);
  });

  it("coerces the idle timeout from a form string", () => {
    const result = settingsSchema.safeParse({
      ...base,
      sessionPreferences: { ...base.sessionPreferences, idleTimeoutMinutes: "45" },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionPreferences.idleTimeoutMinutes).toBe(45);
    }
  });

  it("enforces platform name and idle timeout bounds", () => {
    expect(settingsSchema.safeParse({ ...base, platformName: "A" }).success).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...base,
        sessionPreferences: { ...base.sessionPreferences, idleTimeoutMinutes: 4 },
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...base,
        sessionPreferences: { ...base.sessionPreferences, idleTimeoutMinutes: 241 },
      }).success,
    ).toBe(false);
  });
});

describe("academic schemas", () => {
  it("requires the YYYY-YY academic year format", () => {
    const valid = {
      name: "Class 8",
      organizationId: "org-1",
      academicYear: "2026-27",
      status: "ACTIVE" as const,
    };

    expect(classInputSchema.safeParse(valid).success).toBe(true);
    expect(classInputSchema.safeParse({ ...valid, academicYear: "2026" }).success).toBe(false);
  });

  it("requires a class for a section", () => {
    expect(sectionInputSchema.safeParse({ classId: "", name: "Section A" }).success).toBe(false);
    expect(sectionInputSchema.safeParse({ classId: "class-1", name: "Section A" }).success).toBe(
      true,
    );
  });
});

describe("allocation schemas", () => {
  const base = {
    courseId: "course-1",
    organizationId: "org-1",
    scope: "ORGANIZATION" as const,
    classId: null,
    sectionId: null,
    startDate: "2026-01-01",
    endDate: "2026-03-01",
    accessEnabled: true,
  };

  it("accepts an organization-wide allocation", () => {
    expect(allocationInputSchema.safeParse(base).success).toBe(true);
  });

  it("requires a class for class and section scopes", () => {
    expect(
      allocationInputSchema.safeParse({ ...base, scope: "CLASS", classId: null }).success,
    ).toBe(false);
    expect(
      allocationInputSchema.safeParse({
        ...base,
        scope: "SECTION",
        classId: "class-1",
        sectionId: null,
      }).success,
    ).toBe(false);
  });

  it("rejects an end date that is not after the start date", () => {
    const result = allocationInputSchema.safeParse({ ...base, endDate: "2026-01-01" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "endDate")).toBe(true);
    }
    expect(
      allocationUpdateSchema.safeParse({
        startDate: "2026-05-01",
        endDate: "2026-04-01",
        accessEnabled: true,
      }).success,
    ).toBe(false);
  });
});

describe("userInputSchema", () => {
  const base = {
    firstName: "Asha",
    lastName: "Verma",
    email: "asha@example.edu",
    role: "TEACHER" as const,
    organizationId: "org-1",
    status: "ACTIVE" as const,
  };

  it("accepts a teacher with an organization", () => {
    expect(userInputSchema.safeParse(base).success).toBe(true);
  });

  it("requires organizations for non-platform roles", () => {
    expect(userInputSchema.safeParse({ ...base, organizationId: null }).success).toBe(false);
  });

  it("forbids organizations for platform-level roles", () => {
    for (const globalRole of ["PLATFORM_OWNER", "PLATFORM_DEVELOPER", "PLATFORM_ADMIN"] as const) {
      expect(
        userInputSchema.safeParse({
          ...base,
          role: globalRole,
          organizationId: "org-1",
        }).success,
      ).toBe(false);
      expect(
        userInputSchema.safeParse({ ...base, role: globalRole, organizationId: null }).success,
      ).toBe(true);
    }
  });
});

describe("organization and course schemas", () => {
  it("rejects an invalid organization slug", () => {
    const result = organizationInputSchema.safeParse({
      name: "Test Academy",
      slug: "Test Academy!",
      type: "SCHOOL",
      contactName: "Test Contact",
      contactEmail: "contact@test.edu",
      phone: "+91 98765 43210",
      address: "1 Test Road",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      postalCode: "411001",
      status: "ACTIVE",
      initialAdministratorEmail: "admin@test.edu",
    });

    expect(result.success).toBe(false);
  });

  it("requires a course description of at least ten characters", () => {
    const result = courseInputSchema.safeParse({
      title: "Python Basics",
      description: "Short",
      category: "Programming",
      language: "PYTHON",
      difficulty: "BEGINNER",
      status: "DRAFT",
    });

    expect(result.success).toBe(false);
  });
});
