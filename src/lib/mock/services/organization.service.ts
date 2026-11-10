import type {
  EntityStatus,
  Invitation,
  Organization,
  OrganizationInput,
  OrganizationQuery,
  OrganizationUpdateInput,
  OrganizationWithStats,
  Paginated,
} from "@/types";
import type { OrganizationService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { organizationInputSchema, organizationUpdateSchema } from "../../validation/organization";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import { recordAudit, toOrganizationWithStats } from "../helpers";

function statsAccessors(organization: OrganizationWithStats) {
  return {
    name: organization.name,
    publicId: organization.publicId,
    type: organization.type,
    contactName: organization.contactName,
    email: organization.contactEmail,
    city: organization.city,
    teachers: organization.stats.teacherCount,
    students: organization.stats.studentCount,
    classes: organization.stats.classCount,
    courses: organization.stats.courseCount,
    status: organization.status,
    createdAt: organization.createdAt,
  };
}

function assertUniqueSlug(db: MockDatabase, slug: string, excludeId?: string) {
  const existing = db.organizations.find(
    (organization) => organization.slug === slug && organization.id !== excludeId,
  );
  if (existing) {
    throw new ApiError(ERROR_CODES.DUPLICATE, "That organization slug is already in use.", {
      fieldErrors: { slug: "This slug is already in use." },
    });
  }
}

function assertUniqueContactEmail(db: MockDatabase, email: string, excludeId?: string) {
  const existing = db.organizations.find(
    (organization) =>
      organization.contactEmail.toLowerCase() === email.toLowerCase() &&
      organization.id !== excludeId,
  );
  if (existing) {
    throw new ApiError(
      ERROR_CODES.DUPLICATE,
      "Another organization already uses that contact email.",
      { fieldErrors: { contactEmail: "This email is already registered to an organization." } },
    );
  }
}

export const organizationService: OrganizationService = {
  async list(query: OrganizationQuery = {}): Promise<Paginated<OrganizationWithStats>> {
    return mockRequest("loading organizations", () => {
      const db = getDb();
      const rows = db.organizations
        .filter((organization) => {
          if (query.status && query.status !== "ALL" && organization.status !== query.status) {
            return false;
          }
          if (query.type && query.type !== "ALL" && organization.type !== query.type) return false;
          return matchesSearch(
            [
              organization.name,
              organization.publicId,
              organization.contactName,
              organization.contactEmail,
              organization.city,
              organization.slug,
            ],
            query.search,
          );
        })
        .map((organization) => toOrganizationWithStats(db, organization));

      const sorted = sortByKey(rows, query.sortBy, query.sortDir, statsAccessors);
      return paginate(sorted, query);
    });
  },

  async getById(organizationId: string): Promise<OrganizationWithStats> {
    return mockRequest("loading the organization", () => {
      const db = getDb();
      const organization = db.organizations.find((item) => item.id === organizationId);
      if (!organization) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, "Organization was not found.", { status: 404 });
      }
      return toOrganizationWithStats(db, organization);
    });
  },

  async listOptions(): Promise<Organization[]> {
    return mockRequest("loading organization options", () =>
      getDb()
        .organizations.slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  },

  async create(input: OrganizationInput): Promise<Organization> {
    return mockRequest("creating the organization", () => {
      const values = validateInput(organizationInputSchema, input);
      return mutateDb((db) => {
        assertUniqueSlug(db, values.slug);
        assertUniqueContactEmail(db, values.contactEmail);
        const duplicateName = db.organizations.find(
          (organization) => organization.name.toLowerCase() === values.name.toLowerCase(),
        );
        if (duplicateName) {
          throw new ApiError(
            ERROR_CODES.DUPLICATE,
            "An organization with that name already exists.",
            {
              fieldErrors: { name: "This organization name is already registered." },
            },
          );
        }
        const adminEmail = values.initialAdministratorEmail.toLowerCase();
        const existingUser = db.users.find((user) => user.email?.toLowerCase() === adminEmail);
        if (existingUser) {
          throw new ApiError(
            ERROR_CODES.DUPLICATE,
            "That administrator email already has an account.",
            {
              fieldErrors: {
                initialAdministratorEmail: "A user with this email already exists.",
              },
            },
          );
        }
        const duplicateInvitation = db.invitations.find(
          (invitation) =>
            invitation.recipient.toLowerCase() === adminEmail && invitation.status === "PENDING",
        );
        if (duplicateInvitation) {
          throw new ApiError(
            ERROR_CODES.DUPLICATE,
            "An invitation is already pending for that administrator email.",
            {
              fieldErrors: {
                initialAdministratorEmail: "A pending invitation already exists for this email.",
              },
            },
          );
        }

        const timestamp = new Date().toISOString();
        const organization: Organization = {
          id: createId(),
          publicId: nextPublicId(db, "organizations", "ORG"),
          name: values.name,
          slug: values.slug,
          type: values.type,
          contactName: values.contactName,
          contactEmail: values.contactEmail,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode,
          status: values.status,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.organizations.push(organization);
        recordAudit(db, {
          action: "ORGANIZATION_CREATED",
          entityType: "ORGANIZATION",
          entityId: organization.id,
          entityLabel: organization.name,
          organizationId: organization.id,
          metadata: { type: organization.type, status: organization.status },
        });

        const invitation: Invitation = {
          id: createId(),
          publicId: nextPublicId(db, "invitations", "INV"),
          recipient: values.initialAdministratorEmail,
          channel: "EMAIL",
          role: "ORGANIZATION_ADMIN",
          organizationId: organization.id,
          organizationName: organization.name,
          status: "PENDING",
          invitedAt: timestamp,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastSentAt: timestamp,
        };
        db.invitations.unshift(invitation);
        recordAudit(db, {
          action: "INVITATION_CREATED",
          entityType: "INVITATION",
          entityId: invitation.id,
          entityLabel: invitation.recipient,
          organizationId: organization.id,
          metadata: { role: invitation.role },
        });
        return organization;
      });
    });
  },

  async update(organizationId: string, input: OrganizationUpdateInput): Promise<Organization> {
    return mockRequest("updating the organization", () => {
      const values = validateInput(organizationUpdateSchema, input);
      return mutateDb((db) => {
        const organization = db.organizations.find((item) => item.id === organizationId);
        if (!organization) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Organization was not found.", { status: 404 });
        }
        assertUniqueSlug(db, values.slug, organizationId);
        assertUniqueContactEmail(db, values.contactEmail, organizationId);
        Object.assign(organization, values, { updatedAt: new Date().toISOString() });
        recordAudit(db, {
          action: "ORGANIZATION_UPDATED",
          entityType: "ORGANIZATION",
          entityId: organization.id,
          entityLabel: organization.name,
          organizationId: organization.id,
          metadata: { type: organization.type, status: organization.status },
        });
        return organization;
      });
    });
  },

  async setStatus(organizationId: string, status: EntityStatus): Promise<Organization> {
    return mockRequest(
      `${status === "ACTIVE" ? "activating" : "deactivating"} the organization`,
      () =>
        mutateDb((db) => {
          const organization = db.organizations.find((item) => item.id === organizationId);
          if (!organization) {
            throw new ApiError(ERROR_CODES.NOT_FOUND, "Organization was not found.", {
              status: 404,
            });
          }
          if (organization.status === status) return organization;
          organization.status = status;
          organization.updatedAt = new Date().toISOString();
          recordAudit(db, {
            action: status === "ACTIVE" ? "ORGANIZATION_ACTIVATED" : "ORGANIZATION_DEACTIVATED",
            entityType: "ORGANIZATION",
            entityId: organization.id,
            entityLabel: organization.name,
            organizationId: organization.id,
          });
          return organization;
        }),
    );
  },
};
