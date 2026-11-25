import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { dashboardService } from "../services/dashboard.js";
import {
  DEFAULT_RECOVERY_RATE_THRESHOLD_PERCENT,
  MAX_WINDOW_WEEKS,
  recoveryObservabilityService,
} from "../services/recovery-observability.js";
import { assertBoard, assertCompanyAccess } from "./authz.js";
import { agentStatsPeriods, readAgentStats, type AgentStatsPeriod, type AgentStatsScope } from "../services/agent-stats.js";
import { authorizationService } from "../services/authorization.js";
import { listProjectFiles } from "../services/project-files.js";

function parsePositiveNumber(
  value: unknown,
  fallback: number,
  max?: number,
): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return max != null ? Math.min(parsed, max) : parsed;
}

export function dashboardRoutes(db: Db) {
  const router = Router();
  const svc = dashboardService(db);
  const access = authorizationService(db);
  const recoveryObservability = recoveryObservabilityService(db);

  router.get("/companies/:companyId/dashboard", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const summary = await svc.summary(companyId);
    res.json(summary);
  });

  router.get("/companies/:companyId/agent-stats", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertBoard(req);
    assertCompanyAccess(req, companyId);
    const period = req.query.period ?? "7d";
    if (typeof period !== "string" || !agentStatsPeriods.includes(period as AgentStatsPeriod)) {
      res.status(400).json({ error: "Unsupported agent statistics period" });
      return;
    }
    const scope: AgentStatsScope = {};
    for (const key of ["projectId", "requestId"] as const) {
      const value = req.query[key];
      if (value === undefined || value === "") continue;
      if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        res.status(400).json({ error: `${key} must be a UUID` });
        return;
      }
      scope[key] = value;
    }
    const permission = await access.decide({
      actor: req.actor, action: "company_scope:read", resource: { type: "company", companyId },
    });
    if (!permission.allowed) {
      res.status(403).json({ error: "Run telemetry is outside this actor's authorization boundary" });
      return;
    }
    const stats = await readAgentStats(db, req.actor, companyId, period as AgentStatsPeriod, scope);
    const agentReads = await Promise.all(stats.agents.map(agent => access.decide({
      actor: req.actor, action: "agent:read", resource: { type: "agent", companyId, agentId: agent.id },
    })));
    res.set("Cache-Control", "private, no-store").json({
      ...stats, agents: stats.agents.filter((_, index) => agentReads[index].allowed),
    });
  });

  router.get("/companies/:companyId/projects/:projectId/files", async (req, res) => {
    const companyId = req.params.companyId as string;
    const projectId = req.params.projectId as string;
    assertBoard(req);
    assertCompanyAccess(req, companyId);
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
      res.status(400).json({ error: "projectId must be a UUID" });
      return;
    }
    const permission = await access.decide({
      actor: req.actor, action: "company_scope:read", resource: { type: "company", companyId },
    });
    if (!permission.allowed) {
      res.status(403).json({ error: "Project files are outside this actor's authorization boundary" });
      return;
    }
    const files = await listProjectFiles(db, req.actor, companyId, projectId);
    res.set("Cache-Control", "private, no-store").json({ files });
  });

  router.get("/companies/:companyId/recovery-observability", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const weeks = parsePositiveNumber(req.query.weeks, 8, MAX_WINDOW_WEEKS);
    const thresholdPercent = parsePositiveNumber(
      req.query.threshold,
      DEFAULT_RECOVERY_RATE_THRESHOLD_PERCENT,
    );
    const report = await recoveryObservability.report(companyId, {
      weeks,
      thresholdPercent,
    });
    res.json(report);
  });

  return router;
}
