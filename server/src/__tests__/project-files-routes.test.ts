import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@paperclipai/db";
import { errorHandler } from "../middleware/index.js";
import { latestPerFilename } from "../services/project-files.js";

const { decide, listProjectFiles } = vi.hoisted(() => ({ decide: vi.fn(), listProjectFiles: vi.fn() }));

vi.mock("../services/project-files.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/project-files.js")>()),
  listProjectFiles,
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

const model = (filename: string, createdAt: string, status = "done") => ({
  attachmentId: `att-${filename}-${createdAt}`,
  filename,
  byteSize: 1000,
  createdAt,
  issue: { id: "issue-1", identifier: "QLD-1", title: "Dựng hình", status },
});

beforeEach(() => {
  decide.mockReset();
  listProjectFiles.mockReset();
});

describe("GET /companies/:companyId/projects/:projectId/files", () => {
  const projectId = "00000000-0000-4000-8000-0000000000aa";

  it("lists the project's files for an actor who can read the company", async () => {
    decide.mockResolvedValue({ allowed: true });
    listProjectFiles.mockResolvedValue([{ ...model("layout.json", "2026-11-23T01:00:00.000Z"), contentType: "application/json", createdByAgent: "Kiến trúc sư" }]);
    const res = await request(app()).get(`/api/companies/${companyId}/projects/${projectId}/files`);
    expect(res.status).toBe(200);
    expect(res.body.files.map((f: { filename: string }) => f.filename)).toEqual(["layout.json"]);
    expect(listProjectFiles).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: "board" }), companyId, projectId);
  });

  it("refuses an actor without company read access and rejects a malformed project id", async () => {
    decide.mockResolvedValue({ allowed: false });
    expect((await request(app()).get(`/api/companies/${companyId}/projects/${projectId}/files`)).status).toBe(403);
    expect((await request(app()).get(`/api/companies/${companyId}/projects/not-a-uuid/files`)).status).toBe(400);
    expect(listProjectFiles).not.toHaveBeenCalled();
  });
});

describe("latestPerFilename", () => {
  it("keeps only the newest upload of each file name, newest first", () => {
    const rows = [
      model("a.glb", "2026-11-23T01:00:00.000Z"),
      model("b.glb", "2026-11-23T02:00:00.000Z"),
      model("a.glb", "2026-11-23T03:00:00.000Z", "in_progress"),
    ];
    expect(latestPerFilename(rows).map((m) => `${m.filename}@${m.createdAt}`)).toEqual([
      "a.glb@2026-11-23T03:00:00.000Z",
      "b.glb@2026-11-23T02:00:00.000Z",
    ]);
  });
});
