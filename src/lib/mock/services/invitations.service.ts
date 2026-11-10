import type {
  Invitation,
  InvitationInput,
  InvitationQuery,
  InvitationStatus,
  Paginated,
} from "@/types";
import type { InvitationService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { ApiError, ERROR_CODES } from "../../api/errors";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { validateInput } from "../../api/validate";
import { invitationInputSchema } from "../../validation/invitation";
import { createId, getDb, mutateDb, nextPublicId, type MockDatabase } from "../db";
import { assertOrganization, organizationName, recordAudit } from "../helpers";

export function effectiveInvitationStatus(invitation: Invitation): InvitationStatus {
  if (invitation.status === "PENDING" && new Date(invitation.expiresAt).getTime() < Date.now()) {
    return "EXPIRED";
  }
  return invitation.status;
}

function withEffectiveStatus(db: MockDatabase, invitation: Invitation): Invitation {
  return {
    ...invitation,
    status: effectiveInvitationStatus(invitation),
    organizationName:
      invitation.organizationName ?? organizationName(db, invitation.organizationId),
  };
}

function accessors(invitation: Invitation) {
  return {
    recipient: invitation.recipient,
    role: invitation.role,
    organization: invitation.organizationName ?? "",
    status: invitation.status,
    invitedAt: invitation.invitedAt,
    expiresAt: invitation.expiresAt,
  };
}

function buildQuery(db: MockDatabase, query: InvitationQuery): Paginated<Invitation> {
  const rows = db.invitations
    .map((invitation) => withEffectiveStatus(db, invitation))
    .filter((invitation) => {
      if (query.status && query.status !== "ALL" && invitation.status !== query.status)
        return false;
      if (query.role && query.role !== "ALL" && invitation.role !== query.role) return false;
      if (
        query.organizationId &&
        query.organizationId !== "ALL" &&
        invitation.organizationId !== query.organizationId
      ) {
        return false;
      }
      return matchesSearch(
        [invitation.recipient, invitation.organizationName, invitation.publicId],
        query.search,
      );
    });
  const sorted = sortByKey(rows, query.sortBy ?? "invitedAt", query.sortDir ?? "desc", accessors);
  return paginate(sorted, query);
}

export const invitationService: InvitationService = {
  async list(query: InvitationQuery = {}): Promise<Paginated<Invitation>> {
    return mockRequest("loading invitations", () => buildQuery(getDb(), query));
  },

  async create(input: InvitationInput): Promise<Invitation> {
    return mockRequest("creating the invitation", () => {
      const values = validateInput(invitationInputSchema, input);
      return mutateDb((db) => {
        const organization = assertOrganization(db, values.organizationId);
        if (organization.status !== "ACTIVE") {
          throw new ApiError(
            ERROR_CODES.ORGANIZATION_INACTIVE,
            "Invitations cannot be sent to an inactive organization.",
            { status: 409 },
          );
        }
        const recipient = values.recipient.toLowerCase();
        const duplicate = db.invitations.find(
          (invitation) =>
            invitation.organizationId === organization.id &&
            invitation.recipient.toLowerCase() === recipient &&
            effectiveInvitationStatus(invitation) === "PENDING",
        );
        if (duplicate) {
          throw new ApiError(
            ERROR_CODES.DUPLICATE,
            "A pending invitation already exists for this recipient.",
            { status: 409, fieldErrors: { recipient: "An invitation is already pending." } },
          );
        }
        const existingUser = db.users.find(
          (user) =>
            user.email?.toLowerCase() === recipient || user.username?.toLowerCase() === recipient,
        );
        if (existingUser && existingUser.organizationId === organization.id) {
          throw new ApiError(
            ERROR_CODES.DUPLICATE,
            "This person is already a member of the organization.",
            {
              status: 409,
              fieldErrors: { recipient: "This user already belongs to the organization." },
            },
          );
        }
        const timestamp = new Date().toISOString();
        const invitation: Invitation = {
          id: createId(),
          publicId: nextPublicId(db, "invitations", "INV"),
          recipient: values.recipient,
          channel: values.channel,
          role: values.role,
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
          metadata: { role: invitation.role, channel: invitation.channel },
        });
        return invitation;
      });
    });
  },

  async resend(invitationId: string): Promise<Invitation> {
    return mockRequest("resending the invitation", () =>
      mutateDb((db) => {
        const invitation = db.invitations.find((item) => item.id === invitationId);
        if (!invitation) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Invitation was not found.", { status: 404 });
        }
        const status = effectiveInvitationStatus(invitation);
        if (status === "ACCEPTED" || status === "REVOKED") {
          throw new ApiError(
            ERROR_CODES.CONFLICT,
            `This invitation is ${status.toLowerCase()} and cannot be resent.`,
            { status: 409 },
          );
        }
        invitation.status = "PENDING";
        invitation.lastSentAt = new Date().toISOString();
        invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        recordAudit(db, {
          action: "INVITATION_RESENT",
          entityType: "INVITATION",
          entityId: invitation.id,
          entityLabel: invitation.recipient,
          organizationId: invitation.organizationId,
        });
        return invitation;
      }),
    );
  },

  async revoke(invitationId: string): Promise<Invitation> {
    return mockRequest("revoking the invitation", () =>
      mutateDb((db) => {
        const invitation = db.invitations.find((item) => item.id === invitationId);
        if (!invitation) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, "Invitation was not found.", { status: 404 });
        }
        const status = effectiveInvitationStatus(invitation);
        if (status === "ACCEPTED") {
          throw new ApiError(ERROR_CODES.CONFLICT, "Accepted invitations cannot be revoked.", {
            status: 409,
          });
        }
        if (status === "REVOKED") {
          throw new ApiError(ERROR_CODES.CONFLICT, "This invitation is already revoked.", {
            status: 409,
          });
        }
        invitation.status = "REVOKED";
        recordAudit(db, {
          action: "INVITATION_REVOKED",
          entityType: "INVITATION",
          entityId: invitation.id,
          entityLabel: invitation.recipient,
          organizationId: invitation.organizationId,
        });
        return invitation;
      }),
    );
  },
};
