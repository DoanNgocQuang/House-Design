import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  agents,
  companies,
  createDb,
  heartbeatRuns,
  issueAttachments,
  issueComments,
  issues,
} from "@paperclipai/db";
import { startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";
import { createLocalDiskStorageProvider } from "../storage/local-disk-provider.js";
import { createStorageService } from "../storage/service.js";
import {
  buildPaperclipWakePayload,
  mergeCoalescedContextSnapshot,
} from "../services/heartbeat.js";
import { stageNativeRunnerWakeAttachments } from "../services/native-runtime/native-runner-file-handoff.js";
import { issueRoutes } from "../routes/issues.js";
import { errorHandler } from "../middleware/index.js";
import { issueService } from "../services/issues.js";
import { setPluginEventBus } from "../services/activity-log.js";

const wakeup = vi.hoisted(() =>
  vi.fn(
    async (
      _agentId: string,
      _options: { contextSnapshot?: Record<string, unknown> },
    ) => null,
  ),
);
// Only dispatch is replaced: this fixture exercises real HTTP, DB comment
// binding, wake construction and private byte staging, but launches no agent.
vi.mock("../services/heartbeat.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/heartbeat.js")>()),
  heartbeatService: () => ({
    wakeup,
    getRun: async () => null,
    getActiveRunForAgent: async () => null,
    getQueuedAssignmentRunForIssue: async () => null,
    reportRunActivity: async () => undefined,
  }),
}));

describe("Board upload receipt to native wake staging", () => {
  let temporary: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;
  let db: ReturnType<typeof createDb>;
  let root: string;
  let storage: ReturnType<typeof createStorageService>;
  let app: express.Express;
  let companyId: string;
  let agentId: string;
  let otherAgentId: string;
  let issueId: string;
  let fixtureNumber = 0;

  beforeAll(async () => {
    temporary = await startEmbeddedPostgresTestDatabase(
      "board-native-attachments-",
    );
    db = createDb(temporary.connectionString);
    root = await mkdtemp(path.join(tmpdir(), "board-native-attachments-"));
    storage = createStorageService(
      createLocalDiskStorageProvider(path.join(root, "storage")),
    );
  }, 90_000);
  afterAll(async () => {
    await temporary?.cleanup();
    if (root) await rm(root, { recursive: true, force: true });
  });
  beforeEach(async () => {
    wakeup.mockClear();
    companyId = randomUUID();
    agentId = randomUUID();
    otherAgentId = randomUUID();
    issueId = randomUUID();
    await db.insert(companies).values({
      id: companyId,
      name: "Board upload fixture",
      issuePrefix: `UPL${++fixtureNumber}`,
      issueCounter: 1,
    });
    await db.insert(agents).values(
      [agentId, otherAgentId].map((id) => ({
        id,
        companyId,
        name: id,
        adapterType: "paperclip_runner",
        adapterConfig: { provider: "codex" },
        runtimeConfig: {},
        status: "active",
      })),
    );
    await db.insert(issues).values({
      id: issueId,
      companyId,
      title: "Inspect the exact new file and keep this task open",
      issueNumber: 1,
      identifier: `UPL${fixtureNumber}-1`,
      status: "todo",
      assigneeAgentId: agentId,
    });
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.actor = {
        type: "board",
        userId: "local-board",
        source: "local_implicit",
        companyIds: [companyId],
        isInstanceAdmin: false,
      };
      next();
    });
    app.use("/api", issueRoutes(db, storage));
    app.use(errorHandler);
  });

  async function upload(filename = "fresh.txt", targetIssueId = issueId) {
    const bytes = Buffer.from(
      `Exact new file: ${filename}\nObject: kite\nAccent: teal\nCount: 7\n`,
    );
    const response = await request(app)
      .post(`/api/companies/${companyId}/issues/${targetIssueId}/attachments`)
      .attach("file", bytes, { filename, contentType: "text/plain" });
    expect(response.status).toBe(201);
    expect(response.body.issueCommentId).toBeNull();
    return {
      attachment: response.body as { id: string; contentPath: string },
      bytes,
    };
  }

  it.each(["post", "patch"] as const)(
    "binds a %s comment before building and staging the exact wake bytes",
    async (method) => {
      const { attachment, bytes } = await upload();
      const response =
        method === "post"
          ? await request(app)
              .post(`/api/issues/${issueId}/comments`)
              .send({
                body: "Inspect only this new file; keep this internal and open.",
                attachmentIds: [attachment.id],
              })
          : await request(app)
              .patch(`/api/issues/${issueId}`)
              .send({
                comment:
                  "Inspect only this new file; keep this internal and open.",
                attachmentIds: [attachment.id],
                assigneeAgentId: otherAgentId,
              });
      expect(response.status, JSON.stringify(response.body)).toBe(
        method === "post" ? 201 : 200,
      );
      const [bound] = await db
        .select()
        .from(issueAttachments)
        .where(eq(issueAttachments.id, attachment.id));
      expect(bound!.issueCommentId).not.toBeNull();
      const [comment] = await db
        .select()
        .from(issueComments)
        .where(eq(issueComments.id, bound!.issueCommentId!));
      const [issue] = await db
        .select()
        .from(issues)
        .where(eq(issues.id, issueId));
      expect(issue!.assigneeAgentId).toBe(
        method === "post" ? agentId : otherAgentId,
      );
      expect(issue!.status).toBe("todo");
      await vi.waitFor(() => expect(wakeup).toHaveBeenCalled());

      const runId = randomUUID();
      const emitted = wakeup.mock.calls.find(
        ([target, options]) =>
          target === issue!.assigneeAgentId &&
          options.contextSnapshot?.wakeCommentId === comment!.id,
      );
      expect(emitted).toBeDefined();
      // Apply the production canonical comment-ID merge to the real route wake;
      // dispatch itself is held so this test never launches an agent process.
      const contextSnapshot = mergeCoalescedContextSnapshot(
        {},
        emitted![1].contextSnapshot!,
      );
      const paperclipWake = await buildPaperclipWakePayload({
        db,
        companyId,
        agentId: issue!.assigneeAgentId,
        runId,
        contextSnapshot,
      });
      expect(paperclipWake?.comments[0]?.attachments).toEqual([
        expect.objectContaining({ id: attachment.id, byteSize: bytes.length }),
      ]);
      await db.insert(heartbeatRuns).values({
        id: runId,
        companyId,
        agentId: issue!.assigneeAgentId!,
        status: "running",
        runtimeMode: "native",
        nativeIssueId: issueId,
        invocationSource: "assignment",
        triggerDetail: "system",
        contextSnapshot: { ...contextSnapshot, paperclipWake },
      });
      await db
        .update(issues)
        .set({ executionRunId: runId, status: "in_progress" })
        .where(eq(issues.id, issueId));
      const workspaceRoot = path.join(root, runId);
      await mkdir(workspaceRoot);
      const stage = await stageNativeRunnerWakeAttachments({
        db,
        storage,
        binding: {
          companyId,
          issueId,
          agentId: issue!.assigneeAgentId!,
          runId,
          workspaceRoot,
          executionTargetKind: "local",
        },
      });
      try {
        expect(stage.attachments).toEqual([
          expect.objectContaining({
            id: attachment.id,
            unavailableReason: null,
          }),
        ]);
        expect(
          await readFile(
            path.join(
              workspaceRoot,
              stage.attachments[0]!.workspaceRelativePath!,
            ),
          ),
        ).toEqual(bytes);
      } finally {
        await stage.cleanup();
      }
    },
  );

  it("tells plugins when a question card is created and when it changes", async () => {
    const emit = vi.fn(async (_event: { eventType: string; entityId?: string; payload: unknown }) => ({ errors: [] }));
    setPluginEventBus({ emit } as never);
    const created = await request(app).post(`/api/issues/${issueId}/interactions`).send({
      kind: "request_confirmation", title: "Approve", continuationPolicy: "none", payload: { version: 1, prompt: "Approve?" },
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const rejected = await request(app).post(`/api/issues/${issueId}/interactions/${created.body.id}/reject`).send({ reason: "No" });
    expect(rejected.status, JSON.stringify(rejected.body)).toBe(200);
    const cards = emit.mock.calls.map(([event]) => event).filter((event) => event.eventType.startsWith("issue.interaction."));
    expect(cards).toEqual([
      expect.objectContaining({ eventType: "issue.interaction.created", entityId: issueId, payload: expect.objectContaining({ interactionId: created.body.id }) }),
      expect.objectContaining({ eventType: "issue.interaction.updated", entityId: issueId, payload: expect.objectContaining({ interactionId: created.body.id }) }),
    ]);
  });

  it("overwrites an agent's same-named task file in place and leaves other files alone", async () => {
    const register = async (body: string, createdByAgentId: string | null, filename = "plan.svg") => {
      const stored = await storage.putFile({
        companyId, namespace: `issues/${issueId}`, originalFilename: filename, contentType: "image/svg+xml", body: Buffer.from(body),
      });
      const row = await issueService(db).createAttachment({
        issueId, ...stored, createdByAgentId, createdByUserId: createdByAgentId ? null : "local-board", replaceSameName: true,
      });
      return { row, stored };
    };
    const pasted = await register("owner", null, "image.png");
    const first = await register("old", agentId);
    const second = await register("new", otherAgentId);
    expect(second.row.id).toBe(first.row.id);
    expect(second.row.replaced?.objectKey).toBe(first.stored.objectKey);

    // An owner's own file is never overwritten, not even by an agent.
    expect((await register("agent", agentId, "image.png")).row.id).not.toBe(pasted.row.id);

    // Over HTTP the owner may overwrite an agent's file; the old bytes are removed.
    const { attachment, bytes } = await upload("plan.svg");
    expect(attachment.id).toBe(first.row.id);
    const content = await request(app).get(attachment.contentPath).buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk)).on("end", () => done(null, Buffer.concat(chunks)));
    });
    expect(content.body).toEqual(bytes);
    expect((await storage.headObject(companyId, second.stored.objectKey)).exists).toBe(false);
    const names = (await issueService(db).listAttachments(issueId)).map((file) => file.originalFilename).sort();
    expect(names).toEqual(["image.png", "image.png", "plan.svg"]);

    // A file the agent sent with a comment is overwritten too and stays with that comment.
    const [comment] = await db.insert(issueComments).values({ companyId, issueId, authorAgentId: agentId, authorType: "agent", body: "Done" }).returning();
    await db.update(issueAttachments).set({ issueCommentId: comment!.id }).where(eq(issueAttachments.id, first.row.id));
    const third = await register("newer", agentId);
    expect([third.row.id, third.row.issueCommentId]).toEqual([first.row.id, comment!.id]);
  });

  it("does not bind or stage an old attachment merely referenced in Markdown", async () => {
    const { attachment } = await upload();
    const response = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .send({ body: `[old file](${attachment.contentPath})` });
    expect(response.status).toBe(201);
    const [retained] = await db
      .select()
      .from(issueAttachments)
      .where(eq(issueAttachments.id, attachment.id));
    expect(retained!.issueCommentId).toBeNull();
    await vi.waitFor(() => expect(wakeup).toHaveBeenCalled());
    const wake = await buildPaperclipWakePayload({
      db,
      companyId,
      agentId,
      contextSnapshot: mergeCoalescedContextSnapshot(
        {},
        { issueId, wakeCommentId: response.body.id },
      ),
    });
    expect(wake?.comments[0]?.attachments ?? []).toEqual([]);
  });

  it.each([
    "foreign_task",
    "foreign_company",
    "already_bound",
    "failed_reassignment",
  ] as const)(
    "rolls back comment, binding and reassignment for %s",
    async (mode) => {
      const { attachment } = await upload();
      let originalCommentId: string | null = null;
      let selected = attachment.id;
      if (mode === "foreign_task") {
        const foreignIssueId = randomUUID();
        await db.insert(issues).values({
          id: foreignIssueId,
          companyId,
          title: "Other task",
          issueNumber: 2,
          identifier: `UPL${fixtureNumber}-2`,
          status: "todo",
          assigneeAgentId: agentId,
        });
        selected = (await upload("other.txt", foreignIssueId)).attachment.id;
      } else if (mode === "foreign_company") {
        const foreignCompanyId = randomUUID();
        const foreignIssueId = randomUUID();
        await db.insert(companies).values({
          id: foreignCompanyId,
          name: "Other company",
          issuePrefix: `FR${fixtureNumber}`,
        });
        await db.insert(issues).values({
          id: foreignIssueId,
          companyId: foreignCompanyId,
          title: "Private other task",
          issueNumber: 1,
          identifier: `FR${fixtureNumber}-1`,
          status: "todo",
        });
        const stored = await storage.putFile({
          companyId: foreignCompanyId,
          namespace: `issues/${foreignIssueId}`,
          originalFilename: "foreign.txt",
          contentType: "text/plain",
          body: Buffer.from("Foreign bytes"),
        });
        selected = (
          await issueService(db).createAttachment({
            issueId: foreignIssueId,
            issueCommentId: null,
            ...stored,
            createdByUserId: "local-board",
          })
        ).id;
      } else if (mode === "already_bound") {
        const first = await request(app)
          .post(`/api/issues/${issueId}/comments`)
          .send({ body: "First binding", attachmentIds: [attachment.id] });
        expect(first.status).toBe(201);
        originalCommentId = first.body.id;
        await vi.waitFor(() => expect(wakeup).toHaveBeenCalled());
      }
      const beforeComments = await db
        .select({ id: issueComments.id })
        .from(issueComments)
        .where(eq(issueComments.issueId, issueId));
      wakeup.mockClear();
      const response = await request(app)
        .patch(`/api/issues/${issueId}`)
        .send({
          comment: "Must not persist",
          attachmentIds: [selected],
          assigneeAgentId:
            mode === "failed_reassignment" ? randomUUID() : otherAgentId,
        });
      expect([404, 409, 422]).toContain(response.status);
      const [current] = await db
        .select()
        .from(issues)
        .where(eq(issues.id, issueId));
      expect(current!.assigneeAgentId).toBe(agentId);
      const [retained] = await db
        .select()
        .from(issueAttachments)
        .where(eq(issueAttachments.id, attachment.id));
      expect(retained!.issueCommentId).toBe(originalCommentId);
      expect(
        await db
          .select({ id: issueComments.id })
          .from(issueComments)
          .where(eq(issueComments.issueId, issueId)),
      ).toEqual(beforeComments);
      expect(wakeup).not.toHaveBeenCalled();
    },
  );
});
