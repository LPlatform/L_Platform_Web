import { afterEach, describe, expect, it, vi } from "vitest";
import { backendRequest } from "./client";
import { services } from "./backend-services";

describe("Web API transport & empty-body Content-Type guard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("omits Content-Type header on empty-body GET, PATCH, and DELETE calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await backendRequest("/api/questions");
    await backendRequest("/api/assessments/asmt-1/publish", { method: "PATCH" });
    await backendRequest("/api/sections/sec-1/students/stu-1", { method: "DELETE" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const call of fetchMock.mock.calls) {
      const init = call[1] as RequestInit;
      const headers = new Headers(init.headers);
      expect(headers.has("Content-Type")).toBe(false);
      expect(init.credentials).toBe("include");
    }
  });

  it("sets Content-Type application/json when JSON body is present and handles 204", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "q-1" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const created = await backendRequest<{ id: string }>("/api/questions", {
      method: "POST",
      body: JSON.stringify({ title: "Sample" }),
    });
    expect(created.id).toBe("q-1");

    const postHeaders = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit).headers);
    expect(postHeaders.get("Content-Type")).toBe("application/json");

    const empty = await backendRequest("/api/sections/sec-1/students/stu-1", { method: "DELETE" });
    expect(empty).toBeUndefined();
  });

  it("wires administrators.listPermissions, reports.getOnboardingSeries, and bulkAssignStudents", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: "PLATFORM_OWNER", label: "Platform Owner", description: "Full access" },
          ]),
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ month: "Nov 2026", students: 5, teachers: 2 }]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ assigned: 2, skipped: 0, errors: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const roles = await services.administrators.listPermissions();
    expect(roles).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/platform/roles");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toEqual({});

    const series = await services.reports.getOnboardingSeries();
    expect(series).toHaveLength(1);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/api/reports/onboarding-series");

    const bulk = await services.sections.bulkAssignStudents("sec-1", "email\na@b.edu", "org-1");
    expect(bulk.assigned).toBe(2);
    expect(fetchMock.mock.calls[2]?.[0]).toContain("/api/sections/sec-1/students/bulk");
  });

  it("excludes demo accounts and passwords whenever NODE_ENV is production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS", "true");
    const prodAuth = await import("./auth.service");
    expect(prodAuth.SHOW_DEMO_ACCOUNTS).toBe(false);
    expect(prodAuth.DEMO_ACCOUNTS).toEqual([]);

    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS", "");
    const devAuth = await import("./auth.service");
    expect(devAuth.SHOW_DEMO_ACCOUNTS).toBe(true);
    expect(devAuth.DEMO_ACCOUNTS).toHaveLength(3);
  });
});
