import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const entry = process.argv[2];
if (!entry) throw new Error("Pass the installed Agent Pixels dist/ui/index.js path.");

const original = readFileSync(entry, "utf8");
const legacyRendererImport = 'import { createOfficeLighting } from "./office-lighting.js";\n';
const begin = "/* Agent Office lighting renderer begin */";
const endMarker = "/* Agent Office lighting renderer end */";
const source = readFileSync(new URL("./office-lighting.mjs", import.meta.url), "utf8");
// Paperclip loads plugin source from a blob URL, which cannot resolve relative imports.
const inlineRenderer = `${begin}\n${source.replace(/^export /, "").trimEnd()}\n${endMarker}\n`;
const existingRenderer = original.indexOf(begin);
let patched;

if (existingRenderer >= 0) {
  const end = original.indexOf(endMarker + "\n", existingRenderer);
  if (end < 0) throw new Error("Agent Office lighting renderer end marker is missing.");
  patched = original.slice(0, existingRenderer) + inlineRenderer + original.slice(end + endMarker.length + 1);
} else if (original.startsWith(legacyRendererImport)) {
  patched = inlineRenderer + original.slice(legacyRendererImport.length);
} else {
  const start = original.indexOf("function PixelOfficeCanvas(");
  const end = original.indexOf("\nfunction ", start + 1);
  if (start < 0 || end < 0) throw new Error("Agent Pixels canvas renderer was not found.");
  const canvas = original.slice(start, end);
  const hooks = [
    ["    const stop = startGameLoop(canvas, {", `    const lightingRooms = roomLabels?.length ? roomLabels.map(room => room.rect)
      : CLASSIC_CAMERA_ORDER.map(id => assets.cameraBounds[id]).filter(Boolean);
    const drawNightLighting = createOfficeLighting(canvas, TILE_SIZE, lightingRooms);
    const stop = startGameLoop(canvas, {`],
    ["          viewTransformRef.current = isoViewState;", `          drawNightLighting(ctx, project, isoZoom);
          viewTransformRef.current = isoViewState;`],
    ["        viewTransformRef.current = { offsetX, offsetY, zoom };", `        drawNightLighting(ctx, (x, y) => ({ x: offsetX + x * zoom, y: offsetY + y * zoom }), zoom);
        viewTransformRef.current = { offsetX, offsetY, zoom };`],
  ];
  let renderer = canvas;
  for (const [anchor, replacement] of hooks) {
    if (canvas.split(anchor).length !== 2) throw new Error(`Unexpected Agent Pixels renderer hook: ${anchor.trim()}`);
    renderer = renderer.replace(anchor, replacement);
  }
  patched = inlineRenderer + original.slice(0, start) + renderer + original.slice(end);
}

if (patched !== original) {
  const backup = entry + ".before-office-lighting";
  if (!existsSync(backup)) copyFileSync(entry, backup);
  writeFileSync(entry + ".office-lighting-tmp", patched);
  renameSync(entry + ".office-lighting-tmp", entry);
}
