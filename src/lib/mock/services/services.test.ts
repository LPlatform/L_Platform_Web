import { beforeEach, describe, expect, it } from "vitest";
import { configureMockApi } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { currentAcademicYear, daysFromNow } from "../../dates";
import { getDb, resetDb } from "../db";
import { services } from "./index";

beforeEach(() => {
  configureMockApi({ latencyMs: 0 });
  resetDb();
});

function must<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing seed fixture: ${label}`);
  return value;
}

async function findOrganization(name: string) {
  const organizations = await services.organizations.list({ search: name, pageSize: 100 });
  return must(
    organizations.items.find((organization) => organization.name === name),
    `organization ${name}`,
  );
}

async function findClass(organizationId: string, name: string) {
  const classes = await services.classes.list({ organizationId, search: name, pageSize: 100 });
  return must(
    classes.items.find((academicClass) => academicClass.name === name),
    `class ${name}`,
  );
}

async function findCourse(title: string) {
  const courses = await services.courses.list({ search: title, pageSize: 100 });
  return must(
    courses.items.find((course) => course.title === title),
    `course ${title}`,
  );
}

const organizationPayload = {
  name: "Sunrise Academy",
  slug: "sunrise-academy",
  type: "SCHOOL" as const,
  contactName: "Deepa Nair",
  contactEmail: "office@sunriseacademy.edu",
  phone: "+91 98100 12345",
  address: "21 Lake View Road",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  postalCode: "600001",
  initialAdministratorEmail: "principal@sunriseacademy.edu",
  status: "ACTIVE" as const,
};

describe("organization onboarding", () => {
  it("creates an organization and its initial administrator invitation", async () => {
    const organization = await services.organizations.create(organizationPayload);

    expect(organization.publicId).toMatch(/^ORG-\d{4}-\d{4}$/);
    expect(organization.slug).toBe("sunrise-academy");

    const invitations = await services.invitations.list({
      organizationId: organization.id,
      pageSize: 100,
    });
    expect(invitations.items).toHaveLength(1);
    expect(invitations.items[0]).toMatchObject({
      recipient: "principal@sunriseacademy.edu",
      channel: "EMAIL",
      role: "ORGANIZATION_ADMIN",
      organizationId: organization.id,
      status: "PENDING",
    });

    const audit = await services.audit.list({ organizationId: organization.id, pageSize: 100 });
    expect(audit.items.map((log) => log.action)).toEqual(
      expect.arrayContaining(["ORGANIZATION_CREATED", "INVITATION_CREATED"]),
    );

    const withStats = await services.organizations.getById(organization.id);
    expect(withStats.stats).toEqual({
      teacherCount: 0,
      studentCount: 0,
      classCount: 0,
      courseCount: 0,
      administratorCount: 0,
    });
  });

  it("rejects duplicate slugs, names and administrator emails", async () => {
    await services.organizations.create(organizationPayload);

    await expect(
      services.organizations.create({
        ...organizationPayload,
        name: "Sunrise Academy North",
        contactEmail: "north@sunriseacademy.edu",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.DUPLICATE,
      fieldErrors: { slug: "This slug is already in use." },
    });

    await expect(
      services.organizations.create({
        ...organizationPayload,
        slug: "sunrise-north",
        contactEmail: "north@sunriseacademy.edu",
        initialAdministratorEmail: "office@sunriseacademy.edu",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.DUPLICATE });
  });

  it("blocks new records in inactive organizations", async () => {
    const nova = await findOrganization("Nova Skills Training Institute");
    expect(nova.status).toBe("INACTIVE");

    await expect(
      services.invitations.create({
        recipient: "new.teacher@nova.edu",
        channel: "EMAIL",
        role: "TEACHER",
        organizationId: nova.id,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.ORGANIZATION_INACTIVE, status: 409 });

    await expect(
      services.users.create({
        firstName: "Nova",
        lastName: "Teacher",
        email: "nova.teacher@nova.edu",
        role: "TEACHER",
        organizationId: nova.id,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.ORGANIZATION_INACTIVE, status: 409 });

    await expect(
      services.classes.create({
        name: "Class 12",
        organizationId: nova.id,
        academicYear: currentAcademicYear(),
        description: "",
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.ORGANIZATION_INACTIVE, status: 409 });
  });
});

describe("class and section management", () => {
  it("enforces unique class and section names within their scope", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const academicYear = currentAcademicYear();

    const created = await services.classes.create({
      name: "Class 12",
      organizationId: riverside.id,
      academicYear,
      description: "Final year cohort",
      status: "ACTIVE",
    });
    expect(created.publicId).toMatch(/^CLS-\d{4}-\d{4}$/);

    await expect(
      services.classes.create({
        name: "class 12",
        organizationId: riverside.id,
        academicYear,
        description: "",
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.DUPLICATE,
      fieldErrors: { name: "This class already exists for the selected academic year." },
    });

    const section = await services.sections.create(created.id, {
      classId: created.id,
      name: "Section C",
      description: "Evening cohort",
    });
    expect(section.classId).toBe(created.id);

    await expect(
      services.sections.create(created.id, {
        classId: created.id,
        name: "section c",
        description: "",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.DUPLICATE });

    const list = await services.classes.list({
      organizationId: riverside.id,
      search: "Class 12",
      pageSize: 100,
    });
    expect(list.items.map((item) => item.id)).toContain(created.id);
    expect(list.items[0]?.sectionCount).toBe(1);
  });

  it("assigns eligible students and teachers, skipping duplicates", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const academicClass = await services.classes.create({
      name: "Class 12",
      organizationId: riverside.id,
      academicYear: currentAcademicYear(),
      description: "",
      status: "ACTIVE",
    });
    const section = await services.sections.create(academicClass.id, {
      classId: academicClass.id,
      name: "Section A",
      description: "",
    });

    const students = await services.lookups.listEligibleStudents({
      organizationId: riverside.id,
      pageSize: 100,
    });
    const teachers = await services.lookups.listEligibleTeachers({
      organizationId: riverside.id,
      pageSize: 100,
    });
    const studentId = must(students.items[0], "eligible student").id;
    const teacherId = must(teachers.items[0], "eligible teacher").id;

    const outcome = await services.sections.assignStudents(section.id, [studentId]);
    expect(outcome).toEqual({ assigned: 1, skipped: 0 });

    const repeat = await services.sections.assignStudents(section.id, [studentId]);
    expect(repeat).toEqual({ assigned: 0, skipped: 1 });

    const teacherOutcome = await services.sections.assignTeachers(section.id, [teacherId]);
    expect(teacherOutcome).toEqual({ assigned: 1, skipped: 0 });

    const roster = await services.sections.getRoster(section.id);
    expect(roster.students.map((student) => student.id)).toContain(studentId);
    expect(roster.teachers.map((teacher) => teacher.id)).toContain(teacherId);
    expect(roster.capacity).toBe(60);

    await services.sections.removeStudent(section.id, studentId);
    const updatedRoster = await services.sections.getRoster(section.id);
    expect(updatedRoster.students.map((student) => student.id)).not.toContain(studentId);
  });

  it("refuses to assign students to archived sections", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const academicClass = await services.classes.create({
      name: "Class 12",
      organizationId: riverside.id,
      academicYear: currentAcademicYear(),
      description: "",
      status: "ACTIVE",
    });
    const section = await services.sections.create(academicClass.id, {
      classId: academicClass.id,
      name: "Section A",
      description: "",
    });
    await services.sections.setStatus(section.id, "ARCHIVED");

    const students = await services.lookups.listEligibleStudents({
      organizationId: riverside.id,
      pageSize: 10,
    });
    const studentId = must(students.items[0], "eligible student").id;

    await expect(services.sections.assignStudents(section.id, [studentId])).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
      status: 409,
    });
  });
});

describe("course lifecycle", () => {
  it("creates, versions, archives and restricts course options", async () => {
    const created = await services.courses.create({
      title: "Systems Programming with C++",
      description: "Memory ownership, concurrency and performance fundamentals.",
      category: "Systems",
      language: "CPP",
      difficulty: "ADVANCED",
      status: "ACTIVE",
    });
    expect(created.version).toBe(1);

    await expect(
      services.courses.create({
        title: "systems programming with c++",
        description: "Duplicate title should be rejected by the catalog.",
        category: "Systems",
        language: "CPP",
        difficulty: "ADVANCED",
        status: "DRAFT",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.DUPLICATE,
      fieldErrors: { title: "This course title is already in use." },
    });

    const updated = await services.courses.update(created.id, {
      title: "Systems Programming with C++",
      description: "Memory ownership, concurrency, performance and tooling fundamentals.",
      category: "Systems",
      language: "CPP",
      difficulty: "ADVANCED",
      status: "ACTIVE",
    });
    expect(updated.version).toBe(2);

    const archived = await services.courses.setStatus(created.id, "ARCHIVED");
    expect(archived.status).toBe("ARCHIVED");

    await expect(
      services.courses.update(created.id, {
        title: "Systems Programming with C++",
        description: "Archived courses should be read-only in the mock service.",
        category: "Systems",
        language: "CPP",
        difficulty: "ADVANCED",
        status: "ARCHIVED",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.CONFLICT, status: 409 });

    const options = await services.courses.listOptions();
    expect(options.some((course) => course.id === created.id)).toBe(false);
  });
});

describe("course allocation rules", () => {
  it("creates scoped allocations and blocks duplicates", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const course = await findCourse("Python Data Structures");

    const allocation = await services.allocations.create({
      courseId: course.id,
      organizationId: riverside.id,
      classId: null,
      sectionId: null,
      startDate: daysFromNow(-1),
      endDate: daysFromNow(30),
      accessEnabled: true,
    });
    expect(allocation.scope).toBe("ORGANIZATION");
    expect(allocation.status).toBe("ACTIVE");
    expect(allocation.affectedStudentCount).toBeGreaterThan(0);

    await expect(
      services.allocations.create({
        courseId: course.id,
        organizationId: riverside.id,
        classId: null,
        sectionId: null,
        startDate: daysFromNow(5),
        endDate: daysFromNow(40),
        accessEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.DUPLICATE_ALLOCATION, status: 409 });
  });

  it("rejects archived courses, inactive organizations and cross-organization targets", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const greenwood = await findOrganization("Greenwood College");
    const nova = await findOrganization("Nova Skills Training Institute");
    const activeCourse = await findCourse("Python Data Structures");
    const archivedCourse = await findCourse("Python Web Foundations");
    const greenwoodClass = await findClass(greenwood.id, "Class 6");

    await expect(
      services.allocations.create({
        courseId: archivedCourse.id,
        organizationId: riverside.id,
        classId: null,
        sectionId: null,
        startDate: daysFromNow(-1),
        endDate: daysFromNow(30),
        accessEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.COURSE_UNAVAILABLE, status: 409 });

    await expect(
      services.allocations.create({
        courseId: activeCourse.id,
        organizationId: nova.id,
        classId: null,
        sectionId: null,
        startDate: daysFromNow(-1),
        endDate: daysFromNow(30),
        accessEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.ORGANIZATION_INACTIVE, status: 409 });

    await expect(
      services.allocations.create({
        courseId: activeCourse.id,
        organizationId: riverside.id,
        classId: greenwoodClass.id,
        sectionId: null,
        startDate: daysFromNow(-1),
        endDate: daysFromNow(30),
        accessEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.CROSS_ORGANIZATION, status: 403 });

    await expect(
      services.allocations.create({
        courseId: activeCourse.id,
        organizationId: riverside.id,
        classId: null,
        sectionId: null,
        startDate: daysFromNow(10),
        endDate: daysFromNow(10),
        accessEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED, status: 422 });
  });

  it("revokes allocations once and blocks edits afterwards", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const course = await findCourse("Object-Oriented Java");

    const allocation = await services.allocations.create({
      courseId: course.id,
      organizationId: riverside.id,
      classId: null,
      sectionId: null,
      startDate: daysFromNow(3),
      endDate: daysFromNow(60),
      accessEnabled: true,
    });
    expect(allocation.status).toBe("SCHEDULED");

    const revoked = await services.allocations.revoke(allocation.id);
    expect(revoked.status).toBe("REVOKED");
    expect(revoked.accessEnabled).toBe(false);

    await expect(services.allocations.revoke(allocation.id)).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
      status: 409,
    });
    await expect(
      services.allocations.update(allocation.id, {
        startDate: daysFromNow(4),
        endDate: daysFromNow(90),
        accessEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.CONFLICT, status: 409 });
  });
});

describe("invitation lifecycle", () => {
  it("creates pending invitations with a seven-day expiry", async () => {
    const riverside = await findOrganization("Riverside Public School");

    const invitation = await services.invitations.create({
      recipient: "qa.teacher@riverside.edu",
      channel: "EMAIL",
      role: "TEACHER",
      organizationId: riverside.id,
    });
    expect(invitation.status).toBe("PENDING");
    const daysToExpiry = (new Date(invitation.expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(daysToExpiry).toBeGreaterThan(6.9);
    expect(daysToExpiry).toBeLessThanOrEqual(7);

    await expect(
      services.invitations.create({
        recipient: "QA.TEACHER@riverside.edu",
        channel: "EMAIL",
        role: "TEACHER",
        organizationId: riverside.id,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.DUPLICATE,
      fieldErrors: { recipient: "An invitation is already pending." },
    });

    await expect(
      services.invitations.create({
        recipient: "priya.sharma@riverside.edu",
        channel: "EMAIL",
        role: "TEACHER",
        organizationId: riverside.id,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.DUPLICATE, status: 409 });
  });

  it("resends pending invitations and blocks accepted or revoked ones", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const invitation = await services.invitations.create({
      recipient: "qa.resend@riverside.edu",
      channel: "EMAIL",
      role: "STUDENT",
      organizationId: riverside.id,
    });

    const resent = await services.invitations.resend(invitation.id);
    expect(resent.status).toBe("PENDING");
    expect(new Date(resent.expiresAt).getTime()).toBeGreaterThanOrEqual(
      new Date(invitation.expiresAt).getTime(),
    );

    const revoked = await services.invitations.revoke(invitation.id);
    expect(revoked.status).toBe("REVOKED");
    await expect(services.invitations.resend(invitation.id)).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
      status: 409,
    });

    const accepted = await services.invitations.list({
      status: "ACCEPTED",
      pageSize: 100,
    });
    const acceptedInvitation = must(accepted.items[0], "accepted invitation");
    await expect(services.invitations.revoke(acceptedInvitation.id)).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
      status: 409,
    });
  });
});

describe("user and administrator management", () => {
  it("creates users, enforces unique identities and organization rules", async () => {
    const riverside = await findOrganization("Riverside Public School");

    const created = await services.users.create({
      firstName: "Meera",
      lastName: "Krishnan",
      email: "meera.krishnan@riverside.edu",
      username: "meera.krishnan",
      role: "STUDENT",
      organizationId: riverside.id,
      status: "ACTIVE",
    });
    expect(created.publicId).toMatch(/^USR-\d{4}-\d{5}$/);

    await expect(
      services.users.create({
        firstName: "Meera",
        lastName: "Krishnan",
        email: "MEERA.KRISHNAN@riverside.edu",
        role: "STUDENT",
        organizationId: riverside.id,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.DUPLICATE,
      fieldErrors: { email: "This email is already registered." },
    });

    await expect(
      services.users.create({
        firstName: "Platform",
        lastName: "Root",
        email: "root@lplatform.dev",
        role: "PLATFORM_ADMIN",
        organizationId: null,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });

    await expect(
      services.users.create({
        firstName: "Unassigned",
        lastName: "Student",
        email: "unassigned@riverside.edu",
        role: "STUDENT",
        organizationId: null,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });
  });

  it("blocks moving assigned students across organizations", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const greenwood = await findOrganization("Greenwood College");
    const db = getDb();
    const student = must(
      db.users.find(
        (user) =>
          user.role === "STUDENT" &&
          user.status === "ACTIVE" &&
          user.organizationId === riverside.id &&
          Boolean(user.email) &&
          db.sectionStudents.some((record) => record.studentId === user.id),
      ),
      "assigned Riverside student",
    );

    await expect(
      services.users.update(student.id, {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email ?? "",
        username: student.username ?? undefined,
        organizationId: greenwood.id,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.CONFLICT, status: 409 });
  });

  it("protects the platform administrator account from organization administration", async () => {
    const db = getDb();
    const platformAdmin = must(
      db.users.find((user) => user.role === "PLATFORM_ADMIN"),
      "platform administrator",
    );

    await expect(
      services.administrators.update(platformAdmin.id, {
        firstName: platformAdmin.firstName,
        lastName: platformAdmin.lastName,
        email: platformAdmin.email ?? "",
        username: undefined,
        organizationId: null,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.CONFLICT, status: 409 });
  });
});

describe("audit logging", () => {
  it("records mutations and filters by organization, action and search", async () => {
    const riverside = await findOrganization("Riverside Public School");
    await services.organizations.create(organizationPayload);
    const organization = await findOrganization("Sunrise Academy");

    const created = await services.audit.list({
      organizationId: organization.id,
      action: "ORGANIZATION_CREATED",
      pageSize: 100,
    });
    expect(created.items).toHaveLength(1);
    expect(created.items[0]).toMatchObject({
      entityType: "ORGANIZATION",
      entityLabel: "Sunrise Academy",
      status: "SUCCESS",
    });

    const riversideLogs = await services.audit.list({
      organizationId: riverside.id,
      action: "STUDENT_ASSIGNED",
      pageSize: 100,
    });
    expect(riversideLogs.items.length).toBeGreaterThan(0);
    expect(
      riversideLogs.items.every(
        (log) => log.organizationId === riverside.id && log.action === "STUDENT_ASSIGNED",
      ),
    ).toBe(true);

    const search = await services.audit.list({ search: "Sunrise Academy", pageSize: 100 });
    expect(search.items.map((log) => log.action)).toContain("ORGANIZATION_CREATED");
    expect(search.items.length).toBeLessThanOrEqual(2);

    const unfiltered = await services.audit.list({ pageSize: 100 });
    const sentinel = await services.audit.list({ action: "ALL", pageSize: 100 });
    expect(sentinel.items).toHaveLength(unfiltered.items.length);
    expect(sentinel.items).toHaveLength(getDb().auditLogs.length);
  });
});

describe("reports", () => {
  it("exposes every report with computed rows", async () => {
    const riverside = await findOrganization("Riverside Public School");
    const db = getDb();

    const reports = await services.reports.list();
    expect(reports.map((report) => report.id)).toEqual([
      "organization-students",
      "organization-teachers",
      "class-distribution",
      "allocation-statistics",
      "onboarding-statistics",
      "organization-status",
    ]);

    const students = await services.reports.getById("organization-students");
    const riversideRow = must(
      students.rows.find((row) => row.key === riverside.id),
      "Riverside student report row",
    );
    const expectedStudents = db.users.filter(
      (user) => user.organizationId === riverside.id && user.role === "STUDENT",
    ).length;
    expect(riversideRow.values.students).toBe(expectedStudents);

    const onboarding = await services.reports.getOnboardingSeries();
    expect(onboarding).toHaveLength(9);
    expect(onboarding.every((point) => point.students >= 0 && point.teachers >= 0)).toBe(true);
  });

  it("rejects unknown reports", async () => {
    await expect(services.reports.getById("not-a-report" as never)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("settings", () => {
  it("persists updates and resets demo data", async () => {
    const settings = await services.settings.get();
    expect(settings.platformName).toBe("L_Platform");

    const updated = await services.settings.update({
      ...settings,
      platformName: "L_Platform Console",
      theme: "dark",
      notifications: { ...settings.notifications, weeklyDigest: true },
      sessionPreferences: { ...settings.sessionPreferences, idleTimeoutMinutes: 45 },
    });
    expect(updated.platformName).toBe("L_Platform Console");
    expect(updated.theme).toBe("dark");
    expect(updated.sessionPreferences.idleTimeoutMinutes).toBe(45);

    const reread = await services.settings.get();
    expect(reread).toMatchObject({
      platformName: "L_Platform Console",
      theme: "dark",
      sessionPreferences: { idleTimeoutMinutes: 45, requireReauthentication: true },
    });

    await services.settings.resetDemoData();
    const reset = await services.settings.get();
    expect(reset.platformName).toBe("L_Platform");
    expect(reset.theme).toBe("system");
  });
});
