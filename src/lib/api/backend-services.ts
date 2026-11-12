import { API_BASE as API_BASE_URL } from "@/lib/api/base";
import { normalizeHeader, parseCsv } from "../csv";
import type { PlatformServices } from "./contracts";
import { ApiError } from "./errors";

/* eslint-disable @typescript-eslint/no-explicit-any -- Backend responses currently lack generated OpenAPI types; this file is the single transport boundary and its public contract is PlatformServices. */

const apiBase = API_BASE_URL;

function queryString(input?: object): string {
  if (!input) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      value.code || "BACKEND_ERROR",
      value.message || `Backend returned ${response.status}`,
      {
        status: response.status,
      },
    );
  }
  return value as T;
}

const encoded = encodeURIComponent;
const page = <T>(value: any) =>
  ({
    items: value.items ?? [],
    meta: {
      page: value.meta?.page ?? value.page ?? 1,
      pageSize: value.meta?.pageSize ?? value.pageSize ?? value.items?.length ?? 0,
      total: value.meta?.total ?? value.total ?? 0,
      totalPages: value.meta?.totalPages ?? value.totalPages ?? 0,
    },
  }) as T;

function normalizeInvitation(value: any) {
  return {
    ...value,
    publicId: value.publicId ?? value.id?.toUpperCase(),
    recipient: value.recipient ?? value.email,
    channel: value.channel ?? "EMAIL",
    organizationName: value.organizationName ?? null,
    invitedAt: value.invitedAt ?? value.createdAt,
    lastSentAt: value.lastSentAt ?? value.createdAt,
  };
}

// This adapter deliberately has no mock fallback: missing endpoints surface as errors.
export const services = {
  organizations: {
    list: async (q?: any) => page(await api<any>(`/api/organizations${queryString(q)}`)),
    getById: (id: string) => api<any>(`/api/organizations/${encoded(id)}`),
    listOptions: () => api<any>("/api/organizations/options"),
    create: (input: any) => api<any>("/api/organizations", "POST", input),
    update: (id: string, input: any) =>
      api<any>(`/api/organizations/${encoded(id)}`, "PATCH", input),
    setStatus: (id: string, status: string) =>
      api<any>(`/api/organizations/${encoded(id)}/status`, "PATCH", { status }),
  },
  users: {
    list: async (q?: any) => page(await api<any>(`/api/users${queryString(q)}`)),
    getById: (id: string) => api<any>(`/api/users/${encoded(id)}`),
    create: (input: any) => api<any>("/api/users", "POST", input),
    update: (id: string, input: any) => api<any>(`/api/users/${encoded(id)}`, "PATCH", input),
    setStatus: (id: string, status: string) =>
      api<any>(`/api/users/${encoded(id)}/status`, "PATCH", { status }),
    importPreview: async (fileName: string, csvText: string) => {
      const parsedMeta = new Map<number, { username?: string; organizationPublicId?: string }>();
      try {
        const parsed = parseCsv(csvText);
        const normHeaders = parsed.headers.map(normalizeHeader);
        const userIdx = normHeaders.indexOf("username");
        const orgIdx = normHeaders.findIndex(
          (h) => h === "organizationpublicid" || h === "organizationid",
        );
        parsed.rows.forEach((cells, idx) => {
          parsedMeta.set(idx + 1, {
            username: userIdx >= 0 ? cells[userIdx] || undefined : undefined,
            organizationPublicId: orgIdx >= 0 ? cells[orgIdx] || "" : "",
          });
        });
      } catch {
        // Defer malformed CSV details to backend validator.
      }

      const res = await api<any>("/api/users/import/preview", "POST", { fileName, csvText });
      return {
        fileName: res.fileName ?? fileName,
        rows: (res.rows ?? []).map((row: any, idx: number) => {
          const rowNum = Number(row.rowNumber ?? idx + 1);
          const meta = parsedMeta.get(rowNum);
          return {
            row: rowNum,
            firstName: row.firstName ?? "",
            lastName: row.lastName ?? "",
            email: row.email || undefined,
            username: meta?.username,
            role: row.role === "TEACHER" ? "TEACHER" : "STUDENT",
            organizationPublicId: meta?.organizationPublicId ?? "",
            errors: Array.isArray(row.errors) ? row.errors : [],
            status: row.isValid ? "VALID" : "INVALID",
          };
        }),
        summary: {
          total: Number(res.totalRows ?? 0),
          valid: Number(res.validRows ?? 0),
          invalid: Number(res.invalidRows ?? 0),
          duplicate: 0,
        },
      };
    },
    importConfirm: async (preview: any) => {
      const publicId = preview?.rows?.find(
        (r: any) => r.status === "VALID" && r.organizationPublicId,
      )?.organizationPublicId;
      let organizationId: string | undefined;
      if (publicId) {
        const orgOptions = await api<any[]>("/api/organizations/options").catch(() => []);
        const match = (Array.isArray(orgOptions) ? orgOptions : []).find(
          (o) =>
            o.id === publicId ||
            String(o.publicId ?? "").toUpperCase() === String(publicId).toUpperCase(),
        );
        if (match?.id) organizationId = match.id;
      }

      const res = await api<any>("/api/users/import/confirm", "POST", {
        ...(organizationId ? { organizationId } : {}),
        rows: (preview?.rows ?? []).map((r: any) => ({
          email: r.email ?? "",
          firstName: r.firstName,
          lastName: r.lastName,
          role: r.role,
          isValid: r.status === "VALID",
        })),
      });
      return {
        imported: Number(res.imported ?? 0),
        skipped: Number(res.skipped ?? 0),
        users: res.created ?? [],
      };
    },
  },
  administrators: {
    list: async (q?: any) =>
      page(
        await api<any>(
          `/api/users${queryString({ ...q, role: q?.role && q.role !== "ALL" ? q.role : "ORGANIZATION_ADMIN" })}`,
        ),
      ),
    getById: (id: string) => api<any>(`/api/users/${encoded(id)}`),
    create: (input: any) =>
      api<any>("/api/users", "POST", { ...input, role: input.role ?? "ORGANIZATION_ADMIN" }),
    update: (id: string, input: any) => api<any>(`/api/users/${encoded(id)}`, "PATCH", input),
    setStatus: (id: string, status: string) =>
      api<any>(`/api/users/${encoded(id)}/status`, "PATCH", { status }),
    listPermissions: async () => api<any>("/api/platform/roles"),
  },
  classes: {
    list: async (q?: any) => page(await api<any>(`/api/classes${queryString(q)}`)),
    getById: (id: string) => api<any>(`/api/classes/${encoded(id)}`),
    listOptions: async (organizationId: string) =>
      (await api<any>(`/api/classes/options${queryString({ organizationId })}`)).items ?? [],
    create: (input: any) => api<any>("/api/classes", "POST", input),
    update: (id: string, input: any) => api<any>(`/api/classes/${encoded(id)}`, "PATCH", input),
    setStatus: (id: string, status: string) =>
      api<any>(`/api/classes/${encoded(id)}/status`, "PATCH", { status }),
  },
  sections: {
    list: async (q?: any) => page(await api<any>(`/api/sections${queryString(q)}`)),
    getById: (id: string) => api<any>(`/api/sections/${encoded(id)}`),
    getRoster: (id: string) => api<any>(`/api/sections/${encoded(id)}/roster`),
    create: (classId: string, input: any) =>
      api<any>("/api/sections", "POST", { ...input, classId }),
    update: (id: string, input: any) => api<any>(`/api/sections/${encoded(id)}`, "PATCH", input),
    setStatus: (id: string, status: string) =>
      api<any>(`/api/sections/${encoded(id)}/status`, "PATCH", { status }),
    assignStudents: (id: string, studentIds: string[]) =>
      api<any>(`/api/sections/${encoded(id)}/students`, "POST", { studentIds }),
    removeStudent: async (id: string, studentId: string) => {
      await api(`/api/sections/${encoded(id)}/students/${encoded(studentId)}`, "DELETE");
    },
    assignTeachers: (id: string, teacherIds: string[]) =>
      api<any>(`/api/sections/${encoded(id)}/teachers`, "POST", { teacherIds }),
    removeTeacher: async (id: string, teacherId: string) => {
      await api(`/api/sections/${encoded(id)}/teachers/${encoded(teacherId)}`, "DELETE");
    },
    bulkAssignStudents: (id: string, csvText: string, organizationId: string) =>
      api<any>(`/api/sections/${encoded(id)}/students/bulk`, "POST", {
        csvText,
        organizationId,
      }),
  },
  courses: {
    list: async (q?: any) => page(await api<any>(`/api/courses${queryString(q)}`)),
    getById: (id: string) => api<any>(`/api/courses/${encoded(id)}`),
    listOptions: () => api<any>("/api/courses/options"),
    create: (input: any) => api<any>("/api/courses", "POST", input),
    update: (id: string, input: any) => api<any>(`/api/courses/${encoded(id)}`, "PATCH", input),
    setStatus: (id: string, status: string) =>
      api<any>(`/api/courses/${encoded(id)}/status`, "PATCH", { status }),
  },
  allocations: {
    list: async (q?: any) => page(await api<any>(`/api/allocations${queryString(q)}`)),
    getById: (id: string) => api<any>(`/api/allocations/${encoded(id)}`),
    create: (input: any) => api<any>("/api/allocations", "POST", input),
    update: (id: string, input: any) => api<any>(`/api/allocations/${encoded(id)}`, "PATCH", input),
    revoke: (id: string) => api<any>(`/api/allocations/${encoded(id)}/revoke`, "PATCH", {}),
  },
  invitations: {
    list: async (q?: any) => {
      const result = await api<any>(`/api/invitations${queryString(q)}`);
      return page({ ...result, items: (result.items ?? []).map(normalizeInvitation) });
    },
    create: async (input: any) =>
      normalizeInvitation(
        await api<any>("/api/invitations", "POST", {
          recipient: input.recipient,
          channel: input.channel,
          role: input.role,
          organizationId: input.organizationId,
        }),
      ),
    resend: async (id: string) =>
      normalizeInvitation(await api<any>(`/api/invitations/${encoded(id)}/resend`, "POST", {})),
    revoke: async (id: string) =>
      normalizeInvitation(await api<any>(`/api/invitations/${encoded(id)}/revoke`, "PATCH", {})),
  },
  audit: {
    list: async (q?: any) => page(await api<any>(`/api/audit-logs${queryString(q)}`)),
  },
  reports: {
    list: () => api<any>("/api/reports"),
    getById: (id: string) => api<any>(`/api/reports/${encoded(id)}`),
    getOnboardingSeries: () => api<any>("/api/reports/onboarding-series"),
  },
  dashboard: {
    getSummary: () => api<any>("/api/dashboard/summary"),
    getStudentGrowth: () => api<any>("/api/dashboard/student-growth"),
    getOrganizationDistribution: () => api<any>("/api/dashboard/organization-distribution"),
    getRecentOrganizations: async (limit = 5) =>
      (await api<any>(`/api/organizations${queryString({ page: 1, pageSize: limit })}`)).items ??
      [],
    getRecentInvitations: async (limit = 5) =>
      (await api<any>(`/api/invitations${queryString({ page: 1, pageSize: limit })}`)).items ?? [],
    getRecentActivity: async (limit = 5) => {
      const result = await api<any>(`/api/dashboard/recent-activity${queryString({ limit })}`);
      return Array.isArray(result) ? result.slice(0, limit) : (result.items ?? []);
    },
  },
  settings: {
    get: () => api<any>("/api/settings"),
    update: (input: any) => api<any>("/api/settings", "PATCH", input),
    resetDemoData: async () => api<any>("/api/settings/reset-demo", "POST", {}),
  },
  lookups: {
    listEligibleStudents: async (q?: any) =>
      page(await api<any>(`/api/users${queryString({ ...q, role: "STUDENT", status: "ACTIVE" })}`)),
    listEligibleTeachers: async (q?: any) =>
      page(await api<any>(`/api/users${queryString({ ...q, role: "TEACHER", status: "ACTIVE" })}`)),
    listByOrganization: async (organizationId: string, role: string, q?: any) =>
      page(await api<any>(`/api/users${queryString({ ...q, organizationId, role })}`)),
  },
} as unknown as PlatformServices;
