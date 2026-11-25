// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { AiAccountsUsage, resetsIn, windowName } from "./AiAccountsUsage";

const { list, probeUsage } = vi.hoisted(() => ({ list: vi.fn(), probeUsage: vi.fn() }));
vi.mock("@/api/ai-connections", () => ({ aiConnectionsApi: { list, probeUsage } }));

const account = (id: string, provider: string, method: string, label: string, extra: object = {}) => ({
  id, grantId: `grant-${id}`, companyId: "qld", provider, method, name: provider === "openai" ? "OpenAI" : "Anthropic",
  accountLabel: label, ownership: "shared", isDefault: false, status: "connected", ...extra,
});
const limit = (id: string, label: string, usedPercent: number | null, seconds: number | null, resetsAt: string | null) => ({
  id, label, scope: null, windowDurationSeconds: seconds, resetsAt, usedPercent, remainingPercent: usedPercent === null ? null : 100 - usedPercent,
  used: null, limit: null, remaining: null, unit: null, limitReached: false, allowed: null,
});
const okUsage = (id: string) => ({
  connectionId: id, grantId: `grant-${id}`, provider: "openai", method: "subscription", status: "ok",
  checkedAt: "2026-11-24T02:10:00.000Z", source: null, planType: "plus",
  overage: { enabled: false, available: false, unlimited: null, used: null, limit: null, remaining: 0, balance: null, unit: "credits" },
  limits: [
    limit("primary", "Codex · Primary · 5h", 19, 18_000, "2099-01-01T07:10:00.000Z"),
    limit("secondary", "Codex · Secondary · Weekly", 44, 604_800, "2099-01-03T02:47:00.000Z"),
    limit("spend", "Workspace spend control", null, null, null),
  ],
});

afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); });

async function render() {
  const client = new QueryClient();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await act(async () => root.render(<QueryClientProvider client={client}><AiAccountsUsage companyId="qld" /></QueryClientProvider>));
  return { host, cleanup: async () => { await act(async () => root.unmount()); client.clear(); host.remove(); } };
}

it("shows compact 5-hour and weekly rows with brand marks and hides API-key accounts", async () => {
  list.mockResolvedValue({ currentUserId: "me", canManageConnections: true, connections: [
    account("c1", "openai", "subscription", "owner@example.com"),
    account("c2", "anthropic", "subscription", "claude@example.test"),
    account("g1", "google", "api_key", "Company Google"),
  ] });
  probeUsage.mockImplementation(async (_company: string, id: string) => id === "c1" ? okUsage("c1")
    : { connectionId: id, grantId: `grant-${id}`, provider: "anthropic", method: "subscription", status: "unavailable",
      errorCode: "rate_limited", checkedAt: "2026-11-24T02:10:00.000Z", source: null, planType: null, limits: [], overage: null });
  const { host, cleanup } = await render();
  try {
    await vi.waitFor(() => expect(host.querySelector('article[aria-label="OpenAI"]')?.textContent).toContain("Weekly"));
    const codex = host.querySelector('article[aria-label="OpenAI"]')!;
    expect(codex.textContent).toContain("Codex");
    expect(codex.textContent).toContain("5-hour");
    expect(codex.textContent).toContain("81% left");
    expect(codex.textContent).toContain("56% left");
    expect(codex.textContent).toContain("Resets in");
    expect(codex.textContent).not.toContain("Workspace spend control");
    expect(codex.textContent).not.toContain("Overage");
    expect(codex.querySelector('img[src="/brands/codex-color.svg"]')).not.toBeNull();
    const claude = host.querySelector('article[aria-label="Anthropic"]')!;
    expect(claude.querySelector('img[src="/brands/claude-color.svg"]')).not.toBeNull();
    expect(claude.textContent).toContain("limiting usage checks");
    expect(host.querySelector('article[aria-label="Company Google"]')).toBeNull();
    expect(host.textContent).toContain("1 API-key account has no time-based limits");
    expect(host.textContent).toContain("Lowest remaining: Weekly 56%");
    expect(probeUsage).toHaveBeenCalledTimes(2);
  } finally {
    await cleanup();
  }
});

it("keeps the last good reading when the provider refuses a new check", async () => {
  list.mockResolvedValue({ currentUserId: "me", canManageConnections: true, connections: [account("c1", "openai", "subscription", "a@b.test")] });
  probeUsage.mockResolvedValueOnce(okUsage("c1"));
  const first = await render();
  await vi.waitFor(() => expect(first.host.textContent).toContain("81% left"));
  await first.cleanup();

  probeUsage.mockResolvedValueOnce({ ...okUsage("c1"), status: "unavailable", errorCode: "rate_limited", limits: [] });
  const second = await render();
  try {
    await vi.waitFor(() => expect(second.host.textContent).toContain("limiting usage checks"));
    expect(second.host.textContent).toContain("81% left");
    expect(second.host.textContent).toContain("Last checked");
  } finally {
    await second.cleanup();
  }
});

it("names windows and formats reset countdowns", () => {
  expect(windowName(limit("x", "Codex · Primary · 5h", 1, null, null))).toBe("5-hour");
  expect(windowName(limit("x", "Anything", 1, 604_800, null))).toBe("Weekly");
  expect(windowName(limit("x", "Opus 7d", 1, null, null))).toBe("Weekly");
  const now = Date.parse("2026-11-24T00:00:00Z");
  expect(resetsIn("2026-11-24T04:12:00Z", now)).toMatch(/^Resets in 4h 12m · /);
  expect(resetsIn("2026-11-26T06:00:00Z", now)).toMatch(/^Resets in 2d 6h · /);
  expect(resetsIn(null)).toBeNull();
});
