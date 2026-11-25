// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { AgentStats } from "./AgentStats";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/client", () => ({ api: { get } }));
vi.mock("@/api/companies-query", () => ({ useAccountIdentity: () => ({ settled: true, userId: "person" }) }));
vi.mock("@/context/BreadcrumbContext", () => {
  const setBreadcrumbs = () => {};
  return { useBreadcrumbs: () => ({ setBreadcrumbs }) };
});
vi.mock("@/context/CompanyContext", () => ({ useCompany: () => ({ selectedCompanyId: "qld" }) }));

it("compares the same filtered metrics in all three charts and keeps the details table available", async () => {
  const empty = { title: null, status: "idle", activeTask: null, todo: 0, inProgress: 0, inReview: 0, blocked: 0, done: 0, points: 0, unestimated: 0, succeeded: 0, failed: 0, timedOut: 0, cancelled: 0, failureRate: null };
  get.mockResolvedValue({ agents: [
    { ...empty, id: "first", name: "Alpha", blocked: 3, done: 4, points: 2, timedOut: 2, failed: 1, succeeded: 3, failureRate: 0.5 },
    { ...empty, id: "second", name: "Beta", done: 2, points: 8, todo: 4, failed: 2, failureRate: 1 },
    { ...empty, id: "third", name: "Zero", title: "Agent kiểm thử" },
  ] });
  const client = new QueryClient();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const chart = (name: string) => host.querySelector(`section[aria-label="${name}"]`)!;
  const firstAgent = (name: string) => chart(name).querySelector('[role="img"]')?.getAttribute("aria-label");
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={["/QLD/agent-stats"]}><QueryClientProvider client={client}><AgentStats /></QueryClientProvider></MemoryRouter>));
    await vi.waitFor(() => expect(firstAgent("Task Output")).toContain("Alpha"));
    expect(firstAgent("Current Workload")).toContain("Beta");
    expect(firstAgent("Run Outcomes")).toContain("Alpha");
    expect(chart("Run Outcomes").textContent).toContain("—");
    expect(chart("Current Workload").querySelector('[aria-label^="Zero"]')?.getAttribute("aria-label")).toContain("Blocked: 0");
    expect(host.querySelector("details")?.open).toBe(false);
    expect(host.querySelector("table")?.textContent).toContain("Agent kiểm thử");
    const points = [...host.querySelectorAll("button")].find(button => button.textContent === "Story Points");
    await act(async () => points!.click());
    expect(firstAgent("Task Output")).toContain("Beta");
    expect(firstAgent("Task Output")).toContain("Story Points: 8");
    const today = [...host.querySelectorAll("button")].find(button => button.textContent === "Today");
    await act(async () => today!.click());
    expect(get).toHaveBeenCalledWith("/companies/qld/agent-stats?period=today", expect.anything());
    const filter = host.querySelector<HTMLInputElement>('input[aria-label="Search agents"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(filter, "Zero");
      filter.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await vi.waitFor(() => expect(firstAgent("Task Output")).toContain("Zero"));
    for (const name of ["Task Output", "Current Workload", "Run Outcomes"]) {
      expect(chart(name).querySelectorAll('[role="img"]')).toHaveLength(1);
      expect(chart(name).innerHTML).not.toMatch(/NaN|Infinity/);
    }
  } finally {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    vi.unstubAllGlobals();
  }
});

it("shows token, wake-reason and summary panels and narrows to an owner request", async () => {
  const row = { id: "pm", name: "PM", title: null, status: "running", activeTask: null, todo: 0, inProgress: 1, inReview: 0, blocked: 0,
    done: 3, points: 5, unestimated: 0, avgTaskSeconds: 200, succeeded: 4, failed: 0, timedOut: 0, cancelled: 0, failureRate: 0,
    inputTokens: 1000, cachedInputTokens: 3000, outputTokens: 200, runSeconds: 125, costCents: null,
    wakeReasons: [{ reason: "issue_blockers_resolved", count: 16 }, { reason: "issue_commented", count: 11 }] };
  const requestId = "00000000-0000-4000-8000-0000000000e1";
  get.mockImplementation(async (url: string) => url.includes("/projects")
    ? [{ id: "00000000-0000-4000-8000-0000000000p1".replace("p1", "a1"), name: "Thiết kế nhà" }]
    : { agents: [row], requests: [{ id: requestId, identifier: "QLD-139", title: "Nhà 2 tầng có sân vườn" }] });
  const client = new QueryClient();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  try {
    await act(async () => root.render(<MemoryRouter><QueryClientProvider client={client}><AgentStats /></QueryClientProvider></MemoryRouter>));
    await vi.waitFor(() => expect(host.querySelector('section[aria-label="Token Usage"]')).not.toBeNull());
    const summary = host.querySelector('[aria-label="Summary"]')!.textContent!;
    expect(summary).toContain("4.2K");
    expect(summary).toContain("71.4% cached");
    expect(summary).toContain("2m 5s");
    const wakes = host.querySelector('section[aria-label="Wake Reasons"] [role="img"]')!.getAttribute("aria-label");
    expect(wakes).toContain("Blockers Resolved: 16");
    expect(wakes).toContain("Commented: 11");
    expect(host.querySelector('section[aria-label="Avg Time per Task"]')!.textContent).toContain("3m 20s");
    expect(host.innerHTML).not.toMatch(/NaN|Infinity/);
    const scope = host.querySelector<HTMLSelectElement>('select[aria-label="Scope"]')!;
    await vi.waitFor(() => expect(scope.querySelector(`optgroup[label="Request"] option[value="request:${requestId}"]`)).not.toBeNull());
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(scope, `request:${requestId}`);
      scope.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await vi.waitFor(() => expect(get).toHaveBeenCalledWith(`/companies/qld/agent-stats?period=7d&requestId=${requestId}`, expect.anything()));
  } finally {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    vi.unstubAllGlobals();
  }
});
