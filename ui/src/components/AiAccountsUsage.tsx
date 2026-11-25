import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportsAiConnectionUsage, type AiConnectionUsage, type AiConnectionUsageLimit, type AiManagedConnectionSummary } from "@paperclipai/shared";
import { aiConnectionsApi } from "@/api/ai-connections";
import { AdapterMark } from "@/components/AdapterMark";
import { Button } from "@/components/ui/button";

const providerBrand: Record<string, { mark: string; name: string }> = {
  openai: { mark: "codex_local", name: "Codex" },
  anthropic: { mark: "claude_local", name: "Claude" },
  google: { mark: "gemini_local", name: "Gemini" },
};
const statusLabels: Record<string, string> = {
  connected: "Connected", needs_attention: "Needs attention", expired: "Expired", revoked: "Revoked",
};
const errorText: Record<string, string> = {
  rate_limited: "Provider is limiting usage checks. Try again in a few minutes.",
  permission_denied: "This sign-in does not share usage limits.",
  authentication_required: "Sign in again in Apps to see usage.",
  connection_unavailable: "Account is not reachable right now.",
  provider_unavailable: "Provider did not answer. Try again later.",
};
const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayTime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const STORAGE_KEY = "paperclip.ai-account-usage.v1";

/** "5-hour", "Weekly", or the provider's own label. */
export function windowName(window: AiConnectionUsageLimit): string {
  if (window.windowDurationSeconds === 18_000) return "5-hour";
  if (window.windowDurationSeconds === 604_800) return "Weekly";
  const label = window.label.toLowerCase();
  if (/\b5h\b|5-hour|five/.test(label)) return "5-hour";
  if (/weekly|\b7d\b|seven/.test(label)) return "Weekly";
  return window.label;
}

export function resetsIn(resetsAt: string | null, now = Date.now()): string | null {
  if (!resetsAt) return null;
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - now) / 60_000));
  const span = minutes >= 1440 ? `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
    : minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  const at = new Date(resetsAt);
  return `Resets in ${span} · ${minutes >= 1440 ? dayTime.format(at) : time.format(at)}`;
}

const barColor = (used: number) => used >= 90 ? "bg-[var(--status-task-blocked)]" : used >= 70 ? "bg-orange-500" : "bg-[var(--status-task-icon-done)]";

// Last good reading per account, so a provider refusing a re-check does not blank the card.
function readSaved(): Record<string, AiConnectionUsage> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, AiConnectionUsage>; } catch { return {}; }
}
function saveGood(grantId: string, usage: AiConnectionUsage) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), [grantId]: usage })); } catch { /* storage unavailable */ }
}

function AccountCard({ account, usage, checking }: { account: AiManagedConnectionSummary; usage: AiConnectionUsage | undefined; checking: boolean }) {
  const brand = providerBrand[account.provider];
  const saved = usage?.status === "ok" ? usage : readSaved()[account.grantId];
  const shown = saved?.status === "ok" ? saved : undefined;
  const windows = (shown?.limits ?? []).filter(window => window.usedPercent !== null);
  const problem = usage && usage.status !== "ok" ? errorText[usage.errorCode ?? ""] ?? usage.message ?? "Usage is not available." : null;
  return <article aria-label={account.name} className="min-w-0 space-y-3 rounded-lg border p-4">
    <header className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <AdapterMark type={brand?.mark ?? account.provider} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold" title={account.name}>{brand?.name ?? account.name}</h3>
        <p className="truncate text-xs text-muted-foreground" title={account.accountLabel}>{account.accountLabel ?? account.name}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${account.status === "connected" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
        {statusLabels[account.status] ?? account.status}
      </span>
    </header>
    {checking && !shown && <p role="status" className="text-xs text-muted-foreground">Checking usage…</p>}
    {windows.length > 0 && <ul className="space-y-3">
      {windows.map(window => {
        const used = Math.min(100, Math.max(0, window.usedPercent ?? 0));
        const reset = resetsIn(window.resetsAt);
        return <li key={window.id} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{windowName(window)}</span>
            <span className="tabular-nums"><span className="font-semibold">{Math.round(100 - used)}% left</span>
              <span className="ml-1 text-xs text-muted-foreground">({Math.round(used)}% used)</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${windowName(window)} used`} aria-valuenow={Math.round(used)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full ${barColor(used)}`} style={{ width: `${used}%` }} />
          </div>
          {reset && <p className="text-xs text-muted-foreground">{reset}</p>}
        </li>;
      })}
    </ul>}
    {shown && windows.length === 0 && <p className="text-xs text-muted-foreground">No time-based limits reported.</p>}
    {problem && <p role="status" className="text-xs text-muted-foreground">{problem}</p>}
    {shown && <p className="text-xs text-muted-foreground">
      {usage?.status === "ok" ? "Checked" : "Last checked"} {dayTime.format(new Date(shown.checkedAt))}{shown.planType ? ` · ${shown.planType} plan` : ""}
    </p>}
  </article>;
}

/** Provider-reported 5-hour and weekly allowances, and reset times, for the company's subscription AI accounts. */
export function AiAccountsUsage({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ["ai-connections", companyId], queryFn: () => aiConnectionsApi.list(companyId) });
  // Revoked accounts were removed by the owner; API-key accounts have no time-based allowance.
  const all = (accounts.data?.connections ?? []).filter(account => account.status !== "revoked");
  const list = all.filter(account => supportsAiConnectionUsage(account.provider, account.method));
  const skipped = all.length - list.length;
  // Each check asks the provider, which throttles frequent checks: keep results 15 minutes and refresh on request only.
  const usages = useQueries({ queries: list.map(account => ({
    queryKey: ["ai-connection-usage", companyId, account.id, account.grantId],
    queryFn: async () => {
      const usage = await aiConnectionsApi.probeUsage(companyId, account.id, account.grantId);
      if (usage.status === "ok") saveGood(account.grantId, usage);
      return usage;
    },
    enabled: account.status === "connected",
    staleTime: 900_000,
    refetchOnWindowFocus: false,
    retry: false,
  })) });
  const refreshing = usages.some(usage => usage.isFetching);
  const lowest = list.flatMap((account, index) => {
    const usage = usages[index]?.data?.status === "ok" ? usages[index].data : readSaved()[account.grantId];
    return (usage?.limits ?? []).filter(window => window.usedPercent !== null)
      .map(window => ({ left: 100 - (window.usedPercent ?? 0), window: windowName(window), who: `${providerBrand[account.provider]?.name ?? account.name} · ${account.accountLabel ?? account.name}` }));
  }).sort((a, b) => a.left - b.left)[0];

  return <section aria-label="AI Accounts" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-xs sm:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-semibold">AI Accounts</h2>
        <p className="text-xs text-muted-foreground">
          {lowest ? `Lowest remaining: ${lowest.window} ${Math.round(lowest.left)}% (${lowest.who})` : "Remaining 5-hour and weekly allowance reported by each provider."}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={refreshing || !list.length}
        onClick={() => void queryClient.invalidateQueries({ queryKey: ["ai-connection-usage", companyId] })}>
        {refreshing ? "Checking…" : "Refresh usage"}
      </Button>
    </header>
    {accounts.isError ? <div className="flex items-center gap-2 text-sm" role="alert">Could not load AI accounts. <Button variant="outline" size="sm" onClick={() => void accounts.refetch()}>Retry</Button></div> :
      accounts.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading AI accounts…</p> :
      !list.length ? <p className="text-sm text-muted-foreground">No subscription AI accounts yet. Add Claude or Codex sign-ins in Apps.</p> :
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {list.map((account, index) => <AccountCard key={account.grantId} account={account} usage={usages[index]?.data}
          checking={usages[index]?.fetchStatus === "fetching"} />)}
      </div>}
    {skipped > 0 && <p className="text-xs text-muted-foreground">{skipped} API-key account{skipped > 1 ? "s have" : " has"} no time-based limits and {skipped > 1 ? "are" : "is"} not shown.</p>}
  </section>;
}
