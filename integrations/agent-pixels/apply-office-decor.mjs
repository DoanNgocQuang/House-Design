import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const entry = process.argv[2];
if (!entry) throw new Error("Pass the installed Agent Pixels dist/ui/index.js path.");

const original = readFileSync(entry, "utf8");
const begin = "/* Agent Office decor begin */";
const end = "/* Agent Office decor end */";
const source = readFileSync(new URL("./office-decor.mjs", import.meta.url), "utf8");
const inline = `${begin}\n${source.replace(/^export /gm, "").trimEnd()}\n${end}\n`;
const existing = original.indexOf(begin);
let patched = original;

if (existing >= 0) {
  const endIndex = original.indexOf(end + "\n", existing);
  if (endIndex < 0) throw new Error("Agent Office decor end marker is missing.");
  patched = original.slice(0, existing) + inline + original.slice(endIndex + end.length + 1);
} else {
  const replace = (anchor, replacement) => {
    if (patched.split(anchor).length !== 2) throw new Error(`Unexpected Agent Pixels hook: ${anchor.trim()}`);
    patched = patched.replace(anchor, replacement);
  };
  replace(
    '    const layout = builtMap ? builtMap.layout : applyThemeToLayout(assets.layouts.combined, themeId);',
    `    const sourceLayout = builtMap ? builtMap.layout : applyThemeToLayout(assets.layouts.combined, themeId);
    const layout = withOfficeDecor(sourceLayout, mapId);`,
  );
  replace('      if (isNew && saved && character?.seatId === saved.seatId) {', `      if (isNew && saved && character?.seatId === saved.seatId &&
          (isWalkable(saved.tileCol, saved.tileRow, office.tileMap, office.blockedTiles) ||
           office.ownSeatKey(character) === saved.tileCol + "," + saved.tileRow)) {`);
  patched = inline + patched;
}

if (patched !== original) {
  const backup = entry + ".before-office-decor";
  if (!existsSync(backup)) copyFileSync(entry, backup);
  writeFileSync(entry + ".office-decor-tmp", patched);
  renameSync(entry + ".office-decor-tmp", entry);
}
