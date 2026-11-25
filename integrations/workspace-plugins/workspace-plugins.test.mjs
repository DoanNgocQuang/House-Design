import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = name => fileURLToPath(new URL(name, import.meta.url));

test("builds both customized plugins and restores only a matching installation", () => {
  const dir = mkdtempSync(join(tmpdir(), "paperclip-workspace-plugins-"));
  const output = join(dir, "packages");
  execFileSync(process.execPath, [script("build.mjs"), output]);
  const pixel = join(output, "agent-pixels");
  const telegram = join(output, "telegram");
  const pixelUi = readFileSync(join(pixel, "dist", "ui", "index.js"), "utf8");
  for (const feature of ["Hybrid Office", "applyOfficeMeetings", "drawNightLighting", "officeBreakSitOnly", "withOfficeDecor", "#166534"]) {
    assert.ok(pixelUi.includes(feature), feature);
  }
  assert.ok(readFileSync(join(pixel, "dist", "ui", "assets", "agent-pixels-assets.json")).length > 0);
  assert.ok(readFileSync(join(telegram, "dist", "chat-room-bridge.js")).length > 0);
  for (const pkgPath of [pixel, telegram]) {
    const pkg = JSON.parse(readFileSync(join(pkgPath, "package.json"), "utf8"));
    for (const entry of Object.values(pkg.paperclipPlugin)) {
      if (entry.endsWith(".js")) execFileSync(process.execPath, ["--check", join(pkgPath, entry)]);
    }
  }

  const home = join(dir, "home");
  const installed = join(home, ".paperclip", "plugins", "node_modules");
  const installedPixel = join(installed, "@tomartec", "pixel-agent");
  const installedTelegram = join(installed, "paperclip-plugin-telegram");
  mkdirSync(join(installed, "@tomartec"), { recursive: true });
  cpSync(pixel, installedPixel, { recursive: true });
  cpSync(telegram, installedTelegram, { recursive: true });
  writeFileSync(join(installedPixel, "dist", "ui", "index.js"), "old interface");
  writeFileSync(join(installedTelegram, "dist", "manifest.js"), "operator-installed manifest");
  writeFileSync(join(home, "database-sentinel"), "keep");
  execFileSync(process.execPath, [script("restore.mjs"), output, home]);
  assert.equal(readFileSync(join(installedPixel, "dist", "ui", "index.js"), "utf8"), pixelUi);
  assert.equal(readFileSync(join(installedTelegram, "dist", "manifest.js"), "utf8"), "operator-installed manifest");
  assert.equal(readFileSync(join(home, "database-sentinel"), "utf8"), "keep");
});
