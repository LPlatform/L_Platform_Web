import type { ChartPoint, DashboardSummary, Invitation, Organization, AuditLog } from "@/types";
import type { DashboardService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { lastMonthKeys, monthLabel } from "../../dates";
import { getDb } from "../db";
import { effectiveAllocationStatus } from "../helpers";
import { effectiveInvitationStatus } from "./invitations.service";

export const dashboardService: DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return mockRequest("loading dashboard statistics", () => {
      const db = getDb();
      const activeAllocations = db.allocations.filter(
        (allocation) => effectiveAllocationStatus(allocation) === "ACTIVE",
      );
      return {
        totalOrganizations: db.organizations.length,
        activeOrganizations: db.organizations.filter(
          (organization) => organization.status === "ACTIVE",
        ).length,
        totalTeachers: db.users.filter((user) => user.role === "TEACHER").length,
        totalStudents: db.users.filter((user) => user.role === "STUDENT").length,
        totalClasses: db.classes.length,
        totalCourses: db.courses.filter((course) => course.status !== "ARCHIVED").length,
        pendingInvitations: db.invitations.filter(
          (invitation) => effectiveInvitationStatus(invitation) === "PENDING",
        ).length,
        totalAllocations: db.allocations.length,
        activeAllocations: activeAllocations.length,
      };
    });
  },

  async getStudentGrowth(): Promise<ChartPoint[]> {
    return mockRequest("loading student growth", () => {
      const db = getDb();
      const students = db.users.filter((user) => user.role === "STUDENT");
      const teachers = db.users.filter((user) => user.role === "TEACHER");
      const monthEnd = (key: string) => {
        const [year, month] = key.split("-").map(Number);
        return new Date(year ?? 2026, month ?? 1, 0, 23, 59, 59).getTime();
      };
      return lastMonthKeys(9).map((key) => {
        const end = monthEnd(key);
        return {
          label: monthLabel(key),
          value: students.filter((student) => new Date(student.createdAt).getTime() <= end).length,
          secondary: teachers.filter((teacher) => new Date(teacher.createdAt).getTime() <= end)
            .length,
        };
      });
    });
  },

  async getOrganizationDistribution(): Promise<ChartPoint[]> {
    return mockRequest("loading organization distribution", () => {
      const db = getDb();
      const shortName = (organization: Organization) => {
        const words = organization.name.split(" ");
        return words.length > 2 ? `${words[0]} ${words[1]}` : organization.name;
      };
      return db.organizations
        .map((organization) => {
          const members = db.users.filter((user) => user.organizationId === organization.id);
          return {
            label: shortName(organization),
            value: members.filter((user) => user.role === "STUDENT").length,
            secondary: members.filter((user) => user.role === "TEACHER").length,
          };
        })
        .sort((a, b) => b.value - a.value);
    });
  },

  async getRecentOrganizations(limit = 5): Promise<Organization[]> {
    return mockRequest("loading recent organizations", () =>
      getDb()
        .organizations.slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    );
  },

  async getRecentInvitations(limit = 5): Promise<Invitation[]> {
    return mockRequest("loading recent invitations", () =>
      getDb()
        .invitations.map((invitation) => ({
          ...invitation,
          status: effectiveInvitationStatus(invitation),
        }))
        .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))
        .slice(0, limit),
    );
  },

  async getRecentActivity(limit = 8): Promise<AuditLog[]> {
    return mockRequest("loading recent activity", () =>
      getDb()
        .auditLogs.slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    );
  },
};
