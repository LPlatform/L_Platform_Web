import type {
  CsvImportPreview,
  CsvImportResult,
  CsvUserRow,
  EntityStatus,
  PageQuery,
  Paginated,
  User,
  UserInput,
  UserQuery,
  UserRole,
  UserWithOrganization,
} from "@/types";
import type { UserLookupService, UserService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { CsvParseError, parseCsv, recordsFromCsv, requireHeaders } from "../../csv";
import { csvUserRowSchema, userInputSchema, userUpdateSchema } from "../../validation/user";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import { assertOrganization, fullName, recordAudit, toUserWithOrganization } from "../helpers";

function userSortAccessors(user: UserWithOrganization) {
  return {
    name: fullName(user),
    email: user.email ?? user.username ?? "",
    organization: user.organizationName ?? "",
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt ?? "",
  };
}

function assertUniqueIdentity(
  db: MockDatabase,
  email: string | null,
  username: string | null,
  excludeId?: string,
) {
  const normalizedEmail = email?.toLowerCase() ?? null;
  const normalizedUsername = username?.toLowerCase() ?? null;
  const existingEmail = normalizedEmail
    ? db.users.find(
        (user) => user.email?.toLowerCase() === normalizedEmail && user.id !== excludeId,
      )
    : undefined;
  if (existingEmail) {
    throw new ApiError(ERROR_CODES.DUPLICATE, "A user with that email already exists.", {
      fieldErrors: { email: "This email is already registered." },
    });
  }
  const existingUsername = normalizedUsername
    ? db.users.find(
        (user) => user.username?.toLowerCase() === normalizedUsername && user.id !== excludeId,
      )
    : undefined;
  if (existingUsername) {
    throw new ApiError(ERROR_CODES.DUPLICATE, "That username is already taken.", {
      fieldErrors: { username: "This username is already taken." },
    });
  }
}

function buildUserRecord(
  db: MockDatabase,
  input: {
    firstName: string;
    lastName: string;
    email: string | null;
    username: string | null;
    role: UserRole;
    organizationId: string;
    status: EntityStatus;
  },
  timestamp = new Date().toISOString(),
): User {
  return {
    id: createId(),
    publicId: nextPublicId(db, "users", "USR", 5),
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    username: input.username,
    role: input.role,
    organizationId: input.organizationId,
    status: input.status,
    permissions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastActiveAt: null,
  };
}

function applyQuery(
  db: MockDatabase,
  query: UserQuery,
  roleOverride?: UserRole,
): Paginated<UserWithOrganization> {
  const rows = db.users
    .filter((user) => {
      if (roleOverride && user.role !== roleOverride) return false;
      if (query.role && query.role !== "ALL" && user.role !== query.role) return false;
      if (query.status && query.status !== "ALL" && user.status !== query.status) return false;
      if (
        query.organizationId &&
        query.organizationId !== "ALL" &&
        user.organizationId !== query.organizationId
      ) {
        return false;
      }
      const withOrganization = toUserWithOrganization(db, user);
      return matchesSearch(
        [
          fullName(user),
          user.email,
          user.username,
          user.publicId,
          withOrganization.organizationName,
        ],
        query.search,
      );
    })
    .map((user) => toUserWithOrganization(db, user));

  const sorted = sortByKey(rows, query.sortBy, query.sortDir, userSortAccessors);
  return paginate(sorted, query);
}

function parseImportRows(db: MockDatabase, csvText: string, fileName: string): CsvImportPreview {
  const parsed = parseCsv(csvText);
  requireHeaders(parsed, [
    { key: "firstname", label: "firstName" },
    { key: "lastname", label: "lastName" },
    { key: "role", label: "role" },
  ]);
  const records = recordsFromCsv(parsed);
  const rows: CsvUserRow[] = [];
  const seenEmails = new Set<string>();
  const seenUsernames = new Set<string>();

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const email = record.email?.trim() || undefined;
    const username = record.username?.trim() || undefined;
    const roleValue = (record.role ?? "").trim().toUpperCase();
    const organizationKey = (
      record.organizationid ||
      record.organizationpublicid ||
      record.organization ||
      ""
    ).trim();
    const raw = {
      firstName: record.firstname ?? "",
      lastName: record.lastname ?? "",
      email,
      username,
      role: roleValue,
      organizationPublicId: organizationKey,
    };

    const result = csvUserRowSchema.safeParse(raw);
    const errors: string[] = [];
    if (!result.success) {
      errors.push(...result.error.issues.map((issue) => issue.message));
    }

    const organization = db.organizations.find(
      (item) =>
        item.publicId.toLowerCase() === organizationKey.toLowerCase() ||
        item.slug.toLowerCase() === organizationKey.toLowerCase(),
    );
    if (!organization) {
      errors.push("Organization ID or slug was not found.");
    } else if (organization.status === "INACTIVE") {
      errors.push("Organization is inactive and cannot receive new users.");
    }

    const normalizedEmail = email?.toLowerCase();
    const normalizedUsername = username?.toLowerCase();
    if (normalizedEmail) {
      const exists =
        seenEmails.has(normalizedEmail) ||
        db.users.some((user) => user.email?.toLowerCase() === normalizedEmail);
      if (exists) {
        errors.push("Email already exists or is repeated in this file.");
      }
      seenEmails.add(normalizedEmail);
    }
    if (normalizedUsername) {
      const exists =
        seenUsernames.has(normalizedUsername) ||
        db.users.some((user) => user.username?.toLowerCase() === normalizedUsername);
      if (exists) {
        errors.push("Username already exists or is repeated in this file.");
      }
      seenUsernames.add(normalizedUsername);
    }

    const isDuplicate = errors.some(
      (error) =>
        error.startsWith("Email already exists") || error.startsWith("Username already exists"),
    );
    rows.push({
      row: rowNumber,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email,
      username,
      role: roleValue === "TEACHER" ? "TEACHER" : "STUDENT",
      organizationPublicId: organizationKey,
      errors,
      status: errors.length === 0 ? "VALID" : isDuplicate ? "DUPLICATE" : "INVALID",
    });
  });

  return {
    fileName,
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((row) => row.status === "VALID").length,
      invalid: rows.filter((row) => row.status === "INVALID").length,
      duplicate: rows.filter((row) => row.status === "DUPLICATE").length,
    },
  };
}

export const userService: UserService = {
  async list(query: UserQuery = {}): Promise<Paginated<UserWithOrganization>> {
    return mockRequest("loading users", () => applyQuery(getDb(), query));
  },

  async getById(userId: string): Promise<UserWithOrganization> {
    return mockRequest("loading the user", () => {
      const db = getDb();
      const user = db.users.find((item) => item.id === userId);
      if (!user) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "User was not found.", { status: 404 });
      }
      return toUserWithOrganization(db, user);
    });
  },

  async create(input: UserInput): Promise<User> {
    return mockRequest("creating the user", () => {
      const values = validateInput(userInputSchema, input);
      if (values.role === "PLATFORM_ADMIN") {
        throw new ApiError(
          ERROR_CODES.VALIDATION_FAILED,
          "Platform administrators must be managed through administrator settings.",
          { fieldErrors: { role: "Platform administrators cannot be created here." } },
        );
      }
      return mutateDb((db) => {
        if (!values.organizationId) {
          throw new ApiError(ERROR_CODES.VALIDATION_FAILED, "Select an organization.", {
            fieldErrors: { organizationId: "Select an organization." },
          });
        }
        const organization = assertOrganization(db, values.organizationId);
        if (organization.status === "INACTIVE") {
          throw new ApiError(
            ERROR_CODES.ORGANIZATION_INACTIVE,
            "Users cannot be added to an inactive organization.",
            { status: 409 },
          );
        }
        assertUniqueIdentity(db, values.email, values.username ?? null);
        const user = buildUserRecord(db, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          username: values.username || null,
          role: values.role,
          organizationId: organization.id,
          status: values.status,
        });
        db.users.push(user);
        recordAudit(db, {
          action: "USER_CREATED",
          entityType: "USER",
          entityId: user.id,
          entityLabel: fullName(user),
          organizationId: organization.id,
          metadata: { role: user.role },
        });
        return user;
      });
    });
  },

  async update(userId: string, input: Omit<UserInput, "role">): Promise<User> {
    return mockRequest("updating the user", () => {
      const values = validateInput(userUpdateSchema, input);
      return mutateDb((db) => {
        const user = db.users.find((item) => item.id === userId);
        if (!user) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "User was not found.", { status: 404 });
        }
        if (!values.organizationId) {
          throw new ApiError(ERROR_CODES.VALIDATION_FAILED, "Select an organization.");
        }
        const organization = assertOrganization(db, values.organizationId);
        if (
          user.organizationId !== organization.id &&
          user.role === "STUDENT" &&
          db.sectionStudents.some((record) => record.studentId === user.id)
        ) {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            "Remove this student from their sections before moving them to another organization.",
            { status: 409 },
          );
        }
        if (
          user.organizationId !== organization.id &&
          user.role === "TEACHER" &&
          db.sectionTeachers.some((record) => record.teacherId === user.id)
        ) {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            "Remove this teacher from their sections before moving them to another organization.",
            { status: 409 },
          );
        }
        assertUniqueIdentity(db, values.email, values.username ?? null, userId);
        Object.assign(user, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          username: values.username || null,
          organizationId: organization.id,
          status: values.status,
          updatedAt: new Date().toISOString(),
        });
        recordAudit(db, {
          action: "USER_UPDATED",
          entityType: "USER",
          entityId: user.id,
          entityLabel: fullName(user),
          organizationId: user.organizationId,
          metadata: { role: user.role },
        });
        return user;
      });
    });
  },

  async setStatus(userId: string, status: EntityStatus): Promise<User> {
    return mockRequest(`${status === "ACTIVE" ? "activating" : "deactivating"} the user`, () =>
      mutateDb((db) => {
        const user = db.users.find((item) => item.id === userId);
        if (!user) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "User was not found.", { status: 404 });
        }
        if (user.id === readActorId() && status === "INACTIVE") {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            "You cannot deactivate the account you are currently using.",
            { status: 409 },
          );
        }
        user.status = status;
        user.updatedAt = new Date().toISOString();
        recordAudit(db, {
          action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entityType: "USER",
          entityId: user.id,
          entityLabel: fullName(user),
          organizationId: user.organizationId,
          metadata: { role: user.role },
        });
        return user;
      }),
    );
  },

  async importPreview(fileName: string, csvText: string): Promise<CsvImportPreview> {
    return mockRequest("validating the CSV import", () => {
      try {
        return parseImportRows(getDb(), csvText, fileName);
      } catch (error) {
        if (error instanceof CsvParseError) {
          throw new ApiError(ERROR_CODES.VALIDATION_FAILED, error.message, { status: 422 });
        }
        throw error;
      }
    });
  },

  async importConfirm(preview: CsvImportPreview): Promise<CsvImportResult> {
    return mockRequest("importing users", () => {
      if (preview.rows.length === 0) {
        throw new ApiError(ERROR_CODES.VALIDATION_FAILED, "There are no rows to import.");
      }
      return mutateDb((db) => {
        const created: User[] = [];
        let skipped = 0;
        const seenEmails = new Set<string>();
        const seenUsernames = new Set<string>();

        for (const row of preview.rows) {
          if (row.status !== "VALID") {
            skipped += 1;
            continue;
          }
          const result = csvUserRowSchema.safeParse({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            username: row.username,
            role: row.role,
            organizationPublicId: row.organizationPublicId,
          });
          if (!result.success) {
            skipped += 1;
            continue;
          }
          const organization = db.organizations.find(
            (item) =>
              item.publicId.toLowerCase() === row.organizationPublicId.toLowerCase() ||
              item.slug.toLowerCase() === row.organizationPublicId.toLowerCase(),
          );
          if (!organization || organization.status === "INACTIVE") {
            skipped += 1;
            continue;
          }
          const email = row.email?.toLowerCase() ?? null;
          const username = row.username?.toLowerCase() ?? null;
          const duplicate =
            (email !== null &&
              (seenEmails.has(email) ||
                db.users.some((user) => user.email?.toLowerCase() === email))) ||
            (username !== null &&
              (seenUsernames.has(username) ||
                db.users.some((user) => user.username?.toLowerCase() === username)));
          if (duplicate) {
            skipped += 1;
            continue;
          }
          if (email) seenEmails.add(email);
          if (username) seenUsernames.add(username);
          const user = buildUserRecord(db, {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email ?? null,
            username: row.username ?? null,
            role: row.role,
            organizationId: organization.id,
            status: "ACTIVE",
          });
          db.users.push(user);
          created.push(user);
        }

        if (created.length > 0) {
          recordAudit(db, {
            action: "USERS_IMPORTED",
            entityType: "USER",
            entityId: created[0]?.id ?? "batch",
            entityLabel: `${created.length} users imported`,
            organizationId: created[0]?.organizationId ?? null,
            metadata: { imported: created.length, skipped, fileName: preview.fileName },
          });
        }

        return { imported: created.length, skipped, users: created };
      });
    });
  },
};

function readActorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lplatform.mock.session");
    if (!raw) return null;
    return (JSON.parse(raw) as { userId?: string }).userId ?? null;
  } catch {
    return null;
  }
}

export const userLookupService: UserLookupService = {
  async listEligibleStudents(query: UserQuery = {}) {
    return mockRequest("loading eligible students", () =>
      applyQuery(getDb(), { ...query, role: "STUDENT", status: "ACTIVE" }),
    );
  },

  async listEligibleTeachers(query: UserQuery = {}) {
    return mockRequest("loading eligible teachers", () =>
      applyQuery(getDb(), { ...query, role: "TEACHER", status: "ACTIVE" }),
    );
  },

  async listByOrganization(organizationId: string, role: UserRole, query: PageQuery = {}) {
    return mockRequest("loading organization members", () =>
      applyQuery(getDb(), { ...query, organizationId, role }),
    );
  },
};
