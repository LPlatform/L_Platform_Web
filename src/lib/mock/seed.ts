import type {
  AcademicClass,
  AuditAction,
  AuditLog,
  Course,
  CourseAllocation,
  Invitation,
  Organization,
  OrganizationType,
  PlatformSettings,
  Section,
  User,
} from "@/types";
import { daysFromNow, monthsAgo } from "../dates";
import type { MockDatabase, SectionStudentRecord, SectionTeacherRecord } from "./db";
import { MOCK_DB_VERSION } from "./db";
import { createPrng, pick, randomInt } from "./random";

const FIRST_NAMES = [
  "Aarav",
  "Priya",
  "Rohan",
  "Ananya",
  "Vikram",
  "Meera",
  "Ishaan",
  "Kavya",
  "Arjun",
  "Diya",
  "Kabir",
  "Saanvi",
  "Aditya",
  "Ira",
  "Neel",
  "Riya",
  "Dev",
  "Tara",
  "Karan",
  "Nisha",
  "Vihaan",
  "Sneha",
  "Rahul",
  "Pooja",
  "Siddharth",
  "Aisha",
  "Manav",
  "Trisha",
  "Yash",
  "Aditi",
  "Nikhil",
  "Shreya",
] as const;

const LAST_NAMES = [
  "Mehta",
  "Sharma",
  "Iyer",
  "Nair",
  "Kapoor",
  "Reddy",
  "Verma",
  "Menon",
  "Singh",
  "Desai",
  "Kulkarni",
  "Bose",
  "Joshi",
  "Rao",
  "Gupta",
  "Patel",
  "Chopra",
  "Malhotra",
  "Shetty",
  "Bansal",
] as const;

const ORG_SEEDS: Array<{
  name: string;
  slug: string;
  type: OrganizationType;
  city: string;
  state: string;
  status: "ACTIVE" | "INACTIVE";
  createdMonthsAgo: number;
  studentCount: number;
  teacherCount: number;
  street: string;
  postalCode: string;
}> = [
  {
    name: "Riverside Public School",
    slug: "riverside-public-school",
    type: "SCHOOL",
    city: "New Delhi",
    state: "Delhi",
    status: "ACTIVE",
    createdMonthsAgo: 9,
    studentCount: 30,
    teacherCount: 5,
    street: "14 Yamuna Marg, Civil Lines",
    postalCode: "110054",
  },
  {
    name: "Greenwood College",
    slug: "greenwood-college",
    type: "COLLEGE",
    city: "Bengaluru",
    state: "Karnataka",
    status: "ACTIVE",
    createdMonthsAgo: 7,
    studentCount: 26,
    teacherCount: 4,
    street: "88 MG Road, Indiranagar",
    postalCode: "560038",
  },
  {
    name: "BrightPath Coaching Institute",
    slug: "brightpath-coaching",
    type: "COACHING_INSTITUTE",
    city: "Pune",
    state: "Maharashtra",
    status: "ACTIVE",
    createdMonthsAgo: 5,
    studentCount: 24,
    teacherCount: 6,
    street: "5 FC Road, Shivajinagar",
    postalCode: "411005",
  },
  {
    name: "Nova Skills Training Institute",
    slug: "nova-skills",
    type: "TRAINING_INSTITUTE",
    city: "Hyderabad",
    state: "Telangana",
    status: "INACTIVE",
    createdMonthsAgo: 8,
    studentCount: 16,
    teacherCount: 3,
    street: "21 Jubilee Hills Road",
    postalCode: "500033",
  },
  {
    name: "Horizon Global School",
    slug: "horizon-global",
    type: "SCHOOL",
    city: "Mumbai",
    state: "Maharashtra",
    status: "ACTIVE",
    createdMonthsAgo: 3,
    studentCount: 22,
    teacherCount: 4,
    street: "7 Palm Beach Road, Navi Mumbai",
    postalCode: "400703",
  },
];

const ORG_ADMIN_NAMES = [
  ["Priya", "Sharma"],
  ["Rohan", "Iyer"],
  ["Kavya", "Reddy"],
  ["Vikram", "Menon"],
  ["Ananya", "Kapoor"],
] as const;

const PLATFORM_ADMIN = {
  firstName: "Aarav",
  lastName: "Mehta",
  email: "admin@lplatform.dev",
  jobTitle: "Platform Administrator",
};

const ORG_ADMIN_PERMISSIONS = [
  "users.manage",
  "classes.manage",
  "sections.manage",
  "courses.view",
  "allocations.manage",
  "reports.view",
];

const PLATFORM_PERMISSIONS = [
  "organizations.manage",
  "administrators.manage",
  "users.manage",
  "courses.manage",
  "allocations.manage",
  "reports.view",
  "audit.view",
  "settings.manage",
];

function must<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

function academicYear(base = new Date()): string {
  const startYear = base.getMonth() >= 2 ? base.getFullYear() : base.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function computeStatus(allocation: {
  revokedAt: string | null;
  startDate: string;
  endDate: string;
}): CourseAllocation["status"] {
  const now = Date.now();
  if (allocation.revokedAt) return "REVOKED";
  if (new Date(allocation.endDate).getTime() < now) return "EXPIRED";
  if (new Date(allocation.startDate).getTime() > now) return "SCHEDULED";
  return "ACTIVE";
}

export function seedDatabase(): MockDatabase {
  const random = createPrng(20261109);
  const now = new Date();
  const year = now.getFullYear();
  let idCounter = 0;
  const id = () => {
    idCounter += 1;
    return `10000000-0000-4000-8000-${String(idCounter).padStart(12, "0")}`;
  };

  const usedEmails = new Set<string>();
  const usedUsernames = new Set<string>();

  const uniqueEmail = (first: string, last: string, domain: string) => {
    const base = `${first}.${last}`.toLowerCase();
    let candidate = `${base}@${domain}`;
    let suffix = 2;
    while (usedEmails.has(candidate)) {
      candidate = `${base}${suffix}@${domain}`;
      suffix += 1;
    }
    usedEmails.add(candidate);
    return candidate;
  };

  const uniqueUsername = (slug: string, sequence: number) => {
    const prefix = slug
      .replace(/[^a-z]/g, "")
      .slice(0, 3)
      .toUpperCase();
    let candidate = `${prefix}${year}${String(sequence).padStart(4, "0")}`.toLowerCase();
    let suffix = 2;
    while (usedUsernames.has(candidate)) {
      candidate = `${prefix}${year}${String(sequence).padStart(4, "0")}${suffix}`;
      suffix += 1;
    }
    usedUsernames.add(candidate);
    return candidate;
  };

  const organizations: Organization[] = [];
  const users: User[] = [];
  const classes: AcademicClass[] = [];
  const sections: Section[] = [];
  const sectionStudents: SectionStudentRecord[] = [];
  const sectionTeachers: SectionTeacherRecord[] = [];
  const courses: Course[] = [];
  const allocations: CourseAllocation[] = [];
  const invitations: Invitation[] = [];
  const auditLogs: AuditLog[] = [];

  ORG_SEEDS.forEach((seed, index) => {
    const createdAt = monthsAgo(seed.createdMonthsAgo, 4 + index, now);
    organizations.push({
      id: id(),
      publicId: `ORG-${year}-${String(index + 1).padStart(4, "0")}`,
      name: seed.name,
      slug: seed.slug,
      type: seed.type,
      contactName: ORG_ADMIN_NAMES[index]
        ? `${ORG_ADMIN_NAMES[index][0]} ${ORG_ADMIN_NAMES[index][1]}`
        : "Organization Contact",
      contactEmail: `office@${seed.slug.split("-")[0]}.edu`,
      phone: `+91 ${randomInt(random, 70, 99)} ${randomInt(random, 10000000, 99999999)}`,
      address: seed.street,
      city: seed.city,
      state: seed.state,
      country: "India",
      postalCode: seed.postalCode,
      status: seed.status,
      createdAt,
      updatedAt: createdAt,
    });
  });

  const platformAdminCreatedAt = monthsAgo(10, 2, now);
  users.push({
    id: id(),
    publicId: `USR-${year}-00001`,
    firstName: PLATFORM_ADMIN.firstName,
    lastName: PLATFORM_ADMIN.lastName,
    email: PLATFORM_ADMIN.email,
    username: null,
    role: "PLATFORM_ADMIN",
    organizationId: null,
    status: "ACTIVE",
    permissions: PLATFORM_PERMISSIONS,
    createdAt: platformAdminCreatedAt,
    updatedAt: platformAdminCreatedAt,
    lastActiveAt: daysFromNow(-0.02, now),
  });
  usedEmails.add(PLATFORM_ADMIN.email);

  let userSequence = 1;
  const nextPublicUser = () => {
    userSequence += 1;
    return `USR-${year}-${String(userSequence).padStart(5, "0")}`;
  };

  const orgAdminIdsByOrg = new Map<string, string[]>();
  const teacherIdsByOrg = new Map<string, string[]>();
  const studentIdsByOrg = new Map<string, string[]>();

  organizations.forEach((organization, orgIndex) => {
    const emailDomain = `${organization.slug.split("-")[0] ?? organization.slug}.edu`;
    const adminNames = ORG_ADMIN_NAMES[orgIndex] ?? ["Organization", "Admin"];
    const adminCount = orgIndex === 0 ? 2 : 1;
    const adminIds: string[] = [];
    for (let adminIndex = 0; adminIndex < adminCount; adminIndex += 1) {
      const first = adminIndex === 0 ? must(adminNames[0], "admin first name") : "Nisha";
      const last = adminIndex === 0 ? must(adminNames[1], "admin last name") : "Bansal";
      const createdAt = monthsAgo(Math.max(1, 8 - orgIndex), 8 + adminIndex, now);
      const admin: User = {
        id: id(),
        publicId: nextPublicUser(),
        firstName: first,
        lastName: last,
        email: uniqueEmail(first, last, emailDomain),
        username: null,
        role: "ORGANIZATION_ADMIN",
        organizationId: organization.id,
        status: organization.status,
        permissions: ORG_ADMIN_PERMISSIONS,
        createdAt,
        updatedAt: createdAt,
        lastActiveAt: daysFromNow(-randomInt(random, 0, 6), now),
      };
      users.push(admin);
      adminIds.push(admin.id);
    }
    orgAdminIdsByOrg.set(organization.id, adminIds);

    const seed = ORG_SEEDS[orgIndex];
    const teacherIds: string[] = [];
    for (let teacherIndex = 0; teacherIndex < (seed?.teacherCount ?? 3); teacherIndex += 1) {
      const first = pick(random, FIRST_NAMES);
      const last = pick(random, LAST_NAMES);
      const createdAt = monthsAgo(randomInt(random, 1, 8), randomInt(random, 2, 27), now);
      const teacher: User = {
        id: id(),
        publicId: nextPublicUser(),
        firstName: first,
        lastName: last,
        email: uniqueEmail(first, last, emailDomain),
        username: null,
        role: "TEACHER",
        organizationId: organization.id,
        status: organization.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        permissions: [],
        createdAt,
        updatedAt: createdAt,
        lastActiveAt:
          organization.status === "ACTIVE"
            ? daysFromNow(-randomInt(random, 0, 9), now)
            : daysFromNow(-60, now),
      };
      users.push(teacher);
      teacherIds.push(teacher.id);
    }
    teacherIdsByOrg.set(organization.id, teacherIds);

    const studentIds: string[] = [];
    for (let studentIndex = 0; studentIndex < (seed?.studentCount ?? 20); studentIndex += 1) {
      const first = pick(random, FIRST_NAMES);
      const last = pick(random, LAST_NAMES);
      const createdAt = monthsAgo(randomInt(random, 0, 8), randomInt(random, 1, 27), now);
      const usernameOnly = random() < 0.3;
      const username = usernameOnly
        ? uniqueUsername(organization.slug, studentIndex + orgIndex * 100 + 1)
        : null;
      const email = usernameOnly ? null : uniqueEmail(first, last, emailDomain);
      const student: User = {
        id: id(),
        publicId: nextPublicUser(),
        firstName: first,
        lastName: last,
        email,
        username,
        role: "STUDENT",
        organizationId: organization.id,
        status: organization.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        permissions: [],
        createdAt,
        updatedAt: createdAt,
        lastActiveAt:
          organization.status === "ACTIVE"
            ? daysFromNow(-randomInt(random, 0, 14), now)
            : daysFromNow(-45, now),
      };
      users.push(student);
      studentIds.push(student.id);
    }
    studentIdsByOrg.set(organization.id, studentIds);

    const classYear = academicYear(now);
    const classNames = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11"];
    const orgClasses: AcademicClass[] = [];
    classNames.forEach((className, classIndex) => {
      const createdAt = monthsAgo(Math.max(1, 7 - (orgIndex % 3)), classIndex + 2, now);
      const academicClass: AcademicClass = {
        id: id(),
        publicId: `CLS-${year}-${String(classes.length + 1).padStart(4, "0")}`,
        organizationId: organization.id,
        name: className,
        academicYear: classYear,
        description: `${className} cohort for ${organization.name}, academic year ${classYear}.`,
        status: organization.status,
        createdAt,
        updatedAt: createdAt,
      };
      classes.push(academicClass);
      orgClasses.push(academicClass);
    });

    const orgSections: Section[] = [];
    orgClasses.forEach((academicClass, classIndex) => {
      ["A", "B"].forEach((sectionName, sectionIndex) => {
        const createdAt = monthsAgo(
          Math.max(1, 6 - (orgIndex % 2)),
          classIndex + sectionIndex + 3,
          now,
        );
        const section: Section = {
          id: id(),
          publicId: `SEC-${year}-${String(sections.length + 1).padStart(4, "0")}`,
          classId: academicClass.id,
          organizationId: organization.id,
          name: `Section ${sectionName}`,
          description: `${sectionName} section of ${academicClass.name}`,
          status: organization.status === "ACTIVE" ? "ACTIVE" : "ARCHIVED",
          createdAt,
          updatedAt: createdAt,
        };
        sections.push(section);
        orgSections.push(section);
      });
    });

    studentIds.forEach((studentId, studentIndex) => {
      const targetClassIndex = studentIndex % orgClasses.length;
      const targetSection = orgSections[targetClassIndex * 2 + (studentIndex % 2)];
      const targetClass = orgClasses[targetClassIndex];
      if (!targetSection || !targetClass) return;
      sectionStudents.push({
        id: id(),
        sectionId: targetSection.id,
        studentId,
        assignedAt: monthsAgo(randomInt(random, 0, 4), randomInt(random, 1, 27), now),
      });
    });

    teacherIds.forEach((teacherId, teacherIndex) => {
      for (let slot = 0; slot < 2; slot += 1) {
        const targetSection = orgSections[(teacherIndex * 2 + slot) % orgSections.length];
        if (!targetSection) continue;
        if (
          sectionTeachers.some(
            (record) => record.sectionId === targetSection.id && record.teacherId === teacherId,
          )
        ) {
          continue;
        }
        sectionTeachers.push({
          id: id(),
          sectionId: targetSection.id,
          teacherId,
          assignedAt: monthsAgo(randomInt(random, 0, 3), randomInt(random, 1, 27), now),
        });
      }
    });
  });

  const courseSeeds: Array<
    Omit<Course, "id" | "publicId" | "createdAt" | "updatedAt"> & { createdMonthsAgo: number }
  > = [
    {
      title: "Class 8 Python Foundation",
      description: "Introduces variables, control flow, functions and problem solving with Python.",
      category: "Foundations",
      language: "PYTHON",
      difficulty: "BEGINNER",
      status: "ACTIVE",
      version: 3,
      createdMonthsAgo: 8,
    },
    {
      title: "Class 9 Java Basics",
      description: "Object-oriented programming fundamentals using Java and the standard library.",
      category: "Foundations",
      language: "JAVA",
      difficulty: "BEGINNER",
      status: "ACTIVE",
      version: 2,
      createdMonthsAgo: 7,
    },
    {
      title: "C++ Programming Fundamentals",
      description: "Syntax, memory model, functions and structured programming in modern C++.",
      category: "Foundations",
      language: "CPP",
      difficulty: "BEGINNER",
      status: "ACTIVE",
      version: 2,
      createdMonthsAgo: 6,
    },
    {
      title: "Python Data Structures",
      description: "Lists, dictionaries, sets, comprehensions and algorithmic thinking in Python.",
      category: "Problem Solving",
      language: "PYTHON",
      difficulty: "INTERMEDIATE",
      status: "ACTIVE",
      version: 4,
      createdMonthsAgo: 5,
    },
    {
      title: "Object-Oriented Java",
      description: "Classes, inheritance, interfaces and design principles with Java projects.",
      category: "Software Design",
      language: "JAVA",
      difficulty: "INTERMEDIATE",
      status: "ACTIVE",
      version: 2,
      createdMonthsAgo: 4,
    },
    {
      title: "Advanced C++ Algorithms",
      description: "Graphs, dynamic programming and competitive programming patterns in C++.",
      category: "Algorithms",
      language: "CPP",
      difficulty: "ADVANCED",
      status: "DRAFT",
      version: 1,
      createdMonthsAgo: 2,
    },
    {
      title: "Python Web Foundations",
      description: "HTTP, APIs and server-side development foundations with Python.",
      category: "Web Development",
      language: "PYTHON",
      difficulty: "INTERMEDIATE",
      status: "ARCHIVED",
      version: 2,
      createdMonthsAgo: 9,
    },
    {
      title: "Creative Coding with Python",
      description: "Visual and interactive programming projects for early learners.",
      category: "Creative Computing",
      language: "PYTHON",
      difficulty: "BEGINNER",
      status: "DRAFT",
      version: 1,
      createdMonthsAgo: 1,
    },
  ];

  courseSeeds.forEach((seed, index) => {
    const createdAt = monthsAgo(seed.createdMonthsAgo, 6 + (index % 7), now);
    courses.push({
      id: id(),
      publicId: `CRS-${year}-${String(index + 1).padStart(4, "0")}`,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      language: seed.language,
      difficulty: seed.difficulty,
      status: seed.status,
      version: seed.version,
      createdAt,
      updatedAt: createdAt,
    });
  });

  const orgByIndex = (index: number) => must(organizations[index], `organization ${index}`);
  const courseByIndex = (index: number) => must(courses[index], `course ${index}`);
  const classByName = (organizationId: string, name: string) =>
    classes.find((item) => item.organizationId === organizationId && item.name === name);
  const sectionByClassAndName = (classId: string, name: string) =>
    sections.find((item) => item.classId === classId && item.name === name);

  let allocationSequence = 0;
  const addAllocation = (input: {
    courseIndex: number;
    organizationIndex: number;
    className?: string;
    sectionName?: string;
    startOffsetDays: number;
    endOffsetDays: number;
    accessEnabled?: boolean;
    revokedAt?: string | null;
  }) => {
    const organization = orgByIndex(input.organizationIndex);
    const course = courseByIndex(input.courseIndex);
    const academicClass = input.className
      ? classByName(organization.id, input.className)
      : undefined;
    const section =
      academicClass && input.sectionName
        ? sectionByClassAndName(academicClass.id, `Section ${input.sectionName}`)
        : undefined;
    allocationSequence += 1;
    const revokedAt = input.revokedAt ?? null;
    const startDate = daysFromNow(input.startOffsetDays, now);
    const endDate = daysFromNow(input.endOffsetDays, now);
    const allocation: CourseAllocation = {
      id: id(),
      publicId: `ALL-${year}-${String(allocationSequence).padStart(4, "0")}`,
      courseId: course.id,
      organizationId: organization.id,
      classId: academicClass?.id ?? null,
      sectionId: section?.id ?? null,
      scope: section ? "SECTION" : academicClass ? "CLASS" : "ORGANIZATION",
      startDate,
      endDate,
      accessEnabled: input.accessEnabled ?? true,
      status: "SCHEDULED",
      revokedAt,
      createdAt: daysFromNow(Math.min(-1, input.startOffsetDays - 4), now),
      updatedAt: daysFromNow(-1, now),
    };
    allocation.status = computeStatus(allocation);
    allocations.push(allocation);
  };

  addAllocation({
    courseIndex: 0,
    organizationIndex: 0,
    className: "Class 8",
    sectionName: "A",
    startOffsetDays: -35,
    endOffsetDays: 145,
  });
  addAllocation({
    courseIndex: 1,
    organizationIndex: 0,
    className: "Class 9",
    startOffsetDays: -25,
    endOffsetDays: 120,
  });
  addAllocation({ courseIndex: 2, organizationIndex: 0, startOffsetDays: -80, endOffsetDays: 180 });
  addAllocation({
    courseIndex: 0,
    organizationIndex: 1,
    className: "Class 8",
    sectionName: "B",
    startOffsetDays: -12,
    endOffsetDays: 90,
  });
  addAllocation({
    courseIndex: 3,
    organizationIndex: 1,
    className: "Class 9",
    startOffsetDays: -40,
    endOffsetDays: 110,
  });
  addAllocation({
    courseIndex: 1,
    organizationIndex: 2,
    className: "Class 9",
    sectionName: "A",
    startOffsetDays: -5,
    endOffsetDays: 150,
  });
  addAllocation({
    courseIndex: 2,
    organizationIndex: 2,
    className: "Class 10",
    startOffsetDays: -20,
    endOffsetDays: 160,
  });
  addAllocation({ courseIndex: 4, organizationIndex: 2, startOffsetDays: -15, endOffsetDays: 200 });
  addAllocation({
    courseIndex: 0,
    organizationIndex: 4,
    className: "Class 7",
    sectionName: "A",
    startOffsetDays: 12,
    endOffsetDays: 190,
  });
  addAllocation({
    courseIndex: 3,
    organizationIndex: 4,
    className: "Class 8",
    startOffsetDays: -3,
    endOffsetDays: 120,
  });
  addAllocation({
    courseIndex: 3,
    organizationIndex: 3,
    className: "Class 8",
    startOffsetDays: -120,
    endOffsetDays: -30,
  });
  addAllocation({
    courseIndex: 1,
    organizationIndex: 0,
    className: "Class 10",
    startOffsetDays: -60,
    endOffsetDays: 60,
    revokedAt: daysFromNow(-5, now),
  });
  addAllocation({
    courseIndex: 4,
    organizationIndex: 1,
    className: "Class 7",
    sectionName: "A",
    startOffsetDays: -8,
    endOffsetDays: 130,
  });

  const invitationSeeds: Array<{
    recipient: string;
    channel: Invitation["channel"];
    role: Invitation["role"];
    organizationIndex: number;
    status: Invitation["status"];
    invitedDaysAgo: number;
    expiresInDays: number;
  }> = [
    {
      recipient: "teacher.new@riverside.edu",
      channel: "EMAIL",
      role: "TEACHER",
      organizationIndex: 0,
      status: "PENDING",
      invitedDaysAgo: 2,
      expiresInDays: 5,
    },
    {
      recipient: "student.asha@riverside.edu",
      channel: "EMAIL",
      role: "STUDENT",
      organizationIndex: 0,
      status: "PENDING",
      invitedDaysAgo: 1,
      expiresInDays: 6,
    },
    {
      recipient: "riv20264001",
      channel: "USERNAME",
      role: "STUDENT",
      organizationIndex: 0,
      status: "PENDING",
      invitedDaysAgo: 4,
      expiresInDays: 3,
    },
    {
      recipient: "faculty@greenwood.edu",
      channel: "EMAIL",
      role: "TEACHER",
      organizationIndex: 1,
      status: "ACCEPTED",
      invitedDaysAgo: 18,
      expiresInDays: -4,
    },
    {
      recipient: "admin.ops@brightpath.edu",
      channel: "EMAIL",
      role: "ORGANIZATION_ADMIN",
      organizationIndex: 2,
      status: "PENDING",
      invitedDaysAgo: 3,
      expiresInDays: 4,
    },
    {
      recipient: "bp20262201",
      channel: "USERNAME",
      role: "STUDENT",
      organizationIndex: 2,
      status: "EXPIRED",
      invitedDaysAgo: 30,
      expiresInDays: -16,
    },
    {
      recipient: "mentor@horizon.edu",
      channel: "EMAIL",
      role: "TEACHER",
      organizationIndex: 4,
      status: "PENDING",
      invitedDaysAgo: 0.5,
      expiresInDays: 6.5,
    },
    {
      recipient: "old.teacher@nova.edu",
      channel: "EMAIL",
      role: "TEACHER",
      organizationIndex: 3,
      status: "REVOKED",
      invitedDaysAgo: 25,
      expiresInDays: -11,
    },
    {
      recipient: "student.rahul@greenwood.edu",
      channel: "EMAIL",
      role: "STUDENT",
      organizationIndex: 1,
      status: "ACCEPTED",
      invitedDaysAgo: 12,
      expiresInDays: -2,
    },
    {
      recipient: "new.admin@horizon.edu",
      channel: "EMAIL",
      role: "ORGANIZATION_ADMIN",
      organizationIndex: 4,
      status: "EXPIRED",
      invitedDaysAgo: 21,
      expiresInDays: -7,
    },
    {
      recipient: "teacher.maths@brightpath.edu",
      channel: "EMAIL",
      role: "TEACHER",
      organizationIndex: 2,
      status: "ACCEPTED",
      invitedDaysAgo: 9,
      expiresInDays: 0,
    },
    {
      recipient: "student.dev@riverside.edu",
      channel: "EMAIL",
      role: "STUDENT",
      organizationIndex: 0,
      status: "REVOKED",
      invitedDaysAgo: 14,
      expiresInDays: -5,
    },
  ];

  invitationSeeds.forEach((seed, index) => {
    const organization = orgByIndex(seed.organizationIndex);
    const invitedAt = daysFromNow(-seed.invitedDaysAgo, now);
    invitations.push({
      id: id(),
      publicId: `INV-${year}-${String(index + 1).padStart(4, "0")}`,
      recipient: seed.recipient,
      channel: seed.channel,
      role: seed.role,
      organizationId: organization.id,
      organizationName: organization.name,
      status: seed.status,
      invitedAt,
      expiresAt: daysFromNow(seed.expiresInDays, now),
      lastSentAt: invitedAt,
    });
  });

  const platformAdminId = must(users[0], "platform admin").id;
  const auditSeeds: Array<{
    action: AuditAction;
    entityType: AuditLog["entityType"];
    entityLabel: string;
    entityId: string;
    organizationIndex: number | null;
    daysAgo: number;
    metadata?: Record<string, string | number | boolean>;
  }> = [
    {
      action: "COURSE_ALLOCATED",
      entityType: "ALLOCATION",
      entityLabel: "Python Web Foundations · Horizon Global School",
      entityId: allocations[0]?.id ?? "",
      organizationIndex: 4,
      daysAgo: 0.2,
      metadata: { scope: "CLASS" },
    },
    {
      action: "INVITATION_RESENT",
      entityType: "INVITATION",
      entityLabel: "teacher.new@riverside.edu",
      entityId: invitations[0]?.id ?? "",
      organizationIndex: 0,
      daysAgo: 0.6,
    },
    {
      action: "STUDENT_ASSIGNED",
      entityType: "SECTION",
      entityLabel: "Section A · Class 8",
      entityId: sections[0]?.id ?? "",
      organizationIndex: 0,
      daysAgo: 1.1,
      metadata: { students: 3 },
    },
    {
      action: "USER_CREATED",
      entityType: "USER",
      entityLabel: "Nisha Bansal",
      entityId: users[4]?.id ?? "",
      organizationIndex: 0,
      daysAgo: 1.4,
    },
    {
      action: "CLASS_CREATED",
      entityType: "CLASS",
      entityLabel: "Class 11 · Horizon Global School",
      entityId: classes[0]?.id ?? "",
      organizationIndex: 4,
      daysAgo: 2.2,
    },
    {
      action: "SECTION_CREATED",
      entityType: "SECTION",
      entityLabel: "Section B · Class 9",
      entityId: sections[1]?.id ?? "",
      organizationIndex: 1,
      daysAgo: 2.8,
    },
    {
      action: "COURSE_UPDATED",
      entityType: "COURSE",
      entityLabel: "Python Data Structures",
      entityId: courses[3]?.id ?? "",
      organizationIndex: null,
      daysAgo: 3.5,
      metadata: { version: 4 },
    },
    {
      action: "USER_DEACTIVATED",
      entityType: "USER",
      entityLabel: "Former faculty · Nova Skills",
      entityId: users[10]?.id ?? "",
      organizationIndex: 3,
      daysAgo: 4.1,
    },
    {
      action: "INVITATION_CREATED",
      entityType: "INVITATION",
      entityLabel: "mentor@horizon.edu",
      entityId: invitations[6]?.id ?? "",
      organizationIndex: 4,
      daysAgo: 5.0,
    },
    {
      action: "ORGANIZATION_UPDATED",
      entityType: "ORGANIZATION",
      entityLabel: "BrightPath Coaching Institute",
      entityId: organizations[2]?.id ?? "",
      organizationIndex: 2,
      daysAgo: 5.6,
    },
    {
      action: "COURSE_ALLOCATION_REVOKED",
      entityType: "ALLOCATION",
      entityLabel: "Class 10 Java Basics",
      entityId: allocations[11]?.id ?? "",
      organizationIndex: 0,
      daysAgo: 6.3,
    },
    {
      action: "TEACHER_ASSIGNED",
      entityType: "SECTION",
      entityLabel: "Section A · Class 10",
      entityId: sections[8]?.id ?? "",
      organizationIndex: 2,
      daysAgo: 7.0,
    },
    {
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityLabel: "Horizon Global School",
      entityId: organizations[4]?.id ?? "",
      organizationIndex: 4,
      daysAgo: 7.5,
    },
    {
      action: "INVITATION_CREATED",
      entityType: "INVITATION",
      entityLabel: "admin.ops@brightpath.edu",
      entityId: invitations[4]?.id ?? "",
      organizationIndex: 2,
      daysAgo: 8.2,
    },
    {
      action: "COURSE_ACTIVATED",
      entityType: "COURSE",
      entityLabel: "Object-Oriented Java",
      entityId: courses[4]?.id ?? "",
      organizationIndex: null,
      daysAgo: 9.0,
    },
    {
      action: "USER_CREATED",
      entityType: "USER",
      entityLabel: "Imported cohort · Greenwood College",
      entityId: users[20]?.id ?? "",
      organizationIndex: 1,
      daysAgo: 10.4,
      metadata: { imported: 24 },
    },
    {
      action: "ORGANIZATION_DEACTIVATED",
      entityType: "ORGANIZATION",
      entityLabel: "Nova Skills Training Institute",
      entityId: organizations[3]?.id ?? "",
      organizationIndex: 3,
      daysAgo: 11.2,
    },
    {
      action: "CLASS_UPDATED",
      entityType: "CLASS",
      entityLabel: "Class 9 · Greenfield College",
      entityId: classes[3]?.id ?? "",
      organizationIndex: 1,
      daysAgo: 12.6,
    },
    {
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityLabel: "BrightPath Coaching Institute",
      entityId: organizations[2]?.id ?? "",
      organizationIndex: 2,
      daysAgo: 14.0,
    },
    {
      action: "STUDENT_REMOVED",
      entityType: "SECTION",
      entityLabel: "Section B · Class 7",
      entityId: sections[3]?.id ?? "",
      organizationIndex: 0,
      daysAgo: 15.5,
      metadata: { students: 1 },
    },
    {
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityLabel: "Greenwood College",
      entityId: organizations[1]?.id ?? "",
      organizationIndex: 1,
      daysAgo: 17.0,
    },
    {
      action: "INVITATION_REVOKED",
      entityType: "INVITATION",
      entityLabel: "old.teacher@nova.edu",
      entityId: invitations[7]?.id ?? "",
      organizationIndex: 3,
      daysAgo: 19.0,
    },
    {
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityLabel: "Nova Skills Training Institute",
      entityId: organizations[3]?.id ?? "",
      organizationIndex: 3,
      daysAgo: 21.0,
    },
    {
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityLabel: "Riverside Public School",
      entityId: organizations[0]?.id ?? "",
      organizationIndex: 0,
      daysAgo: 24.0,
    },
  ];

  auditSeeds.forEach((seed, index) => {
    const organization =
      seed.organizationIndex === null ? null : organizations[seed.organizationIndex];
    auditLogs.push({
      id: id(),
      actorId: platformAdminId,
      actorName: `${PLATFORM_ADMIN.firstName} ${PLATFORM_ADMIN.lastName}`,
      action: seed.action,
      entityType: seed.entityType,
      entityId: seed.entityId,
      entityLabel: seed.entityLabel,
      organizationId: organization?.id ?? null,
      organizationName: organization?.name ?? null,
      status: "SUCCESS",
      metadata: seed.metadata ?? {},
      correlationId: `seed-cor-${String(index + 1).padStart(3, "0")}`,
      createdAt: daysFromNow(-seed.daysAgo, now),
    });
  });

  auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const settings: PlatformSettings = {
    platformName: "L_Platform",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    theme: "system",
    notifications: {
      organizationCreated: true,
      invitationAccepted: true,
      allocationExpiring: true,
      weeklyDigest: false,
    },
    adminProfile: {
      firstName: PLATFORM_ADMIN.firstName,
      lastName: PLATFORM_ADMIN.lastName,
      email: PLATFORM_ADMIN.email,
      jobTitle: PLATFORM_ADMIN.jobTitle,
    },
    sessionPreferences: {
      idleTimeoutMinutes: 30,
      requireReauthentication: true,
    },
    updatedAt: now.toISOString(),
  };

  return {
    version: MOCK_DB_VERSION,
    seededAt: now.toISOString(),
    organizations,
    users,
    classes,
    sections,
    sectionStudents,
    sectionTeachers,
    courses,
    allocations,
    invitations,
    auditLogs,
    settings,
    sequences: {
      organizations: organizations.length,
      users: userSequence,
      classes: classes.length,
      sections: sections.length,
      courses: courses.length,
      allocations: allocations.length,
      invitations: invitations.length,
    },
  };
}
