// @vitest-environment jsdom

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PluginPage } from "./PluginPage";

const mockPluginsApi = vi.hoisted(() => ({
  listUiContributions: vi.fn(),
}));

const mockSetBreadcrumbs = vi.hoisted(() => vi.fn());
const mockLoadContribution = vi.hoisted(() => vi.fn(async () => {}));
const mockParams = vi.hoisted(() => ({
  companyPrefix: "PAP" as string | undefined,
  pluginId: undefined as string | undefined,
  pluginRoutePath: undefined as string | undefined,
  "*": undefined as string | undefined,
}));

vi.mock("@/api/plugins", () => ({
  pluginsApi: mockPluginsApi,
}));

vi.mock("@/context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({
    setBreadcrumbs: mockSetBreadcrumbs,
  }),
}));

vi.mock("@/context/CompanyContext", () => ({
  useCompany: () => ({
    companies: [{ id: "company-1", name: "Paperclip", issuePrefix: "PAP" }],
    selectedCompanyId: "company-1",
  }),
}));

vi.mock("@/components/ToastViewport", () => ({ ToastViewport: () => null }));

vi.mock("@/lib/router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Navigate: () => null,
  useParams: () => mockParams,
}));

vi.mock("@/plugins/slots", async () => {
  const actual = await vi.importActual<typeof import("@/plugins/slots")>("@/plugins/slots");
  return {
    ensurePluginContributionLoaded: mockLoadContribution,
    resolveRouteSidebarSlot: actual.resolveRouteSidebarSlot,
    PluginSlotMount: ({ slot }: { slot: { displayName: string } }) => (
      <div data-testid="plugin-slot-mount">{slot.displayName}</div>
    ),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function act(callback: () => void | Promise<void>) {
  await callback();
  await Promise.resolve();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

function pageContribution(overrides: Partial<{ slots: unknown[] }> = {}) {
  return {
    pluginId: "plugin-wiki",
    pluginKey: "paperclipai.plugin-llm-wiki",
    displayName: "LLM Wiki",
    version: "0.1.0",
    uiEntryFile: "ui.js",
    slots: [
      {
        type: "page",
        id: "wiki-page",
        displayName: "Wiki",
        exportName: "WikiPage",
        routePath: "wiki",
      },
    ],
    launchers: [],
    ...overrides,
  };
}

async function renderPage(container: HTMLDivElement, standaloneRoute?: "agent-pixels") {
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <PluginPage standaloneRoute={standaloneRoute} />
      </QueryClientProvider>,
    );
  });
  await flushReact();
  await flushReact();
  return root;
}

describe("PluginPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockParams.companyPrefix = "PAP";
    mockParams.pluginId = undefined;
    mockParams.pluginRoutePath = undefined;
    mockParams["*"] = undefined;
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("shows a standalone Agent Office and changes to night at 18:00 local time", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date(2026, 10, 19, 17, 59, 59));
    mockPluginsApi.listUiContributions.mockResolvedValue([pageContribution({
      slots: [{ type: "page", id: "agent-pixels-camera-page", displayName: "Agent Pixels", exportName: "AgentPixelsCameraPage", routePath: "agent-pixels" }],
    })]);
    const root = await renderPage(container, "agent-pixels");
    try {
      const office = container.querySelector('[aria-label="Agent Office"]');
      expect(office?.getAttribute("data-lighting")).toBe("day");
      expect(office?.querySelector("time")?.textContent).toBe("17:59:59");
      expect(office?.querySelector('[data-testid="plugin-slot-mount"]')?.textContent).toBe("Agent Pixels");
      expect(mockLoadContribution).toHaveBeenCalledOnce();
      expect(container.textContent).not.toContain("Back");
      await act(() => { vi.advanceTimersByTime(1000); });
      expect(office?.getAttribute("data-lighting")).toBe("night");
      expect(office?.querySelector("time")?.textContent).toBe("18:00:00");
      const lighting = office?.querySelector<HTMLSelectElement>('select[aria-label="Lighting"]');
      expect(lighting?.value).toBe("auto");
      await act(() => {
        lighting!.value = "day";
        lighting!.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(office?.getAttribute("data-lighting")).toBe("day");
      await act(() => {
        lighting!.value = "night";
        lighting!.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(office?.getAttribute("data-lighting")).toBe("night");
      await act(() => {
        lighting!.value = "auto";
        lighting!.dispatchEvent(new Event("change", { bubbles: true }));
        vi.setSystemTime(new Date(2026, 10, 20, 6));
        vi.advanceTimersByTime(1000);
      });
      expect(office?.getAttribute("data-lighting")).toBe("day");
    } finally {
      await act(() => root.unmount());
      vi.useRealTimers();
      localStorage.removeItem("paperclip.agent-office.lighting");
    }
  });

  it("renders the breadcrumb and Back button on a legacy plugin route (no routeSidebar)", async () => {
    mockParams.pluginRoutePath = "wiki";
    mockPluginsApi.listUiContributions.mockResolvedValue([pageContribution()]);

    const root = await renderPage(container);

    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { label: "Plugins", href: "/company/settings/instance/plugins" },
      { label: "LLM Wiki" },
    ]);
    expect(container.textContent).toContain("Back");
    expect(container.querySelector('a[href="/PAP/dashboard"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("shows the Chat room page title instead of its Agent Pixels plugin name", async () => {
    mockParams.pluginRoutePath = "agent-chat-rooms";
    mockPluginsApi.listUiContributions.mockResolvedValue([{...pageContribution(), displayName: "Agent Pixels", slots: [{type: "page", id: "agent-chat-rooms", displayName: "Chat room", exportName: "AgentChatRoomsPage", routePath: "agent-chat-rooms"}]}]);
    const root = await renderPage(container);
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      {label: "Plugins", href: "/company/settings/instance/plugins"},
      {label: "Chat room"},
    ]);
    await act(async () => { root.unmount(); });
  });

  it("uses a route title and hides the Back button when a routeSidebar matches the active route", async () => {
    mockParams.pluginRoutePath = "wiki";
    mockPluginsApi.listUiContributions.mockResolvedValue([
      pageContribution({
        slots: [
          {
            type: "page",
            id: "wiki-page",
            displayName: "Wiki",
            exportName: "WikiPage",
            routePath: "wiki",
          },
          {
            type: "routeSidebar",
            id: "wiki-sidebar",
            displayName: "Wiki Sidebar",
            exportName: "WikiRouteSidebar",
            routePath: "wiki",
          },
        ],
      }),
    ]);

    const root = await renderPage(container);

    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([{ label: "Wiki" }]);
    expect(container.textContent).not.toContain("Back");
    expect(container.querySelector('a[href="/PAP/dashboard"]')).toBeNull();
    // Page slot itself still renders.
    expect(container.querySelector('[data-testid="plugin-slot-mount"]')?.textContent).toBe("Wiki");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses the selected plugin page path as the route-sidebar title", async () => {
    mockParams.pluginRoutePath = "wiki";
    mockParams["*"] = "page/templates%3A%3Aindex.md";
    mockPluginsApi.listUiContributions.mockResolvedValue([
      pageContribution({
        slots: [
          {
            type: "page",
            id: "wiki-page",
            displayName: "Wiki",
            exportName: "WikiPage",
            routePath: "wiki",
          },
          {
            type: "routeSidebar",
            id: "wiki-sidebar",
            displayName: "Wiki Sidebar",
            exportName: "WikiRouteSidebar",
            routePath: "wiki",
          },
        ],
      }),
    ]);

    const root = await renderPage(container);

    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([{ label: "index" }]);

    await act(async () => {
      root.unmount();
    });
  });
});
