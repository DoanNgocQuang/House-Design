/** Display helpers for the Agent Stats page. */

export const wakeGroups = [
  { key: "assigned", label: "Assigned", color: "bg-[var(--status-task-in_progress)]" },
  { key: "commented", label: "Commented", color: "bg-[var(--chart-2)]" },
  { key: "blockers", label: "Blockers Resolved", color: "bg-[var(--status-task-in_review)]" },
  { key: "children", label: "Children Completed", color: "bg-[var(--status-task-icon-done)]" },
  { key: "retry", label: "Retry", color: "bg-orange-600 dark:bg-orange-400" },
  { key: "timer", label: "Timer", color: "bg-[var(--chart-4)]" },
  { key: "meeting", label: "Meeting", color: "bg-[var(--chart-5)]" },
  { key: "other", label: "Other", color: "bg-[var(--status-task-icon-cancelled)]" },
] as const;
export type WakeGroup = (typeof wakeGroups)[number]["key"];

/** Map a raw wake reason (or invocation source) to one of the chart groups. */
export function wakeGroup(reason: string): WakeGroup {
  if (reason.endsWith("_retry")) return "retry";
  if (reason.includes("assigned") || reason === "assignment") return "assigned";
  if (reason.includes("comment")) return "commented";
  if (reason.includes("blockers_resolved") || reason.includes("unblock")) return "blockers";
  if (reason.includes("children_completed")) return "children";
  if (reason.includes("timer")) return "timer";
  if (reason.includes("discussion") || reason.includes("meeting")) return "meeting";
  return "other";
}

export function groupWakeReasons(reasons: { reason: string; count: number }[]): Record<WakeGroup, number> {
  const totals = Object.fromEntries(wakeGroups.map(group => [group.key, 0])) as Record<WakeGroup, number>;
  for (const { reason, count } of reasons) totals[wakeGroup(reason)] += count;
  return totals;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (value: number) => compact.format(value);

/** "45s", "3m 20s", "2h 5m". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
export const formatCost = (cents: number | null) => cents === null ? "—" : usd.format(cents / 100);
