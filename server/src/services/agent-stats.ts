import { agents, costEvents, heartbeatRuns, issues, type Db } from "@paperclipai/db";
import { and, desc, eq, isNotNull, isNull, ne, not, or, sql } from "drizzle-orm";
import { issueReadSqlCondition, type AuthorizationActor } from "./authorization.js";

const dayMs = 86_400_000;
const vietnamOffsetMs = 7 * 60 * 60 * 1000;

export const agentStatsPeriods = ["today", "7d", "30d", "all"] as const;
export type AgentStatsPeriod = (typeof agentStatsPeriods)[number];
/** Optional narrowing: one project, or one owner request (given to the CEO) together with every task below it. */
export type AgentStatsScope = { projectId?: string | null; requestId?: string | null };

export function agentStatsWindow(period: AgentStatsPeriod, now = new Date()) {
  const day = Math.floor((now.getTime() + vietnamOffsetMs) / dayMs);
  const until = new Date((day + 1) * dayMs - vietnamOffsetMs);
  if (period === "all") return { from: new Date(0), until };
  const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
  return { from: new Date((day - days + 1) * dayMs - vietnamOffsetMs), until };
}

export async function readAgentStats(
  db: Db,
  actor: AuthorizationActor,
  companyId: string,
  period: AgentStatsPeriod,
  scope: AgentStatsScope = {},
) {
  const { from, until } = agentStatsWindow(period);
  const readable = await issueReadSqlCondition(db, actor);
  const companyTask = and(eq(issues.companyId, companyId), isNull(issues.hiddenAt), readable,
    not(sql`${issues.originKind} like 'plugin:%:operation' or ${issues.originKind} like 'plugin:%:operation:%'`));
  const inScope = scope.requestId
    ? sql`${issues.id} in (with recursive tree(id) as (
        select ${scope.requestId}::uuid
        union all
        select child.id from issues child join tree on child.parent_id = tree.id
      ) select id from tree)`
    : scope.projectId ? eq(issues.projectId, scope.projectId) : undefined;
  const scoped = Boolean(scope.requestId || scope.projectId);
  const visibleTask = and(companyTask, inScope);
  const inWindow = (column: typeof issues.completedAt | typeof heartbeatRuns.finishedAt) =>
    sql`${column} >= ${from.toISOString()}::timestamptz AND ${column} < ${until.toISOString()}::timestamptz`;
  const done = sql`${issues.status} = 'done' AND ${inWindow(issues.completedAt)}`;
  const count = (condition: ReturnType<typeof sql>) => sql<number>`(count(*) FILTER (WHERE ${condition}))::int`;
  const companyRun = and(isNull(heartbeatRuns.issueId), eq(heartbeatRuns.scopeKind, "company"));
  // A scoped view only counts runs that worked on a task inside the scope.
  const visibleRun = and(eq(heartbeatRuns.companyId, companyId),
    scoped ? and(isNotNull(issues.id), visibleTask) : or(companyRun, and(isNotNull(issues.id), visibleTask)));
  const runInWindow = and(visibleRun, inWindow(heartbeatRuns.finishedAt));
  const usage = (key: string) => sql<number>`coalesce(sum((${heartbeatRuns.usageJson}->>${key})::numeric), 0)::float8`;
  const wakeReason = sql<string>`coalesce(${heartbeatRuns.contextSnapshot}->>'wakeReason', ${heartbeatRuns.invocationSource})`;

  const [agentRows, tasks, runs, wakes, costs, active, requests] = await Promise.all([
    db.select({ id: agents.id, name: agents.name, title: agents.title, status: agents.status })
      .from(agents).where(and(eq(agents.companyId, companyId), ne(agents.status, "terminated"))),
    db.select({
      agentId: issues.assigneeAgentId,
      todo: count(sql`${issues.status} = 'todo'`),
      inProgress: count(sql`${issues.status} = 'in_progress'`),
      inReview: count(sql`${issues.status} = 'in_review'`),
      blocked: count(sql`${issues.status} = 'blocked'`),
      done: count(done),
      points: sql<number>`coalesce(sum(${issues.storyPoints}) FILTER (WHERE ${done}), 0)::float8`,
      unestimated: count(sql`${done} AND ${issues.storyPoints} IS NULL`),
      avgTaskSeconds: sql<number | null>`(avg(extract(epoch from ${issues.completedAt} - ${issues.startedAt}))
        FILTER (WHERE ${done} AND ${issues.startedAt} IS NOT NULL))::float8`,
    }).from(issues).where(and(visibleTask, isNotNull(issues.assigneeAgentId),
      sql`(${issues.status} in ('todo', 'in_progress', 'in_review', 'blocked') OR (${done}))`))
      .groupBy(issues.assigneeAgentId),
    db.select({
      agentId: heartbeatRuns.agentId,
      succeeded: count(sql`${heartbeatRuns.status} = 'succeeded'`),
      failed: count(sql`${heartbeatRuns.status} = 'failed'`),
      timedOut: count(sql`${heartbeatRuns.status} = 'timed_out'`),
      cancelled: count(sql`${heartbeatRuns.status} = 'cancelled'`),
      inputTokens: usage("inputTokens"),
      cachedInputTokens: usage("cachedInputTokens"),
      outputTokens: usage("outputTokens"),
      runSeconds: sql<number>`coalesce(sum(extract(epoch from ${heartbeatRuns.finishedAt} - ${heartbeatRuns.startedAt}))
        FILTER (WHERE ${heartbeatRuns.startedAt} IS NOT NULL), 0)::float8`,
    }).from(heartbeatRuns).leftJoin(issues, eq(heartbeatRuns.issueId, issues.id))
      .where(runInWindow).groupBy(heartbeatRuns.agentId),
    db.select({ agentId: heartbeatRuns.agentId, reason: wakeReason, count: sql<number>`count(*)::int` })
      .from(heartbeatRuns).leftJoin(issues, eq(heartbeatRuns.issueId, issues.id))
      .where(runInWindow).groupBy(heartbeatRuns.agentId, wakeReason),
    db.select({
      agentId: heartbeatRuns.agentId,
      costCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::float8`,
      // Subscription and unpriced usage carry no price; with none priced the cost is unknown, not zero.
      priced: count(sql`${costEvents.costStatus} <> 'unpriced' AND ${costEvents.billingType} <> 'subscription_included'`),
    }).from(costEvents).innerJoin(heartbeatRuns, eq(costEvents.heartbeatRunId, heartbeatRuns.id))
      .leftJoin(issues, eq(heartbeatRuns.issueId, issues.id))
      .where(runInWindow).groupBy(heartbeatRuns.agentId),
    db.selectDistinctOn([heartbeatRuns.agentId], {
      agentId: heartbeatRuns.agentId, id: issues.id, identifier: issues.identifier, title: issues.title,
    }).from(heartbeatRuns).innerJoin(issues, eq(heartbeatRuns.issueId, issues.id))
      .where(and(eq(heartbeatRuns.companyId, companyId), companyTask, eq(heartbeatRuns.status, "running")))
      .orderBy(heartbeatRuns.agentId, desc(heartbeatRuns.startedAt), desc(heartbeatRuns.id)),
    // Owner requests: top-level tasks handed to the CEO (level 1 of the request → Epic → Task → Sub-task tree).
    db.select({ id: issues.id, identifier: issues.identifier, title: issues.title, projectId: issues.projectId })
      .from(issues).innerJoin(agents, eq(issues.assigneeAgentId, agents.id))
      .where(and(companyTask, isNull(issues.parentId), eq(agents.role, "ceo")))
      .orderBy(desc(issues.createdAt)).limit(100),
  ]);

  const byAgent = <T extends { agentId: string | null }>(rows: T[]) => new Map(rows.map(row => [row.agentId, row]));
  const taskStats = byAgent(tasks), runStats = byAgent(runs), costStats = byAgent(costs), activeTasks = byAgent(active);
  const wakeStats = new Map<string | null, { reason: string; count: number }[]>();
  for (const row of wakes) {
    const list = wakeStats.get(row.agentId) ?? [];
    list.push({ reason: row.reason, count: row.count });
    wakeStats.set(row.agentId, list);
  }
  return { period, from: from.toISOString(), until: until.toISOString(), requests, agents: agentRows.map(agent => {
    const tasks = taskStats.get(agent.id);
    const runs = runStats.get(agent.id);
    const cost = costStats.get(agent.id);
    const current = activeTasks.get(agent.id);
    const succeeded = runs?.succeeded ?? 0;
    const failed = runs?.failed ?? 0;
    const timedOut = runs?.timedOut ?? 0;
    const assessed = succeeded + failed + timedOut;
    return {
      ...agent,
      status: current ? "running" : agent.status,
      activeTask: current ? { id: current.id, identifier: current.identifier, title: current.title } : null,
      todo: tasks?.todo ?? 0, inProgress: tasks?.inProgress ?? 0, inReview: tasks?.inReview ?? 0, blocked: tasks?.blocked ?? 0,
      done: tasks?.done ?? 0, points: tasks?.points ?? 0, unestimated: tasks?.unestimated ?? 0,
      avgTaskSeconds: tasks?.avgTaskSeconds ?? null,
      succeeded, failed, timedOut, cancelled: runs?.cancelled ?? 0,
      failureRate: assessed ? (failed + timedOut) / assessed : null,
      inputTokens: runs?.inputTokens ?? 0, cachedInputTokens: runs?.cachedInputTokens ?? 0, outputTokens: runs?.outputTokens ?? 0,
      runSeconds: runs?.runSeconds ?? 0,
      costCents: cost && cost.priced > 0 ? cost.costCents : null,
      wakeReasons: (wakeStats.get(agent.id) ?? []).sort((a, b) => b.count - a.count),
    };
  }) };
}
