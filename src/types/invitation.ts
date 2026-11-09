import type { PageQuery } from "./common";
import type { UserRole } from "./user";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type InvitationChannel = "EMAIL" | "USERNAME";

export interface Invitation {
  id: string;
  publicId: string;
  recipient: string;
  channel: InvitationChannel;
  role: Extract<UserRole, "ORGANIZATION_ADMIN" | "TEACHER" | "STUDENT">;
  organizationId: string | null;
  organizationName: string | null;
  status: InvitationStatus;
  invitedAt: string;
  expiresAt: string;
  lastSentAt: string;
}

export interface InvitationQuery extends PageQuery {
  status?: InvitationStatus | "ALL";
  role?: UserRole | "ALL";
  organizationId?: string | "ALL";
}

export interface InvitationInput {
  recipient: string;
  channel: InvitationChannel;
  role: Extract<UserRole, "ORGANIZATION_ADMIN" | "TEACHER" | "STUDENT">;
  organizationId: string;
}
