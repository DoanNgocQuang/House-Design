import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@paperclipai/db";
import { errorHandler } from "../middleware/index.js";
import { agentStatsWindow } from "../services/agent-stats.js";

const { decide, readAgentStats } = vi.hoisted(() => ({ decide: vi.fn(), readAgentStats: vi.fn() }));

vi.mock("../services/agent-stats.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/agent-stats.js")>()),
  readAgentStats,
}));
vi.mock("../services/authorization.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/authorization.js")>()),
  authorizationService: () => ({ decide }),
}));

const { dashboardRoutes } = await import("../routes/dashboard.js");

const companyId = "00000000-0000-4000-8000-000000000001";

function app() {
  const server = express();
  server.use((req, _res, next) => {
    (req as any).actor = { type: "board", userId: "local-board", source: "local_implicit", isInstanceAdmin: true };
    next();
  });
  server.use("/api", dashboardRoutes({} as Db));
  server.use(errorHandler);
  return server;
}

beforeEach(() => {
  decide.mockReset();
  readAgentStats.mockReset().mockResolvedValue({
    period: "7d", from: "x", until: "y",
    agents: [{ id: "visible-agent" }, { id: "hidden-agent" }],
  });
});

describe("GET /companies/:companyId/agent-stats", () => {
  it("drops agents the actor cannot read", async () => {
    decide.mockImplementation(async ({ action, resource }) => ({
      allowed: action === "company_scope:read" || resource.agentId === "visible-agent",
    }));
    const res = await request(app()).get(`/api/companies/${companyId}/agent-stats`);
    expect(res.status).toBe(200);
    expect(res.body.agents.map((agent: { id: string }) => agent.id)).toEqual(["visible-agent"]);
    expect(res.headers["cache-control"]).toBe("private, no-store");
  });

  it("refuses an actor without company read access", async () => {
    decide.mockResolvedValue({ allowed: false });
    const res = await request(app()).get(`/api/companies/${companyId}/agent-stats`);
    expect(res.status).toBe(403);
    expect(readAgentStats).not.toHaveBeenCalled();
  });

  it("rejects an unknown period", async () => {
    const res = await request(app()).get(`/api/companies/${companyId}/agent-stats?period=1y`);
    expect(res.status).toBe(400);
    expect(decide).not.toHaveBeenCalled();
  });
});

describe("agent-stats scope and period", () => {
  const requestId = "00000000-0000-4000-8000-0000000000e1";

  it("accepts all-time and passes a project or owner-request scope to the service", async () => {
    decide.mockResolvedValue({ allowed: true });
    const res = await request(app()).get(`/api/companies/${companyId}/agent-stats?period=all&requestId=${requestId}`);
    expect(res.status).toBe(200);
    expect(readAgentStats).toHaveBeenCalledWith(expect.anything(), expect.anything(), companyId, "all", { requestId });
  });

  it("rejects a scope id that is not a UUID", async () => {
    for (const query of ["projectId=abc", "requestId=1;drop"]) {
      const res = await request(app()).get(`/api/companies/${companyId}/agent-stats?${query}`);
      expect(res.status).toBe(400);
    }
    expect(readAgentStats).not.toHaveBeenCalled();
  });
});

describe("agentStatsWindow", () => {
  it("all-time starts at the epoch and still ends at the next Vietnam midnight", () => {
    const window = agentStatsWindow("all", new Date("2026-11-22T23:30:00Z"));
    expect(window.from.getTime()).toBe(0);
    expect(window.until.toISOString()).toBe("2026-11-23T17:00:00.000Z");
  });

  it("starts 'today' at midnight in Vietnam time (UTC+7)", () => {
    // 2026-11-22 23:30 UTC is already 2026-11-23 06:30 in Vietnam.
    const window = agentStatsWindow("today", new Date("2026-11-22T23:30:00Z"));
    expect(window.from.toISOString()).toBe("2026-11-22T17:00:00.000Z");
    expect(window.until.toISOString()).toBe("2026-11-23T17:00:00.000Z");
  });
});
