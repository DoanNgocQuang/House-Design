import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const integrations = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(process.argv[2] ?? join(integrations, "workspace-plugins", "dist"));
const metadata = new Set(["package.json", "README.md", "LICENSE"]);

for (const name of ["agent-pixels", "telegram"]) {
  const source = join(integrations, name, "source");
  const bundle = join(output, name);
  mkdirSync(join(bundle, "dist"), { recursive: true });
  for (const entry of readdirSync(source)) {
    cpSync(join(source, entry), join(bundle, metadata.has(entry) ? "" : "dist", entry), { recursive: true });
  }
}

const pixelEntry = join(output, "agent-pixels", "dist", "ui", "index.js");
for (const layer of ["lighting", "breaks", "presentation", "decor"]) {
  execFileSync(process.execPath, [join(integrations, "agent-pixels", `apply-office-${layer}.mjs`), pixelEntry], { stdio: "inherit" });
  const backup = `${pixelEntry}.before-office-${layer}`;
  if (existsSync(backup)) unlinkSync(backup);
}

// Local Telegram installs need the worker-side SDK. Bundle the exports it uses
// against the compiled Shared package, since the workspace's normal export
// points at TypeScript. Existing npm installs keep their own SDK.
const sdk = join(integrations, "..", "packages", "plugins", "sdk");
if (existsSync(join(sdk, "dist", "index.js"))) {
  const { buildSync } = await import("esbuild");
  const runtimeSdk = join(output, "node_modules", "@paperclipai", "plugin-sdk");
  mkdirSync(runtimeSdk, { recursive: true });
  buildSync({
    stdin: {
      contents: [
        'export { definePlugin } from "./define-plugin.js";',
        'export { runWorker } from "./worker-rpc-host.js";',
        'export { JsonRpcCallError, PLUGIN_RPC_ERROR_CODES } from "./protocol.js";',
      ].join("\n"),
      resolveDir: join(sdk, "dist"),
    },
    alias: { "@paperclipai/shared": join(integrations, "..", "packages", "shared", "dist", "index.js") },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: join(runtimeSdk, "index.js"),
  });
  writeFileSync(join(runtimeSdk, "package.json"), '{"type":"module","exports":"./index.js"}\n');
}

console.log(`Built local Paperclip plugins in ${output}`);
