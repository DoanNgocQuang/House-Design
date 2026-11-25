import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAccountIdentity } from "@/api/companies-query";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { formatCompact, formatCost, formatDuration, groupWakeReasons, wakeGroups } from "@/lib/agent-stats";
import { companyProjectsQuery } from "@/lib/company-projects-query";
import { Link } from "@/lib/router";

const periods = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
] as const;
type Period = (typeof periods)[number]["value"];
type Sort = "done" | "points" | "failed" | "tokens" | "costCents";
type Row = {
  id: string; name: string; title: string | null; status: string;
  activeTask: { id: string; identifier: string | null; title: string } | null;
  todo: number; inProgress: number; inReview: number; blocked: number;
  done: number; points: number; unestimated: number; avgTaskSeconds: number | null;
  succeeded: number; failed: number; timedOut: number; cancelled: number; failureRate: number | null;
  inputTokens: number; cachedInputTokens: number; outputTokens: number; runSeconds: number; costCents: number | null;
  wakeReasons: { reason: string; count: number }[];
};
type Stats = { agents: Row[]; requests?: { id: string; identifier: string | null; title: string }[] };

const statusLabels: Record<string, string> = {
  running: "Running", idle: "Idle", paused: "Paused", error: "Error",
  active: "Ready", pending_approval: "Pending Approval",
};
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const counts = new Intl.NumberFormat("en-US");
const columns = ["Agent", "Current", "Todo", "In Progress", "In Review", "Blocked", "Completed", "Story Points", "Avg Time per Task",
  "Succeeded", "Failed", "Timed Out", "Cancelled", "Failure Rate", "Tokens", "Cost", "Run Time"];
const cell = "border-b px-3 py-3 text-right tabular-nums";

type Metric = "done" | "points";
type Segment = { key: string; label: string; color: string; value: (row: Row) => number };

const blue = "bg-[var(--status-task-in_progress)]";
const red = "bg-[var(--status-task-blocked)]";
const gray = "bg-[var(--status-task-icon-cancelled)]";
const field = (key: keyof Row, label: string, color: string): Segment => ({ key, label, color, value: row => Number(row[key]) || 0 });
const outputSegments: Record<Metric, Segment> = {
  done: field("done", "Completed Tasks", blue),
  points: field("points", "Story Points", "bg-[var(--status-task-in_review)]"),
};
const workload = [
  field("todo", "Todo", gray),
  field("inProgress", "In Progress", blue),
  field("inReview", "In Review", "bg-[var(--status-task-icon-todo)]"),
  field("blocked", "Blocked", red),
];
const outcomes = [
  field("succeeded", "Succeeded", "bg-[var(--status-task-icon-done)]"),
  field("failed", "Failed", red),
  field("timedOut", "Timed Out", "bg-orange-600 dark:bg-orange-400"),
  field("cancelled", "Cancelled", gray),
];
const tokens = [
  field("inputTokens", "Input", blue),
  field("cachedInputTokens", "Cached", "bg-[var(--status-task-in_review)]"),
  field("outputTokens", "Output", "bg-[var(--status-task-icon-done)]"),
];
const wakes: Segment[] = wakeGroups.map(group => ({ ...group, value: row => groupWakeReasons(row.wakeReasons ?? [])[group.key] }));
const avgTime = [field("avgTaskSeconds", "Avg Time per Task", "bg-[var(--chart-2)]")];
// Older servers omit the newer fields; treat them as zero so totals never turn into NaN.
const rowDefaults = { avgTaskSeconds: null, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, runSeconds: 0, costCents: null, wakeReasons: [] };
const totalTokens = (row: Row) => row.inputTokens + row.cachedInputTokens + row.outputTokens;
const formatRate = (rate: number | null) => rate === null ? "—" : percent.format(rate);

function AgentName({ row }: { row: Row }) {
  const running = row.status === "running";
  return <span className="flex min-w-0 items-center gap-2">
    <span className="relative shrink-0">
      <AgentAvatar agent={{ id: row.id, name: row.name }} size={20} />
      <span aria-hidden="true" className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-card ${running ? "animate-pulse bg-[var(--status-task-icon-done)]" : "bg-[var(--status-task-icon-cancelled)]"}`} />
    </span>
    <span className="min-w-0 break-words text-sm font-medium" title={row.name}>{row.name}</span>
  </span>;
}

function AgentBars({ title, rows, segments, context, metric, onMetricChange, showFailureRate = false, format = counts.format, description }: {
  title: string;
  rows: Row[];
  segments: Segment[];
  context: string;
  metric?: Metric;
  onMetricChange?: (metric: Metric) => void;
  showFailureRate?: boolean;
  format?: (value: number) => string;
  description?: string;
}) {
  const bars = rows.map(row => ({ row, total: segments.reduce((sum, segment) => sum + segment.value(row), 0) }));
  const rank = ({ row, total }: (typeof bars)[number]) => showFailureRate ? row.failed + row.timedOut : total;
  bars.sort((a, b) => rank(b) - rank(a) || a.row.name.localeCompare(b.row.name, "en"));
  const max = bars.reduce((highest, bar) => Math.max(highest, bar.total), 1);

  return <section aria-label={title} className="min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-xs sm:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description ? `${context} · ${description}` : context}</p>
      </div>
      {onMetricChange && <div className="flex flex-wrap gap-1" role="group" aria-label="Output metric">
        {(["done", "points"] as const).map(value => <Button key={value} type="button" size="sm"
          variant={metric === value ? "secondary" : "ghost"} aria-pressed={metric === value}
          onClick={() => onMetricChange(value)}>{outputSegments[value].label}</Button>)}
      </div>}
    </header>
    {segments.length > 1 && <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {segments.map(segment => <li key={segment.key} className="flex items-center gap-1.5">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-sm ${segment.color}`} />{segment.label}
      </li>)}
    </ul>}
    <ul className="space-y-1">
      {bars.map(({ row, total }) => {
        const rate = formatRate(row.failureRate);
        const values = segments.map(segment => `${segment.label}: ${format(segment.value(row))}`);
        const label = [row.name, ...values, ...(showFailureRate ? [`Failure Rate: ${rate}`] : [])].join(", ");
        return <li key={row.id}>
          <div role="img" aria-label={label} tabIndex={0}
            className="group relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-md px-2 py-1.5 outline-none hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1.1fr)_minmax(0,3fr)_6rem]">
            <AgentName row={row} />
            <div className="order-last col-span-2 flex h-2.5 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1" aria-hidden="true">
              {segments.filter(segment => segment.value(row) > 0).map(segment =>
                <div key={segment.key} className={`${segment.color} transition-[width] duration-500`} style={{ width: `${segment.value(row) / max * 100}%` }} />)}
            </div>
            <span className="whitespace-nowrap text-right text-sm font-medium tabular-nums">
              {format(total)}
              {showFailureRate && <span className="ml-2 text-xs font-normal text-muted-foreground" title="Failure Rate">{rate}</span>}
            </span>
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full z-10 hidden max-w-max flex-wrap gap-x-3 gap-y-1 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md group-hover:flex group-focus:flex">
              {values.map(value => <span key={value}>{value}</span>)}
              {showFailureRate && <span>Failure Rate: {rate}</span>}
            </span>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div className="min-w-0 rounded-xl border bg-card p-4 shadow-xs">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 truncate text-2xl font-semibold tabular-nums">{value}</div>
    {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
  </div>;
}

export function AgentStats() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const identity = useAccountIdentity();
  const [period, setPeriod] = useState<Period>("7d");
  const [scope, setScope] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("done");
  const [metric, setMetric] = useState<Metric>("done");
  useEffect(() => { setBreadcrumbs([{ label: "Agent Stats" }]); }, [setBreadcrumbs]);
  const scopeParam = scope ? `&${scope.startsWith("project:") ? "projectId" : "requestId"}=${encodeURIComponent(scope.split(":")[1])}` : "";
  const stats = useQuery({
    queryKey: ["agent-stats", selectedCompanyId, identity.userId, period, scope],
    queryFn: ({ signal }) => api.get<Stats>(`/companies/${selectedCompanyId}/agent-stats?period=${period}${scopeParam}`, { signal }),
    enabled: !!selectedCompanyId && identity.settled,
    refetchInterval: 15_000,
  });
  const projects = useQuery({ ...companyProjectsQuery(selectedCompanyId ?? ""), enabled: !!selectedCompanyId });
  const search = query.trim().toLocaleLowerCase("en");
  const sortValue = (row: Row) => sort === "tokens" ? totalTokens(row) : sort === "costCents" ? row.costCents ?? -1 : row[sort];
  const rows = (stats.data?.agents ?? []).map(row => ({ ...rowDefaults, ...row }) as Row)
    .filter(row => row.name.toLocaleLowerCase("en").includes(search))
    .sort((a, b) => sortValue(b) - sortValue(a) || a.name.localeCompare(b.name, "en"));
  const periodLabel = periods.find(option => option.value === period)!.label;

  const sum = (pick: (row: Row) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const runs = sum(row => row.succeeded + row.failed + row.timedOut + row.cancelled);
  const allTokens = sum(totalTokens);
  const assessed = sum(row => row.succeeded + row.failed + row.timedOut);
  const priced = rows.filter(row => row.costCents !== null);

  return <section className="flex min-w-0 flex-col gap-4" aria-label="Agent Stats">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">Agent Stats</h1>
        <p className="text-sm text-muted-foreground">Times use Vietnam time. Status and current workload refresh every 15 seconds.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input className="w-44" aria-label="Search agents" placeholder="Search agents…" value={query} onChange={event => setQuery(event.target.value)} />
        <select className="h-9 max-w-64 rounded-md border bg-background px-2 text-sm" aria-label="Scope" value={scope} onChange={event => setScope(event.target.value)}>
          <option value="">All company</option>
          {(projects.data ?? []).length > 0 && <optgroup label="Project">
            {(projects.data ?? []).map(project => <option key={project.id} value={`project:${project.id}`}>{project.name}</option>)}
          </optgroup>}
          {(stats.data?.requests ?? []).length > 0 && <optgroup label="Request">
            {(stats.data?.requests ?? []).map(request => <option key={request.id} value={`request:${request.id}`}>{request.identifier ? `${request.identifier} · ` : ""}{request.title}</option>)}
          </optgroup>}
        </select>
        <div className="flex gap-1" role="group" aria-label="Date range">
          {periods.map(option => <Button key={option.value} size="sm" variant={period === option.value ? "default" : "outline"}
            aria-pressed={period === option.value} onClick={() => setPeriod(option.value)}>{option.label}</Button>)}
        </div>
      </div>
    </header>
    {!selectedCompanyId ? <p>Select a company to view statistics.</p> :
      stats.isError ? <div className="flex items-center gap-2" role="alert">Could not load agent statistics. <Button variant="outline" size="sm" onClick={() => void stats.refetch()}>Retry</Button></div> :
      stats.isPending ? <p role="status">Loading agent statistics…</p> :
      !rows.length ? <p className="text-sm text-muted-foreground">No agents found.</p> :
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-label="Summary">
          <Kpi label="Runs" value={counts.format(runs)} hint={periodLabel} />
          <Kpi label="Tokens" value={formatCompact(allTokens)}
            hint={allTokens ? `${percent.format(sum(row => row.cachedInputTokens) / allTokens)} cached` : undefined} />
          <Kpi label="Cost" value={priced.length ? formatCost(priced.reduce((total, row) => total + (row.costCents ?? 0), 0)) : "—"}
            hint={priced.length ? undefined : "Subscription usage, no price"} />
          <Kpi label="Completed Tasks" value={counts.format(sum(row => row.done))} hint={`${counts.format(sum(row => row.points))} story points`} />
          <Kpi label="Failure Rate" value={assessed ? percent.format(sum(row => row.failed + row.timedOut) / assessed) : "—"} />
          <Kpi label="Run Time" value={formatDuration(sum(row => row.runSeconds))} />
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <AgentBars title="Token Usage" context={periodLabel} rows={rows} segments={tokens} format={formatCompact} />
          <AgentBars title="Wake Reasons" context={periodLabel} description="why each agent was started" rows={rows} segments={wakes} />
          <AgentBars title="Task Output" context={periodLabel}
            rows={rows} segments={[outputSegments[metric]]} metric={metric} onMetricChange={setMetric} />
          <AgentBars title="Avg Time per Task" context={periodLabel} description="started to completed" rows={rows} segments={avgTime}
            format={value => value ? formatDuration(value) : "—"} />
          <AgentBars title="Current Workload" context="Current" rows={rows} segments={workload} />
          <AgentBars title="Run Outcomes" context={periodLabel} rows={rows} segments={outcomes} showFailureRate />
        </div>
        <details className="min-w-0 rounded-xl border bg-card shadow-xs">
          <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View Detailed Statistics
          </summary>
          <div className="px-4 pb-3">
            <select className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Sort agent statistics" value={sort} onChange={event => setSort(event.target.value as Sort)}>
              <option value="done">Most Completed Tasks</option>
              <option value="points">Most Story Points</option>
              <option value="failed">Most Failed Runs</option>
              <option value="tokens">Most Tokens</option>
              <option value="costCents">Highest Cost</option>
            </select>
          </div>
          <div className="overflow-x-auto border-t">
            <table className="w-full whitespace-nowrap text-sm" aria-label="Statistics by agent">
              <thead className="bg-muted/50"><tr>
                {columns.map((label, index) => <th key={label} scope="col" className={`${cell} font-medium ${index < 2 ? "text-left" : ""}`}>{label}</th>)}
              </tr></thead>
              <tbody>{rows.map(row => <tr key={row.id} className="align-top hover:bg-muted/30">
                <th scope="row" className={`${cell} text-left font-medium`}>
                  <Link className="hover:underline" to={`/agents/${encodeURIComponent(row.id)}`}>{row.name}</Link>
                  {row.title && <div className="text-xs font-normal text-muted-foreground">{row.title}</div>}
                </th>
                <td className={`${cell} text-left`}>
                  <span className={row.status === "running" ? "font-semibold text-primary" : undefined}>{statusLabels[row.status] ?? row.status}</span>
                  {row.activeTask && <Link className="block max-w-56 truncate text-xs text-muted-foreground hover:underline"
                    title={row.activeTask.title} to={`/issues/${encodeURIComponent(row.activeTask.identifier ?? row.activeTask.id)}`}>{row.activeTask.title}</Link>}
                </td>
                {[row.todo, row.inProgress, row.inReview, row.blocked, row.done].map((value, index) => <td key={index} className={cell}>{counts.format(value)}</td>)}
                <td className={cell}>
                  {counts.format(row.points)}
                  {row.unestimated > 0 && <div className="text-xs text-muted-foreground">{counts.format(row.unestimated)} unestimated</div>}
                </td>
                <td className={cell}>{formatDuration(row.avgTaskSeconds ?? null)}</td>
                {[row.succeeded, row.failed, row.timedOut, row.cancelled].map((value, index) => <td key={index} className={cell}>{counts.format(value)}</td>)}
                <td className={cell}>{row.failureRate === null ? "—" : percent.format(row.failureRate)}</td>
                <td className={cell} title={`Input ${counts.format(row.inputTokens ?? 0)} · Cached ${counts.format(row.cachedInputTokens ?? 0)} · Output ${counts.format(row.outputTokens ?? 0)}`}>
                  {formatCompact(totalTokens(row) || 0)}
                </td>
                <td className={cell}>{formatCost(row.costCents ?? null)}</td>
                <td className={cell}>{formatDuration(row.runSeconds ?? 0)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </details>
      </>}
    <p className="text-xs text-muted-foreground">Completed tasks count toward the current assignee. Failure rate includes timed-out runs and excludes cancelled runs. A scope counts only runs that worked on a task inside it.</p>
  </section>;
}
