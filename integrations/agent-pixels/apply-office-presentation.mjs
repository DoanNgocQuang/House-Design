import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const entry = process.argv[2];
if (!entry) throw new Error("Pass the installed Agent Pixels dist/ui/index.js path.");

const original = readFileSync(entry, "utf8");
const begin = "/* Agent Office presentation begin */";
const end = "/* Agent Office presentation end */";
const source = readFileSync(new URL("./office-presentation.mjs", import.meta.url), "utf8");
const inline = `${begin}\n${source.replace(/^export /gm, "").trimEnd()}\n${end}\n`;
let patched = original;

function replaceOnce(anchor, replacement) {
  if (patched.split(anchor).length !== 2) throw new Error(`Unexpected Agent Pixels hook: ${anchor.trim()}`);
  patched = patched.replace(anchor, replacement);
}

function replaceRange(from, to, replacement) {
  const start = patched.indexOf(from);
  const endIndex = patched.indexOf(to, start + from.length);
  if (start < 0 || endIndex < 0) throw new Error(`Agent Pixels range not found: ${from.trim()}`);
  patched = patched.slice(0, start) + replacement + patched.slice(endIndex);
}

const existing = original.indexOf(begin);
if (existing >= 0) {
  const endIndex = original.indexOf(end + "\n", existing);
  if (endIndex < 0) throw new Error("Agent Office presentation end marker is missing.");
  patched = original.slice(0, existing) + inline + original.slice(endIndex + end.length + 1);
} else {
  replaceOnce('function AgentPixelsCameraPage() {\n  const pageRef = useRef2(null);', `function AgentPixelsCameraPage() {
  const pageRef = useRef2(null);
  const [toolbarTarget, setToolbarTarget] = useState2(null);
  const [orbitResetToken, setOrbitResetToken] = useState2(0);
  useEffect2(() => {
    setToolbarTarget(pageRef.current?.closest(".pixel-office-view")?.querySelector("[data-office-settings]") ?? null);
  }, []);`);
  replaceOnce(`  return /* @__PURE__ */ jsxs2("main", { ref: pageRef, className: "pixel-agent-page", style: styles.page, children: [
    jsx2("style", { children: pixelAgentLayout }),
    /* @__PURE__ */ jsxs2("header", { style: styles.header, children: [
      /* @__PURE__ */ jsxs2("div", { children: [`, `  const toolbar = jsxs2("header", { style: toolbarTarget ? undefined : styles.header,
    className: toolbarTarget ? "agent-office-settings-panel" : undefined, children: [
      !toolbarTarget && jsxs2("div", { children: [`);
  replaceOnce('jsxs2("div", { style: styles.cameraTabs, children: [', 'jsxs2("div", { style: toolbarTarget ? undefined : styles.cameraTabs, children: [');
  replaceOnce(`        /* @__PURE__ */ jsx2(
          LiveStatusBadge,`, `        toolbarTarget && view === "map" && jsx2("button", {
          type: "button",
          style: styles.cameraTab,
          onClick: () => setOrbitResetToken(token => token + 1),
          children: "Đặt lại góc nhìn",
        }),
        /* @__PURE__ */ jsx2(
          LiveStatusBadge,`);
  replaceOnce(`      ] })
    ] }),
    settings.mapId === "hybrid-office" && (data?.meetings?.length > 0)`, `      ] })
    ] });
  return jsxs2("main", { ref: pageRef, className: "pixel-agent-page", style: styles.page, children: [
    jsx2("style", { children: pixelAgentLayout }),
    toolbarTarget ? createPortal(jsxs2("details", {
      className: "agent-office-settings",
      onKeyDown: event => {
        if (event.key !== "Escape" || !event.currentTarget.open) return;
        event.stopPropagation();
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      },
      children: [jsx2("summary", { children: "Cài đặt" }), toolbar],
    }), toolbarTarget) : toolbar,
    settings.mapId === "hybrid-office" && (data?.meetings?.length > 0)`);
  replaceOnce('          themeId: settings.themeId,\n          resetToken,', '          themeId: settings.themeId,\n          orbitResetToken,\n          hideOrbitReset: !!toolbarTarget,\n          resetToken,');
  replaceOnce('  themeId,\n  resetToken,\n  roomLabels,', '  themeId,\n  orbitResetToken,\n  hideOrbitReset,\n  resetToken,\n  roomLabels,');
  replaceOnce('  const orbitRef=useRef({yaw:Math.PI/4,pitch:Math.PI/6});', `  const orbitRef=useRef({yaw:Math.PI/4,pitch:Math.PI/6});
  useEffect(() => {
    orbitRef.current = { yaw: Math.PI / 4, pitch: Math.PI / 6 };
  }, [orbitResetToken]);`);
  replaceOnce('camera === "map" && jsx("button", { type:"button", onClick:()=>{orbitRef.current=', 'camera === "map" && !hideOrbitReset && jsx("button", { type:"button", onClick:()=>{orbitRef.current=');
  replaceRange(
    '          ctx.save();\n          ctx.font = `${Math.max(11, Math.floor(6 * isoZoom))}',
    '          drawMeetingSpeech(ctx,office.characters.values(),ch=>{const p=project',
    `          drawOfficeAgentLabels(ctx, office.characters.values(), agentMeta, project, isoZoom,
            window.devicePixelRatio || 1, CHARACTER_SITTING_OFFSET_PX * 0.5, selectionRef.current);
`,
  );
  replaceRange(
    '        drawRoomLabels(ctx, offsetX, offsetY, zoom);\n        ctx.save();',
    '        drawMeetingSpeech(ctx,office.characters.values(),ch=>({x:offsetX',
    `        drawRoomLabels(ctx, offsetX, offsetY, zoom);
        drawOfficeAgentLabels(ctx, office.characters.values(), agentMeta, (x, y) => ({
          x: offsetX + x * zoom, y: offsetY + y * zoom,
        }), zoom, window.devicePixelRatio || 1, CHARACTER_SITTING_OFFSET_PX, selectionRef.current);
`,
  );
  patched = inline + 'import { createPortal } from "react-dom";\n' + patched;
}

replaceRange(
  '    function drawRoomLabels(ctx, offsetX, offsetY, zoom) {',
  '    const lightingRooms =',
  `    function drawRoomLabels(ctx, offsetX, offsetY, zoom) {
      drawOfficeRoomLabels(ctx, roomFocus ? [roomFocus] : roomLabels ?? assets.rooms ?? [], {
        offsetX, offsetY, zoom, tileSize: TILE_SIZE, dpr: window.devicePixelRatio || 1,
      });
    }
`,
);

if (patched !== original) {
  const backup = entry + ".before-office-presentation";
  if (!existsSync(backup)) copyFileSync(entry, backup);
  writeFileSync(entry + ".office-presentation-tmp", patched);
  renameSync(entry + ".office-presentation-tmp", entry);
}
