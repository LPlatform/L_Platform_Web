import type { ThemePreference } from "./common";

export interface NotificationPreferences {
  organizationCreated: boolean;
  invitationAccepted: boolean;
  allocationExpiring: boolean;
  weeklyDigest: boolean;
}

export interface PlatformSettings {
  platformName: string;
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  theme: ThemePreference;
  notifications: NotificationPreferences;
  adminProfile: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
  };
  sessionPreferences: {
    idleTimeoutMinutes: number;
    requireReauthentication: boolean;
  };
  updatedAt: string;
}
