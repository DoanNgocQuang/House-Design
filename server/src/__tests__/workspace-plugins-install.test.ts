import { describe, expect, it, vi } from "vitest";
import { ensureWorkspacePlugins, workspacePluginPaths } from "../services/bundled-plugins.js";

function deps(installedKeys: string[]) {
  const registered = new Set(installedKeys);
  return {
    registry: {
      getByKey: vi.fn(async (key: string) => (registered.has(key) ? { id: `row-${key}`, pluginKey: key } : null)),
      update: vi.fn(),
      updateStatus: vi.fn(),
    },
    loader: {
      loadManifest: vi.fn(async (p: string) => (p.endsWith("missing") ? null : { id: `key-${p.split("/").pop()}` })),
      installPlugin: vi.fn(async ({ localPath }: { localPath: string }) => {
        const key = `key-${localPath.split("/").pop()}`;
        registered.add(key);
        return { manifest: { id: key } };
      }),
    },
    lifecycle: { load: vi.fn() },
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  } as any;
}

describe("workspace plugin auto-install", () => {
  it("installs only plugins that are not registered yet and skips missing bundles", async () => {
    const d = deps(["key-telegram"]);
    await ensureWorkspacePlugins(["/dist/agent-pixels", "/dist/telegram", "/dist/missing"], d);
    expect(d.loader.installPlugin).toHaveBeenCalledTimes(1);
    expect(d.loader.installPlugin).toHaveBeenCalledWith({ localPath: "/dist/agent-pixels" });
    expect(d.lifecycle.load).toHaveBeenCalledWith("row-key-agent-pixels");
  });

  it("keeps booting when an install fails", async () => {
    const d = deps([]);
    d.loader.installPlugin.mockRejectedValueOnce(new Error("boom"));
    await expect(ensureWorkspacePlugins(["/dist/agent-pixels", "/dist/telegram"], d)).resolves.toBeUndefined();
    expect(d.loader.installPlugin).toHaveBeenCalledTimes(2);
    expect(d.logger.error).toHaveBeenCalled();
  });

  it("is off unless PAPERCLIP_INSTALL_WORKSPACE_PLUGINS=true", () => {
    expect(workspacePluginPaths({})).toEqual([]);
    expect(workspacePluginPaths({ PAPERCLIP_INSTALL_WORKSPACE_PLUGINS: "true", PAPERCLIP_WORKSPACE_PLUGIN_ROOT: "/x" }).map((p) => p.replace(/\\/g, "/")))
      .toEqual(["/x/agent-pixels", "/x/telegram"]);
  });
});
