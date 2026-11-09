import type {
  EntityStatus,
  PlatformPermission,
  User,
  UserInput,
  UserQuery,
  UserWithOrganization,
} from "@/types";
import type { AdministratorService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { userService } from "./users.service";

const PERMISSIONS: PlatformPermission[] = [
  {
    id: "users.manage",
    label: "Manage organization users",
    description: "Invite, edit, activate and deactivate users in the organization.",
  },
  {
    id: "classes.manage",
    label: "Manage classes",
    description: "Create and edit academic classes for the organization.",
  },
  {
    id: "sections.manage",
    label: "Manage sections",
    description: "Create sections and assign students or teachers.",
  },
  {
    id: "courses.view",
    label: "View organization courses",
    description: "View courses allocated to the organization.",
  },
  {
    id: "allocations.manage",
    label: "Manage course allocations",
    description: "Allocate or revoke courses for permitted classes and sections.",
  },
  {
    id: "reports.view",
    label: "View organization reports",
    description: "View reporting data scoped to the organization.",
  },
];

async function getAdministrator(administratorId: string): Promise<UserWithOrganization> {
  const user = await userService.getById(administratorId);
  if (user.role !== "ORGANIZATION_ADMIN" && user.role !== "PLATFORM_ADMIN") {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Administrator was not found.", { status: 404 });
  }
  return user;
}

export const administratorService: AdministratorService = {
  async list(query: UserQuery = {}) {
    return mockRequest("loading administrators", () =>
      userService.list({
        ...query,
        role: query.role && query.role !== "ALL" ? query.role : "ORGANIZATION_ADMIN",
      }),
    );
  },

  async getById(administratorId: string) {
    return mockRequest("loading the administrator", () => getAdministrator(administratorId));
  },

  async create(input: UserInput): Promise<User> {
    return mockRequest("creating the administrator", () =>
      userService.create({ ...input, role: "ORGANIZATION_ADMIN" }),
    );
  },

  async update(administratorId: string, input: Omit<UserInput, "role">): Promise<User> {
    return mockRequest("updating the administrator", async () => {
      const existing = await getAdministrator(administratorId);
      if (existing.role === "PLATFORM_ADMIN") {
        throw new ApiError(
          ERROR_CODES.CONFLICT,
          "Platform administrator accounts cannot be edited from organization administration.",
          { status: 409 },
        );
      }
      return userService.update(administratorId, input);
    });
  },

  async setStatus(administratorId: string, status: EntityStatus): Promise<User> {
    return mockRequest("updating the administrator status", async () => {
      const existing = await getAdministrator(administratorId);
      if (existing.role === "PLATFORM_ADMIN") {
        throw new ApiError(
          ERROR_CODES.CONFLICT,
          "Platform administrator accounts cannot be deactivated here.",
          { status: 409 },
        );
      }
      return userService.setStatus(administratorId, status);
    });
  },

  async listPermissions(): Promise<PlatformPermission[]> {
    return mockRequest("loading permission definitions", () => PERMISSIONS);
  },
};
