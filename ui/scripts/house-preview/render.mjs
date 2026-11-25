#!/usr/bin/env node
/**
 * Render house_builder .glb files to PNG with the viewer's realistic materials (headless Edge or Chrome).
 *   node ui/scripts/house-preview/render.mjs --out <dir> [--view front|back|top] [--size 1280x860] a.glb b.glb ...
 * Writes <dir>/<name>.png for each model.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  if (at < 0) return fallback;
  const [value] = args.splice(at, 2).slice(1);
  return value;
};
const out = path.resolve(option("--out", "previews"));
const view = option("--view", "front");
const [width, height] = option("--size", "1280x860").split("x").map(Number);
const models = args.map((file) => path.resolve(file));
if (!models.length) {
  console.error("usage: render.mjs --out <dir> [--view front|back|top] [--size WxH] model.glb ...");
  process.exit(2);
}

const browser = [
  process.env.PREVIEW_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/chromium", "/usr/bin/google-chrome",
].find((candidate) => candidate && fs.existsSync(candidate));
if (!browser) throw new Error("No Edge/Chrome found; set PREVIEW_BROWSER");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "house-preview-"));
await build({
  entryPoints: [path.join(here, "entry.ts")],
  bundle: true,
  format: "esm",
  outfile: path.join(work, "bundle.js"),
  nodePaths: [path.join(here, "../../node_modules")],
  logLevel: "warning",
});
fs.writeFileSync(path.join(work, "index.html"),
  '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;background:#eef3f7}</style></head>' +
  '<body><script type="module" src="bundle.js"></script></body></html>');

const types = { ".html": "text/html", ".js": "text/javascript", ".glb": "model/gltf-binary", ".jpg": "image/jpeg", ".hdr": "application/octet-stream" };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, "http://x").pathname.slice(1));
  const file = name.startsWith("models/") ? models[Number(name.split("/")[1])]
    : name.startsWith("house-textures/") ? path.join(here, "../../public/house-textures", path.basename(name))
    : path.join(work, name);
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
fs.mkdirSync(out, { recursive: true });
try {
  for (const [index, model] of models.entries()) {
    const target = path.join(out, `${path.basename(model, ".glb")}.png`);
    const url = `http://127.0.0.1:${port}/index.html?model=models/${index}&view=${view}&w=${width}&h=${height}`;
    await new Promise((resolve, reject) => {
      // Run the browser asynchronously so this process keeps serving the page and model.
      import("node:child_process").then(({ execFile }) => execFile(browser, [
        "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars",
        `--window-size=${width},${height}`, "--virtual-time-budget=30000", `--screenshot=${target}`, url,
      ], { timeout: 120000 }, (error) => (error && !fs.existsSync(target) ? reject(error) : resolve())));
    });
    console.log(`rendered ${target}`);
  }
} finally {
  server.close();
  fs.rmSync(work, { recursive: true, force: true });
}
void execFileSync;
