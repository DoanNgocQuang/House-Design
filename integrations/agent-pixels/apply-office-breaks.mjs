import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { officeRoomLabels } from "./office-room-labels.mjs";

const entry = process.argv[2];
if (!entry) throw new Error("Pass the installed Agent Pixels dist/ui/index.js path.");

const original = readFileSync(entry, "utf8");
const begin = "/* Agent Office breaks begin */";
const end = "/* Agent Office breaks end */";
const source = readFileSync(new URL("./office-breaks.mjs", import.meta.url), "utf8");
const inline = `${begin}\n${source.replace(/^export /gm, "").trimEnd()}\n${end}\n`;
let patched = original;

const replaceOnce = (anchor, replacement) => {
  if (patched.split(anchor).length !== 2) throw new Error(`Unexpected Agent Pixels hook: ${anchor.trim()}`);
  patched = patched.replace(anchor, replacement);
};

const existing = original.indexOf(begin);
if (existing >= 0) {
  const endIndex = original.indexOf(end + "\n", existing);
  if (endIndex < 0) throw new Error("Agent Office breaks end marker is missing.");
  patched = original.slice(0, existing) + inline + original.slice(endIndex + end.length + 1);
} else {
  replaceOnce('    persistedRef.current = readPersistedOffice(companyId, mapId, themeId);', `    const office = officeRef.current;
    for (const ch of office.characters.values()) {
      if (!ch.officeBreak) continue;
      delete ch.officeBreak;
      ch.seatTimer = 0;
      ch.wanderTimer = 0;
    }
    office.breakUpdate = createOfficeBreaks(office, builtMap?.rooms ?? assets.rooms ?? [], findPath, getCatalogEntry);
    persistedRef.current = readPersistedOffice(companyId, mapId, themeId);`);
  replaceOnce('      if (!roomLabels || roomLabels.length === 0) return;', '      const visibleRoomLabels = roomLabels ?? assets.rooms ?? [];\n      if (visibleRoomLabels.length === 0) return;');
  replaceOnce('      for (const room of roomLabels) {', '      for (const room of visibleRoomLabels) {');
  replaceOnce('      const isWorking = activity !== "idle";', `      const isWorking = activity !== "idle";
      if (character) character.officeBreakEligible = agent.id !== "placeholder" &&
        !["terminated", "paused", "error", "pending_approval"].includes(agent.status) && !agent.pendingApproval && !agent.waiting;`);
  replaceOnce('      update: (dt) => office.update(dt),', '      update: (dt) => { office.breakUpdate?.(dt); office.update(dt); },');
  replaceOnce('          drawMeetingSpeech(ctx,office.characters.values(),ch=>{const p=project', `          drawOfficeBreakActivity(ctx, office.characters.values(), ch => project(ch.x, ch.y - 21), window.devicePixelRatio || 1);
          drawMeetingSpeech(ctx,office.characters.values(),ch=>{const p=project`);
  replaceOnce('        drawMeetingSpeech(ctx,office.characters.values(),ch=>({x:offsetX', `        drawOfficeBreakActivity(ctx, office.characters.values(), ch => ({
          x: offsetX + ch.x * zoom, y: offsetY + (ch.y - 25) * zoom,
        }), window.devicePixelRatio || 1);
        drawMeetingSpeech(ctx,office.characters.values(),ch=>({x:offsetX`);
  replaceOnce('      if (w >= 10 && h >= 7) items.push(...meetingTable(w - 5, 2));', `      if (w >= 10 && h >= 7) items.push(...meetingTable(w - 5, 2));
      if (w >= 17 && h >= 7) items.push({ type: "POOL_TABLE", col: 5, row: h - 3 });`);
  replaceOnce('    if (ch.homeRoomId === roomId && seat && hybridContains(room.rect, seat.seatCol, seat.seatRow)) continue;', '    if (ch.homeRoomId === roomId && (!seat || hybridContains(room.rect, seat.seatCol, seat.seatRow))) continue;');
  replaceOnce('    if (ch.homeRoomId === roomId && ch.seatId) continue;', '    if (ch.homeRoomId === roomId) continue;');
  replaceOnce('    ch.homeRoomId = roomId;\n    ch.tileCol', '    ch.homeRoomId = roomId;\n    ch.homeWorkTile = tile;\n    ch.tileCol');
  replaceOnce('delete ch.homeWalkableTiles; delete ch.homeRoomId;', 'delete ch.homeWalkableTiles; delete ch.homeRoomId; delete ch.homeWorkTile;');
  replaceOnce('function getCharacterSprite(ch, sprites) {\n', `function getCharacterSprite(ch, sprites) {
  if (ch.officeBreak?.arrived && !ch.officeMeeting && !ch.isActive) {
    const { activity } = ch.officeBreak.target;
    if (activity === "rest") return sprites.typing[ch.dir][0];
    if (activity !== "rest") return sprites.walk[ch.dir][1];
  }
`);
  patched = inline + patched;
}

patched = patched.replace(
  '    if (activity !== "rest") return sprites.walk[ch.dir][Math.floor(Date.now() / 450) % 2 + 1];',
  '    if (activity !== "rest") return sprites.walk[ch.dir][1];',
);
patched = patched.replace(
  '    const { activity, seatUid } = ch.officeBreak.target;\n    if (seatUid) return sprites.typing[ch.dir][0];',
  '    const { activity } = ch.officeBreak.target;\n    if (activity === "rest") return sprites.typing[ch.dir][0];',
);

if (!patched.includes("character.officeBreakSitOnly =")) {
  replaceOnce('      const nextTool = activity === "research"', `      if (character) character.officeBreakSitOnly = agent.role === "ceo" || agent.name.trim().toLowerCase() === "ceo";
      const nextTool = activity === "research"`);
}

if (!patched.includes('uid: "kitchen-pool-table"')) {
  replaceOnce('    // Break corner\n', `    // Break corner
    { uid: "kitchen-pool-table", type: "POOL_TABLE", col: 2, row: 5 },
`);
}

for (const [from, to] of [
  ["var INDUSTRY_TEMPLATES =", "function getIndustry"],
  ["var hubCentral =", "var MAP_DEFS ="],
  ["function buildOfficeMap", "// src/office/maps/catalog.ts"],
  ['label: "Office", rect: { ...officeAt', "    cameraBounds: {"],
  ["var CLASSIC_ROOM_LABELS =", "var CLASSIC_NAV ="],
]) {
  const start = patched.indexOf(from);
  if (start < 0 && from.startsWith('label: "Office"')) continue;
  const endIndex = patched.indexOf(to, start + from.length);
  if (start < 0 || endIndex < 0) throw new Error(`Agent Pixels labels not found: ${from}`);
  let section = patched.slice(start, endIndex);
  for (const [english, vietnamese] of Object.entries(officeRoomLabels)) {
    section = section.replaceAll(JSON.stringify(english), JSON.stringify(vietnamese));
  }
  patched = patched.slice(0, start) + section + patched.slice(endIndex);
}
patched = patched.replaceAll('"Total \\xB7 All Rooms"', '"Toàn bộ văn phòng"')
  .replaceAll('"← All Rooms"', '"← Tất cả các phòng"');

if (patched !== original) {
  const backup = entry + ".before-office-breaks";
  if (!existsSync(backup)) copyFileSync(entry, backup);
  writeFileSync(entry + ".office-breaks-tmp", patched);
  renameSync(entry + ".office-breaks-tmp", entry);
}
