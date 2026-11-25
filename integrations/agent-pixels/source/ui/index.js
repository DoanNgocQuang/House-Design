// src/ui/index.tsx
import { useEffect as useEffect2, useMemo as useMemo2, useRef as useRef2, useState as useState2 } from "react";
import { usePluginAction, useHostContext, useHostNavigation, usePluginData, usePluginStream, usePluginToast } from "@paperclipai/plugin-sdk/ui";

// src/manifest.ts
var PLUGIN_ID = "4d696994-e10d-4a05-a063-ca8b6e95de80";
var PLUGIN_VERSION = "2026.807.2";
var PAGE_ROUTE = "agent-pixels";
var SLOT_IDS = {
  sidebar: "agent-pixels-sidebar",
  page: "agent-pixels-camera-page",
  settingsPage: "agent-pixels-settings-page"
};
var EXPORT_NAMES = {
  sidebar: "AgentPixelsSidebarLink",
  page: "AgentPixelsCameraPage",
  settingsPage: "AgentPixelsSettingsPage"
};
var manifest = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Agent Pixels",
  description: "Security camera style pixel office view for Paperclip companies.",
  author: "tomartec",
  categories: ["ui"],
  capabilities: [
    "companies.read",
    "agents.read",
    "issues.read",
    "events.emit",
    "issues.update",
    "issues.create",
    "issues.wakeup",
    "issue.comments.create",
    "ui.action.register",
    "events.subscribe",
    "instance.settings.register",
    "ui.sidebar.register",
    "ui.page.register"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  ui: {
    slots: [
      {type: "page", id: "agent-chat-rooms", displayName: "Chat room", exportName: "AgentChatRoomsPage", routePath: "agent-chat-rooms"},
      {
        type: "sidebar",
        id: SLOT_IDS.sidebar,
        displayName: "Agent Pixels",
        exportName: EXPORT_NAMES.sidebar
      },
      {
        type: "page",
        id: SLOT_IDS.page,
        displayName: "Agent Pixels",
        exportName: EXPORT_NAMES.page,
        routePath: PAGE_ROUTE
      },
      {
        type: "settingsPage",
        id: SLOT_IDS.settingsPage,
        displayName: "Agent Pixels Settings",
        exportName: EXPORT_NAMES.settingsPage
      }
    ]
  }
};

// src/constants.ts
var TILE_SIZE = 16;
var DEFAULT_COLS = 20;
var DEFAULT_ROWS = 11;
var WALK_SPEED_PX_PER_SEC = 48;
var WALK_FRAME_DURATION_SEC = 0.15;
var TYPE_FRAME_DURATION_SEC = 0.3;
var WANDER_PAUSE_MIN_SEC = 2;
var WANDER_PAUSE_MAX_SEC = 20;
var WANDER_MOVES_BEFORE_REST_MIN = 3;
var WANDER_MOVES_BEFORE_REST_MAX = 6;
var MATRIX_EFFECT_DURATION_SEC = 0.3;
var MATRIX_TRAIL_LENGTH = 6;
var MATRIX_SPRITE_COLS = 16;
var MATRIX_SPRITE_ROWS = 24;
var MATRIX_FLICKER_FPS = 30;
var MATRIX_FLICKER_VISIBILITY_THRESHOLD = 180;
var MATRIX_COLUMN_STAGGER_RANGE = 0.3;
var MATRIX_HEAD_COLOR = "#ccffcc";
var matrixGreenBright = (a) => `rgba(0, 255, 65, ${a})`;
var matrixGreenMid = (a) => `rgba(0, 170, 40, ${a})`;
var matrixGreenDim = (a) => `rgba(0, 85, 20, ${a})`;
var MATRIX_TRAIL_OVERLAY_ALPHA = 0.6;
var MATRIX_TRAIL_EMPTY_ALPHA = 0.5;
var MATRIX_TRAIL_MID_THRESHOLD = 0.33;
var MATRIX_TRAIL_DIM_THRESHOLD = 0.66;
var CHARACTER_SITTING_OFFSET_PX = 6;
var CHARACTER_Z_SORT_OFFSET = 0.5;
var OUTLINE_Z_SORT_OFFSET = 1e-3;
var SELECTED_OUTLINE_ALPHA = 1;
var HOVERED_OUTLINE_ALPHA = 0.5;
var GHOST_PREVIEW_SPRITE_ALPHA = 0.5;
var GHOST_PREVIEW_TINT_ALPHA = 0.25;
var SELECTION_DASH_PATTERN = [4, 3];
var BUTTON_MIN_RADIUS = 6;
var BUTTON_RADIUS_ZOOM_FACTOR = 3;
var BUTTON_ICON_SIZE_FACTOR = 0.45;
var BUTTON_LINE_WIDTH_MIN = 1.5;
var BUTTON_LINE_WIDTH_ZOOM_FACTOR = 0.5;
var BUBBLE_FADE_DURATION_SEC = 0.5;
var BUBBLE_SITTING_OFFSET_PX = 10;
var BUBBLE_VERTICAL_OFFSET_PX = 24;
var FALLBACK_FLOOR_COLOR = "#808080";
var SEAT_OWN_COLOR = "rgba(0, 127, 212, 0.35)";
var SEAT_AVAILABLE_COLOR = "rgba(0, 200, 80, 0.35)";
var SEAT_BUSY_COLOR = "rgba(220, 50, 50, 0.35)";
var GRID_LINE_COLOR = "rgba(255,255,255,0.12)";
var VOID_TILE_OUTLINE_COLOR = "rgba(255,255,255,0.08)";
var VOID_TILE_DASH_PATTERN = [2, 2];
var GHOST_BORDER_HOVER_FILL = "rgba(60, 130, 220, 0.25)";
var GHOST_BORDER_HOVER_STROKE = "rgba(60, 130, 220, 0.5)";
var GHOST_BORDER_STROKE = "rgba(255, 255, 255, 0.06)";
var GHOST_VALID_TINT = "#00ff00";
var GHOST_INVALID_TINT = "#ff0000";
var SELECTION_HIGHLIGHT_COLOR = "#007fd4";
var DELETE_BUTTON_BG = "rgba(200, 50, 50, 0.85)";
var ROTATE_BUTTON_BG = "rgba(50, 120, 200, 0.85)";
var BUTTON_ICON_COLOR = "#fff";
var CANVAS_ERROR_TILE_COLOR = "#FF00FF";
var WALL_COLOR = "#3A3A5C";
var FURNITURE_ANIM_INTERVAL_SEC = 0.2;
var MAX_DELTA_TIME_SEC = 0.1;
var WAITING_BUBBLE_DURATION_SEC = 2;
var DISMISS_BUBBLE_FAST_FADE_SEC = 0.3;
var INACTIVE_SEAT_TIMER_MIN_SEC = 3;
var INACTIVE_SEAT_TIMER_RANGE_SEC = 2;
var PALETTE_COUNT = 6;
var HUE_SHIFT_MIN_DEG = 45;
var HUE_SHIFT_RANGE_DEG = 271;
var AUTO_ON_FACING_DEPTH = 3;
var AUTO_ON_SIDE_DEPTH = 2;
var CHARACTER_HIT_HALF_WIDTH = 8;
var CHARACTER_HIT_HEIGHT = 24;

// src/office/types.ts
var TileType = {
  WALL: 0,
  FLOOR_1: 1,
  FLOOR_2: 2,
  FLOOR_3: 3,
  FLOOR_4: 4,
  FLOOR_5: 5,
  FLOOR_6: 6,
  FLOOR_7: 7,
  FLOOR_8: 8,
  FLOOR_9: 9,
  VOID: 255
};
var CharacterState = {
  IDLE: "idle",
  WALK: "walk",
  TYPE: "type"
};
var Direction = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3
};

// src/office/maps/builder.ts
function workstation(c, r, pc = "PC_FRONT_ON_1") {
  return [
    { type: "DESK_FRONT", col: c, row: r },
    { type: pc, col: c + 1, row: r },
    { type: "CUSHIONED_BENCH", col: c + 1, row: r + 2 }
  ];
}
function meetingTable(c, r) {
  return [
    { type: "TABLE_FRONT", col: c, row: r },
    { type: "WOODEN_CHAIR_SIDE", col: c - 1, row: r },
    { type: "WOODEN_CHAIR_SIDE", col: c - 1, row: r + 2 },
    { type: "WOODEN_CHAIR_SIDE:left", col: c + 3, row: r },
    { type: "WOODEN_CHAIR_SIDE:left", col: c + 3, row: r + 2 }
  ];
}
function boardroom(c, r) {
  return [
    { type: "BOARDROOM_TABLE", col: c, row: r },
    { type: "CUSHIONED_CHAIR_FRONT", col: c + 1, row: r - 1 },
    { type: "CUSHIONED_CHAIR_BACK", col: c + 1, row: r + 5 },
    { type: "CUSHIONED_CHAIR_SIDE", col: c - 1, row: r + 1 },
    { type: "CUSHIONED_CHAIR_SIDE", col: c - 1, row: r + 3 },
    { type: "CUSHIONED_CHAIR_SIDE:left", col: c + 3, row: r + 1 },
    { type: "CUSHIONED_CHAIR_SIDE:left", col: c + 3, row: r + 3 }
  ];
}
function sofaSet(c, r) {
  return [
    { type: "COFFEE_TABLE", col: c, row: r },
    { type: "SOFA_FRONT", col: c, row: r - 1 },
    { type: "SOFA_BACK", col: c, row: r + 2 },
    { type: "SOFA_SIDE", col: c - 1, row: r },
    { type: "SOFA_SIDE:left", col: c + 2, row: r }
  ];
}
function reception(c, r) {
  return [
    { type: "DESK_FRONT", col: c, row: r },
    { type: "CUSHIONED_BENCH", col: c + 1, row: r - 1 }
  ];
}
function wallDecor(type, c) {
  return { type, col: c, row: -2 };
}
function roleFurniture(role, w, h, walled) {
  const items = [];
  const deco = (type, c) => {
    if (walled && c >= 0 && c + 2 <= w) items.push(wallDecor(type, c));
  };
  switch (role) {
    case "product":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1));
      if (w >= 10 && h >= 4) items.push(...workstation(5, 1, "PC_FRONT_ON_1"));
      deco("WHITEBOARD", 1);
      deco("SMALL_PAINTING", 4);
      if (w >= 8 && h >= 6) items.push({ type: "SMALL_TABLE_FRONT", col: w - 3, row: h - 3 });
      if (w >= 7) items.push({ type: "PLANT", col: w - 2, row: 1 });
      if (h >= 5) items.push({ type: "BIN", col: 0, row: h - 1 });
      break;
    case "engineering":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1, "PC_FRONT_ON_2"));
      if (w >= 9 && h >= 4) items.push(...workstation(5, 1, "PC_FRONT_ON_1"));
      if (w >= 13 && h >= 4) items.push(...workstation(9, 1, "PC_FRONT_ON_3"));
      deco("WHITEBOARD", 1);
      deco("DOUBLE_BOOKSHELF", 4);
      deco("CLOCK", 7);
      if (h >= 7) items.push({ type: "PLANT_2", col: w - 2, row: h - 3 });
      if (h >= 5) items.push({ type: "BIN", col: 0, row: h - 1 });
      if (w >= 6 && h >= 6) items.push({ type: "CACTUS", col: 1, row: h - 2 });
      break;
    case "design":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1, "PC_FRONT_ON_3"));
      if (w >= 10 && h >= 4) items.push(...workstation(5, 1, "PC_FRONT_ON_1"));
      deco("LARGE_PAINTING", 1);
      deco("SMALL_PAINTING", 4);
      if (w >= 7 && h >= 6) items.push({ type: "CUSHIONED_CHAIR_FRONT", col: w - 2, row: h - 3 });
      if (w >= 7) items.push({ type: "PLANT_2", col: w - 2, row: 1 });
      if (w >= 8 && h >= 6) items.push({ type: "SMALL_TABLE_SIDE", col: 0, row: h - 3 });
      break;
    case "marketing":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1));
      if (w >= 10 && h >= 4) items.push(...workstation(5, 1, "PC_FRONT_OFF"));
      deco("WHITEBOARD", Math.max(1, w - 4));
      deco("SMALL_PAINTING_2", 1);
      if (w >= 7 && h >= 6) items.push({ type: "PLANT", col: w - 2, row: h - 3 });
      if (h >= 5) items.push({ type: "BIN", col: 0, row: h - 1 });
      break;
    case "support":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1, "PC_FRONT_ON_1"));
      if (w >= 9 && h >= 4) items.push(...workstation(5, 1, "PC_FRONT_ON_2"));
      if (w >= 13 && h >= 4) items.push(...workstation(9, 1, "PC_FRONT_ON_3"));
      deco("SMALL_PAINTING_2", 1);
      deco("CLOCK", 4);
      if (h >= 7) items.push({ type: "PLANT", col: w - 2, row: h - 3 });
      if (h >= 5) items.push({ type: "BIN", col: 0, row: h - 1 });
      break;
    case "hr":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1, "PC_FRONT_OFF"));
      deco("CLOCK", 1);
      deco("SMALL_PAINTING", 3);
      deco("DOUBLE_BOOKSHELF", 5);
      if (w >= 7 && h >= 6) items.push({ type: "SMALL_TABLE_SIDE", col: w - 2, row: 1 });
      if (w >= 7) items.push({ type: "PLANT", col: w - 2, row: h - 2 });
      if (h >= 5) items.push({ type: "BIN", col: 0, row: h - 1 });
      break;
    case "data":
      if (w >= 5 && h >= 4) items.push(...workstation(1, 1, "PC_FRONT_ON_2"));
      if (w >= 10 && h >= 4) items.push(...workstation(5, 1, "PC_FRONT_ON_3"));
      deco("SMALL_PAINTING", 1);
      deco("WHITEBOARD", 3);
      if (w >= 7) items.push({ type: "CACTUS", col: w - 2, row: 1 });
      if (h >= 5) items.push({ type: "BIN", col: 0, row: h - 1 });
      break;
    case "meeting":
      if (w >= 7 && h >= 9) {
        items.push(...boardroom(2, 2));
      } else if (w >= 6 && h >= 5) {
        items.push(...meetingTable(2, 1));
      }
      deco("WHITEBOARD", 1);
      deco("CLOCK", 4);
      if (w >= 8) items.push({ type: "PLANT", col: w - 2, row: h - 3 });
      break;
    case "pantry":
      items.push(
        { type: "SMALL_TABLE_FRONT", col: 0, row: 0 },
        { type: "SMALL_TABLE_FRONT", col: 2, row: 0 },
        { type: "COFFEE", col: 0, row: 1 }
      );
      if (w >= 6) items.push({ type: "POT", col: 4, row: 0 });
      if (w >= 8) {
        items.push(
          { type: "SMALL_TABLE_FRONT", col: 5, row: 0 },
          { type: "COFFEE", col: 6, row: 1 }
        );
      }
      if (w >= 10 && h >= 7) items.push(...meetingTable(w - 5, 2));
      if (w >= 10 && h >= 6) {
        items.push(
          { type: "CUSHIONED_BENCH", col: 1, row: h - 2 },
          { type: "CUSHIONED_BENCH", col: 2, row: h - 2 },
          { type: "SMALL_TABLE_SIDE", col: 3, row: h - 3 }
        );
      }
      items.push({ type: "BIN", col: w - 1, row: h - 1 });
      if (h >= 5) items.push({ type: "PLANT_2", col: 0, row: h - 3 });
      deco("SMALL_PAINTING_2", 1);
      deco("CLOCK", 4);
      break;
    case "server":
      items.push(
        { type: "SMALL_TABLE_FRONT", col: 0, row: 0 },
        { type: "PC_SIDE", col: 0, row: 1 }
      );
      if (w >= 5) {
        items.push(
          { type: "SMALL_TABLE_FRONT", col: 2, row: 0 },
          { type: "PC_SIDE:left", col: 3, row: 1 }
        );
      }
      if (h >= 7) {
        items.push(
          { type: "SMALL_TABLE_FRONT", col: 0, row: 3 },
          { type: "PC_SIDE", col: 0, row: 4 }
        );
        if (w >= 5) {
          items.push(
            { type: "SMALL_TABLE_FRONT", col: 2, row: 3 },
            { type: "PC_SIDE:left", col: 3, row: 4 }
          );
        }
      }
      items.push({ type: "BIN", col: w - 1, row: h - 1 });
      if (w >= 6) items.push({ type: "CACTUS", col: w - 2, row: 0 });
      break;
    case "lounge":
      if (w >= 6 && h >= 6) items.push(...sofaSet(2, 2));
      if (w >= 6 && h >= 6) items.push({ type: "COFFEE", col: 2, row: 2 });
      if (w >= 9 && h >= 4) items.push({ type: "ARCADE_MACHINE", col: w - 3, row: 0 });
      if (w >= 14 && h >= 8) items.push({ type: "POOL_TABLE", col: w - 8, row: h - 4 });
      if (w >= 8 && h >= 7) items.push({ type: "SMALL_TABLE_SIDE", col: 0, row: 0 });
      items.push({ type: "PLANT", col: 0, row: h - 3 });
      break;
    case "focus":
      if (w >= 4 && h >= 4) {
        items.push(
          { type: "SMALL_TABLE_FRONT", col: 1, row: 1 },
          { type: "CUSHIONED_CHAIR_SIDE", col: 0, row: 1 }
        );
      }
      deco("SMALL_PAINTING", 1);
      items.push({ type: "PLANT", col: w - 2, row: h - 3 });
      break;
    case "content":
      deco("LARGE_PAINTING", 1);
      deco("SMALL_PAINTING_2", 4);
      if (w >= 6 && h >= 5) {
        items.push(
          { type: "SMALL_TABLE_SIDE", col: w - 2, row: 1 },
          { type: "SOFA_FRONT", col: 1, row: h - 2 },
          { type: "COFFEE_TABLE", col: 1, row: h - 4 },
          { type: "POT", col: w - 2, row: h - 1 }
        );
      }
      if (w >= 9 && h >= 6) items.push({ type: "CUSHIONED_CHAIR_FRONT", col: 4, row: h - 4 });
      if (w >= 9) items.push({ type: "PLANT_2", col: w - 2, row: h - 3 });
      break;
    case "hub": {
      const mid = Math.floor(w / 2);
      if (w >= 8 && h >= 8) items.push(...reception(mid - 1, h - 3));
      if (w >= 8 && h >= 8) items.push(...sofaSet(2, 2));
      if (w >= 13 && h >= 8) {
        items.push(
          { type: "SOFA_FRONT", col: w - 4, row: 2 },
          { type: "COFFEE_TABLE", col: w - 4, row: 3 }
        );
      }
      if (w >= 12 && h >= 10) {
        items.push(
          { type: "WOODEN_BENCH", col: mid - 3, row: h - 2 },
          { type: "WOODEN_BENCH", col: mid + 2, row: h - 2 },
          { type: "LARGE_PLANT", col: 1, row: h - 4 },
          { type: "LARGE_PLANT", col: w - 4, row: h - 4 }
        );
      }
      items.push(
        { type: "PLANT", col: 0, row: 0 },
        { type: "PLANT_2", col: w - 2, row: h - 3 }
      );
      break;
    }
    case "courtyard": {
      const mid = Math.floor(w / 2);
      items.push(
        { type: "LARGE_PLANT", col: 1, row: 1 },
        { type: "LARGE_PLANT", col: w - 3, row: 1 },
        { type: "POT", col: 1, row: h - 2 },
        { type: "POT", col: w - 2, row: h - 2 }
      );
      if (h >= 12) {
        items.push(
          { type: "WOODEN_BENCH", col: 2, row: Math.floor(h / 2) },
          { type: "WOODEN_BENCH", col: w - 3, row: Math.floor(h / 2) },
          { type: "LARGE_PLANT", col: mid - 1, row: Math.floor(h / 2) - 2 }
        );
      }
      if (h >= 16) {
        items.push(
          { type: "WOODEN_BENCH", col: 2, row: 4 },
          { type: "WOODEN_BENCH", col: w - 3, row: 4 },
          { type: "POT", col: mid, row: 2 }
        );
      }
      if (w >= 8 && h >= 10) items.push(...reception(mid - 1, h - 3));
      break;
    }
    case "corridor":
      break;
  }
  return items;
}
var DESK_ACCENT_TYPES = /* @__PURE__ */ new Set([
  "DESK_FRONT",
  "DESK_SIDE",
  "TABLE_FRONT",
  "SMALL_TABLE_FRONT",
  "SMALL_TABLE_SIDE",
  "COFFEE_TABLE",
  "BOARDROOM_TABLE"
]);
function buildOfficeMap(def, theme) {
  const { cols, rows } = def;
  const corridorTile = def.corridorTile ?? 9;
  const corridorColor = theme.roles[def.corridorRole ?? "corridor"];
  const wallColor = theme.wall;
  const tiles = Array(cols * rows).fill(corridorTile);
  const tileColors = Array(cols * rows).fill(corridorColor);
  const index = (col, row) => row * cols + col;
  const setTile = (col, row, tile, color) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return;
    tiles[index(col, row)] = tile;
    tileColors[index(col, row)] = color;
  };
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        setTile(col, row, TileType.WALL, wallColor);
      }
    }
  }
  for (const room of def.rooms) {
    const { rect: rect2 } = room;
    const floorColor = theme.roles[room.role];
    const floorTile = room.floorTile ?? (room.open ? 3 : 1);
    for (let r = 0; r < rect2.rows; r++) {
      for (let c = 0; c < rect2.cols; c++) {
        const isWall = !room.open && (r === 0 || r === rect2.rows - 1 || c === 0 || c === rect2.cols - 1);
        setTile(
          rect2.col + c,
          rect2.row + r,
          isWall ? TileType.WALL : floorTile,
          isWall ? wallColor : floorColor
        );
      }
    }
  }
  for (const room of def.rooms) {
    for (const door of room.doors ?? []) {
      const width = door.width ?? 2;
      const { rect: rect2 } = room;
      const floorColor = theme.roles[room.role];
      const floorTile = room.floorTile ?? 1;
      for (let i = 0; i < width; i++) {
        let col;
        let row;
        if (door.side === "top" || door.side === "bottom") {
          col = rect2.col + door.at + i;
          row = door.side === "top" ? rect2.row : rect2.row + rect2.rows - 1;
        } else {
          col = door.side === "left" ? rect2.col : rect2.col + rect2.cols - 1;
          row = rect2.row + door.at + i;
        }
        setTile(col, row, floorTile, floorColor);
      }
    }
  }
  const furniture = [];
  let uidCounter = 0;
  const pushItem = (item, originCol, originRow, scope) => {
    const accent = item.color ?? (theme.deskAccent && DESK_ACCENT_TYPES.has(item.type) ? theme.deskAccent : void 0);
    furniture.push({
      uid: `${def.id}-${scope}-${uidCounter++}`,
      type: item.type,
      col: originCol + item.col,
      row: originRow + item.row,
      ...accent ? { color: accent } : {}
    });
  };
  for (const room of def.rooms) {
    const inset = room.open ? 0 : 1;
    const originCol = room.rect.col + inset;
    const originRow = room.rect.row + inset;
    const w = room.rect.cols - inset * 2;
    const h = room.rect.rows - inset * 2;
    const items = room.furniture ?? roleFurniture(room.role, w, h, !room.open);
    for (const item of items) pushItem(item, originCol, originRow, room.id);
  }
  for (const item of def.furniture ?? []) pushItem(item, 0, 0, "floor");
  const halfC = Math.floor(cols / 2);
  const halfR = Math.floor(rows / 2);
  const quads = [
    { id: "cam1", bounds: { col: 0, row: 0, cols: halfC + 1, rows: halfR + 1 } },
    { id: "cam2", bounds: { col: halfC - 1, row: 0, cols: cols - halfC + 1, rows: halfR + 1 } },
    { id: "cam3", bounds: { col: 0, row: halfR - 1, cols: halfC + 1, rows: rows - halfR + 1 } },
    { id: "cam4", bounds: { col: halfC - 1, row: halfR - 1, cols: cols - halfC + 1, rows: rows - halfR + 1 } }
  ];
  const cameras = quads.map((quad) => {
    const contained = def.rooms.filter((room) => {
      const cx = room.rect.col + room.rect.cols / 2;
      const cy = room.rect.row + room.rect.rows / 2;
      return cx >= quad.bounds.col && cx < quad.bounds.col + quad.bounds.cols && cy >= quad.bounds.row && cy < quad.bounds.row + quad.bounds.rows;
    });
    const label = contained.slice(0, 2).map((room) => room.label).join(" + ") || "Open Floor";
    return { id: quad.id, label, bounds: quad.bounds };
  });
  cameras.push({ id: "total", label: "Total \xB7 All Rooms", bounds: { col: 0, row: 0, cols, rows } });
  return {
    layout: {
      version: 1,
      cols,
      rows,
      layoutRevision: 1,
      tiles,
      tileColors,
      spawnTile: def.spawnTile,
      furniture
    },
    cameras,
    rooms: def.rooms.map((room) => ({
      id: room.id,
      role: room.role,
      label: room.label,
      rect: room.rect,
      open: !!room.open
    }))
  };
}

// src/office/maps/catalog.ts
var rect = (col, row, cols, rows) => ({ col, row, cols, rows });
var centerTable = (c, r) => [
  { type: "TABLE_FRONT", col: c, row: r },
  { type: "WOODEN_CHAIR_SIDE", col: c - 1, row: r },
  { type: "WOODEN_CHAIR_SIDE", col: c - 1, row: r + 2 },
  { type: "WOODEN_CHAIR_SIDE:left", col: c + 3, row: r },
  { type: "WOODEN_CHAIR_SIDE:left", col: c + 3, row: r + 2 }
];
var sofaCluster = (c, r) => [
  { type: "COFFEE_TABLE", col: c, row: r },
  { type: "SOFA_FRONT", col: c, row: r - 1 },
  { type: "SOFA_BACK", col: c, row: r + 2 },
  { type: "SOFA_SIDE", col: c - 1, row: r },
  { type: "SOFA_SIDE:left", col: c + 2, row: r }
];
var workRow = (c, r, pc = "PC_FRONT_ON_1") => [
  { type: "DESK_FRONT", col: c, row: r },
  { type: pc, col: c + 1, row: r },
  { type: "CUSHIONED_BENCH", col: c + 1, row: r + 2 }
];
var hubCentral = {
  id: "hub-central",
  label: "Central Hub",
  cols: 46,
  rows: 36,
  spawnTile: { col: 22, row: 17 },
  rooms: [
    { id: "product", role: "product", label: "Product & Strategy", rect: rect(1, 1, 12, 8), doors: [{ side: "right", at: 3 }] },
    { id: "marketing", role: "marketing", label: "Marketing & Sales", rect: rect(1, 8, 12, 8), doors: [{ side: "right", at: 3 }] },
    { id: "meeting", role: "meeting", label: "Meeting Room", rect: rect(1, 15, 12, 8), doors: [{ side: "right", at: 3 }] },
    { id: "data", role: "data", label: "Data & QA", rect: rect(1, 22, 12, 8), doors: [{ side: "right", at: 3 }] },
    { id: "engineering", role: "engineering", label: "Engineering", rect: rect(15, 1, 16, 8), doors: [{ side: "bottom", at: 7, width: 3 }] },
    { id: "design", role: "design", label: "Design Studio", rect: rect(33, 1, 12, 8), doors: [{ side: "left", at: 3 }] },
    { id: "support", role: "support", label: "Customer Support", rect: rect(33, 8, 12, 8), doors: [{ side: "left", at: 3 }] },
    { id: "hr", role: "hr", label: "HR / Finance / Admin", rect: rect(33, 15, 12, 8), doors: [{ side: "left", at: 3 }] },
    { id: "server", role: "server", label: "Server / Storage", rect: rect(33, 22, 12, 8), doors: [{ side: "left", at: 3 }] },
    { id: "pantry", role: "pantry", label: "Pantry & Lounge", rect: rect(15, 27, 16, 8), doors: [{ side: "top", at: 7, width: 3 }, { side: "left", at: 3 }, { side: "right", at: 3 }] },
    { id: "hub", role: "hub", label: "Hub / Reception / Lounge", rect: rect(15, 9, 16, 18), open: true, floorTile: 1 }
  ]
};
var openStudio = {
  id: "open-studio",
  label: "Open Studio",
  cols: 46,
  rows: 36,
  corridorRole: "hub",
  corridorTile: 1,
  spawnTile: { col: 17, row: 19 },
  rooms: [
    { id: "product", role: "product", label: "Product", rect: rect(2, 2, 12, 9), open: true },
    { id: "design", role: "design", label: "Design", rect: rect(2, 13, 12, 9), open: true },
    { id: "support", role: "support", label: "Support", rect: rect(2, 24, 12, 9), open: true },
    { id: "engineering", role: "engineering", label: "Engineering", rect: rect(30, 2, 14, 10), open: true },
    { id: "marketing", role: "marketing", label: "Marketing", rect: rect(30, 14, 14, 9), open: true },
    { id: "meeting", role: "meeting", label: "Meeting Room", rect: rect(16, 23, 13, 11), doors: [{ side: "top", at: 5 }] },
    { id: "focus", role: "focus", label: "Focus Booth", rect: rect(30, 25, 6, 8), doors: [{ side: "top", at: 2 }] },
    { id: "pantry", role: "pantry", label: "Pantry & Lounge", rect: rect(37, 25, 8, 10), open: true }
  ],
  furniture: [
    ...centerTable(20, 10),
    { type: "LARGE_PLANT", col: 16, row: 16 },
    { type: "LARGE_PLANT", col: 26, row: 16 },
    { type: "POT", col: 15, row: 3 }
  ]
};
var boulevard = {
  id: "boulevard",
  label: "The Boulevard",
  cols: 46,
  rows: 36,
  spawnTile: { col: 23, row: 14 },
  rooms: [
    { id: "product", role: "product", label: "Product & Strategy", rect: rect(1, 1, 14, 8), doors: [{ side: "right", at: 3 }] },
    { id: "marketing", role: "marketing", label: "Marketing & Sales", rect: rect(1, 8, 14, 8), doors: [{ side: "right", at: 3 }] },
    { id: "meeting", role: "meeting", label: "Meeting Room", rect: rect(1, 15, 14, 8), doors: [{ side: "right", at: 3 }] },
    { id: "data", role: "data", label: "Data & QA", rect: rect(1, 22, 14, 8), doors: [{ side: "right", at: 3 }] },
    { id: "engineering", role: "engineering", label: "Engineering", rect: rect(31, 1, 14, 8), doors: [{ side: "left", at: 3 }] },
    { id: "design", role: "design", label: "Design Studio", rect: rect(31, 8, 14, 8), doors: [{ side: "left", at: 3 }] },
    { id: "support", role: "support", label: "Customer Support", rect: rect(31, 15, 14, 8), doors: [{ side: "left", at: 3 }] },
    { id: "hr", role: "hr", label: "HR / Admin", rect: rect(31, 22, 14, 8), doors: [{ side: "left", at: 3 }] },
    { id: "pantry", role: "pantry", label: "Pantry & Lounge", rect: rect(15, 27, 16, 8), doors: [{ side: "top", at: 7, width: 3 }, { side: "left", at: 3 }, { side: "right", at: 3 }] },
    {
      id: "boulevard",
      role: "hub",
      label: "The Boulevard",
      rect: rect(15, 1, 16, 26),
      open: true,
      floorTile: 1,
      furniture: [
        { type: "LARGE_PLANT", col: 1, row: 2 },
        { type: "LARGE_PLANT", col: 13, row: 2 },
        { type: "LARGE_PLANT", col: 1, row: 12 },
        { type: "LARGE_PLANT", col: 13, row: 12 },
        { type: "LARGE_PLANT", col: 1, row: 20 },
        { type: "LARGE_PLANT", col: 13, row: 20 },
        ...sofaCluster(7, 8),
        { type: "SOFA_SIDE", col: 6, row: 16 },
        { type: "COFFEE_TABLE", col: 7, row: 16 },
        { type: "SOFA_SIDE:left", col: 9, row: 16 },
        { type: "POT", col: 7, row: 22 }
      ]
    }
  ]
};
var campusMini = {
  id: "campus-mini",
  label: "Campus Mini",
  cols: 46,
  rows: 36,
  spawnTile: { col: 20, row: 18 },
  rooms: [
    { id: "product", role: "product", label: "Product & Strategy", rect: rect(1, 1, 14, 9), doors: [{ side: "bottom", at: 6 }] },
    { id: "engineering", role: "engineering", label: "Engineering", rect: rect(16, 1, 14, 9), doors: [{ side: "bottom", at: 6 }] },
    { id: "design", role: "design", label: "Design + Marketing", rect: rect(31, 1, 14, 9), doors: [{ side: "bottom", at: 6 }] },
    { id: "meeting", role: "meeting", label: "Meeting Room", rect: rect(1, 12, 14, 8), doors: [{ side: "right", at: 3 }] },
    { id: "support", role: "support", label: "Support + Ops", rect: rect(31, 12, 14, 8), doors: [{ side: "left", at: 3 }] },
    { id: "pantry", role: "pantry", label: "Pantry & Lounge", rect: rect(1, 21, 14, 14), doors: [{ side: "right", at: 4 }] },
    { id: "server", role: "server", label: "Server / Storage", rect: rect(31, 21, 14, 14), doors: [{ side: "left", at: 4 }] },
    { id: "courtyard", role: "courtyard", label: "Welcome Hub / Courtyard", rect: rect(16, 12, 14, 23), open: true }
  ]
};
var teamPods = {
  id: "team-pods",
  label: "Team Pods",
  cols: 46,
  rows: 36,
  corridorTile: 1,
  spawnTile: { col: 18, row: 20 },
  rooms: [
    { id: "product", role: "product", label: "Product + Design", rect: rect(3, 2, 12, 8), open: true },
    { id: "engineering", role: "engineering", label: "Engineering", rect: rect(29, 2, 14, 8), open: true },
    { id: "marketing", role: "marketing", label: "Growth / Sales", rect: rect(3, 12, 12, 8), open: true },
    { id: "support", role: "support", label: "Support / Ops", rect: rect(29, 12, 14, 8), open: true },
    { id: "data", role: "data", label: "Data / QA", rect: rect(29, 21, 14, 6), open: true },
    { id: "meeting", role: "meeting", label: "Meeting Room", rect: rect(1, 22, 13, 12), doors: [{ side: "right", at: 1 }] },
    { id: "server", role: "server", label: "Server", rect: rect(14, 26, 7, 8), doors: [{ side: "top", at: 2 }] },
    { id: "pantry", role: "pantry", label: "Pantry & Lounge", rect: rect(22, 28, 15, 7), open: true }
  ],
  furniture: [
    { type: "LARGE_PLANT", col: 17, row: 7 },
    { type: "LARGE_PLANT", col: 27, row: 7 },
    ...sofaCluster(23, 17)
  ]
};
var creativeLoft = {
  id: "creative-loft",
  label: "Creative Loft",
  cols: 46,
  rows: 36,
  corridorRole: "lounge",
  corridorTile: 2,
  spawnTile: { col: 16, row: 22 },
  rooms: [
    { id: "marketing", role: "marketing", label: "Marketing Area", rect: rect(2, 2, 13, 9), open: true },
    { id: "design", role: "design", label: "Design Area", rect: rect(2, 13, 13, 9), open: true },
    { id: "engineering", role: "engineering", label: "Engineering Nook", rect: rect(1, 24, 13, 11), doors: [{ side: "top", at: 9 }] },
    {
      id: "studio",
      role: "hub",
      label: "Open Studio",
      rect: rect(17, 10, 14, 11),
      open: true,
      furniture: [...centerTable(3, 1), ...centerTable(9, 6)]
    },
    { id: "meeting", role: "meeting", label: "Meeting Room", rect: rect(32, 1, 13, 11), doors: [{ side: "bottom", at: 5 }, { side: "left", at: 4 }] },
    { id: "content", role: "content", label: "Content Corner", rect: rect(32, 13, 13, 9), open: true },
    { id: "lounge", role: "lounge", label: "Lounge", rect: rect(15, 25, 16, 10), open: true },
    { id: "pantry", role: "pantry", label: "Pantry", rect: rect(32, 24, 13, 11), doors: [{ side: "top", at: 5 }] }
  ],
  furniture: [
    { type: "LARGE_PLANT", col: 16, row: 4 },
    { type: "LARGE_PLANT", col: 29, row: 4 },
    { type: "BIN", col: 15, row: 8 }
  ]
};
var hybridOffice = {
  id: "hybrid-office",
  label: "Hybrid Office",
  cols: 46,
  rows: 36,
  spawnTile: { col: 22, row: 12 },
  rooms: [
    { id: "product", role: "product", label: "Phòng Phân tích & Kế hoạch", rect: rect(1, 1, 13, 9), doors: [{ side: "right", at: 3 }] },
    { id: "meeting", role: "meeting", label: "Phòng họp Ban lãnh đạo", rect: rect(1, 10, 13, 9), doors: [{ side: "right", at: 3 }] },
    { id: "focus", role: "focus", label: "Phòng làm việc tập trung", rect: rect(1, 19, 13, 7), doors: [{ side: "right", at: 2 }] },
    { id: "pantry", role: "pantry", label: "Khu nghỉ ngơi", rect: rect(1, 26, 19, 9), doors: [{ side: "top", at: 15 }] },
    { id: "engineering", furniture: [...workRow(1, 0, "PC_FRONT_ON_2"), ...workRow(6, 0, "PC_FRONT_ON_1"), ...workRow(1, 3, "PC_FRONT_ON_3"), ...workRow(6, 3, "PC_FRONT_ON_1"), { type: "PLANT_2", col: 10, row: 6 }], role: "engineering", label: "Phòng Thiết kế", rect: rect(32, 1, 13, 9), doors: [{ side: "left", at: 3 }] },
    { id: "marketing", furniture: [...workRow(1, 0), ...workRow(6, 0), ...workRow(1, 3), ...workRow(6, 3)], role: "marketing", label: "Phòng Marketing", rect: rect(32, 10, 13, 8), doors: [{ side: "left", at: 3 }] },
    { id: "support", role: "support", label: "Phòng Kiểm thử", rect: rect(32, 18, 13, 8), doors: [{ side: "left", at: 3 }] },
    { id: "hr", furniture: [...workRow(0, 1), ...workRow(4, 1)], role: "hr", label: "Phòng Điều hành", rect: rect(21, 26, 10, 9), doors: [{ side: "top", at: 4 }] },
    { id: "server", role: "server", label: "Phòng Máy chủ", rect: rect(32, 26, 13, 9), doors: [{ side: "left", at: 3 }] },
    {
      id: "workzone",
      role: "hub",
      label: "Khu làm việc chung",
      rect: rect(15, 2, 16, 10),
      open: true,
      floorTile: 1,
      furniture: [
        ...workRow(1, 1, "PC_FRONT_ON_1"),
        ...workRow(5, 1, "PC_FRONT_ON_2"),
        ...workRow(9, 1, "PC_FRONT_ON_3"),
        ...workRow(3, 6, "PC_FRONT_ON_2"),
        ...workRow(7, 6, "PC_FRONT_ON_1"),
        { type: "PLANT", col: 14, row: 0 }
      ]
    },
    {
      id: "collab",
      role: "content",
      label: "Khu họp nhóm",
      rect: rect(15, 13, 16, 12),
      open: true,
      floorTile: 1,
      furniture: [
        { type: "BOARDROOM_TABLE", col: 5, row: 3 },
        { type: "CUSHIONED_CHAIR_FRONT", col: 6, row: 2 },
        { type: "CUSHIONED_CHAIR_BACK", col: 6, row: 8 },
        { type: "CUSHIONED_CHAIR_SIDE", col: 4, row: 4 },
        { type: "CUSHIONED_CHAIR_SIDE", col: 4, row: 6 },
        { type: "CUSHIONED_CHAIR_SIDE:left", col: 8, row: 4 },
        { type: "CUSHIONED_CHAIR_SIDE:left", col: 8, row: 6 },
        ...sofaCluster(12, 4),
        { type: "POT", col: 1, row: 10 },
        { type: "PLANT_2", col: 14, row: 9 }
      ]
    }
  ]
};
var MAP_DEFS = [
  hubCentral,
  openStudio,
  boulevard,
  campusMini,
  teamPods,
  creativeLoft,
  hybridOffice
];
function getMapDef(id) {
  return MAP_DEFS.find((def) => def.id === id);
}

function hybridRoomForAgent(agent) {
  const name = (agent.name ?? "").trim().toLowerCase();
  const groups = {hr: ["ceo", "cto"], product: ["pm", "ba"], engineering: ["be", "fe"], support: ["qa"], marketing: ["cmo", "ads", "content creator", "content creater", "seo", "social", "mkt strategist"]};
  for (const [room, names] of Object.entries(groups)) if (names.includes(name)) return room;
  const roles = {ceo: "hr", cto: "hr", cmo: "marketing", pm: "product", engineer: "engineering", designer: "engineering", qa: "support", marketer: "marketing"};
  return roles[agent.role] ?? "workzone";
}
function hybridContains(rect, col, row) {
  return col > rect.col && row > rect.row && col < rect.col + rect.cols - 1 && row < rect.row + rect.rows - 1;
}
function assignHybridDepartments(office, agents, builtMap) {
  const byId = new Map(agents.map(agent => [stableNumericId(agent.id), hybridRoomForAgent(agent)]));
  // Release old random seats before allocating so no department borrows another's desk.
  for (const ch of office.characters.values()) {
    const roomId = byId.get(ch.id);
    const room = builtMap.rooms.find(room => room.id === roomId);
    if (!room) continue;
    const seat = office.seats.get(ch.seatId);
    if (ch.homeRoomId === roomId && seat && hybridContains(room.rect, seat.seatCol, seat.seatRow)) continue;
    if (seat) seat.assigned = false;
    ch.seatId = null;
    ch.homeRoomId = null;
  }
  for (const agent of [...agents].sort((a,b) => a.id.localeCompare(b.id))) {
    const ch = office.characters.get(stableNumericId(agent.id));
    const roomId = hybridRoomForAgent(agent);
    const room = builtMap.rooms.find(room => room.id === roomId);
    if (!ch || !room) continue;
    const homeTiles = office.walkableTiles.filter(t => hybridContains(room.rect, t.col, t.row));
    const sharedTiles = office.walkableTiles.filter(t => builtMap.rooms.some(r => ["pantry", "collab", "focus"].includes(r.id) && hybridContains(r.rect,t.col,t.row)));
    ch.homeWalkableTiles = [...homeTiles, ...homeTiles, ...homeTiles, ...homeTiles, ...sharedTiles];
    if (ch.homeRoomId === roomId && ch.seatId) continue;
    const seat = [...office.seats.values()].find(seat => !seat.assigned && hybridContains(room.rect,seat.seatCol,seat.seatRow));
    const tile = seat ? {col: seat.seatCol, row: seat.seatRow} : homeTiles[0];
    if (!tile) continue;
    if (seat) {seat.assigned = true; ch.seatId = seat.uid; ch.dir = seat.facingDir;}
    ch.homeRoomId = roomId;
    ch.tileCol = tile.col; ch.tileRow = tile.row;
    ch.x = tile.col * TILE_SIZE + TILE_SIZE / 2; ch.y = tile.row * TILE_SIZE + TILE_SIZE / 2;
    ch.path = []; ch.moveProgress = 0; ch.state = CharacterState.IDLE; ch.frame = 0; ch.frameTimer = 0;
    ch.wanderTimer = 10 + Math.random() * 10;
  }
}

function applyOfficeMeetings(office, meetings, builtMap, now = Date.now()) {
  const active=meetings.filter(m=>m.phase==='active'&&(m.persistent||m.expiresAt>now)),invited=new Map();
  for(const m of active)for(const id of m.participants)invited.set(stableNumericId(id),m);
  for(const ch of office.characters.values())if(ch.officeMeeting&&ch.officeMeeting.key!==invited.get(ch.id)?.key){delete ch.officeMeeting;delete ch.meetingSpeech;office.sendToSeat(ch.id);}
  const reserved=new Set();for(const ch of office.characters.values())if(ch.officeMeeting&&invited.get(ch.id)?.key===ch.officeMeeting.key)reserved.add(ch.officeMeeting.target.col+','+ch.officeMeeting.target.row);
  const occupiedRooms=new Set();
  for(const meeting of active){
    const ids=new Set(meeting.participants.map(stableNumericId));
    const freeSeats=room=>[...office.seats.values()].filter(seat=>hybridContains(room.rect,seat.seatCol,seat.seatRow)&&![...office.characters.values()].some(ch=>ch.seatId===seat.uid&&!ids.has(ch.id)));
    const preferred=builtMap.rooms.find(r=>r.id===meeting.roomId);
    const candidates=[preferred,...builtMap.rooms.filter(r=>['meeting','collab','boardroomKitchen'].includes(r.id))].filter(Boolean);
    const room=candidates.find(r=>!occupiedRooms.has(r.id)&&freeSeats(r).length>=ids.size)??preferred??candidates[0];if(!room||occupiedRooms.has(room.id))continue;occupiedRooms.add(room.id);
    const seats=freeSeats(room),center={col:room.rect.col+room.rect.cols/2,row:room.rect.row+room.rect.rows/2};
    const targets=[...seats.map(seat=>({col:seat.seatCol,row:seat.seatRow,seatUid:seat.uid,facingDir:seat.facingDir})),...office.walkableTiles.filter(t=>hybridContains(room.rect,t.col,t.row)).sort((a,b)=>(Math.abs(a.col-center.col)+Math.abs(a.row-center.row))-(Math.abs(b.col-center.col)+Math.abs(b.row-center.row)))];
    for(const id of meeting.participants){
      const ch=office.characters.get(stableNumericId(id));if(!ch)continue;
      const speech=[...(meeting.speechMessages??[])].reverse().find(m=>m.agentId===id);
      ch.meetingSpeech=speech?{...speech}:meeting.currentSpeakerId===id?{text:'Đang chuẩn bị phản hồi…',thinking:true}:null;
      if(ch.officeMeeting?.key===meeting.key){ch.officeMeeting.expiresAt=meeting.expiresAt;ch.officeMeeting.persistent=!!meeting.persistent;if(ch.path.length||ch.tileCol===ch.officeMeeting.target.col&&ch.tileRow===ch.officeMeeting.target.row)continue;reserved.delete(ch.officeMeeting.target.col+','+ch.officeMeeting.target.row);}
      for(const target of targets){
        const key=target.col+','+target.row;if(reserved.has(key))continue;
        const wasBlocked=office.blockedTiles.has(key);if(wasBlocked)office.blockedTiles.delete(key);
        let path;try{path=office.withOwnSeatUnblocked(ch,()=>findPath(ch.tileCol,ch.tileRow,target.col,target.row,office.tileMap,office.blockedTiles));}finally{if(wasBlocked)office.blockedTiles.add(key);}
        if(!path.length&&(ch.tileCol!==target.col||ch.tileRow!==target.row))continue;
        ch.officeMeeting={key:meeting.key,expiresAt:meeting.expiresAt,persistent:!!meeting.persistent,target,seatUid:target.seatUid,facingDir:target.facingDir};
        ch.path=path;ch.moveProgress=0;ch.state=path.length?CharacterState.WALK:target.seatUid?CharacterState.TYPE:CharacterState.IDLE;ch.frame=0;ch.frameTimer=0;reserved.add(key);break;
      }
    }
  }
}
function meetingSpeechText(text){return String(text??'').replace(/<!--[\s\S]*?-->/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_`#>]/g,'').replace(/\s+/g,' ').trim();}
function drawMeetingSpeech(ctx,characters,positionFor,width,height,dpr=1){
  const boxes=[],font=12*dpr,pad=9*dpr,line=16*dpr;
  ctx.save();ctx.textAlign='left';ctx.textBaseline='top';ctx.font=font+'px sans-serif';
  for(const ch of characters){
    if(!ch.officeMeeting||!ch.meetingSpeech?.text)continue;
    const plain=meetingSpeechText(ch.meetingSpeech.text),short=plain.length>150?plain.slice(0,147)+'…':plain;
    const words=short.split(' '),lines=[];let text='';const maxWidth=Math.min(225*dpr,Math.max(100*dpr,width-2*pad));
    for(const word of words){const next=text?text+' '+word:word;if(text&&ctx.measureText(next).width>maxWidth-2*pad){lines.push(text);text=word;if(lines.length===3){text='';lines[2]=lines[2].slice(0,-1)+'…';break;}}else text=next;}if(text)lines.push(text);if(!lines.length)continue;
    const anchor=positionFor(ch),w=Math.min(maxWidth,Math.max(100*dpr,...lines.map(t=>ctx.measureText(t).width+pad*2))),h=lines.length*line+pad*2;
    const x=Math.max(pad,Math.min(width-w-pad,anchor.x-w/2));let y=Math.max(pad,Math.min(height-h-pad,anchor.y-h-10*dpr));
    for(const box of boxes)if(x<box.x+box.w&&x+w>box.x&&y<box.y+box.h&&y+h>box.y)y=Math.max(pad,box.y-h-5*dpr);
    ctx.fillStyle=ch.meetingSpeech.thinking?'rgba(30,41,59,.94)':'rgba(248,250,252,.97)';ctx.strokeStyle='#8b5cf6';ctx.lineWidth=dpr;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,7*dpr);else ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(Math.max(x+pad,Math.min(x+w-pad,anchor.x)),y+h);ctx.lineTo(anchor.x,anchor.y);ctx.stroke();ctx.fillStyle=ch.meetingSpeech.thinking?'#e2e8f0':'#172554';for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],x+pad,y+pad+i*line);boxes.push({x,y,w,h});
  }
  ctx.restore();return boxes;
}

// src/office/maps/industries.ts
var INDUSTRY_TEMPLATES = [
  {
    id: "software",
    label: "Software Company",
    roleLabels: {}
    // uses each map's default labels
  },
  {
    id: "agency",
    label: "Creative Agency",
    roleLabels: {
      product: "Account & Strategy",
      engineering: "Web & Dev",
      design: "Art Direction",
      marketing: "Campaigns",
      support: "Client Services",
      hr: "Studio Ops",
      data: "Analytics",
      content: "Content Studio",
      server: "Archive / Render"
    }
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    roleLabels: {
      product: "Merchandising",
      engineering: "Platform & Tech",
      design: "Brand & Creative",
      marketing: "Growth & Ads",
      support: "Customer Care",
      hr: "Finance & Admin",
      data: "Ops & Fulfillment",
      content: "Product Photos",
      server: "Warehouse Sync"
    }
  },
  {
    id: "gamestudio",
    label: "Game Studio",
    roleLabels: {
      product: "Game Design",
      engineering: "Programming",
      design: "Art & Animation",
      marketing: "Community",
      support: "Player Support",
      hr: "Production",
      data: "QA & Playtest",
      content: "Audio / Capture",
      server: "Build Farm"
    }
  }
];
function getIndustry(id) {
  return INDUSTRY_TEMPLATES.find((industry) => industry.id === id) ?? INDUSTRY_TEMPLATES[0];
}

// src/office/maps/themes.ts
var CLASSIC_ROLES = {
  product: { h: 95, s: 28, b: -6, c: -14 },
  engineering: { h: 215, s: 32, b: -14, c: -16 },
  design: { h: 290, s: 28, b: -10, c: -16 },
  marketing: { h: 355, s: 26, b: -8, c: -14 },
  support: { h: 175, s: 28, b: -10, c: -16 },
  hr: { h: 35, s: 42, b: -2, c: -10 },
  meeting: { h: 225, s: 32, b: -12, c: -16 },
  data: { h: 250, s: 28, b: -16, c: -20 },
  pantry: { h: 25, s: 38, b: -6, c: -8 },
  server: { h: 230, s: 12, b: -46, c: -40 },
  lounge: { h: 30, s: 34, b: -8, c: -10 },
  focus: { h: 270, s: 28, b: -10, c: -16 },
  content: { h: 40, s: 14, b: 2, c: -10 },
  hub: { h: 35, s: 25, b: 10, c: -8 },
  courtyard: { h: 110, s: 32, b: -6, c: -14 },
  corridor: { h: 35, s: 22, b: 6, c: -10 }
};
var CLASSIC_WALL = { h: 214, s: 30, b: -100, c: -55 };
var clampHue = (h) => (h % 360 + 360) % 360;
var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function mapRoles(f) {
  return Object.fromEntries(
    Object.entries(CLASSIC_ROLES).map(([role, color]) => [role, f(color)])
  );
}
function makeTheme(id, label, adjust, deskAccent) {
  return { id, label, wall: adjust(CLASSIC_WALL), roles: mapRoles(adjust), deskAccent, adjust };
}
var MAP_THEMES = [
  makeTheme("classic", "Classic", (c) => c),
  makeTheme("midnight", "Midnight", (c) => ({
    h: clampHue(c.h + 10),
    s: clamp(c.s - 8, 0, 100),
    b: clamp(c.b - 28, -100, 100),
    c: clamp(c.c - 18, -100, 100)
  })),
  makeTheme("pastel", "Pastel", (c) => ({
    h: c.h,
    s: clamp(c.s - 10, 0, 100),
    b: clamp(c.b + 20, -100, 100),
    c: clamp(c.c - 6, -100, 100)
  })),
  makeTheme(
    "forest",
    "Forest",
    (c) => ({
      h: clampHue(75 + clampHue(c.h) / 360 * 90),
      // remap all hues into 75–165 (greens)
      s: clamp(c.s + 4, 0, 100),
      b: clamp(c.b - 6, -100, 100),
      c: c.c
    }),
    { h: 130, s: 20, b: -12, c: -18 }
  ),
  makeTheme(
    "sunset",
    "Sunset",
    (c) => ({
      h: clampHue(5 + clampHue(c.h) / 360 * 50),
      // remap into 5–55 (warm)
      s: clamp(c.s + 8, 0, 100),
      b: clamp(c.b + 2, -100, 100),
      c: c.c
    }),
    { h: 20, s: 30, b: -8, c: -12 }
  ),
  makeTheme("mono", "Monochrome", (c) => ({
    h: 220,
    s: 5,
    b: clamp(c.b - 4, -100, 100),
    c: clamp(c.c - 8, -100, 100)
  })),
  makeTheme(
    "neon",
    "Neon",
    (c) => ({
      h: clampHue(c.h + 15),
      s: clamp(c.s + 40, 0, 100),
      b: clamp(c.b - 26, -100, 100),
      c: clamp(c.c + 12, -100, 100)
    }),
    { h: 300, s: 40, b: -22, c: 5 }
  ),
  makeTheme(
    "retro",
    "Retro",
    (c) => ({
      h: clampHue(20 + clampHue(c.h) / 360 * 50),
      // remap into 20–70 (70s oranges/olives)
      s: clamp(c.s + 8, 0, 100),
      b: clamp(c.b - 2, -100, 100),
      c: clamp(c.c - 8, -100, 100)
    }),
    { h: 30, s: 34, b: -10, c: -10 }
  )
];
function getTheme(id) {
  return MAP_THEMES.find((theme) => theme.id === id) ?? MAP_THEMES[0];
}

// src/ui/PixelOfficeCanvas.tsx
import { useEffect, useMemo, useRef, useState } from "react";

// src/office/layout/furnitureCatalog.ts
var rotationGroups = /* @__PURE__ */ new Map();
var stateGroups = /* @__PURE__ */ new Map();
var offToOn = /* @__PURE__ */ new Map();
var onToOff = /* @__PURE__ */ new Map();
var animationGroups = /* @__PURE__ */ new Map();
var internalCatalog = null;
var dynamicCatalog = null;
var dynamicCategories = null;
function buildDynamicCatalog(assets) {
  if (!assets?.catalog || !assets?.sprites) return false;
  const allEntries = assets.catalog.map((asset) => {
    const sprite = assets.sprites[asset.id];
    if (!sprite) {
      console.warn(`No sprite data for asset ${asset.id}`);
      return null;
    }
    return {
      type: asset.id,
      label: asset.label,
      footprintW: asset.footprintW,
      footprintH: asset.footprintH,
      sprite,
      isDesk: asset.isDesk,
      category: asset.category,
      ...asset.orientation ? { orientation: asset.orientation } : {},
      ...asset.canPlaceOnSurfaces ? { canPlaceOnSurfaces: true } : {},
      ...asset.backgroundTiles ? { backgroundTiles: asset.backgroundTiles } : {},
      ...asset.canPlaceOnWalls ? { canPlaceOnWalls: true } : {},
      ...asset.mirrorSide ? { mirrorSide: true } : {}
    };
  }).filter((e) => e !== null);
  for (const asset of assets.catalog) {
    if (asset.mirrorSide && asset.orientation === "side") {
      const sideEntry = allEntries.find((e) => e.type === asset.id);
      if (sideEntry) {
        allEntries.push({
          ...sideEntry,
          type: `${asset.id}:left`,
          orientation: "left",
          mirrorSide: true
        });
      }
    }
  }
  if (allEntries.length === 0) return false;
  rotationGroups.clear();
  stateGroups.clear();
  offToOn.clear();
  onToOff.clear();
  animationGroups.clear();
  const groupMap = /* @__PURE__ */ new Map();
  for (const asset of assets.catalog) {
    if (asset.groupId && asset.orientation) {
      if (asset.state && asset.state !== "off") continue;
      let orientMap = groupMap.get(asset.groupId);
      if (!orientMap) {
        orientMap = /* @__PURE__ */ new Map();
        groupMap.set(asset.groupId, orientMap);
      }
      if (asset.orientation === "side") {
        orientMap.set("right", asset.id);
        if (asset.mirrorSide) {
          orientMap.set("left", `${asset.id}:left`);
        }
      } else {
        orientMap.set(asset.orientation, asset.id);
      }
    }
  }
  const rotationSchemes = /* @__PURE__ */ new Map();
  for (const asset of assets.catalog) {
    if (asset.groupId && asset.rotationScheme) {
      rotationSchemes.set(asset.groupId, asset.rotationScheme);
    }
  }
  const nonFrontIds = /* @__PURE__ */ new Set();
  const orientationOrder = ["front", "right", "back", "left"];
  for (const [groupId, orientMap] of groupMap) {
    if (orientMap.size < 2) continue;
    const scheme = rotationSchemes.get(groupId);
    let allowedOrients = orientationOrder;
    if (scheme === "2-way") {
      allowedOrients = ["front", "right"];
    }
    const orderedOrients = allowedOrients.filter((o) => orientMap.has(o));
    if (orderedOrients.length < 2) continue;
    const members = {};
    for (const o of orderedOrients) {
      members[o] = orientMap.get(o);
    }
    const rg = { orientations: orderedOrients, members };
    const registeredIds = /* @__PURE__ */ new Set();
    for (const id of Object.values(members)) {
      if (!registeredIds.has(id)) {
        rotationGroups.set(id, rg);
        registeredIds.add(id);
      }
    }
    for (const [orient, id] of Object.entries(members)) {
      if (orient !== "front") nonFrontIds.add(id);
    }
  }
  const stateMap = /* @__PURE__ */ new Map();
  for (const asset of assets.catalog) {
    if (asset.groupId && asset.state) {
      const key = `${asset.groupId}|${asset.orientation || ""}`;
      let sm = stateMap.get(key);
      if (!sm) {
        sm = /* @__PURE__ */ new Map();
        stateMap.set(key, sm);
      }
      if (asset.animationGroup && asset.frame !== void 0 && asset.frame > 0) continue;
      sm.set(asset.state, asset.id);
    }
  }
  for (const sm of stateMap.values()) {
    const onId = sm.get("on");
    const offId = sm.get("off");
    if (onId && offId) {
      stateGroups.set(onId, offId);
      stateGroups.set(offId, onId);
      offToOn.set(offId, onId);
      onToOff.set(onId, offId);
    }
  }
  for (const asset of assets.catalog) {
    if (asset.groupId && asset.orientation && asset.state === "on") {
      if (asset.animationGroup && asset.frame !== void 0 && asset.frame > 0) continue;
      const offCounterpart = stateGroups.get(asset.id);
      if (offCounterpart) {
        const offGroup = rotationGroups.get(offCounterpart);
        if (offGroup) {
          const onMembers = {};
          for (const orient of offGroup.orientations) {
            const offId = offGroup.members[orient];
            const onId = stateGroups.get(offId);
            onMembers[orient] = onId ?? offId;
          }
          const onGroup = {
            orientations: offGroup.orientations,
            members: onMembers
          };
          for (const id of Object.values(onMembers)) {
            if (!rotationGroups.has(id)) {
              rotationGroups.set(id, onGroup);
            }
          }
        }
      }
    }
  }
  const animGroupCollector = /* @__PURE__ */ new Map();
  for (const asset of assets.catalog) {
    if (asset.animationGroup && asset.frame !== void 0) {
      let frames = animGroupCollector.get(asset.animationGroup);
      if (!frames) {
        frames = [];
        animGroupCollector.set(asset.animationGroup, frames);
      }
      frames.push({ id: asset.id, frame: asset.frame });
    }
  }
  for (const [groupId, frames] of animGroupCollector) {
    frames.sort((a, b) => a.frame - b.frame);
    animationGroups.set(
      groupId,
      frames.map((f) => f.id)
    );
  }
  const onStateIds = /* @__PURE__ */ new Set();
  for (const asset of assets.catalog) {
    if (asset.state === "on") onStateIds.add(asset.id);
  }
  internalCatalog = allEntries;
  const visibleEntries = allEntries.filter(
    (e) => !nonFrontIds.has(e.type) && !onStateIds.has(e.type)
  );
  for (const entry of visibleEntries) {
    if (rotationGroups.has(entry.type) || stateGroups.has(entry.type)) {
      entry.label = entry.label.replace(/ - Front - Off$/, "").replace(/ - Front$/, "").replace(/ - Off$/, "");
    }
  }
  dynamicCatalog = visibleEntries;
  dynamicCategories = Array.from(new Set(visibleEntries.map((e) => e.category))).filter((c) => !!c).sort();
  const rotGroupCount = new Set(Array.from(rotationGroups.values())).size;
  const animGroupCount = animationGroups.size;
  console.log(
    `\u2713 Built dynamic catalog with ${allEntries.length} assets (${visibleEntries.length} visible, ${rotGroupCount} rotation groups, ${stateGroups.size / 2} state pairs, ${animGroupCount} animation groups)`
  );
  return true;
}
function getCatalogEntry(type) {
  if (internalCatalog) {
    return internalCatalog.find((e) => e.type === type);
  }
  return dynamicCatalog?.find((e) => e.type === type);
}
function getOnStateType(currentType) {
  return offToOn.get(currentType) ?? currentType;
}
function getAnimationFrames(type) {
  for (const [, frames] of animationGroups) {
    if (frames.includes(type)) return frames;
  }
  return null;
}
function getOrientationInGroup(type) {
  const group = rotationGroups.get(type);
  if (!group) return void 0;
  for (const [orient, id] of Object.entries(group.members)) {
    if (id === type) return orient;
  }
  return void 0;
}

// src/office/colorize.ts
var colorizeCache = /* @__PURE__ */ new Map();
function getColorizedSprite(cacheKey, sprite, color) {
  const cached = colorizeCache.get(cacheKey);
  if (cached) return cached;
  const result = color.colorize ? colorizeSprite(sprite, color) : adjustSprite(sprite, color);
  colorizeCache.set(cacheKey, result);
  return result;
}
function clearColorizeCache() {
  colorizeCache.clear();
}
function colorizeSprite(sprite, color) {
  const { h, s, b, c } = color;
  const result = [];
  for (const row of sprite) {
    const newRow = [];
    for (const pixel of row) {
      if (pixel === "") {
        newRow.push("");
        continue;
      }
      const r = parseInt(pixel.slice(1, 3), 16);
      const g = parseInt(pixel.slice(3, 5), 16);
      const bv = parseInt(pixel.slice(5, 7), 16);
      let lightness = (0.299 * r + 0.587 * g + 0.114 * bv) / 255;
      if (c !== 0) {
        const factor = (100 + c) / 100;
        lightness = 0.5 + (lightness - 0.5) * factor;
      }
      if (b !== 0) {
        lightness = lightness + b / 200;
      }
      lightness = Math.max(0, Math.min(1, lightness));
      const alpha = extractAlpha(pixel);
      const satFrac = s / 100;
      const hex = hslToHex(h, satFrac, lightness);
      newRow.push(appendAlpha(hex, alpha));
    }
    result.push(newRow);
  }
  return result;
}
function extractAlpha(pixel) {
  return pixel.length > 7 ? parseInt(pixel.slice(7, 9), 16) : 255;
}
function appendAlpha(hex, alpha) {
  if (alpha >= 255) return hex;
  return `${hex}${alpha.toString(16).padStart(2, "0").toUpperCase()}`;
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs(hp % 2 - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (hp < 3) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const bOut = Math.round((b1 + m) * 255);
  return `#${clamp255(r).toString(16).padStart(2, "0")}${clamp255(g).toString(16).padStart(2, "0")}${clamp255(bOut).toString(16).padStart(2, "0")}`.toUpperCase();
}
function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}
function rgbToHsl(r, g, b) {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) * 60;
  else if (max === gf) h = ((bf - rf) / d + 2) * 60;
  else h = ((rf - gf) / d + 4) * 60;
  return [h, s, l];
}
function adjustSprite(sprite, color) {
  const { h: hShift, s: sShift, b, c } = color;
  const result = [];
  for (const row of sprite) {
    const newRow = [];
    for (const pixel of row) {
      if (pixel === "") {
        newRow.push("");
        continue;
      }
      const r = parseInt(pixel.slice(1, 3), 16);
      const g = parseInt(pixel.slice(3, 5), 16);
      const bv = parseInt(pixel.slice(5, 7), 16);
      const alpha = extractAlpha(pixel);
      const [origH, origS, origL] = rgbToHsl(r, g, bv);
      const newH = ((origH + hShift) % 360 + 360) % 360;
      const newS = Math.max(0, Math.min(1, origS + sShift / 100));
      let lightness = origL;
      if (c !== 0) {
        const factor = (100 + c) / 100;
        lightness = 0.5 + (lightness - 0.5) * factor;
      }
      if (b !== 0) {
        lightness = lightness + b / 200;
      }
      lightness = Math.max(0, Math.min(1, lightness));
      const hex = hslToHex(newH, newS, lightness);
      newRow.push(appendAlpha(hex, alpha));
    }
    result.push(newRow);
  }
  return result;
}

// src/office/layout/layoutSerializer.ts
function layoutToTileMap(layout) {
  const map = [];
  for (let r = 0; r < layout.rows; r++) {
    const row = [];
    for (let c = 0; c < layout.cols; c++) {
      row.push(layout.tiles[r * layout.cols + c]);
    }
    map.push(row);
  }
  return map;
}
function layoutToFurnitureInstances(furniture) {
  const deskZByTile = /* @__PURE__ */ new Map();
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type);
    if (!entry || !entry.isDesk) continue;
    const deskZY = item.row * TILE_SIZE + entry.sprite.length;
    for (let dr = 0; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        const key = `${item.col + dc},${item.row + dr}`;
        const prev = deskZByTile.get(key);
        if (prev === void 0 || deskZY > prev) deskZByTile.set(key, deskZY);
      }
    }
  }
  const instances = [];
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type);
    if (!entry) continue;
    const x = item.col * TILE_SIZE;
    const y = item.row * TILE_SIZE;
    const spriteH = entry.sprite.length;
    let zY = y + spriteH;
    if (entry.category === "chairs") {
      if (entry.orientation === "back") {
        zY = (item.row + entry.footprintH) * TILE_SIZE + 1;
      } else {
        zY = (item.row + 1) * TILE_SIZE;
      }
    }
    if (entry.canPlaceOnSurfaces) {
      for (let dr = 0; dr < entry.footprintH; dr++) {
        for (let dc = 0; dc < entry.footprintW; dc++) {
          const deskZ = deskZByTile.get(`${item.col + dc},${item.row + dr}`);
          if (deskZ !== void 0 && deskZ + 0.5 > zY) zY = deskZ + 0.5;
        }
      }
    }
    let sprite = entry.sprite;
    if (item.color) {
      const { h, s, b: bv, c: cv } = item.color;
      sprite = getColorizedSprite(
        `furn-${item.type}-${h}-${s}-${bv}-${cv}-${item.color.colorize ? 1 : 0}`,
        entry.sprite,
        item.color
      );
    }
    let mirrored = false;
    if (entry.mirrorSide) {
      const orientInGroup = getOrientationInGroup(item.type);
      if (orientInGroup === "left") {
        mirrored = true;
      }
    }
    const flat = entry.category !== "wall" && !entry.canPlaceOnWalls;
    let heightPx = 0;
    if (flat) {
      if (entry.canPlaceOnSurfaces) heightPx = 11;
      else if (entry.isDesk) heightPx = 9;
      else if (entry.category === "chairs") heightPx = 4;
      else if (entry.category === "decor") heightPx = 6;
      else heightPx = 5;
    }
    instances.push({
      sprite,
      x,
      y,
      zY,
      ...mirrored ? { mirrored: true } : {},
      ...flat ? { flat: true } : {},
      ...heightPx > 0 ? { heightPx } : {}
    });
  }
  return instances;
}
function getBlockedTiles(furniture, excludeTiles) {
  const tiles = /* @__PURE__ */ new Set();
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type);
    if (!entry) continue;
    const bgRows = entry.backgroundTiles || 0;
    for (let dr = 0; dr < entry.footprintH; dr++) {
      if (dr < bgRows) continue;
      for (let dc = 0; dc < entry.footprintW; dc++) {
        const key = `${item.col + dc},${item.row + dr}`;
        if (excludeTiles && excludeTiles.has(key)) continue;
        tiles.add(key);
      }
    }
  }
  return tiles;
}
function orientationToFacing(orientation) {
  switch (orientation) {
    case "front":
      return Direction.DOWN;
    case "back":
      return Direction.UP;
    case "left":
      return Direction.LEFT;
    case "right":
    case "side":
      return Direction.RIGHT;
    default:
      return Direction.DOWN;
  }
}
function layoutToSeats(furniture) {
  const seats = /* @__PURE__ */ new Map();
  const deskTiles = /* @__PURE__ */ new Set();
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type);
    if (!entry || !entry.isDesk) continue;
    for (let dr = 0; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        deskTiles.add(`${item.col + dc},${item.row + dr}`);
      }
    }
  }
  const dirs = [
    { dc: 0, dr: -1, facing: Direction.UP },
    // desk is above chair → face UP
    { dc: 0, dr: 1, facing: Direction.DOWN },
    // desk is below chair → face DOWN
    { dc: -1, dr: 0, facing: Direction.LEFT },
    // desk is left of chair → face LEFT
    { dc: 1, dr: 0, facing: Direction.RIGHT }
    // desk is right of chair → face RIGHT
  ];
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type);
    if (!entry || entry.category !== "chairs") continue;
    let seatCount = 0;
    const bgRows = entry.backgroundTiles ?? 0;
    for (let dr = bgRows; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        const tileCol = item.col + dc;
        const tileRow = item.row + dr;
        let facingDir = Direction.DOWN;
        if (entry.orientation) {
          facingDir = orientationToFacing(entry.orientation);
        } else {
          for (const d of dirs) {
            if (deskTiles.has(`${tileCol + d.dc},${tileRow + d.dr}`)) {
              facingDir = d.facing;
              break;
            }
          }
        }
        const seatUid = seatCount === 0 ? item.uid : `${item.uid}:${seatCount}`;
        seats.set(seatUid, {
          uid: seatUid,
          seatCol: tileCol,
          seatRow: tileRow,
          facingDir,
          assigned: false
        });
        seatCount++;
      }
    }
  }
  return seats;
}
var DEFAULT_LEFT_ROOM_COLOR = { h: 35, s: 30, b: 15, c: 0 };
var DEFAULT_RIGHT_ROOM_COLOR = { h: 25, s: 45, b: 5, c: 10 };
function createDefaultLayout() {
  const W = TileType.WALL;
  const F1 = TileType.FLOOR_1;
  const F2 = TileType.FLOOR_2;
  const tiles = [];
  const tileColors = [];
  for (let r = 0; r < DEFAULT_ROWS; r++) {
    for (let c = 0; c < DEFAULT_COLS; c++) {
      if (r === 0 || r === DEFAULT_ROWS - 1 || c === 0 || c === DEFAULT_COLS - 1) {
        tiles.push(W);
        tileColors.push(null);
      } else if (c < 10) {
        tiles.push(F1);
        tileColors.push(DEFAULT_LEFT_ROOM_COLOR);
      } else {
        tiles.push(F2);
        tileColors.push(DEFAULT_RIGHT_ROOM_COLOR);
      }
    }
  }
  return { version: 1, cols: DEFAULT_COLS, rows: DEFAULT_ROWS, tiles, tileColors, furniture: [] };
}

// src/office/layout/tileMap.ts
function isWalkable(col, row, tileMap, blockedTiles) {
  const rows = tileMap.length;
  const cols = rows > 0 ? tileMap[0].length : 0;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  const t = tileMap[row][col];
  if (t === TileType.WALL || t === TileType.VOID) return false;
  if (blockedTiles.has(`${col},${row}`)) return false;
  return true;
}
function getWalkableTiles(tileMap, blockedTiles) {
  const rows = tileMap.length;
  const cols = rows > 0 ? tileMap[0].length : 0;
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isWalkable(c, r, tileMap, blockedTiles)) {
        tiles.push({ col: c, row: r });
      }
    }
  }
  return tiles;
}
function findPath(startCol, startRow, endCol, endRow, tileMap, blockedTiles) {
  if (startCol === endCol && startRow === endRow) return [];
  const key = (c, r) => `${c},${r}`;
  const startKey = key(startCol, startRow);
  const endKey = key(endCol, endRow);
  const endWalkable = isWalkable(endCol, endRow, tileMap, blockedTiles);
  if (!endWalkable) {
    return [];
  }
  const visited = /* @__PURE__ */ new Set();
  visited.add(startKey);
  const parent = /* @__PURE__ */ new Map();
  const queue = [{ col: startCol, row: startRow }];
  const dirs = [
    { dc: 0, dr: -1 },
    // up
    { dc: 0, dr: 1 },
    // down
    { dc: -1, dr: 0 },
    // left
    { dc: 1, dr: 0 }
    // right
  ];
  while (queue.length > 0) {
    const curr = queue.shift();
    const currKey = key(curr.col, curr.row);
    if (currKey === endKey) {
      const path = [];
      let k = endKey;
      while (k !== startKey) {
        const [c, r] = k.split(",").map(Number);
        path.unshift({ col: c, row: r });
        k = parent.get(k);
      }
      return path;
    }
    for (const d of dirs) {
      const nc = curr.col + d.dc;
      const nr = curr.row + d.dr;
      const nk = key(nc, nr);
      if (visited.has(nk)) continue;
      if (!isWalkable(nc, nr, tileMap, blockedTiles)) continue;
      visited.add(nk);
      parent.set(nk, currKey);
      queue.push({ col: nc, row: nr });
    }
  }
  return [];
}

// src/office/sprites/bubble-permission.json
var bubble_permission_default = {
  name: "bubble-permission",
  description: "Permission bubble: white square with '...' in amber, and a tail pointer (11x13)",
  width: 11,
  height: 13,
  palette: {
    _: "",
    B: "#555566",
    F: "#EEEEFF",
    A: "#CCA700"
  },
  pixels: [
    ["B", "B", "B", "B", "B", "B", "B", "B", "B", "B", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "A", "F", "A", "F", "A", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "B", "B", "B", "B", "B", "B", "B", "B", "B", "B"],
    ["_", "_", "_", "_", "B", "B", "B", "_", "_", "_", "_"],
    ["_", "_", "_", "_", "_", "B", "_", "_", "_", "_", "_"],
    ["_", "_", "_", "_", "_", "_", "_", "_", "_", "_", "_"]
  ]
};

// src/office/sprites/bubble-waiting.json
var bubble_waiting_default = {
  name: "bubble-waiting",
  description: "Waiting bubble: white square with green checkmark, and a tail pointer (11x13)",
  width: 11,
  height: 13,
  palette: {
    _: "",
    B: "#555566",
    F: "#EEEEFF",
    G: "#44BB66"
  },
  pixels: [
    ["_", "B", "B", "B", "B", "B", "B", "B", "B", "B", "_"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "G", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "G", "F", "F", "B"],
    ["B", "F", "F", "G", "F", "F", "G", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "G", "G", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["B", "F", "F", "F", "F", "F", "F", "F", "F", "F", "B"],
    ["_", "B", "B", "B", "B", "B", "B", "B", "B", "B", "_"],
    ["_", "_", "_", "_", "B", "B", "B", "_", "_", "_", "_"],
    ["_", "_", "_", "_", "_", "B", "_", "_", "_", "_", "_"],
    ["_", "_", "_", "_", "_", "_", "_", "_", "_", "_", "_"]
  ]
};

// src/office/sprites/spriteData.ts
function resolveBubbleSprite(data) {
  return data.pixels.map((row) => row.map((key) => data.palette[key] ?? key));
}
var BUBBLE_PERMISSION_SPRITE = resolveBubbleSprite(bubble_permission_default);
var BUBBLE_WAITING_SPRITE = resolveBubbleSprite(bubble_waiting_default);
var loadedCharacters = null;
function setCharacterTemplates(data) {
  loadedCharacters = data;
  spriteCache.clear();
}
function getLoadedCharacterCount() {
  return loadedCharacters ? loadedCharacters.length : PALETTE_COUNT;
}
function flipSpriteHorizontal(sprite) {
  return sprite.map((row) => [...row].reverse());
}
var spriteCache = /* @__PURE__ */ new Map();
function hueShiftSprites(sprites, hueShift) {
  const color = { h: hueShift, s: 0, b: 0, c: 0 };
  const shift = (s) => adjustSprite(s, color);
  const shiftWalk = (arr) => [
    shift(arr[0]),
    shift(arr[1]),
    shift(arr[2]),
    shift(arr[3])
  ];
  const shiftPair = (arr) => [
    shift(arr[0]),
    shift(arr[1])
  ];
  return {
    walk: {
      [Direction.DOWN]: shiftWalk(sprites.walk[Direction.DOWN]),
      [Direction.UP]: shiftWalk(sprites.walk[Direction.UP]),
      [Direction.RIGHT]: shiftWalk(sprites.walk[Direction.RIGHT]),
      [Direction.LEFT]: shiftWalk(sprites.walk[Direction.LEFT])
    },
    typing: {
      [Direction.DOWN]: shiftPair(sprites.typing[Direction.DOWN]),
      [Direction.UP]: shiftPair(sprites.typing[Direction.UP]),
      [Direction.RIGHT]: shiftPair(sprites.typing[Direction.RIGHT]),
      [Direction.LEFT]: shiftPair(sprites.typing[Direction.LEFT])
    },
    reading: {
      [Direction.DOWN]: shiftPair(sprites.reading[Direction.DOWN]),
      [Direction.UP]: shiftPair(sprites.reading[Direction.UP]),
      [Direction.RIGHT]: shiftPair(sprites.reading[Direction.RIGHT]),
      [Direction.LEFT]: shiftPair(sprites.reading[Direction.LEFT])
    }
  };
}
function emptySprite(w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    rows.push(new Array(w).fill(""));
  }
  return rows;
}
function getCharacterSprites(paletteIndex, hueShift = 0) {
  const cacheKey = `${paletteIndex}:${hueShift}`;
  const cached = spriteCache.get(cacheKey);
  if (cached) return cached;
  let sprites;
  if (loadedCharacters) {
    const char = loadedCharacters[paletteIndex % loadedCharacters.length];
    const d = char.down;
    const u = char.up;
    const rt = char.right;
    const flip = flipSpriteHorizontal;
    sprites = {
      walk: {
        [Direction.DOWN]: [d[0], d[1], d[2], d[1]],
        [Direction.UP]: [u[0], u[1], u[2], u[1]],
        [Direction.RIGHT]: [rt[0], rt[1], rt[2], rt[1]],
        [Direction.LEFT]: [flip(rt[0]), flip(rt[1]), flip(rt[2]), flip(rt[1])]
      },
      typing: {
        [Direction.DOWN]: [d[3], d[4]],
        [Direction.UP]: [u[3], u[4]],
        [Direction.RIGHT]: [rt[3], rt[4]],
        [Direction.LEFT]: [flip(rt[3]), flip(rt[4])]
      },
      reading: {
        [Direction.DOWN]: [d[5], d[6]],
        [Direction.UP]: [u[5], u[6]],
        [Direction.RIGHT]: [rt[5], rt[6]],
        [Direction.LEFT]: [flip(rt[5]), flip(rt[6])]
      }
    };
  } else {
    const e = emptySprite(16, 32);
    const walkSet = [e, e, e, e];
    const pairSet = [e, e];
    sprites = {
      walk: {
        [Direction.DOWN]: walkSet,
        [Direction.UP]: walkSet,
        [Direction.RIGHT]: walkSet,
        [Direction.LEFT]: walkSet
      },
      typing: {
        [Direction.DOWN]: pairSet,
        [Direction.UP]: pairSet,
        [Direction.RIGHT]: pairSet,
        [Direction.LEFT]: pairSet
      },
      reading: {
        [Direction.DOWN]: pairSet,
        [Direction.UP]: pairSet,
        [Direction.RIGHT]: pairSet,
        [Direction.LEFT]: pairSet
      }
    };
  }
  if (hueShift !== 0) {
    sprites = hueShiftSprites(sprites, hueShift);
  }
  spriteCache.set(cacheKey, sprites);
  return sprites;
}

// src/office/engine/characters.ts
var READING_TOOLS = /* @__PURE__ */ new Set(["Read", "Grep", "Glob", "WebFetch", "WebSearch"]);
function isReadingTool(tool) {
  if (!tool) return false;
  return READING_TOOLS.has(tool);
}
function tileCenter(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2
  };
}
function directionBetween(fromCol, fromRow, toCol, toRow) {
  const dc = toCol - fromCol;
  const dr = toRow - fromRow;
  if (dc > 0) return Direction.RIGHT;
  if (dc < 0) return Direction.LEFT;
  if (dr > 0) return Direction.DOWN;
  return Direction.UP;
}
function createCharacter(id, palette, seatId, seat, hueShift = 0) {
  const col = seat ? seat.seatCol : 1;
  const row = seat ? seat.seatRow : 1;
  const center = tileCenter(col, row);
  return {
    id,
    state: CharacterState.TYPE,
    dir: seat ? seat.facingDir : Direction.DOWN,
    x: center.x,
    y: center.y,
    tileCol: col,
    tileRow: row,
    path: [],
    moveProgress: 0,
    currentTool: null,
    palette,
    hueShift,
    frame: 0,
    frameTimer: 0,
    wanderTimer: 0,
    wanderCount: 0,
    wanderLimit: randomInt(WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX),
    isActive: true,
    seatId,
    bubbleType: null,
    bubbleTimer: 0,
    seatTimer: 0,
    isSubagent: false,
    parentAgentId: null,
    matrixEffect: null,
    matrixEffectTimer: 0,
    matrixEffectSeeds: [],
    inputTokens: 0,
    outputTokens: 0
  };
}
function updateCharacter(ch, dt, walkableTiles, seats, tileMap, blockedTiles) {
  if(ch.officeMeeting && (ch.officeMeeting.persistent||ch.officeMeeting.expiresAt>Date.now()) && (ch.state!==CharacterState.WALK || ch.path.length===0)) {
    ch.state=ch.officeMeeting.seatUid?CharacterState.TYPE:CharacterState.IDLE;if(ch.officeMeeting.facingDir!==undefined)ch.dir=ch.officeMeeting.facingDir;ch.frame=0;ch.frameTimer=0;return;
  }
  ch.frameTimer += dt;
  switch (ch.state) {
    case CharacterState.TYPE: {
      if (ch.frameTimer >= TYPE_FRAME_DURATION_SEC) {
        ch.frameTimer -= TYPE_FRAME_DURATION_SEC;
        ch.frame = (ch.frame + 1) % 2;
      }
      if (!ch.isActive) {
        if (ch.seatTimer > 0) {
          ch.seatTimer -= dt;
          break;
        }
        ch.seatTimer = 0;
        ch.state = CharacterState.IDLE;
        ch.frame = 0;
        ch.frameTimer = 0;
        ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC);
        ch.wanderCount = 0;
        ch.wanderLimit = randomInt(WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX);
      }
      break;
    }
    case CharacterState.IDLE: {
      ch.frame = 0;
      if (ch.seatTimer < 0) ch.seatTimer = 0;
      if (ch.isActive) {
        if (!ch.seatId) {
          ch.state = CharacterState.TYPE;
          ch.frame = 0;
          ch.frameTimer = 0;
          break;
        }
        const seat = seats.get(ch.seatId);
        if (seat) {
          const path = findPath(
            ch.tileCol,
            ch.tileRow,
            seat.seatCol,
            seat.seatRow,
            tileMap,
            blockedTiles
          );
          if (path.length > 0) {
            ch.path = path;
            ch.moveProgress = 0;
            ch.state = CharacterState.WALK;
            ch.frame = 0;
            ch.frameTimer = 0;
          } else {
            ch.state = CharacterState.TYPE;
            ch.dir = seat.facingDir;
            ch.frame = 0;
            ch.frameTimer = 0;
          }
        }
        break;
      }
      ch.wanderTimer -= dt;
      if (ch.wanderTimer <= 0) {
        if (ch.wanderCount >= ch.wanderLimit) {
          ch.wanderCount = 0;
          ch.wanderLimit = randomInt(WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX);
        }
        if (walkableTiles.length > 0) {
          const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
          const path = findPath(
            ch.tileCol,
            ch.tileRow,
            target.col,
            target.row,
            tileMap,
            blockedTiles
          );
          if (path.length > 0) {
            ch.path = path;
            ch.moveProgress = 0;
            ch.state = CharacterState.WALK;
            ch.frame = 0;
            ch.frameTimer = 0;
            ch.wanderCount++;
          }
        }
        ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC);
      }
      break;
    }
    case CharacterState.WALK: {
      if (ch.frameTimer >= WALK_FRAME_DURATION_SEC) {
        ch.frameTimer -= WALK_FRAME_DURATION_SEC;
        ch.frame = (ch.frame + 1) % 4;
      }
      if (ch.path.length === 0) {
        const center = tileCenter(ch.tileCol, ch.tileRow);
        ch.x = center.x;
        ch.y = center.y;
        if (ch.isActive) {
          if (!ch.seatId) {
            ch.state = CharacterState.TYPE;
          } else {
            const seat = seats.get(ch.seatId);
            if (seat && ch.tileCol === seat.seatCol && ch.tileRow === seat.seatRow) {
              ch.state = CharacterState.TYPE;
              ch.dir = seat.facingDir;
            } else {
              ch.state = CharacterState.IDLE;
            }
          }
        } else {
          ch.state = CharacterState.IDLE;
          ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC);
        }
        ch.frame = 0;
        ch.frameTimer = 0;
        break;
      }
      const nextTile = ch.path[0];
      ch.dir = directionBetween(ch.tileCol, ch.tileRow, nextTile.col, nextTile.row);
      ch.moveProgress += WALK_SPEED_PX_PER_SEC / TILE_SIZE * dt;
      const fromCenter = tileCenter(ch.tileCol, ch.tileRow);
      const toCenter = tileCenter(nextTile.col, nextTile.row);
      const t = Math.min(ch.moveProgress, 1);
      ch.x = fromCenter.x + (toCenter.x - fromCenter.x) * t;
      ch.y = fromCenter.y + (toCenter.y - fromCenter.y) * t;
      if (ch.moveProgress >= 1) {
        ch.tileCol = nextTile.col;
        ch.tileRow = nextTile.row;
        ch.x = toCenter.x;
        ch.y = toCenter.y;
        ch.path.shift();
        ch.moveProgress = 0;
      }
      if (ch.isActive && ch.seatId && !ch.officeMeeting) {
        const seat = seats.get(ch.seatId);
        if (seat) {
          const lastStep = ch.path[ch.path.length - 1];
          if (!lastStep || lastStep.col !== seat.seatCol || lastStep.row !== seat.seatRow) {
            const newPath = findPath(
              ch.tileCol,
              ch.tileRow,
              seat.seatCol,
              seat.seatRow,
              tileMap,
              blockedTiles
            );
            if (newPath.length > 0) {
              ch.path = newPath;
              ch.moveProgress = 0;
            }
          }
        }
      }
      break;
    }
  }
}
function getCharacterSprite(ch, sprites) {
  switch (ch.state) {
    case CharacterState.TYPE:
      if (isReadingTool(ch.currentTool)) {
        return sprites.reading[ch.dir][ch.frame % 2];
      }
      return sprites.typing[ch.dir][ch.frame % 2];
    case CharacterState.WALK:
      return sprites.walk[ch.dir][ch.frame % 4];
    case CharacterState.IDLE:
      return sprites.walk[ch.dir][1];
    default:
      return sprites.walk[ch.dir][1];
  }
}
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// src/office/engine/matrixEffect.ts
function flickerVisible(col, row, time) {
  const t = Math.floor(time * MATRIX_FLICKER_FPS);
  const hash = col * 7 + row * 13 + t * 31 & 255;
  return hash < MATRIX_FLICKER_VISIBILITY_THRESHOLD;
}
function generateSeeds() {
  const seeds = [];
  for (let i = 0; i < MATRIX_SPRITE_COLS; i++) {
    seeds.push(Math.random());
  }
  return seeds;
}
function renderMatrixEffect(ctx, ch, spriteData, drawX, drawY, zoom) {
  const progress = ch.matrixEffectTimer / MATRIX_EFFECT_DURATION_SEC;
  const isSpawn = ch.matrixEffect === "spawn";
  const time = ch.matrixEffectTimer;
  const totalSweep = MATRIX_SPRITE_ROWS + MATRIX_TRAIL_LENGTH;
  for (let col = 0; col < MATRIX_SPRITE_COLS; col++) {
    const stagger = (ch.matrixEffectSeeds[col] ?? 0) * MATRIX_COLUMN_STAGGER_RANGE;
    const colProgress = Math.max(
      0,
      Math.min(1, (progress - stagger) / (1 - MATRIX_COLUMN_STAGGER_RANGE))
    );
    const headRow = colProgress * totalSweep;
    for (let row = 0; row < MATRIX_SPRITE_ROWS; row++) {
      const pixel = spriteData[row]?.[col];
      const hasPixel = pixel && pixel !== "";
      const distFromHead = headRow - row;
      const px = drawX + col * zoom;
      const py = drawY + row * zoom;
      if (isSpawn) {
        if (distFromHead < 0) {
          continue;
        } else if (distFromHead < 1) {
          ctx.fillStyle = MATRIX_HEAD_COLOR;
          ctx.fillRect(px, py, zoom, zoom);
        } else if (distFromHead < MATRIX_TRAIL_LENGTH) {
          const trailPos = distFromHead / MATRIX_TRAIL_LENGTH;
          if (hasPixel) {
            ctx.fillStyle = pixel;
            ctx.fillRect(px, py, zoom, zoom);
            const greenAlpha = (1 - trailPos) * MATRIX_TRAIL_OVERLAY_ALPHA;
            if (flickerVisible(col, row, time)) {
              ctx.fillStyle = matrixGreenBright(greenAlpha);
              ctx.fillRect(px, py, zoom, zoom);
            }
          } else {
            if (flickerVisible(col, row, time)) {
              const alpha = (1 - trailPos) * MATRIX_TRAIL_EMPTY_ALPHA;
              ctx.fillStyle = trailPos < MATRIX_TRAIL_MID_THRESHOLD ? matrixGreenBright(alpha) : trailPos < MATRIX_TRAIL_DIM_THRESHOLD ? matrixGreenMid(alpha) : matrixGreenDim(alpha);
              ctx.fillRect(px, py, zoom, zoom);
            }
          }
        } else {
          if (hasPixel) {
            ctx.fillStyle = pixel;
            ctx.fillRect(px, py, zoom, zoom);
          }
        }
      } else {
        if (distFromHead < 0) {
          if (hasPixel) {
            ctx.fillStyle = pixel;
            ctx.fillRect(px, py, zoom, zoom);
          }
        } else if (distFromHead < 1) {
          ctx.fillStyle = MATRIX_HEAD_COLOR;
          ctx.fillRect(px, py, zoom, zoom);
        } else if (distFromHead < MATRIX_TRAIL_LENGTH) {
          if (flickerVisible(col, row, time)) {
            const trailPos = distFromHead / MATRIX_TRAIL_LENGTH;
            const alpha = (1 - trailPos) * MATRIX_TRAIL_EMPTY_ALPHA;
            ctx.fillStyle = trailPos < MATRIX_TRAIL_MID_THRESHOLD ? matrixGreenBright(alpha) : trailPos < MATRIX_TRAIL_DIM_THRESHOLD ? matrixGreenMid(alpha) : matrixGreenDim(alpha);
            ctx.fillRect(px, py, zoom, zoom);
          }
        }
      }
    }
  }
}

// src/office/engine/officeState.ts
var OfficeState = class {
  layout;
  tileMap;
  seats;
  blockedTiles;
  furniture;
  walkableTiles;
  characters = /* @__PURE__ */ new Map();
  /** Accumulated time for furniture animation frame cycling */
  furnitureAnimTimer = 0;
  selectedAgentId = null;
  cameraFollowId = null;
  hoveredAgentId = null;
  hoveredTile = null;
  /** Maps "parentId:toolId" → sub-agent character ID (negative) */
  subagentIdMap = /* @__PURE__ */ new Map();
  /** Reverse lookup: sub-agent character ID → parent info */
  subagentMeta = /* @__PURE__ */ new Map();
  nextSubagentId = -1;
  constructor(layout) {
    this.layout = layout || createDefaultLayout();
    this.tileMap = layoutToTileMap(this.layout);
    this.seats = layoutToSeats(this.layout.furniture);
    this.blockedTiles = getBlockedTiles(this.layout.furniture);
    this.furniture = layoutToFurnitureInstances(this.layout.furniture);
    this.walkableTiles = getWalkableTiles(this.tileMap, this.blockedTiles);
  }
  /** Rebuild all derived state from a new layout. Reassigns existing characters.
   *  @param shift Optional pixel shift to apply when grid expands left/up */
  rebuildFromLayout(layout, shift) {
    for(const ch of this.characters.values()){delete ch.officeMeeting;delete ch.meetingSpeech;}
    this.layout = layout;
    this.tileMap = layoutToTileMap(layout);
    this.seats = layoutToSeats(layout.furniture);
    this.blockedTiles = getBlockedTiles(layout.furniture);
    this.rebuildFurnitureInstances();
    this.walkableTiles = getWalkableTiles(this.tileMap, this.blockedTiles);
    if (shift && (shift.col !== 0 || shift.row !== 0)) {
      for (const ch of this.characters.values()) {
        ch.tileCol += shift.col;
        ch.tileRow += shift.row;
        ch.x += shift.col * TILE_SIZE;
        ch.y += shift.row * TILE_SIZE;
        ch.path = [];
        ch.moveProgress = 0;
      }
    }
    for (const seat of this.seats.values()) {
      seat.assigned = false;
    }
    for (const ch of this.characters.values()) {
      if (ch.seatId && this.seats.has(ch.seatId)) {
        const seat = this.seats.get(ch.seatId);
        if (!seat.assigned) {
          seat.assigned = true;
          ch.tileCol = seat.seatCol;
          ch.tileRow = seat.seatRow;
          const cx = seat.seatCol * TILE_SIZE + TILE_SIZE / 2;
          const cy = seat.seatRow * TILE_SIZE + TILE_SIZE / 2;
          ch.x = cx;
          ch.y = cy;
          ch.dir = seat.facingDir;
          continue;
        }
      }
      ch.seatId = null;
    }
    for (const ch of this.characters.values()) {
      if (ch.seatId) continue;
      const seatId = this.findFreeSeat();
      if (seatId) {
        this.seats.get(seatId).assigned = true;
        ch.seatId = seatId;
        const seat = this.seats.get(seatId);
        ch.tileCol = seat.seatCol;
        ch.tileRow = seat.seatRow;
        ch.x = seat.seatCol * TILE_SIZE + TILE_SIZE / 2;
        ch.y = seat.seatRow * TILE_SIZE + TILE_SIZE / 2;
        ch.dir = seat.facingDir;
      }
    }
    for (const ch of this.characters.values()) {
      if (ch.seatId) continue;
      if (ch.tileCol < 0 || ch.tileCol >= layout.cols || ch.tileRow < 0 || ch.tileRow >= layout.rows) {
        this.relocateCharacterToWalkable(ch);
      }
    }
  }
  /** Move a character to a random walkable tile */
  relocateCharacterToWalkable(ch) {
    if (this.walkableTiles.length === 0) return;
    const spawn = this.walkableTiles[Math.floor(Math.random() * this.walkableTiles.length)];
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.path = [];
    ch.moveProgress = 0;
  }
  getSpawnTile() {
    const spawn = this.layout.spawnTile;
    if (spawn && isWalkable(spawn.col, spawn.row, this.tileMap, this.blockedTiles)) {
      return spawn;
    }
    return this.walkableTiles[0] ?? { col: 1, row: 1 };
  }
  moveCharacterToSpawn(ch) {
    const spawn = this.getSpawnTile();
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.path = [];
    ch.moveProgress = 0;
    ch.state = CharacterState.IDLE;
    ch.dir = Direction.DOWN;
    ch.frame = 0;
    ch.frameTimer = 0;
    ch.wanderTimer = Math.random() * 3;
  }
  getLayout() {
    return this.layout;
  }
  /** Get the blocked-tile key for a character's own seat, or null */
  ownSeatKey(ch) {
    if (!ch.seatId) return null;
    const seat = this.seats.get(ch.seatId);
    if (!seat) return null;
    return `${seat.seatCol},${seat.seatRow}`;
  }
  /** Temporarily unblock a character's own seat, run fn, then re-block */
  withOwnSeatUnblocked(ch,fn){
    const keys=new Set([this.ownSeatKey(ch),ch.officeMeeting?ch.officeMeeting.target.col+','+ch.officeMeeting.target.row:null].filter(Boolean)),blocked=[...keys].filter(key=>this.blockedTiles.has(key));
    for(const key of blocked)this.blockedTiles.delete(key);try{return fn();}finally{for(const key of blocked)this.blockedTiles.add(key);}
  }
  findFreeSeat() {
    const electronicsTiles = /* @__PURE__ */ new Set();
    for (const item of this.layout.furniture) {
      const entry = getCatalogEntry(item.type);
      if (!entry || entry.category !== "electronics") continue;
      for (let dr = 0; dr < entry.footprintH; dr++) {
        for (let dc = 0; dc < entry.footprintW; dc++) {
          electronicsTiles.add(`${item.col + dc},${item.row + dr}`);
        }
      }
    }
    const pcSeats = [];
    const otherSeats = [];
    for (const [uid, seat] of this.seats) {
      if (seat.assigned) continue;
      let facesPC = false;
      const dCol = seat.facingDir === Direction.RIGHT ? 1 : seat.facingDir === Direction.LEFT ? -1 : 0;
      const dRow = seat.facingDir === Direction.DOWN ? 1 : seat.facingDir === Direction.UP ? -1 : 0;
      for (let d = 1; d <= AUTO_ON_FACING_DEPTH && !facesPC; d++) {
        const tileCol = seat.seatCol + dCol * d;
        const tileRow = seat.seatRow + dRow * d;
        if (electronicsTiles.has(`${tileCol},${tileRow}`)) {
          facesPC = true;
          break;
        }
        if (dCol !== 0) {
          if (electronicsTiles.has(`${tileCol},${tileRow - 1}`) || electronicsTiles.has(`${tileCol},${tileRow + 1}`)) {
            facesPC = true;
            break;
          }
        } else {
          if (electronicsTiles.has(`${tileCol - 1},${tileRow}`) || electronicsTiles.has(`${tileCol + 1},${tileRow}`)) {
            facesPC = true;
            break;
          }
        }
      }
      (facesPC ? pcSeats : otherSeats).push(uid);
    }
    if (pcSeats.length > 0) return pcSeats[Math.floor(Math.random() * pcSeats.length)];
    if (otherSeats.length > 0) return otherSeats[Math.floor(Math.random() * otherSeats.length)];
    return null;
  }
  /**
   * Pick a diverse palette for a new agent based on currently active agents.
   * First 6 agents each get a unique skin (random order). Beyond 6, skins
   * repeat in balanced rounds with a random hue shift (≥45°).
   */
  pickDiversePalette() {
    const paletteCount = getLoadedCharacterCount();
    const counts = new Array(paletteCount).fill(0);
    for (const ch of this.characters.values()) {
      if (ch.isSubagent) continue;
      if (ch.palette < paletteCount) counts[ch.palette]++;
    }
    const minCount = Math.min(...counts);
    const available = [];
    for (let i = 0; i < paletteCount; i++) {
      if (counts[i] === minCount) available.push(i);
    }
    const palette = available[Math.floor(Math.random() * available.length)];
    let hueShift = 0;
    if (minCount > 0) {
      hueShift = HUE_SHIFT_MIN_DEG + Math.floor(Math.random() * HUE_SHIFT_RANGE_DEG);
    }
    return { palette, hueShift };
  }
  addAgent(id, preferredPalette, preferredHueShift, preferredSeatId, skipSpawnEffect, folderName) {
    if (this.characters.has(id)) return;
    let palette;
    let hueShift;
    if (preferredPalette !== void 0) {
      palette = preferredPalette;
      hueShift = preferredHueShift ?? 0;
    } else {
      const pick = this.pickDiversePalette();
      palette = pick.palette;
      hueShift = pick.hueShift;
    }
    let seatId = null;
    if (preferredSeatId && this.seats.has(preferredSeatId)) {
      const seat = this.seats.get(preferredSeatId);
      if (!seat.assigned) {
        seatId = preferredSeatId;
      }
    }
    if (!seatId) {
      seatId = this.findFreeSeat();
    }
    let ch;
    if (seatId) {
      const seat = this.seats.get(seatId);
      seat.assigned = true;
      ch = createCharacter(id, palette, seatId, seat, hueShift);
      this.moveCharacterToSpawn(ch);
    } else {
      ch = createCharacter(id, palette, null, null, hueShift);
      this.moveCharacterToSpawn(ch);
    }
    if (folderName) {
      ch.folderName = folderName;
    }
    if (!skipSpawnEffect) {
      ch.matrixEffect = "spawn";
      ch.matrixEffectTimer = 0;
      ch.matrixEffectSeeds = generateSeeds();
    }
    this.characters.set(id, ch);
  }
  removeAgent(id) {
    const ch = this.characters.get(id);
    if (!ch) return;
    if (ch.matrixEffect === "despawn") return;
    if (ch.seatId) {
      const seat = this.seats.get(ch.seatId);
      if (seat) seat.assigned = false;
    }
    if (this.selectedAgentId === id) this.selectedAgentId = null;
    if (this.cameraFollowId === id) this.cameraFollowId = null;
    ch.matrixEffect = "despawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = generateSeeds();
    ch.bubbleType = null;
  }
  /** Find seat uid at a given tile position, or null */
  getSeatAtTile(col, row) {
    for (const [uid, seat] of this.seats) {
      if (seat.seatCol === col && seat.seatRow === row) return uid;
    }
    return null;
  }
  /** Reassign an agent from their current seat to a new seat */
  reassignSeat(agentId, seatId) {
    const ch = this.characters.get(agentId);
    if (!ch) return;
    if (ch.seatId) {
      const old = this.seats.get(ch.seatId);
      if (old) old.assigned = false;
    }
    const seat = this.seats.get(seatId);
    if (!seat || seat.assigned) return;
    seat.assigned = true;
    ch.seatId = seatId;
    const path = this.withOwnSeatUnblocked(
      ch,
      () => findPath(ch.tileCol, ch.tileRow, seat.seatCol, seat.seatRow, this.tileMap, this.blockedTiles)
    );
    if (path.length > 0) {
      ch.path = path;
      ch.moveProgress = 0;
      ch.state = CharacterState.WALK;
      ch.frame = 0;
      ch.frameTimer = 0;
    } else {
      ch.state = CharacterState.TYPE;
      ch.dir = seat.facingDir;
      ch.frame = 0;
      ch.frameTimer = 0;
      if (!ch.isActive) {
        ch.seatTimer = INACTIVE_SEAT_TIMER_MIN_SEC + Math.random() * INACTIVE_SEAT_TIMER_RANGE_SEC;
      }
    }
  }
  /** Send an agent back to their currently assigned seat */
  sendToSeat(agentId) {
    const ch = this.characters.get(agentId);
    if(ch?.officeMeeting)return;
    if (!ch || !ch.seatId) return;
    const seat = this.seats.get(ch.seatId);
    if (!seat) return;
    const path = this.withOwnSeatUnblocked(
      ch,
      () => findPath(ch.tileCol, ch.tileRow, seat.seatCol, seat.seatRow, this.tileMap, this.blockedTiles)
    );
    if (path.length > 0) {
      ch.path = path;
      ch.moveProgress = 0;
      ch.state = CharacterState.WALK;
      ch.frame = 0;
      ch.frameTimer = 0;
    } else {
      ch.state = CharacterState.TYPE;
      ch.dir = seat.facingDir;
      ch.frame = 0;
      ch.frameTimer = 0;
      if (!ch.isActive) {
        ch.seatTimer = INACTIVE_SEAT_TIMER_MIN_SEC + Math.random() * INACTIVE_SEAT_TIMER_RANGE_SEC;
      }
    }
  }
  /** Walk an agent to an arbitrary walkable tile (right-click command) */
  walkToTile(agentId, col, row) {
    const ch = this.characters.get(agentId);
    if (!ch || ch.isSubagent || ch.officeMeeting) return false;
    if (!isWalkable(col, row, this.tileMap, this.blockedTiles)) {
      const key = this.ownSeatKey(ch);
      if (!key || key !== `${col},${row}`) return false;
    }
    const path = this.withOwnSeatUnblocked(
      ch,
      () => findPath(ch.tileCol, ch.tileRow, col, row, this.tileMap, this.blockedTiles)
    );
    if (path.length === 0) return false;
    ch.path = path;
    ch.moveProgress = 0;
    ch.state = CharacterState.WALK;
    ch.frame = 0;
    ch.frameTimer = 0;
    return true;
  }
  /** Create a sub-agent character with the parent's palette. Returns the sub-agent ID. */
  addSubagent(parentAgentId, parentToolId) {
    const key = `${parentAgentId}:${parentToolId}`;
    if (this.subagentIdMap.has(key)) return this.subagentIdMap.get(key);
    const id = this.nextSubagentId--;
    const parentCh = this.characters.get(parentAgentId);
    const palette = parentCh ? parentCh.palette : 0;
    const hueShift = parentCh ? parentCh.hueShift : 0;
    const parentCol = parentCh ? parentCh.tileCol : 0;
    const parentRow = parentCh ? parentCh.tileRow : 0;
    const dist = (c, r) => Math.abs(c - parentCol) + Math.abs(r - parentRow);
    const occupiedTiles = /* @__PURE__ */ new Set();
    for (const [, other] of this.characters) {
      occupiedTiles.add(`${other.tileCol},${other.tileRow}`);
    }
    let spawn = { col: parentCol, row: parentRow };
    if (this.walkableTiles.length > 0) {
      let closest = this.walkableTiles[0];
      let closestDist = Infinity;
      for (const tile of this.walkableTiles) {
        if (occupiedTiles.has(`${tile.col},${tile.row}`)) continue;
        const d = dist(tile.col, tile.row);
        if (d < closestDist) {
          closest = tile;
          closestDist = d;
        }
      }
      spawn = closest;
    }
    const ch = createCharacter(id, palette, null, null, hueShift);
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
    if (parentCh) ch.dir = parentCh.dir;
    ch.isSubagent = true;
    ch.parentAgentId = parentAgentId;
    ch.matrixEffect = "spawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = generateSeeds();
    this.characters.set(id, ch);
    this.subagentIdMap.set(key, id);
    this.subagentMeta.set(id, { parentAgentId, parentToolId });
    return id;
  }
  /** Remove a specific sub-agent character and free its seat */
  removeSubagent(parentAgentId, parentToolId) {
    const key = `${parentAgentId}:${parentToolId}`;
    const id = this.subagentIdMap.get(key);
    if (id === void 0) return;
    const ch = this.characters.get(id);
    if (ch) {
      if (ch.matrixEffect === "despawn") {
        this.subagentIdMap.delete(key);
        this.subagentMeta.delete(id);
        return;
      }
      if (ch.seatId) {
        const seat = this.seats.get(ch.seatId);
        if (seat) seat.assigned = false;
      }
      ch.matrixEffect = "despawn";
      ch.matrixEffectTimer = 0;
      ch.matrixEffectSeeds = generateSeeds();
      ch.bubbleType = null;
    }
    this.subagentIdMap.delete(key);
    this.subagentMeta.delete(id);
    if (this.selectedAgentId === id) this.selectedAgentId = null;
    if (this.cameraFollowId === id) this.cameraFollowId = null;
  }
  /** Remove all sub-agents belonging to a parent agent */
  removeAllSubagents(parentAgentId) {
    const toRemove = [];
    for (const [key, id] of this.subagentIdMap) {
      const meta = this.subagentMeta.get(id);
      if (meta && meta.parentAgentId === parentAgentId) {
        const ch = this.characters.get(id);
        if (ch) {
          if (ch.matrixEffect === "despawn") {
            this.subagentMeta.delete(id);
            toRemove.push(key);
            continue;
          }
          if (ch.seatId) {
            const seat = this.seats.get(ch.seatId);
            if (seat) seat.assigned = false;
          }
          ch.matrixEffect = "despawn";
          ch.matrixEffectTimer = 0;
          ch.matrixEffectSeeds = generateSeeds();
          ch.bubbleType = null;
        }
        this.subagentMeta.delete(id);
        if (this.selectedAgentId === id) this.selectedAgentId = null;
        if (this.cameraFollowId === id) this.cameraFollowId = null;
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.subagentIdMap.delete(key);
    }
  }
  /** Look up the sub-agent character ID for a given parent+toolId, or null */
  getSubagentId(parentAgentId, parentToolId) {
    return this.subagentIdMap.get(`${parentAgentId}:${parentToolId}`) ?? null;
  }
  setAgentActive(id, active) {
    const ch = this.characters.get(id);
    if (ch) {
      ch.isActive = active;
      if(ch.officeMeeting) return;
      if (!active) {
        ch.seatTimer = -1;
        ch.path = [];
        ch.moveProgress = 0;
      }
      this.rebuildFurnitureInstances();
    }
  }
  /** Rebuild furniture instances with auto-state applied (active agents turn electronics ON) */
  rebuildFurnitureInstances() {
    const autoOnTiles = /* @__PURE__ */ new Set();
    for (const ch of this.characters.values()) {
      if (!ch.isActive || !ch.seatId) continue;
      const seat = this.seats.get(ch.seatId);
      if (!seat) continue;
      const dCol = seat.facingDir === Direction.RIGHT ? 1 : seat.facingDir === Direction.LEFT ? -1 : 0;
      const dRow = seat.facingDir === Direction.DOWN ? 1 : seat.facingDir === Direction.UP ? -1 : 0;
      for (let d = 1; d <= AUTO_ON_FACING_DEPTH; d++) {
        const tileCol = seat.seatCol + dCol * d;
        const tileRow = seat.seatRow + dRow * d;
        autoOnTiles.add(`${tileCol},${tileRow}`);
      }
      for (let d = 1; d <= AUTO_ON_SIDE_DEPTH; d++) {
        const baseCol = seat.seatCol + dCol * d;
        const baseRow = seat.seatRow + dRow * d;
        if (dCol !== 0) {
          autoOnTiles.add(`${baseCol},${baseRow - 1}`);
          autoOnTiles.add(`${baseCol},${baseRow + 1}`);
        } else {
          autoOnTiles.add(`${baseCol - 1},${baseRow}`);
          autoOnTiles.add(`${baseCol + 1},${baseRow}`);
        }
      }
    }
    if (autoOnTiles.size === 0) {
      this.furniture = layoutToFurnitureInstances(this.layout.furniture);
      return;
    }
    const animFrame = Math.floor(this.furnitureAnimTimer / FURNITURE_ANIM_INTERVAL_SEC);
    const modifiedFurniture = this.layout.furniture.map((item) => {
      const entry = getCatalogEntry(item.type);
      if (!entry) return item;
      for (let dr = 0; dr < entry.footprintH; dr++) {
        for (let dc = 0; dc < entry.footprintW; dc++) {
          if (autoOnTiles.has(`${item.col + dc},${item.row + dr}`)) {
            let onType = getOnStateType(item.type);
            if (onType !== item.type) {
              const frames = getAnimationFrames(onType);
              if (frames && frames.length > 1) {
                const frameIdx = animFrame % frames.length;
                onType = frames[frameIdx];
              }
              return { ...item, type: onType };
            }
            return item;
          }
        }
      }
      return item;
    });
    this.furniture = layoutToFurnitureInstances(modifiedFurniture);
  }
  setAgentTool(id, tool) {
    const ch = this.characters.get(id);
    if (ch) {
      ch.currentTool = tool;
    }
  }
  showPermissionBubble(id) {
    const ch = this.characters.get(id);
    if (ch) {
      ch.bubbleType = "permission";
      ch.bubbleTimer = 0;
    }
  }
  clearPermissionBubble(id) {
    const ch = this.characters.get(id);
    if (ch && ch.bubbleType === "permission") {
      ch.bubbleType = null;
      ch.bubbleTimer = 0;
    }
  }
  showWaitingBubble(id) {
    const ch = this.characters.get(id);
    if (ch) {
      ch.bubbleType = "waiting";
      ch.bubbleTimer = WAITING_BUBBLE_DURATION_SEC;
    }
  }
  /** Dismiss bubble on click — permission: instant, waiting: quick fade */
  dismissBubble(id) {
    const ch = this.characters.get(id);
    if (!ch || !ch.bubbleType) return;
    if (ch.bubbleType === "permission") {
      ch.bubbleType = null;
      ch.bubbleTimer = 0;
    } else if (ch.bubbleType === "waiting") {
      ch.bubbleTimer = Math.min(ch.bubbleTimer, DISMISS_BUBBLE_FAST_FADE_SEC);
    }
  }
  setTeamInfo(id, teamName, agentName, isTeamLead, leadAgentId, teamUsesTmux) {
    const ch = this.characters.get(id);
    if (!ch) return;
    ch.teamName = teamName;
    ch.agentName = agentName;
    ch.isTeamLead = isTeamLead;
    ch.leadAgentId = leadAgentId;
    if (teamUsesTmux !== void 0) {
      ch.teamUsesTmux = teamUsesTmux;
    }
  }
  setAgentTokens(id, inputTokens, outputTokens) {
    const ch = this.characters.get(id);
    if (!ch) return;
    ch.inputTokens = inputTokens;
    ch.outputTokens = outputTokens;
  }
  update(dt) {
    const prevFrame = Math.floor(this.furnitureAnimTimer / FURNITURE_ANIM_INTERVAL_SEC);
    this.furnitureAnimTimer += dt;
    const newFrame = Math.floor(this.furnitureAnimTimer / FURNITURE_ANIM_INTERVAL_SEC);
    if (newFrame !== prevFrame) {
      this.rebuildFurnitureInstances();
    }
    const toDelete = [];
    for (const ch of this.characters.values()) {
      if (ch.matrixEffect) {
        ch.matrixEffectTimer += dt;
        if (ch.matrixEffectTimer >= MATRIX_EFFECT_DURATION_SEC) {
          if (ch.matrixEffect === "spawn") {
            ch.matrixEffect = null;
            ch.matrixEffectTimer = 0;
            ch.matrixEffectSeeds = [];
          } else {
            toDelete.push(ch.id);
          }
        }
        continue;
      }
      if(ch.officeMeeting && !ch.officeMeeting.persistent && ch.officeMeeting.expiresAt<=Date.now()) {delete ch.meetingSpeech;delete ch.officeMeeting;this.sendToSeat(ch.id);}
      this.withOwnSeatUnblocked(
        ch,
        () => updateCharacter(ch, dt, ch.homeWalkableTiles ?? this.walkableTiles, this.seats, this.tileMap, this.blockedTiles)
      );
      if (ch.bubbleType === "waiting") {
        ch.bubbleTimer -= dt;
        if (ch.bubbleTimer <= 0) {
          ch.bubbleType = null;
          ch.bubbleTimer = 0;
        }
      }
    }
    for (const id of toDelete) {
      this.characters.delete(id);
    }
  }
  getCharacters() {
    return Array.from(this.characters.values());
  }
  /** Get character at pixel position (for hit testing). Returns id or null. */
  getCharacterAt(worldX, worldY) {
    const chars = this.getCharacters().sort((a, b) => b.y - a.y);
    for (const ch of chars) {
      if (ch.matrixEffect === "despawn") continue;
      const sittingOffset = ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0;
      const anchorY = ch.y + sittingOffset;
      const left = ch.x - CHARACTER_HIT_HALF_WIDTH;
      const right = ch.x + CHARACTER_HIT_HALF_WIDTH;
      const top = anchorY - CHARACTER_HIT_HEIGHT;
      const bottom = anchorY;
      if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
        return ch.id;
      }
    }
    return null;
  }
};

// src/office/engine/gameLoop.ts
function startGameLoop(canvas, callbacks) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  let lastTime = 0;
  let rafId = 0;
  let stopped = false;
  const frame = (time) => {
    if (stopped) return;
    const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1e3, MAX_DELTA_TIME_SEC);
    lastTime = time;
    callbacks.update(dt);
    ctx.imageSmoothingEnabled = false;
    callbacks.render(ctx);
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}

// src/office/sprites/spriteCache.ts
var zoomCaches = /* @__PURE__ */ new Map();
var outlineCache = /* @__PURE__ */ new WeakMap();
function getOutlineSprite(sprite) {
  const cached = outlineCache.get(sprite);
  if (cached) return cached;
  const rows = sprite.length;
  const cols = sprite[0].length;
  const outline = [];
  for (let r = 0; r < rows + 2; r++) {
    outline.push(new Array(cols + 2).fill(""));
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sprite[r][c] === "") continue;
      const er = r + 1;
      const ec = c + 1;
      if (outline[er - 1][ec] === "") outline[er - 1][ec] = "#FFFFFF";
      if (outline[er + 1][ec] === "") outline[er + 1][ec] = "#FFFFFF";
      if (outline[er][ec - 1] === "") outline[er][ec - 1] = "#FFFFFF";
      if (outline[er][ec + 1] === "") outline[er][ec + 1] = "#FFFFFF";
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sprite[r][c] !== "") {
        outline[r + 1][c + 1] = "";
      }
    }
  }
  outlineCache.set(sprite, outline);
  return outline;
}
function getCachedSprite(sprite, zoom) {
  let cache = zoomCaches.get(zoom);
  if (!cache) {
    cache = /* @__PURE__ */ new WeakMap();
    zoomCaches.set(zoom, cache);
  }
  const cached = cache.get(sprite);
  if (cached) return cached;
  const rows = sprite.length;
  const cols = sprite[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cols * zoom));
  canvas.height = Math.max(1, Math.round(rows * zoom));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = sprite[r][c];
      if (color === "") continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * zoom, r * zoom, zoom, zoom);
    }
  }
  cache.set(sprite, canvas);
  return canvas;
}

// src/office/wallTiles.ts
var wallSets = [];
function setWallSprites(sets) {
  wallSets = sets;
}
function hasWallSprites() {
  return wallSets.length > 0;
}
function buildWallMask(col, row, tileMap) {
  const tmRows = tileMap.length;
  const tmCols = tmRows > 0 ? tileMap[0].length : 0;
  let mask = 0;
  if (row > 0 && tileMap[row - 1][col] === TileType.WALL) mask |= 1;
  if (col < tmCols - 1 && tileMap[row][col + 1] === TileType.WALL) mask |= 2;
  if (row < tmRows - 1 && tileMap[row + 1][col] === TileType.WALL) mask |= 4;
  if (col > 0 && tileMap[row][col - 1] === TileType.WALL) mask |= 8;
  return mask;
}
function getWallSprite(col, row, tileMap, setIndex = 0) {
  if (wallSets.length === 0) return null;
  const sprites = wallSets[setIndex] ?? wallSets[0];
  const mask = buildWallMask(col, row, tileMap);
  const sprite = sprites[mask];
  if (!sprite) return null;
  return { sprite, offsetY: TILE_SIZE - sprite.length };
}
function getColorizedWallSprite(col, row, tileMap, color, setIndex = 0) {
  if (wallSets.length === 0) return null;
  const sprites = wallSets[setIndex] ?? wallSets[0];
  const mask = buildWallMask(col, row, tileMap);
  const sprite = sprites[mask];
  if (!sprite) return null;
  const cacheKey = `wall-${setIndex}-${mask}-${color.h}-${color.s}-${color.b}-${color.c}`;
  const colorized = getColorizedSprite(cacheKey, sprite, { ...color, colorize: true });
  return { sprite: colorized, offsetY: TILE_SIZE - sprite.length };
}
function getWallInstances(tileMap, tileColors, cols) {
  if (wallSets.length === 0) return [];
  const tmRows = tileMap.length;
  const tmCols = tmRows > 0 ? tileMap[0].length : 0;
  const layoutCols = cols ?? tmCols;
  const instances = [];
  for (let r = 0; r < tmRows; r++) {
    for (let c = 0; c < tmCols; c++) {
      if (tileMap[r][c] !== TileType.WALL) continue;
      const colorIdx = r * layoutCols + c;
      const wallColor = tileColors?.[colorIdx];
      const wallInfo = wallColor ? getColorizedWallSprite(c, r, tileMap, wallColor) : getWallSprite(c, r, tileMap);
      if (!wallInfo) continue;
      instances.push({
        sprite: wallInfo.sprite,
        x: c * TILE_SIZE,
        y: r * TILE_SIZE + wallInfo.offsetY,
        zY: (r + 1) * TILE_SIZE
      });
    }
  }
  return instances;
}
function wallColorToHex(color) {
  const { h, s, b, c } = color;
  let lightness = 0.5;
  if (c !== 0) {
    const factor = (100 + c) / 100;
    lightness = 0.5 + (lightness - 0.5) * factor;
  }
  if (b !== 0) {
    lightness = lightness + b / 200;
  }
  lightness = Math.max(0, Math.min(1, lightness));
  const satFrac = s / 100;
  const ch = (1 - Math.abs(2 * lightness - 1)) * satFrac;
  const hp = h / 60;
  const x = ch * (1 - Math.abs(hp % 2 - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1) {
    r1 = ch;
    g1 = x;
    b1 = 0;
  } else if (hp < 2) {
    r1 = x;
    g1 = ch;
    b1 = 0;
  } else if (hp < 3) {
    r1 = 0;
    g1 = ch;
    b1 = x;
  } else if (hp < 4) {
    r1 = 0;
    g1 = x;
    b1 = ch;
  } else if (hp < 5) {
    r1 = x;
    g1 = 0;
    b1 = ch;
  } else {
    r1 = ch;
    g1 = 0;
    b1 = x;
  }
  const m = lightness - ch / 2;
  const clamp2 = (v) => Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  return `#${clamp2(r1).toString(16).padStart(2, "0")}${clamp2(g1).toString(16).padStart(2, "0")}${clamp2(b1).toString(16).padStart(2, "0")}`;
}

// src/office/floorTiles.ts
var DEFAULT_FLOOR_SPRITE = Array.from(
  { length: TILE_SIZE },
  () => Array(TILE_SIZE).fill(FALLBACK_FLOOR_COLOR)
);
var floorSprites = [];
function setFloorSprites(sprites) {
  floorSprites = sprites;
  clearColorizeCache();
}
function getFloorSprite(patternIndex) {
  const idx = patternIndex - 1;
  if (idx < 0) return null;
  if (idx < floorSprites.length) return floorSprites[idx];
  if (floorSprites.length === 0 && patternIndex >= 1) return DEFAULT_FLOOR_SPRITE;
  return null;
}
function hasFloorSprites() {
  return true;
}
function getColorizedFloorSprite(patternIndex, color) {
  const key = `floor-${patternIndex}-${color.h}-${color.s}-${color.b}-${color.c}`;
  const base = getFloorSprite(patternIndex);
  if (!base) {
    const err = Array.from(
      { length: 16 },
      () => Array(16).fill(CANVAS_ERROR_TILE_COLOR)
    );
    return err;
  }
  return getColorizedSprite(key, base, { ...color, colorize: true });
}

// src/office/engine/renderer.ts
function renderTileGrid(ctx, tileMap, offsetX, offsetY, zoom, tileColors, cols) {
  const s = TILE_SIZE * zoom;
  const useSpriteFloors = hasFloorSprites();
  const tmRows = tileMap.length;
  const tmCols = tmRows > 0 ? tileMap[0].length : 0;
  const layoutCols = cols ?? tmCols;
  for (let r = 0; r < tmRows; r++) {
    for (let c = 0; c < tmCols; c++) {
      const tile = tileMap[r][c];
      if (tile === TileType.VOID) continue;
      if (tile === TileType.WALL || !useSpriteFloors) {
        if (tile === TileType.WALL) {
          const colorIdx2 = r * layoutCols + c;
          const wallColor = tileColors?.[colorIdx2];
          ctx.fillStyle = wallColor ? wallColorToHex(wallColor) : WALL_COLOR;
        } else {
          ctx.fillStyle = FALLBACK_FLOOR_COLOR;
        }
        ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
        continue;
      }
      const colorIdx = r * layoutCols + c;
      const color = tileColors?.[colorIdx] ?? { h: 0, s: 0, b: 0, c: 0 };
      const sprite = getColorizedFloorSprite(tile, color);
      const cached = getCachedSprite(sprite, zoom);
      ctx.drawImage(cached, offsetX + c * s, offsetY + r * s);
    }
  }
}
function renderScene(ctx, furniture, characters, offsetX, offsetY, zoom, selectedAgentId, hoveredAgentId) {
  const drawables = [];
  for (const f of furniture) {
    const cached = getCachedSprite(f.sprite, zoom);
    const fx = offsetX + f.x * zoom;
    const fy = offsetY + f.y * zoom;
    if (f.mirrored) {
      drawables.push({
        zY: f.zY,
        draw: (c) => {
          c.save();
          c.translate(fx + cached.width, fy);
          c.scale(-1, 1);
          c.drawImage(cached, 0, 0);
          c.restore();
        }
      });
    } else {
      drawables.push({
        zY: f.zY,
        draw: (c) => {
          c.drawImage(cached, fx, fy);
        }
      });
    }
  }
  for (const ch of characters) {
    const sprites = getCharacterSprites(ch.palette, ch.hueShift);
    const spriteData = getCharacterSprite(ch, sprites);
    const cached = getCachedSprite(spriteData, zoom);
    const sittingOffset = ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0;
    const drawX = Math.round(offsetX + ch.x * zoom - cached.width / 2);
    const drawY = Math.round(offsetY + (ch.y + sittingOffset) * zoom - cached.height);
    const charZY = ch.y + TILE_SIZE / 2 + CHARACTER_Z_SORT_OFFSET;
    if (ch.matrixEffect) {
      const mDrawX = drawX;
      const mDrawY = drawY;
      const mSpriteData = spriteData;
      const mCh = ch;
      drawables.push({
        zY: charZY,
        draw: (c) => {
          renderMatrixEffect(c, mCh, mSpriteData, mDrawX, mDrawY, zoom);
        }
      });
      continue;
    }
    const isSelected = selectedAgentId !== null && ch.id === selectedAgentId;
    const isHovered = hoveredAgentId !== null && ch.id === hoveredAgentId;
    if (isSelected || isHovered) {
      const outlineAlpha = isSelected ? SELECTED_OUTLINE_ALPHA : HOVERED_OUTLINE_ALPHA;
      const outlineData = getOutlineSprite(spriteData);
      const outlineCached = getCachedSprite(outlineData, zoom);
      const olDrawX = drawX - zoom;
      const olDrawY = drawY - zoom;
      drawables.push({
        zY: charZY - OUTLINE_Z_SORT_OFFSET,
        // sort just before character
        draw: (c) => {
          c.save();
          c.globalAlpha = outlineAlpha;
          c.drawImage(outlineCached, olDrawX, olDrawY);
          c.restore();
        }
      });
    }
    drawables.push({
      zY: charZY,
      draw: (c) => {
        c.drawImage(cached, drawX, drawY);
      }
    });
  }
  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) {
    d.draw(ctx);
  }
}
function renderSeatIndicators(ctx, seats, characters, selectedAgentId, hoveredTile, offsetX, offsetY, zoom) {
  if (selectedAgentId === null || !hoveredTile) return;
  const selectedChar = characters.get(selectedAgentId);
  if (!selectedChar) return;
  for (const [uid, seat] of seats) {
    if (seat.seatCol !== hoveredTile.col || seat.seatRow !== hoveredTile.row) continue;
    const s = TILE_SIZE * zoom;
    const x = offsetX + seat.seatCol * s;
    const y = offsetY + seat.seatRow * s;
    if (selectedChar.seatId === uid) {
      ctx.fillStyle = SEAT_OWN_COLOR;
    } else if (!seat.assigned) {
      ctx.fillStyle = SEAT_AVAILABLE_COLOR;
    } else {
      ctx.fillStyle = SEAT_BUSY_COLOR;
    }
    ctx.fillRect(x, y, s, s);
    break;
  }
}
function renderGridOverlay(ctx, offsetX, offsetY, zoom, cols, rows, tileMap) {
  const s = TILE_SIZE * zoom;
  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 0; c <= cols; c++) {
    const x = offsetX + c * s + 0.5;
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + rows * s);
  }
  for (let r = 0; r <= rows; r++) {
    const y = offsetY + r * s + 0.5;
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + cols * s, y);
  }
  ctx.stroke();
  if (tileMap) {
    ctx.save();
    ctx.strokeStyle = VOID_TILE_OUTLINE_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash(VOID_TILE_DASH_PATTERN);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (tileMap[r]?.[c] === TileType.VOID) {
          ctx.strokeRect(offsetX + c * s + 0.5, offsetY + r * s + 0.5, s - 1, s - 1);
        }
      }
    }
    ctx.restore();
  }
}
function renderGhostBorder(ctx, offsetX, offsetY, zoom, cols, rows, ghostHoverCol, ghostHoverRow) {
  const s = TILE_SIZE * zoom;
  ctx.save();
  const ghostTiles = [];
  for (let c = -1; c <= cols; c++) {
    ghostTiles.push({ c, r: -1 });
    ghostTiles.push({ c, r: rows });
  }
  for (let r = 0; r < rows; r++) {
    ghostTiles.push({ c: -1, r });
    ghostTiles.push({ c: cols, r });
  }
  for (const { c, r } of ghostTiles) {
    const x = offsetX + c * s;
    const y = offsetY + r * s;
    const isHovered = c === ghostHoverCol && r === ghostHoverRow;
    if (isHovered) {
      ctx.fillStyle = GHOST_BORDER_HOVER_FILL;
      ctx.fillRect(x, y, s, s);
    }
    ctx.strokeStyle = isHovered ? GHOST_BORDER_HOVER_STROKE : GHOST_BORDER_STROKE;
    ctx.lineWidth = 1;
    ctx.setLineDash(VOID_TILE_DASH_PATTERN);
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  }
  ctx.restore();
}
function renderGhostPreview(ctx, sprite, col, row, valid, offsetX, offsetY, zoom, mirrored = false) {
  const cached = getCachedSprite(sprite, zoom);
  const x = offsetX + col * TILE_SIZE * zoom;
  const y = offsetY + row * TILE_SIZE * zoom;
  ctx.save();
  ctx.globalAlpha = GHOST_PREVIEW_SPRITE_ALPHA;
  if (mirrored) {
    ctx.translate(x + cached.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(cached, 0, 0);
  } else {
    ctx.drawImage(cached, x, y);
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = GHOST_PREVIEW_TINT_ALPHA;
  ctx.fillStyle = valid ? GHOST_VALID_TINT : GHOST_INVALID_TINT;
  ctx.fillRect(x, y, cached.width, cached.height);
  ctx.restore();
}
function renderSelectionHighlight(ctx, col, row, w, h, offsetX, offsetY, zoom) {
  const s = TILE_SIZE * zoom;
  const x = offsetX + col * s;
  const y = offsetY + row * s;
  ctx.save();
  ctx.strokeStyle = SELECTION_HIGHLIGHT_COLOR;
  ctx.lineWidth = 2;
  ctx.setLineDash(SELECTION_DASH_PATTERN);
  ctx.strokeRect(x + 1, y + 1, w * s - 2, h * s - 2);
  ctx.restore();
}
function renderDeleteButton(ctx, col, row, w, _h, offsetX, offsetY, zoom) {
  const s = TILE_SIZE * zoom;
  const cx = offsetX + (col + w) * s + 1;
  const cy = offsetY + row * s - 1;
  const radius = Math.max(BUTTON_MIN_RADIUS, zoom * BUTTON_RADIUS_ZOOM_FACTOR);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = DELETE_BUTTON_BG;
  ctx.fill();
  ctx.strokeStyle = BUTTON_ICON_COLOR;
  ctx.lineWidth = Math.max(BUTTON_LINE_WIDTH_MIN, zoom * BUTTON_LINE_WIDTH_ZOOM_FACTOR);
  ctx.lineCap = "round";
  const xSize = radius * BUTTON_ICON_SIZE_FACTOR;
  ctx.beginPath();
  ctx.moveTo(cx - xSize, cy - xSize);
  ctx.lineTo(cx + xSize, cy + xSize);
  ctx.moveTo(cx + xSize, cy - xSize);
  ctx.lineTo(cx - xSize, cy + xSize);
  ctx.stroke();
  ctx.restore();
  return { cx, cy, radius };
}
function renderRotateButton(ctx, col, row, _w, _h, offsetX, offsetY, zoom) {
  const s = TILE_SIZE * zoom;
  const radius = Math.max(BUTTON_MIN_RADIUS, zoom * BUTTON_RADIUS_ZOOM_FACTOR);
  const cx = offsetX + col * s - 1;
  const cy = offsetY + row * s - 1;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = ROTATE_BUTTON_BG;
  ctx.fill();
  ctx.strokeStyle = BUTTON_ICON_COLOR;
  ctx.lineWidth = Math.max(BUTTON_LINE_WIDTH_MIN, zoom * BUTTON_LINE_WIDTH_ZOOM_FACTOR);
  ctx.lineCap = "round";
  const arcR = radius * BUTTON_ICON_SIZE_FACTOR;
  ctx.beginPath();
  ctx.arc(cx, cy, arcR, -Math.PI * 0.8, Math.PI * 0.7);
  ctx.stroke();
  const endAngle = Math.PI * 0.7;
  const endX = cx + arcR * Math.cos(endAngle);
  const endY = cy + arcR * Math.sin(endAngle);
  const arrowSize = radius * 0.35;
  ctx.beginPath();
  ctx.moveTo(endX + arrowSize * 0.6, endY - arrowSize * 0.3);
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX + arrowSize * 0.7, endY + arrowSize * 0.5);
  ctx.stroke();
  ctx.restore();
  return { cx, cy, radius };
}
function renderBubbles(ctx, characters, offsetX, offsetY, zoom) {
  for (const ch of characters) {
    if (!ch.bubbleType) continue;
    const sprite = ch.bubbleType === "permission" ? BUBBLE_PERMISSION_SPRITE : BUBBLE_WAITING_SPRITE;
    let alpha = 1;
    if (ch.bubbleType === "waiting" && ch.bubbleTimer < BUBBLE_FADE_DURATION_SEC) {
      alpha = ch.bubbleTimer / BUBBLE_FADE_DURATION_SEC;
    }
    const cached = getCachedSprite(sprite, zoom);
    const sittingOff = ch.state === CharacterState.TYPE ? BUBBLE_SITTING_OFFSET_PX : 0;
    const bubbleX = Math.round(offsetX + ch.x * zoom - cached.width / 2);
    const bubbleY = Math.round(
      offsetY + (ch.y + sittingOff - BUBBLE_VERTICAL_OFFSET_PX) * zoom - cached.height - 1 * zoom
    );
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(cached, bubbleX, bubbleY);
    ctx.restore();
  }
}
function renderFrame(ctx, canvasWidth, canvasHeight, tileMap, furniture, characters, zoom, panX, panY, selection, editor, tileColors, layoutCols, layoutRows) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const cols = layoutCols ?? (tileMap.length > 0 ? tileMap[0].length : 0);
  const rows = layoutRows ?? tileMap.length;
  const mapW = cols * TILE_SIZE * zoom;
  const mapH = rows * TILE_SIZE * zoom;
  const offsetX = Math.floor((canvasWidth - mapW) / 2) + Math.round(panX);
  const offsetY = Math.floor((canvasHeight - mapH) / 2) + Math.round(panY);
  renderTileGrid(ctx, tileMap, offsetX, offsetY, zoom, tileColors, layoutCols);
  if (selection) {
    renderSeatIndicators(
      ctx,
      selection.seats,
      selection.characters,
      selection.selectedAgentId,
      selection.hoveredTile,
      offsetX,
      offsetY,
      zoom
    );
  }
  const wallInstances = hasWallSprites() ? getWallInstances(tileMap, tileColors, layoutCols) : [];
  const allFurniture = wallInstances.length > 0 ? [...wallInstances, ...furniture] : furniture;
  const selectedId = selection?.selectedAgentId ?? null;
  const hoveredId = selection?.hoveredAgentId ?? null;
  renderScene(ctx, allFurniture, characters, offsetX, offsetY, zoom, selectedId, hoveredId);
  renderBubbles(ctx, characters, offsetX, offsetY, zoom);
  if (editor) {
    if (editor.showGrid) {
      renderGridOverlay(ctx, offsetX, offsetY, zoom, cols, rows, tileMap);
    }
    if (editor.showGhostBorder) {
      renderGhostBorder(
        ctx,
        offsetX,
        offsetY,
        zoom,
        cols,
        rows,
        editor.ghostBorderHoverCol,
        editor.ghostBorderHoverRow
      );
    }
    if (editor.ghostSprite && editor.ghostCol >= 0) {
      renderGhostPreview(
        ctx,
        editor.ghostSprite,
        editor.ghostCol,
        editor.ghostRow,
        editor.ghostValid,
        offsetX,
        offsetY,
        zoom,
        editor.ghostMirrored
      );
    }
    if (editor.hasSelection) {
      renderSelectionHighlight(
        ctx,
        editor.selectedCol,
        editor.selectedRow,
        editor.selectedW,
        editor.selectedH,
        offsetX,
        offsetY,
        zoom
      );
      editor.deleteButtonBounds = renderDeleteButton(
        ctx,
        editor.selectedCol,
        editor.selectedRow,
        editor.selectedW,
        editor.selectedH,
        offsetX,
        offsetY,
        zoom
      );
      if (editor.isRotatable) {
        editor.rotateButtonBounds = renderRotateButton(
          ctx,
          editor.selectedCol,
          editor.selectedRow,
          editor.selectedW,
          editor.selectedH,
          offsetX,
          offsetY,
          zoom
        );
      } else {
        editor.rotateButtonBounds = null;
      }
    } else {
      editor.deleteButtonBounds = null;
      editor.rotateButtonBounds = null;
    }
  }
  return { offsetX, offsetY };
}

// src/office/engine/isoRenderer.ts
var ISO = Math.SQRT1_2;
var HEADROOM_PX = 44;
var floorCache = /* @__PURE__ */ new WeakMap();
var darkenedCache = /* @__PURE__ */ new WeakMap();
function getDarkenedCanvas(source) {
  const cached = darkenedCache.get(source);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const dctx = canvas.getContext("2d");
  dctx.drawImage(source, 0, 0);
  dctx.globalCompositeOperation = "source-atop";
  dctx.fillStyle = "rgba(10, 14, 28, 0.45)";
  dctx.fillRect(0, 0, canvas.width, canvas.height);
  darkenedCache.set(source, canvas);
  return canvas;
}
function getFloorCanvas(tileMap, tileColors, cols, rows, scale) {
  const cached = floorCache.get(tileMap);
  if (cached && cached.scale === scale) return cached.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, cols * TILE_SIZE * scale);
  canvas.height = Math.max(1, rows * TILE_SIZE * scale);
  const fctx = canvas.getContext("2d");
  fctx.imageSmoothingEnabled = false;
  renderTileGrid(fctx, tileMap, 0, 0, scale, tileColors, cols);
  floorCache.set(tileMap, { scale, canvas });
  return canvas;
}
function isoView(width,height,mapW,mapH,orbit={}) {
  const yaw=orbit.yaw??Math.PI/4, pitch=orbit.pitch??Math.PI/6;
  const a=Math.cos(yaw),b=-Math.sin(yaw),c=Math.sin(yaw)*Math.sin(pitch),d=Math.cos(yaw)*Math.sin(pitch);
  const corners=[[0,0],[mapW,0],[0,mapH],[mapW,mapH]].map(([x,y])=>({x:a*x+b*y,y:c*x+d*y}));
  const minX=Math.min(...corners.map(p=>p.x)),maxX=Math.max(...corners.map(p=>p.x)),minY=Math.min(...corners.map(p=>p.y)),maxY=Math.max(...corners.map(p=>p.y));
  const zoom=Math.min(width/(maxX-minX),height/(maxY-minY+HEADROOM_PX))*.94;
  const ox=width/2-(minX+maxX)/2*zoom,oy=height/2-(minY+maxY-HEADROOM_PX)/2*zoom;
  return {a,b,c,d,ox,oy,zoom,depth:(x,y)=>c*x+d*y,
    project:(x,y)=>({x:ox+(a*x+b*y)*zoom,y:oy+(c*x+d*y)*zoom}),
    unproject:(x,y)=>{const u=(x-ox)/zoom,v=(y-oy)/zoom,det=a*d-b*c;return {x:(d*u-b*v)/det,y:(a*v-c*u)/det};}};
}
function bindIsoOrbit(canvas,orbit) {
  let drag=null,suppressUntil=0;
  const down=e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch,moved:false};canvas.setPointerCapture?.(e.pointerId);};
  const move=e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;orbit.yaw=drag.yaw+dx*.008;orbit.pitch=Math.max(.22,Math.min(1.3,drag.pitch-dy*.006));canvas.style.cursor='grabbing';e.preventDefault();};
  const up=e=>{if(!drag||drag.id!==e.pointerId)return;if(drag.moved)suppressUntil=Date.now()+400;drag=null;canvas.style.cursor='grab';if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  const handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:up,lostpointercapture:up};
  for(const [name,fn]of Object.entries(handlers))canvas.addEventListener(name,fn);
  const oldTouch=canvas.style.touchAction;canvas.style.touchAction='none';canvas.style.cursor='grab';
  return {suppressed:()=>!!drag?.moved||Date.now()<suppressUntil,dispose(){for(const [name,fn]of Object.entries(handlers))canvas.removeEventListener(name,fn);canvas.style.touchAction=oldTouch;canvas.style.cursor='default';}};
}

function renderIsoFrame(ctx, canvasWidth, canvasHeight, tileMap, furniture, characters, tileColors, layoutCols, layoutRows, orbit) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const cols = layoutCols ?? (tileMap.length > 0 ? tileMap[0].length : 0);
  const rows = layoutRows ?? tileMap.length;
  const mapW = cols * TILE_SIZE;
  const mapH = rows * TILE_SIZE;
  const view=isoView(canvasWidth,canvasHeight,mapW,mapH,orbit);
  const {project,zoom,a,b,c,d,ox,oy,depth}=view;
  const floorScale = Math.max(1, Math.min(3, Math.ceil(zoom)));
  const floorCanvas = getFloorCanvas(tileMap, tileColors, cols, rows, floorScale);
  const k = zoom / floorScale;
  ctx.save();
  ctx.setTransform(a*k,c*k,b*k,d*k,ox,oy);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(floorCanvas, 0, 0);
  const det=a*d-b*c;
  const flatItems = furniture.filter((f) => f.flat).sort((a, b) => a.zY - b.zY);
  for (const f of flatItems) {
    const cached = getCachedSprite(f.sprite, floorScale);
    const height = f.heightPx ?? 0;
    const drawAt = (img, lift) => {
      const liftX=-b*lift/det*floorScale, liftY=a*lift/det*floorScale;
      if (f.mirrored) {
        ctx.save();
        ctx.translate((f.x + (f.sprite[0]?.length ?? 0)) * floorScale - liftX, f.y * floorScale - liftY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(img, f.x * floorScale - liftX, f.y * floorScale - liftY);
      }
    };
    if (height > 0) {
      const dark = getDarkenedCanvas(cached);
      for (let lift = 0; lift < height; lift++) drawAt(dark, lift);
    }
    drawAt(cached, height);
  }
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
  const wallInstances = hasWallSprites() ? getWallInstances(tileMap, tileColors, cols) : [];
  const uprightFurniture = furniture.filter((f) => !f.flat);
  const drawables = [];
  for (const f of [...wallInstances, ...uprightFurniture]) {
    const spriteWpx = f.sprite[0]?.length ?? 0;
    const cached = getCachedSprite(f.sprite, zoom);
    const anchorFx = f.x + spriteWpx / 2;
    const p = project(anchorFx, f.zY);
    const dx = Math.round(p.x - cached.width / 2);
    const dy = Math.round(p.y - cached.height);
    if (f.mirrored) {
      drawables.push({
        depth: depth(anchorFx,f.zY),
        draw: (c) => {
          c.save();
          c.translate(dx + cached.width, dy);
          c.scale(-1, 1);
          c.drawImage(cached, 0, 0);
          c.restore();
        }
      });
    } else {
      drawables.push({
        depth: depth(anchorFx,f.zY),
        draw: (c) => {
          c.drawImage(cached, dx, dy);
        }
      });
    }
  }
  for (const ch of characters) {
    const sprites = getCharacterSprites(ch.palette, ch.hueShift);
    const spriteData = getCharacterSprite(ch, sprites);
    const cached = getCachedSprite(spriteData, zoom);
    const sittingOffset = ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0;
    const p = project(ch.x, ch.y);
    const drawX = Math.round(p.x - cached.width / 2);
    const drawY = Math.round(p.y - cached.height + sittingOffset * zoom * 0.5);
    const charDepth = depth(ch.x,ch.y) + (TILE_SIZE / 2 + CHARACTER_Z_SORT_OFFSET)*Math.sin(orbit?.pitch??Math.PI/6)*ISO;
    if (ch.matrixEffect) {
      drawables.push({
        depth: charDepth,
        draw: (c) => {
          renderMatrixEffect(c, ch, spriteData, drawX, drawY, zoom);
        }
      });
      continue;
    }
    drawables.push({
      depth: charDepth,
      draw: (c) => {
        c.drawImage(cached, drawX, drawY);
      }
    });
  }
  drawables.sort((a, b) => a.depth - b.depth);
  for (const d of drawables) d.draw(ctx);
  for (const ch of characters) {
    if (!ch.bubbleType) continue;
    const sprite = ch.bubbleType === "permission" ? BUBBLE_PERMISSION_SPRITE : BUBBLE_WAITING_SPRITE;
    let alpha = 1;
    if (ch.bubbleType === "waiting" && ch.bubbleTimer < BUBBLE_FADE_DURATION_SEC) {
      alpha = ch.bubbleTimer / BUBBLE_FADE_DURATION_SEC;
    }
    const cached = getCachedSprite(sprite, zoom);
    const charSprites = getCharacterSprites(ch.palette, ch.hueShift);
    const charHeight = getCharacterSprite(ch, charSprites).length;
    const p = project(ch.x, ch.y);
    const bubbleX = Math.round(p.x - cached.width / 2);
    const bubbleY = Math.round(
      p.y - (charHeight + BUBBLE_VERTICAL_OFFSET_PX + 1) * zoom - cached.height
    );
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(cached, bubbleX, bubbleY);
    ctx.restore();
  }
  return view;
}

// src/ui/pixelAssets.ts
var CHAR_FRAME_W = 16;
var CHAR_FRAME_H = 32;
var CHAR_FRAMES_PER_ROW = 7;
var FLOOR_TILE_SIZE = 16;
var WALL_PIECE_WIDTH = 16;
var WALL_PIECE_HEIGHT = 32;
var WALL_GRID_COLS = 4;
var WALL_BITMASK_COUNT = 16;
var loadPromise = null;
function trimLayoutToVisibleRoom(layout) {
  const occupied = [];
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      if (layout.tiles[row * layout.cols + col] !== 255) occupied.push({ col, row });
    }
  }
  if (occupied.length === 0) return layout;
  const minCol = Math.min(...occupied.map((tile) => tile.col));
  const maxCol = Math.max(...occupied.map((tile) => tile.col));
  const minRow = Math.min(...occupied.map((tile) => tile.row));
  const maxRow = Math.max(...occupied.map((tile) => tile.row));
  const cols = maxCol - minCol + 1;
  const rows = maxRow - minRow + 1;
  const tiles = [];
  const tileColors = layout.tileColors ? [] : void 0;
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const index = row * layout.cols + col;
      tiles.push(layout.tiles[index]);
      tileColors?.push(layout.tileColors?.[index] ?? null);
    }
  }
  return {
    ...layout,
    cols,
    rows,
    tiles,
    tileColors,
    furniture: layout.furniture.map((item) => ({
      ...item,
      col: item.col - minCol,
      row: item.row - minRow
    }))
  };
}
function buildKitchenLayout(cols = 22, rows = 11) {
  const wallColor = { h: 26, s: 14, b: -55, c: -45 };
  const floorColor = { h: 36, s: 24, b: 4, c: -16 };
  const tiles = [];
  const tileColors = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isWall = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
      tiles.push(isWall ? 0 : 1);
      tileColors.push(isWall ? wallColor : floorColor);
    }
  }
  const furniture = [
    // Counter along the top wall
    { uid: "kitchen-counter-1", type: "SMALL_TABLE_FRONT", col: 2, row: 1 },
    { uid: "kitchen-counter-2", type: "SMALL_TABLE_FRONT", col: 4, row: 1 },
    { uid: "kitchen-coffee", type: "COFFEE", col: 2, row: 2 },
    { uid: "kitchen-pot", type: "POT", col: 5, row: 2 },
    // Wall decorations
    { uid: "kitchen-clock", type: "CLOCK", col: 8, row: -1 },
    { uid: "kitchen-paint", type: "SMALL_PAINTING_2", col: 14, row: -1 },
    { uid: "kitchen-hang-plant", type: "HANGING_PLANT", col: 17, row: -1 },
    // Dining table with chairs
    { uid: "kitchen-table", type: "TABLE_FRONT", col: 9, row: 4 },
    { uid: "kitchen-chair-1", type: "WOODEN_CHAIR_SIDE", col: 8, row: 4 },
    { uid: "kitchen-chair-2", type: "WOODEN_CHAIR_SIDE", col: 8, row: 6 },
    { uid: "kitchen-chair-3", type: "WOODEN_CHAIR_SIDE:left", col: 12, row: 4 },
    { uid: "kitchen-chair-4", type: "WOODEN_CHAIR_SIDE:left", col: 12, row: 6 },
    // Break corner
    { uid: "kitchen-bench-1", type: "CUSHIONED_BENCH", col: 16, row: 2 },
    { uid: "kitchen-bench-2", type: "CUSHIONED_BENCH", col: 17, row: 2 },
    { uid: "kitchen-side-table", type: "SMALL_TABLE_SIDE", col: 20, row: 4 },
    { uid: "kitchen-cactus", type: "CACTUS", col: 20, row: 1 },
    { uid: "kitchen-large-plant", type: "LARGE_PLANT", col: 17, row: 7 },
    { uid: "kitchen-plant", type: "PLANT_2", col: 1, row: 1 },
    { uid: "kitchen-bin", type: "BIN", col: 1, row: 9 }
  ];
  return { version: 1, cols, rows, tiles, tileColors, furniture };
}
function normalizeCheckerFloors(layout, checker = 9) {
  const tiles = [...layout.tiles];
  const tileColors = layout.tileColors ? [...layout.tileColors] : void 0;
  const index = (col, row) => row * layout.cols + col;
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      if (layout.tiles[index(col, row)] !== checker) continue;
      const queue = [{ col, row }];
      const seen = /* @__PURE__ */ new Set([`${col},${row}`]);
      search: while (queue.length > 0) {
        const current = queue.shift();
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = current.col + dc;
          const nr = current.row + dr;
          if (nc < 0 || nr < 0 || nc >= layout.cols || nr >= layout.rows) continue;
          const key = `${nc},${nr}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const tile = layout.tiles[index(nc, nr)];
          if (tile !== 0 && tile !== 255 && tile !== checker) {
            tiles[index(col, row)] = tile;
            if (tileColors) tileColors[index(col, row)] = layout.tileColors?.[index(nc, nr)] ?? null;
            break search;
          }
          queue.push({ col: nc, row: nr });
        }
      }
    }
  }
  return { ...layout, tiles, tileColors };
}
function combineLayouts(officeSource, boardroomKitchenSource) {
  const office = normalizeCheckerFloors(officeSource);
  const boardroomKitchen = normalizeCheckerFloors(boardroomKitchenSource, 8);
  const overflowOffice = recolorLayout(office, { h: 145, s: 16, b: -8, c: -35 }, { h: 270, s: 18, b: -20, c: -45 });
  const kitchen = buildKitchenLayout();
  const corridor = 3;
  const margin = 2;
  const leftW = Math.max(office.cols, overflowOffice.cols);
  const rightW = Math.max(boardroomKitchen.cols, kitchen.cols);
  const topH = Math.max(office.rows, boardroomKitchen.rows);
  const bottomH = Math.max(overflowOffice.rows, kitchen.rows);
  const cols = margin + leftW + corridor + rightW + margin;
  const rows = margin + topH + corridor + bottomH + margin;
  const vHallCol = margin + leftW;
  const hHallRow = margin + topH;
  const wallColor = { h: 214, s: 30, b: -100, c: -55 };
  const hallColor = { h: 215, s: 8, b: -44, c: -52 };
  const hallFloor = 9;
  const tiles = Array(cols * rows).fill(hallFloor);
  const tileColors = Array(cols * rows).fill(hallColor);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        const index = row * cols + col;
        tiles[index] = 0;
        tileColors[index] = wallColor;
      }
    }
  }
  function copyLayout(source, offsetCol, offsetRow) {
    for (let row = 0; row < source.rows; row++) {
      for (let col = 0; col < source.cols; col++) {
        const tile = source.tiles[row * source.cols + col];
        if (tile === 255) continue;
        const targetIndex = (row + offsetRow) * cols + col + offsetCol;
        tiles[targetIndex] = tile;
        tileColors[targetIndex] = source.tileColors?.[row * source.cols + col] ?? null;
      }
    }
  }
  const officeAt = { col: margin, row: margin + topH - office.rows };
  const boardAt = { col: vHallCol + corridor + (rightW - boardroomKitchen.cols), row: margin + topH - boardroomKitchen.rows };
  const overflowAt = { col: margin, row: hHallRow + corridor };
  const kitchenAt = { col: vHallCol + corridor, row: hHallRow + corridor };
  copyLayout(office, officeAt.col, officeAt.row);
  copyLayout(boardroomKitchen, boardAt.col, boardAt.row);
  copyLayout(overflowOffice, overflowAt.col, overflowAt.row);
  copyLayout(kitchen, kitchenAt.col, kitchenAt.row);
  function punchDoor(centerCol, centerRow, horizontal) {
    for (let i = -1; i <= 1; i++) {
      const col = horizontal ? centerCol + i : centerCol;
      const row = horizontal ? centerRow : centerRow + i;
      const index = row * cols + col;
      tiles[index] = hallFloor;
      tileColors[index] = hallColor;
    }
  }
  punchDoor(officeAt.col + office.cols - 1, officeAt.row + Math.floor(office.rows / 2), false);
  punchDoor(officeAt.col + Math.floor(office.cols / 2), officeAt.row + office.rows - 1, true);
  punchDoor(boardAt.col, boardAt.row + Math.floor(boardroomKitchen.rows / 2), false);
  punchDoor(boardAt.col + Math.floor(boardroomKitchen.cols / 4), boardAt.row + boardroomKitchen.rows - 1, true);
  punchDoor(boardAt.col + Math.floor(3 * boardroomKitchen.cols / 4), boardAt.row + boardroomKitchen.rows - 1, true);
  punchDoor(overflowAt.col + Math.floor(overflowOffice.cols / 2), overflowAt.row, true);
  punchDoor(overflowAt.col + overflowOffice.cols - 1, overflowAt.row + Math.floor(overflowOffice.rows / 2), false);
  punchDoor(kitchenAt.col + Math.floor(kitchen.cols / 2), kitchenAt.row, true);
  punchDoor(kitchenAt.col, kitchenAt.row + Math.floor(kitchen.rows / 2), false);
  const spawnTile = { col: vHallCol + 1, row: hHallRow + 1 };
  tileColors[spawnTile.row * cols + spawnTile.col] = { h: 204, s: 10, b: -42, c: -32 };
  function shiftFurniture(source, prefix, offset) {
    return source.furniture.map((item) => ({
      ...item,
      uid: `${prefix}-${item.uid}`,
      col: item.col + offset.col,
      row: item.row + offset.row
    }));
  }
  return {
    layout: {
      version: 1,
      cols,
      rows,
      layoutRevision: 1,
      tiles,
      tileColors,
      spawnTile,
      furniture: [
        ...shiftFurniture(office, "camera1", officeAt),
        ...shiftFurniture(boardroomKitchen, "camera2", boardAt),
        ...shiftFurniture(overflowOffice, "camera3", overflowAt),
        ...shiftFurniture(kitchen, "camera4", kitchenAt)
      ]
    },
    rooms: [
      { id: "office", label: "Office", rect: { ...officeAt, cols: office.cols, rows: office.rows } },
      { id: "boardroomKitchen", label: "Boardroom / Kitchen", rect: { ...boardAt, cols: boardroomKitchen.cols, rows: boardroomKitchen.rows } },
      { id: "overflowOffice", label: "Overflow Office", rect: { ...overflowAt, cols: overflowOffice.cols, rows: overflowOffice.rows } },
      { id: "kitchen", label: "Kitchen", rect: { ...kitchenAt, cols: kitchen.cols, rows: kitchen.rows } }
    ],
    cameraBounds: {
      office: { col: 0, row: 0, cols: vHallCol + 2, rows: hHallRow + 2 },
      boardroomKitchen: { col: vHallCol - 1, row: 0, cols: cols - vHallCol + 1, rows: hHallRow + 2 },
      overflowOffice: { col: 0, row: hHallRow - 1, cols: vHallCol + 2, rows: rows - hHallRow + 1 },
      kitchen: { col: vHallCol - 1, row: hHallRow - 1, cols: cols - vHallCol + 1, rows: rows - hHallRow + 1 },
      total: { col: 0, row: 0, cols, rows }
    }
  };
}
function recolorLayout(layout, floorColor, wallColor) {
  return {
    ...layout,
    tileColors: layout.tiles.map((tile, index) => {
      if (tile === 0) return wallColor;
      if (tile === 255) return null;
      return layout.tileColors?.[index] ? floorColor : floorColor;
    }),
    furniture: layout.furniture.map((item) => {
      if (!["DESK_FRONT", "TABLE_FRONT", "SMALL_TABLE_FRONT", "SMALL_TABLE_SIDE", "COFFEE_TABLE"].includes(item.type)) {
        return item;
      }
      return {
        ...item,
        color: { h: 150, s: 18, b: -10, c: -20 }
      };
    })
  };
}
function getPluginAssetBaseUrl() {
  const metaUrl = import.meta.url;
  if (metaUrl && !metaUrl.startsWith("blob:")) {
    return new URL("./assets/", metaUrl).toString();
  }
  const pluginMatch = window.location.pathname.match(/\/_plugins\/[^/]+\/ui\//);
  if (pluginMatch) return `${pluginMatch[0]}assets/`;
  return `/_plugins/${PLUGIN_ID}/ui/assets/`;
}
function rgbaToHex(r, g, b, a) {
  if (a < 2) return "";
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}
function pixelAt(png, x, y) {
  const idx = (y * png.width + x) * 4;
  return rgbaToHex(png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]);
}
function readSprite(png, width, height, offsetX = 0, offsetY = 0) {
  return Array.from(
    { length: height },
    (_, y) => Array.from({ length: width }, (_2, x) => pixelAt(png, offsetX + x, offsetY + y))
  );
}
async function decodePng(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not decode PNG");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, data: imageData.data };
}
async function decodeCharacters(baseUrl, index) {
  return Promise.all(index.characters.map(async (path) => {
    const png = await decodePng(`${baseUrl}${path}`);
    return {
      down: Array.from(
        { length: CHAR_FRAMES_PER_ROW },
        (_, frame) => readSprite(png, CHAR_FRAME_W, CHAR_FRAME_H, frame * CHAR_FRAME_W, 0)
      ),
      up: Array.from(
        { length: CHAR_FRAMES_PER_ROW },
        (_, frame) => readSprite(png, CHAR_FRAME_W, CHAR_FRAME_H, frame * CHAR_FRAME_W, CHAR_FRAME_H)
      ),
      right: Array.from(
        { length: CHAR_FRAMES_PER_ROW },
        (_, frame) => readSprite(png, CHAR_FRAME_W, CHAR_FRAME_H, frame * CHAR_FRAME_W, CHAR_FRAME_H * 2)
      )
    };
  }));
}
async function decodeFloors(baseUrl, index) {
  return Promise.all(index.floors.map(async (path) => readSprite(await decodePng(`${baseUrl}${path}`), FLOOR_TILE_SIZE, FLOOR_TILE_SIZE)));
}
async function decodeWalls(baseUrl, index) {
  return Promise.all(index.walls.map(async (path) => {
    const png = await decodePng(`${baseUrl}${path}`);
    return Array.from(
      { length: WALL_BITMASK_COUNT },
      (_, mask) => readSprite(
        png,
        WALL_PIECE_WIDTH,
        WALL_PIECE_HEIGHT,
        mask % WALL_GRID_COLS * WALL_PIECE_WIDTH,
        Math.floor(mask / WALL_GRID_COLS) * WALL_PIECE_HEIGHT
      )
    );
  }));
}
async function decodeFurniture(baseUrl, index) {
  const entries = await Promise.all(index.furniture.map(async (asset) => {
    const png = await decodePng(`${baseUrl}${asset.furniturePath}`);
    return [asset.id, readSprite(png, asset.width, asset.height)];
  }));
  return Object.fromEntries(entries);
}
function loadPixelAssets() {
  loadPromise ??= (async () => {
    const baseUrl = getPluginAssetBaseUrl();
    const indexUrl = `${baseUrl}agent-pixels-assets.json`;
    const index = await fetch(indexUrl).then((res) => res.json());
    const layoutPaths = index.layouts ?? {
      office: index.defaultLayout,
      boardroomKitchen: index.defaultLayout
    };
    const [characters, floors, walls, furnitureSprites, officeLayout, boardroomKitchenLayout] = await Promise.all([
      decodeCharacters(baseUrl, index),
      decodeFloors(baseUrl, index),
      decodeWalls(baseUrl, index),
      decodeFurniture(baseUrl, index),
      fetch(`${baseUrl}${layoutPaths.office}`).then((res) => res.json()).then(trimLayoutToVisibleRoom),
      fetch(`${baseUrl}${layoutPaths.boardroomKitchen}`).then((res) => res.json()).then(trimLayoutToVisibleRoom)
    ]);
    setCharacterTemplates(characters);
    setFloorSprites(floors);
    setWallSprites(walls);
    buildDynamicCatalog({ catalog: index.furniture, sprites: furnitureSprites });
    const combined = combineLayouts(officeLayout, boardroomKitchenLayout);
    return {
      layouts: {
        office: officeLayout,
        boardroomKitchen: boardroomKitchenLayout,
        combined: combined.layout
      },
      rooms: combined.rooms,
      cameraBounds: combined.cameraBounds
    };
  })();
  return loadPromise;
}

// src/ui/officePersistence.ts
function officeStateKey(companyId) {
  return `agent-pixels.office-state.${companyId ?? "instance"}`;
}
function serializeOffice(office) {
  return JSON.stringify(office);
}
function deserializeOffice(value, mapId, themeId) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed.version !== 1 || parsed.mapId !== mapId || parsed.themeId !== themeId || !parsed.characters || typeof parsed.characters !== "object") {
      return {};
    }
    return parsed.characters;
  } catch {
    return {};
  }
}
function readPersistedOffice(companyId, mapId, themeId) {
  if (typeof window === "undefined") return {};
  try {
    return deserializeOffice(window.sessionStorage.getItem(officeStateKey(companyId)), mapId, themeId);
  } catch {
    return {};
  }
}
function writePersistedOffice(companyId, office) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(officeStateKey(companyId), serializeOffice(office));
  } catch {
  }
}
function clearPersistedOffice(companyId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(officeStateKey(companyId));
  } catch {
  }
}

// src/ui/PixelOfficeCanvas.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function stableNumericId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = hash * 31 + id.charCodeAt(i) | 0;
  }
  return Math.abs(hash) || 1;
}
function applyThemeToLayout(layout, themeId) {
  const theme = getTheme(themeId);
  if (theme.id === "classic" || !layout.tileColors) return layout;
  return {
    ...layout,
    tileColors: layout.tileColors.map((color) => color ? theme.adjust(color) : color)
  };
}
function pixelRoomAt(rooms, view, x, y) {
  let col;
  let row;
  if (view.project) {
    if(view.unproject){const point=view.unproject(x,y);col=point.x/TILE_SIZE;row=point.y/TILE_SIZE;} else {
    const origin = view.project(0, 0);
    const dx = (x - origin.x) / (ISO * view.zoom);
    const dy = (y - origin.y) / (ISO * view.zoom * 0.5);
    col = (dy + dx) / (2 * TILE_SIZE);
    row = (dy - dx) / (2 * TILE_SIZE);
    }
  } else {
    col = (x - view.offsetX) / (view.zoom * TILE_SIZE);
    row = (y - view.offsetY) / (view.zoom * TILE_SIZE);
  }
  return rooms.find(({ rect, role }) => role !== "corridor"
    && col >= rect.col && col < rect.col + rect.cols
    && row >= rect.row && row < rect.row + rect.rows) ?? null;
}

function PixelOfficeCanvas({
  agents,
  meetings,
  camera,
  builtMap,
  companyId,
  mapId,
  themeId,
  resetToken,
  roomLabels,
  selectedAgentId = null,
  onSelectAgent,
  roomFocus,
  onRoomFocus
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const officeRef = useRef(null);
  const assetsRef = useRef(null);
  const previousBubbleStatesRef = useRef(/* @__PURE__ */ new Map());
  const lastResetTokenRef = useRef(resetToken);
  const persistedRef = useRef({});
  const persistRef = useRef(() => {
  });
  const [ready, setReady] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [hoveredCharacterId, setHoveredCharacterId] = useState(null);
  const agentMeta = useMemo(
    () => new Map(agents.map((agent) => [stableNumericId(agent.id), agent])),
    [agents]
  );
  const selectedCharacterId = selectedAgentId === null ? null : stableNumericId(selectedAgentId);
  const selectionRef = useRef({ selected: selectedCharacterId, hovered: hoveredCharacterId });
  selectionRef.current = { selected: selectedCharacterId, hovered: hoveredCharacterId };
  const onSelectAgentRef = useRef(onSelectAgent);
  onSelectAgentRef.current = onSelectAgent;
  const onRoomFocusRef = useRef(onRoomFocus);
  onRoomFocusRef.current = onRoomFocus;
  const viewTransformRef = useRef(null);
  const orbitRef=useRef({yaw:Math.PI/4,pitch:Math.PI/6});
  useEffect(() => {
    let cancelled = false;
    void loadPixelAssets().then((assets) => {
      if (cancelled) return;
      assetsRef.current = assets;
      setReady(true);
    }).catch((error) => {
      if (cancelled) return;
      setLoadError(error instanceof Error ? error.message : String(error));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const assets = assetsRef.current;
    if (!assets || !ready) return;
    const layout = builtMap ? builtMap.layout : applyThemeToLayout(assets.layouts.combined, themeId);
    if (resetToken !== lastResetTokenRef.current) {
      officeRef.current = null;
      lastResetTokenRef.current = resetToken;
    }
    if (officeRef.current) {
      officeRef.current.rebuildFromLayout(layout);
    } else {
      officeRef.current = new OfficeState(layout);
    }
    persistedRef.current = readPersistedOffice(companyId, mapId, themeId);
    setLayoutVersion((version) => version + 1);
  }, [ready, builtMap, companyId, mapId, themeId, resetToken]);
  useEffect(() => {
    const office = officeRef.current;
    if (!office || layoutVersion === 0) return;
    const incoming = new Set(agents.map((agent) => stableNumericId(agent.id)));
    for (const agent of agents) {
      const id = stableNumericId(agent.id);
      const saved = persistedRef.current[agent.id];
      const isNew = !office.characters.has(id);
      office.addAgent(id, agent.characterIndex, 0, saved?.seatId ?? void 0, true);
      const character = office.characters.get(id);
      if (isNew && saved && character?.seatId === saved.seatId) {
        character.tileCol = saved.tileCol;
        character.tileRow = saved.tileRow;
        character.x = saved.tileCol * TILE_SIZE + TILE_SIZE / 2;
        character.y = saved.tileRow * TILE_SIZE + TILE_SIZE / 2;
        character.dir = saved.dir;
        character.path = [];
        character.moveProgress = 0;
      }
      if (character && agent.characterIndex !== void 0) {
        if (character.palette !== agent.characterIndex) character.palette = agent.characterIndex;
        if (character.hueShift !== 0) character.hueShift = 0;
      }
      const activity = agent.activityKind ?? "idle";
      const isWorking = activity !== "idle";
      if (character && character.isActive !== isWorking) office.setAgentActive(id, isWorking);
      const nextTool = activity === "research" ? "Read" : activity === "writing" ? "Write" : activity === "coding" ? "Edit" : activity === "meeting" ? "Task" : null;
      if (character && character.currentTool !== nextTool) office.setAgentTool(id, nextTool);
      const previous = previousBubbleStatesRef.current.get(id) ?? { pendingApproval: false, waiting: false };
      const pendingApproval = agent.pendingApproval === true;
      const waiting = agent.waiting === true;
      if (pendingApproval && !previous.pendingApproval) office.showPermissionBubble(id);
      if (!pendingApproval && previous.pendingApproval) office.clearPermissionBubble(id);
      if (waiting && !previous.waiting) office.showWaitingBubble(id);
      previousBubbleStatesRef.current.set(id, { pendingApproval, waiting });
    }
    if (mapId === "hybrid-office" && builtMap) assignHybridDepartments(office, agents, builtMap);
    else for (const ch of office.characters.values()) { delete ch.homeWalkableTiles; delete ch.homeRoomId; }
    applyOfficeMeetings(office,meetings??[],builtMap??{rooms:assetsRef.current?.rooms??[]});
    for (const id of office.characters.keys()) {
      if (!incoming.has(id)) {
        office.removeAgent(id);
        previousBubbleStatesRef.current.delete(id);
      }
    }
  }, [agents, layoutVersion, mapId, builtMap, meetings]);
  useEffect(() => {
    if (layoutVersion === 0) return;
    function persist() {
      const office = officeRef.current;
      if (!office) return;
      const characters = {};
      for (const agent of agents) {
        const character = office.characters.get(stableNumericId(agent.id));
        if (!character) continue;
        characters[agent.id] = {
          seatId: character.seatId,
          tileCol: character.tileCol,
          tileRow: character.tileRow,
          dir: character.dir,
          palette: character.palette,
          hueShift: character.hueShift
        };
      }
      writePersistedOffice(companyId, { version: 1, mapId, themeId, characters });
    }
    persistRef.current = persist;
    const interval = window.setInterval(persist, 2e3);
    function onPageExit() {
      persist();
    }
    window.addEventListener("visibilitychange", onPageExit);
    window.addEventListener("pagehide", onPageExit);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", onPageExit);
      window.removeEventListener("pagehide", onPageExit);
      persist();
    };
  }, [agents, companyId, layoutVersion, mapId, themeId]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const office = officeRef.current;
    const assets = assetsRef.current;
    if (!canvas || !wrap || !office || !assets || layoutVersion === 0) return;
    const activeCanvas = canvas;
    const activeWrap = wrap;
    function resize() {
      const rect2 = activeWrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      activeCanvas.width = Math.max(1, Math.round(rect2.width * dpr));
      activeCanvas.height = Math.max(1, Math.round(rect2.height * dpr));
      activeCanvas.style.width = `${rect2.width}px`;
      activeCanvas.style.height = `${rect2.height}px`;
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(activeWrap);
    function resolveBounds() {
      const layout = office.getLayout();
      const total = { col: 0, row: 0, cols: layout.cols, rows: layout.rows };
      if (roomFocus) return roomFocus.rect;
      if (camera === "total") return total;
      if (builtMap) {
        return builtMap.cameras.find((entry) => entry.id === camera)?.bounds ?? total;
      }
      const classic = assets.cameraBounds;
      return classic[camera] ?? total;
    }
    function drawRoomLabels(ctx, offsetX, offsetY, zoom) {
      if (!roomLabels || roomLabels.length === 0) return;
      ctx.save();
      const fontSize = Math.max(9, Math.floor(4.5 * zoom));
      ctx.font = `600 ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const room of roomLabels) {
        const centerX = offsetX + (room.rect.col + room.rect.cols / 2) * TILE_SIZE * zoom;
        const topY = offsetY + (room.rect.row + (room.open ? 0.6 : 1.5)) * TILE_SIZE * zoom;
        const text = room.label.toUpperCase();
        const maxWidth = (room.rect.cols - 1) * TILE_SIZE * zoom;
        const fittedSize = Math.min(fontSize, Math.max(6, fontSize * (maxWidth - fontSize) / Math.max(1, ctx.measureText(text).width)));
        ctx.font = `600 ${fittedSize}px sans-serif`;
        const metrics = ctx.measureText(text);
        const padX = fontSize * 0.6;
        const padY = fontSize * 0.35;
        ctx.fillStyle = "rgba(9,13,24,0.82)";
        ctx.fillRect(
          centerX - metrics.width / 2 - padX,
          topY - fontSize / 2 - padY,
          metrics.width + padX * 2,
          fontSize + padY * 2
        );
        ctx.fillStyle = "#f3f4f6";
        ctx.fillText(text, centerX, topY);
        ctx.font = `600 ${fontSize}px sans-serif`;
      }
      ctx.restore();
    }
    const stop = startGameLoop(canvas, {
      update: (dt) => office.update(dt),
      render: (ctx) => {
        const layout = office.getLayout();
        if (camera === "map") {
          const isoViewState = renderIsoFrame(
            ctx,
            canvas.width,
            canvas.height,
            office.tileMap,
            office.furniture,
            Array.from(office.characters.values()),
            layout.tileColors,
            layout.cols,
            layout.rows,
            orbitRef.current
          );
          const {project,zoom:isoZoom}=isoViewState;
          viewTransformRef.current = isoViewState;
          ctx.save();
          ctx.font = `${Math.max(11, Math.floor(6 * isoZoom))}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#f9fafb";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = Math.max(2, isoZoom);
          for (const character of office.characters.values()) {
            const name = agentMeta.get(character.id)?.name;
            if (!name) continue;
            const p = project(character.x, character.y + 8);
            ctx.strokeText(name, p.x, p.y);
            ctx.fillText(name, p.x, p.y);
          }
          ctx.restore();
          drawMeetingSpeech(ctx,office.characters.values(),ch=>{const p=project(ch.x,ch.y);return {x:p.x,y:p.y-24*isoZoom};},canvas.width,canvas.height,window.devicePixelRatio||1);
          return;
        }
        const focus = resolveBounds();
        const dpr = window.devicePixelRatio || 1;
        const fitZoom = Math.min(
          canvas.width / (focus.cols * TILE_SIZE),
          canvas.height / (focus.rows * TILE_SIZE)
        ) * 0.92;
        const zoom = camera === "total" ? fitZoom : Math.max(dpr, fitZoom);
        const mapCenterCol = layout.cols / 2;
        const mapCenterRow = layout.rows / 2;
        const focusCenterCol = focus.col + focus.cols / 2;
        const focusCenterRow = focus.row + focus.rows / 2;
        const panX = (mapCenterCol - focusCenterCol) * TILE_SIZE * zoom;
        const panY = (mapCenterRow - focusCenterRow) * TILE_SIZE * zoom;
        const { offsetX, offsetY } = renderFrame(
          ctx,
          canvas.width,
          canvas.height,
          office.tileMap,
          office.furniture,
          Array.from(office.characters.values()),
          zoom,
          panX,
          panY,
          {
            selectedAgentId: selectionRef.current.selected,
            hoveredAgentId: selectionRef.current.hovered,
            hoveredTile: null,
            seats: office.seats,
            characters: office.characters
          },
          void 0,
          layout.tileColors,
          layout.cols,
          layout.rows
        );
        viewTransformRef.current = { offsetX, offsetY, zoom };
        drawRoomLabels(ctx, offsetX, offsetY, zoom);
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = Math.max(2, zoom);
        const dprNow = window.devicePixelRatio || 1;
        const nameSize = Math.max(11 * dprNow, Math.floor(5 * zoom));
        const taskSize = Math.round(nameSize * 0.85);
        const lineGap = Math.round(nameSize * 0.15);
        for (const character of office.characters.values()) {
          const meta = agentMeta.get(character.id);
          const name = meta?.name;
          if (!name) continue;
          const x = offsetX + character.x * zoom;
          const y = offsetY + (character.y + 8) * zoom;
          ctx.font = `${nameSize}px sans-serif`;
          ctx.fillStyle = "#f9fafb";
          ctx.strokeText(name, x, y);
          ctx.fillText(name, x, y);
          const task = meta?.taskTitle;
          if (!task) continue;
          const limit = camera === "total" ? 18 : 28;
          const text = task.length > limit ? `${task.slice(0, limit - 1)}\u2026` : task;
          ctx.font = `${taskSize}px sans-serif`;
          ctx.fillStyle = "#93c5fd";
          ctx.strokeText(text, x, y + nameSize + lineGap);
          ctx.fillText(text, x, y + nameSize + lineGap);
        }
        ctx.restore();
        drawMeetingSpeech(ctx,office.characters.values(),ch=>({x:offsetX+ch.x*zoom,y:offsetY+(ch.y-22)*zoom}),canvas.width,canvas.height,window.devicePixelRatio||1);
      }
    });
    return () => {
      observer.disconnect();
      persistRef.current();
      stop();
    };
  }, [agentMeta, camera, builtMap, roomLabels, layoutVersion, roomFocus]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layoutVersion === 0) return;
    const orbitControls=camera==="map"?bindIsoOrbit(canvas,orbitRef.current):null;
    function characterAt(event) {
      const office = officeRef.current;
      const view = viewTransformRef.current;
      if (!office || !view) return null;
      const rect2 = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect2.width;
      const scaleY = canvas.height / rect2.height;
      const canvasX = (event.clientX - rect2.left) * scaleX;
      const canvasY = (event.clientY - rect2.top) * scaleY;
      if (camera === "map") {
        if (!view.project) return null;
        const characters = Array.from(office.characters.values()).sort((a, b) => view.project(b.x,b.y).y-view.project(a.x,a.y).y);
        for (const character of characters) {
          const sprite = getCharacterSprite(character, getCharacterSprites(character.palette, character.hueShift));
          const point = view.project(character.x, character.y);
          const halfWidth = sprite[0].length * view.zoom / 2;
          const bottom = point.y + (character.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX * view.zoom * 0.5 : 0);
          if (Math.abs(canvasX - point.x) <= halfWidth && canvasY >= bottom - sprite.length * view.zoom && canvasY <= bottom) {
            return character.id;
          }
        }
        return null;
      }
      if (view.project) return null;
      return office.getCharacterAt((canvasX - view.offsetX) / view.zoom, (canvasY - view.offsetY) / view.zoom);
    }
    function onMouseMove(event) {
      if(orbitControls?.suppressed())return;
      const id = characterAt(event);
      setHoveredCharacterId(id);
      canvas.style.cursor = id === null ? (camera==="map"?"grab":"default") : "pointer";
    }
    function onMouseLeave() {
      setHoveredCharacterId(null);
      canvas.style.cursor = "default";
    }
    function onDoubleClick(event) {
      if(orbitControls?.suppressed())return;
      if (roomFocus || (camera !== "total" && camera !== "map")) return;
      const view = viewTransformRef.current;
      const rooms = builtMap?.rooms ?? assetsRef.current?.rooms;
      const rect = canvas.getBoundingClientRect();
      if (!view || !rooms || !rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) * canvas.width / rect.width;
      const y = (event.clientY - rect.top) * canvas.height / rect.height;
      const room = pixelRoomAt(rooms, view, x, y);
      if (room) onRoomFocusRef.current?.(room);
    }
    function onClick(event) {
      if (event.detail > 1 || orbitControls?.suppressed()) return;
      const id = characterAt(event);
      const agentId = id === null ? null : agentMeta.get(id)?.id ?? null;
      if (agentId !== null || roomFocus || (camera !== "total" && camera !== "map")) onSelectAgentRef.current?.(agentId);
    }
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDoubleClick);
    return () => {
      orbitControls?.dispose();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("dblclick", onDoubleClick);
      canvas.style.cursor = "default";
    };
  }, [agentMeta, camera, layoutVersion, builtMap, roomFocus]);
  return /* @__PURE__ */ jsxs("div", { ref: wrapRef, style: { position: "relative", width: "100%", height: "min(725px, calc(100vh - 185px))", minHeight: "520px" }, children: [
    camera === "map" && jsx("button", { type:"button", onClick:()=>{orbitRef.current={yaw:Math.PI/4,pitch:Math.PI/6};}, title:"Kéo chuột để xoay ngang hoặc nghiêng lên/xuống. Bấm để đặt lại góc nhìn.", style:{position:"absolute",right:12,top:12,zIndex:2,padding:"7px 10px",borderRadius:8,border:"1px solid #64748b",background:"#172033",color:"#e2e8f0",cursor:"pointer"},children:"↻ Đặt lại góc nhìn" }),
    !ready && /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }, children: loadError ? `Camera failed: ${loadError}` : "Loading camera..." }),
    /* @__PURE__ */ jsx("canvas", { ref: canvasRef, style: { display: "block", width: "100%", height: "100%", imageRendering: "pixelated" } })
  ] });
}

// src/ui/index.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var CLASSIC_MAP_ID = "classic";
var CLASSIC_CAMERA_ORDER = ["office", "boardroomKitchen", "overflowOffice", "kitchen"];
var CLASSIC_ROOM_LABELS = {
  office: "Office + Lounge",
  boardroomKitchen: "Boardroom + Game Room",
  overflowOffice: "Overflow Office + Lounge",
  kitchen: "Staff Kitchen",
  total: "Total \xB7 All Rooms"
};
var CLASSIC_NAV = {
  office: { right: "boardroomKitchen", down: "overflowOffice" },
  boardroomKitchen: { left: "office", down: "kitchen" },
  overflowOffice: { up: "office", right: "kitchen" },
  kitchen: { left: "overflowOffice", up: "boardroomKitchen" },
  total: {}
};
var PRESET_NAV = {
  cam1: { right: "cam2", down: "cam3" },
  cam2: { left: "cam1", down: "cam4" },
  cam3: { up: "cam1", right: "cam4" },
  cam4: { left: "cam3", up: "cam2" },
  total: {}
};
var DEFAULT_OFFICE_SETTINGS = {
  mapId: "hybrid-office",
  themeId: "classic",
  industryId: "software"
};
function officeSettingsKey(companyId) {
  return `agent-pixels.office-settings.${companyId ?? "instance"}`;
}
function readOfficeSettings(companyId) {
  if (typeof window === "undefined") return DEFAULT_OFFICE_SETTINGS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(officeSettingsKey(companyId)) ?? "{}");
    return {
      mapId: typeof parsed.mapId === "string" ? parsed.mapId : DEFAULT_OFFICE_SETTINGS.mapId,
      themeId: typeof parsed.themeId === "string" ? parsed.themeId : DEFAULT_OFFICE_SETTINGS.themeId,
      industryId: typeof parsed.industryId === "string" ? parsed.industryId : DEFAULT_OFFICE_SETTINGS.industryId
    };
  } catch {
    return DEFAULT_OFFICE_SETTINGS;
  }
}
function writeOfficeSettings(companyId, settings) {
  window.localStorage.setItem(officeSettingsKey(companyId), JSON.stringify(settings));
}
function useReducedMotion() {
  const [reduced, setReduced] = useState2(
    () => typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect2(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
function LiveStatusBadge({
  companyId,
  connected,
  connecting,
  error,
  fetchedAt
}) {
  const dotRef = useRef2(null);
  const hasConnectedRef = useRef2(false);
  const previousCompanyIdRef = useRef2(companyId);
  const reducedMotion = useReducedMotion();
  if (previousCompanyIdRef.current !== companyId) {
    previousCompanyIdRef.current = companyId;
    hasConnectedRef.current = false;
  }
  if (connected) hasConnectedRef.current = true;
  const reconnecting = !connected && hasConnectedRef.current;
  const isConnecting = companyId !== null && !error && (connecting || reconnecting);
  const label = connected ? "Live" : isConnecting ? reconnecting ? "Reconnecting..." : "Connecting" : "Offline";
  const color = connected ? "#22c55e" : isConnecting ? "#f59e0b" : "#ef4444";
  const duration = connected ? 1800 : isConnecting ? 900 : null;
  useEffect2(() => {
    if (duration === null || reducedMotion || !dotRef.current) return;
    const animation = dotRef.current.animate(
      [{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }],
      { duration, iterations: Infinity, easing: "ease-in-out" }
    );
    return () => animation.cancel();
  }, [duration, reducedMotion]);
  const ageSeconds = fetchedAt ? Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1e3) : 0;
  const age = ageSeconds > 60 ? ` \xB7 ${ageSeconds >= 3600 ? `${Math.floor(ageSeconds / 3600)}h` : `${Math.floor(ageSeconds / 60)}m`} ago` : "";
  return /* @__PURE__ */ jsxs2("span", { role: "status", style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12px", opacity: 0.9 }, children: [
    /* @__PURE__ */ jsx2("span", { ref: dotRef, "aria-hidden": "true", style: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color } }),
    /* @__PURE__ */ jsxs2("span", { children: [
      label,
      age
    ] })
  ] });
}
var ARROW_GLYPHS = {
  up: "\u25B2",
  down: "\u25BC",
  left: "\u25C0",
  right: "\u25B6"
};
var ARROW_KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right"
};
function cameraPagePath(companyPrefix) {
  return companyPrefix ? `/${companyPrefix}/${PAGE_ROUTE}` : `/${PAGE_ROUTE}`;
}
function assignmentsStorageKey(companyId) {
  return `agent-pixels.character-assignments.${companyId ?? "instance"}`;
}
function readStoredAssignments(companyId) {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(assignmentsStorageKey(companyId)) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry) => typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isInteger(entry[1]) && entry[1] >= 0
      )
    );
  } catch {
    return {};
  }
}
function writeStoredAssignments(companyId, assignments) {
  window.localStorage.setItem(assignmentsStorageKey(companyId), JSON.stringify(assignments));
}
var styles = {
  // Measured from the host sidebar item on 2026-08-07; update if the host theme changes.
  link: {
    display: "flex",
    alignItems: "center",
    margin: "0 8px",
    gap: "10px",
    padding: "6px 8px",
    fontSize: "var(--text-compact, 13px)",
    fontWeight: 500,
    textDecoration: "none",
    borderRadius: "8px",
    color: "var(--foreground)",
    opacity: 0.8,
    overflow: "hidden"
  },
  linkActive: {
    background: "var(--accent)"
  },
  linkIcon: {
    flexShrink: 0,
    width: 16,
    height: 16,
    display: "grid",
    placeItems: "center"
  },
  linkLabel: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  page: {
    minHeight: "100%",
    padding: "14px 24px 24px",
    color: "#e5e7eb",
    background: "#111827",
    fontFamily: "inherit"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    color: "#f9fafb"
  },
  title: {
    fontSize: "18px",
    fontWeight: 700
  },
  cameraTabs: {
    display: "flex",
    gap: "6px",
    alignItems: "center"
  },
  cameraTab: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    padding: "5px 9px",
    borderRadius: "4px",
    cursor: "pointer",
    font: "inherit",
    fontSize: "12px"
  },
  cameraTabActive: {
    background: "rgba(255,255,255,0.16)",
    color: "#fff"
  },
  select: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#1f2937",
    color: "#e5e7eb",
    padding: "4px 6px",
    borderRadius: "4px",
    cursor: "pointer",
    font: "inherit",
    fontSize: "12px",
    maxWidth: "150px"
  },
  navArrow: {
    position: "absolute",
    zIndex: 2,
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: "50%",
    background: "rgba(17,24,39,0.72)",
    color: "#f9fafb",
    fontSize: "14px",
    lineHeight: 1,
    cursor: "pointer",
    userSelect: "none"
  },
  camera: {
    position: "relative",
    overflow: "hidden",
    height: "min(725px, calc(100vh - 185px))",
    minHeight: "520px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#1f2937",
    imageRendering: "pixelated"
  },
  scanlines: {
    position: "absolute",
    inset: 0,
    background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
    pointerEvents: "none"
  },
  floor: {
    position: "absolute",
    inset: "34% 0 0",
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), #374151",
    backgroundSize: "32px 32px"
  },
  desk: {
    position: "absolute",
    width: "132px",
    height: "54px",
    background: "#7c2d12",
    border: "4px solid #431407"
  },
  agent: {
    display: "none"
  }
};
function AgentPixelsSidebarLink({ context }) {
  const linkRef = useRef2(null);
  const href = cameraPagePath(context.companyPrefix);
  const isActive = typeof window !== "undefined" && window.location.pathname.startsWith(href);
  const [isCollapsed, setIsCollapsed] = useState2(false);
  useEffect2(() => {
    const parent = linkRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const updateCollapsed = () => setIsCollapsed(parent.getBoundingClientRect().width < 120);
    updateCollapsed();
    const observer = new ResizeObserver(updateCollapsed);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  return /* @__PURE__ */ jsxs2(
    "a",
    {
      ref: linkRef,
      href,
      "aria-current": isActive ? "page" : void 0,
      title: isCollapsed ? "Agent Pixels" : void 0,
      style: {
        // The host keeps every nav item's icon at the exact same left offset
        // in both the expanded and collapsed rail — margin/padding/gap never
        // change. Only the label collapses (see styles.linkLabel below), so
        // this object must NOT branch on isCollapsed: re-centering the icon
        // here is what caused it to drift from every other sidebar icon once
        // the rail narrowed.
        ...styles.link,
        ...isActive ? styles.linkActive : {},
        opacity: isActive ? 1 : 0.8
      },
      children: [
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", style: styles.linkIcon, children: /* @__PURE__ */ jsxs2(
          "svg",
          {
            width: 16,
            height: 16,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsx2("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
              /* @__PURE__ */ jsx2("rect", { x: "9", y: "9", width: "6", height: "6", fill: "currentColor", stroke: "none" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx2(
          "span",
          {
            style: isCollapsed ? (
              // Mirrors the host's own collapsed label: shrink to zero width
              // and hide visually via color, but stay in the DOM (not
              // display:none) so screen readers still announce the name —
              // display:none silently dropped that.
              { ...styles.linkLabel, flex: "0 0 0px", width: 0, color: "transparent" }
            ) : styles.linkLabel,
            children: "Agent Pixels"
          }
        )
      ]
    }
  );
}
function AgentPixelsCameraPage() {
  const pageRef = useRef2(null);
  const { companyId } = useHostContext();
  const toast = usePluginToast();
  const { data, refresh } = usePluginData("camera-room", { companyId });
  const { lastEvent, connecting, connected, error: streamError, close } = usePluginStream(
    `agent-activity:${companyId ?? ""}`,
    { companyId: companyId ?? void 0 }
  );
  const [assignments, setAssignments] = useState2(() => readStoredAssignments(companyId ?? null));
  const [liveOverrides, setLiveOverrides] = useState2({});
  const wasConnectedRef = useRef2(false);
  const agents = useMemo2(
    () => (data?.agents ?? []).map((agent) => {
      const override = liveOverrides[agent.id];
      const status = override?.status ?? agent.status;
      return {
        ...agent,
        status,
        activityKind: override?.activityKind ?? agent.activityKind,
        taskTitle: override?.taskTitle ?? agent.taskTitle ?? null,
        characterIndex: assignments[agent.id],
        meetingSpeech: data?.meetings?.flatMap(m=>m.speechMessages??[]).filter(m=>m.agentId===agent.id).at(-1)?.text??null,
        meetingKey: data?.meetings?.find(m=>m.phase==="active"&&m.participants.includes(agent.id))?.key??null,
        meetingTopic: data?.meetings?.find(m=>m.phase === "active" && m.participants.includes(agent.id))?.topic ?? null,
        pendingApproval: status === "pending_approval",
        waiting: status === "idle" || status === "paused"
      };
    }),
    [assignments, data?.agents, liveOverrides]
  );
  const [settings, setSettings] = useState2(() => readOfficeSettings(companyId ?? null));
  const isClassic = settings.mapId === CLASSIC_MAP_ID || !getMapDef(settings.mapId);
  const [camera, setCameraValue] = useState2("total");
  const [roomFocus, setRoomFocus] = useState2(null);
  function setCamera(value) {
    setRoomFocus(null);
    setCameraValue(value);
  }
  const [view, setView] = useState2("camera");
  const [resetToken, setResetToken] = useState2(0);
  const [selectedAgentId, setSelectedAgentId] = useState2(null);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;
  const builtMap = useMemo2(() => {
    if (isClassic) return null;
    return buildOfficeMap(getMapDef(settings.mapId), getTheme(settings.themeId));
  }, [isClassic, settings.mapId, settings.themeId]);
  const roomLabels = useMemo2(() => {
    if (!builtMap) return void 0;
    const industry = getIndustry(settings.industryId);
    return builtMap.rooms.filter((room) => room.role !== "corridor").map((room) => ({
      label: settings.mapId === "hybrid-office" ? room.label : industry.roleLabels[room.role] ?? room.label,
      rect: room.rect,
      open: room.open
    }));
  }, [builtMap, settings.industryId]);
  const cameraOrder = isClassic ? CLASSIC_CAMERA_ORDER : ["cam1", "cam2", "cam3", "cam4"];
  const nav = isClassic ? CLASSIC_NAV : PRESET_NAV;
  const cameraLabel = (cameraId) => {
    if (isClassic) return CLASSIC_ROOM_LABELS[cameraId] ?? cameraId;
    return builtMap?.cameras.find((entry) => entry.id === cameraId)?.label ?? cameraId;
  };
  function updateSettings(patch) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeOfficeSettings(companyId ?? null, next);
      if (patch.mapId && patch.mapId !== previous.mapId) {
        setCamera("total");
      }
      return next;
    });
  }
  useEffect2(() => {
    setAssignments(readStoredAssignments(companyId ?? null));
    setSettings(readOfficeSettings(companyId ?? null));
    setLiveOverrides({});
  }, [companyId]);
  useEffect2(() => {
    if (!companyId) close();
  }, [companyId, close]);
  useEffect2(() => {
    if (!lastEvent) return;
    setLiveOverrides((previous) => ({
      ...previous,
      [lastEvent.agentId]: {
        status: lastEvent.status,
        activityKind: lastEvent.activityKind,
        taskTitle: lastEvent.taskTitle ?? null,
        at: lastEvent.at
      }
    }));
  }, [lastEvent]);
  useEffect2(() => {
    const interval = window.setInterval(() => {
      refresh();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);
  useEffect2(() => {
    if (connected && !wasConnectedRef.current) refresh();
    wasConnectedRef.current = connected;
  }, [connected, refresh]);
  useEffect2(() => {
    if (view !== "camera") return;
    function onKeyDown(event) {
      const direction = ARROW_KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      const target = event.target;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const nextCamera = nav[camera]?.[direction];
      if (!nextCamera) return;
      event.preventDefault();
      setCamera(nextCamera);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, camera, nav]);
  useEffect2(() => {
    const hostSlot = pageRef.current?.parentElement;
    const hostBackRow = hostSlot?.previousElementSibling;
    const hostWrapper = hostSlot?.parentElement;
    const previousDisplay = hostBackRow?.style.display;
    const previousGap = hostWrapper?.style.gap;
    if (hostBackRow?.textContent?.includes("Back")) hostBackRow.style.display = "none";
    if (hostWrapper) hostWrapper.style.gap = "0";
    return () => {
      if (hostBackRow && previousDisplay !== void 0) hostBackRow.style.display = previousDisplay;
      if (hostWrapper && previousGap !== void 0) hostWrapper.style.gap = previousGap;
    };
  }, []);
  return /* @__PURE__ */ jsxs2("main", { ref: pageRef, className: "pixel-agent-page", style: styles.page, children: [
    jsx2("style", { children: pixelAgentLayout }),
    /* @__PURE__ */ jsxs2("header", { style: styles.header, children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("div", { style: styles.title, children: "Agent Pixels" }),
        /* @__PURE__ */ jsx2("div", { style: { fontSize: "12px", opacity: 0.7 }, children: view === "map" ? "3D Map \xB7 All Rooms" : view === "characters" ? "Character Assignments" : roomFocus ? roomFocus.label : `${cameraLabel(camera)} Camera` })
      ] }),
      /* @__PURE__ */ jsxs2("div", { style: styles.cameraTabs, children: [
        /* @__PURE__ */ jsxs2(
          "select",
          {
            "aria-label": "Office map",
            value: isClassic ? CLASSIC_MAP_ID : settings.mapId,
            onChange: (event) => updateSettings({ mapId: event.target.value }),
            style: styles.select,
            children: [
              /* @__PURE__ */ jsx2("option", { value: CLASSIC_MAP_ID, children: "Classic HQ" }),
              MAP_DEFS.map((def) => /* @__PURE__ */ jsx2("option", { value: def.id, children: def.label }, def.id))
            ]
          }
        ),
        /* @__PURE__ */ jsx2(
          "select",
          {
            "aria-label": "Theme",
            value: settings.themeId,
            onChange: (event) => updateSettings({ themeId: event.target.value }),
            style: styles.select,
            children: MAP_THEMES.map((theme) => /* @__PURE__ */ jsx2("option", { value: theme.id, children: theme.label }, theme.id))
          }
        ),
        !isClassic && /* @__PURE__ */ jsx2(
          "select",
          {
            "aria-label": "Industry template",
            value: settings.industryId,
            onChange: (event) => updateSettings({ industryId: event.target.value }),
            style: styles.select,
            children: INDUSTRY_TEMPLATES.map((industry) => /* @__PURE__ */ jsx2("option", { value: industry.id, children: industry.label }, industry.id))
          }
        ),
        /* @__PURE__ */ jsxs2(
          "select",
          {
            "aria-label": "Camera",
            value: view === "camera" && !roomFocus ? camera : "",
            onChange: (event) => {
              setView("camera");
              setCamera(event.target.value);
            },
            style: styles.select,
            children: [
              /* @__PURE__ */ jsx2("option", { value: "", disabled: true, hidden: true, children: "Camera" }),
              /* @__PURE__ */ jsx2("option", { value: "total", children: cameraLabel("total") }),
              cameraOrder.map((cameraId) => /* @__PURE__ */ jsx2("option", { value: cameraId, children: cameraLabel(cameraId) }, cameraId))
            ]
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            onClick: () => { setRoomFocus(null); setView("map"); },
            style: { ...styles.cameraTab, ...view === "map" ? styles.cameraTabActive : {} },
            children: "3D Map"
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            onClick: () => setView("characters"),
            style: { ...styles.cameraTab, ...view === "characters" ? styles.cameraTabActive : {} },
            children: "Characters"
          }
        ),
        /* @__PURE__ */ jsx2(
          LiveStatusBadge,
          {
            companyId: companyId ?? null,
            connected,
            connecting,
            error: streamError,
            fetchedAt: data?.fetchedAt
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            title: "Reset character positions",
            "aria-label": "Reset character positions",
            onClick: () => {
              clearPersistedOffice(companyId ?? null);
              setResetToken((token) => token + 1);
              toast({ title: "Character positions reset", tone: "success" });
            },
            style: styles.cameraTab,
            children: "\u21BA"
          }
        )
      ] })
    ] }),
    settings.mapId === "hybrid-office" && (data?.meetings?.length > 0) && jsx2("section", {"aria-label":"Cuộc họp đang diễn ra",style:{display:"flex",flexWrap:"wrap",gap:8,padding:"8px 0"},children:data.meetings.map(meeting=>jsx2("a",{href:meeting.issueIdentifier?"/QLD/issues/"+encodeURIComponent(meeting.issueIdentifier):"/QLD/issues/"+encodeURIComponent(meeting.issueId),style:{display:"block",padding:"8px 12px",border:"1px solid #a78bfa",borderRadius:8,background:"rgba(139,92,246,.12)",color:"inherit",maxWidth:"100%",textDecoration:"none"},children:[meeting.phase==="queued"?"⏳ Chờ họp: ":"💬 Đang họp: ",meeting.topic," · ",agents.filter(a=>meeting.participants.includes(a.id)).map(a=>a.name).join(", ")]},meeting.key))}),
    roomFocus && view === "camera" && jsx2("button", {
      type: "button",
      style: { ...styles.cameraTab, marginBottom: 8, alignSelf: "flex-start" },
      onClick: () => setCamera("total"),
      children: "← All Rooms"
    }),
    view === "characters" ? jsx2(CharacterAssignmentsPanel, { companyId: companyId ?? null, assignments, onAssignmentsChange: setAssignments }) : jsxs2("div", { className: "pixel-agent-workspace", children: [
      jsxs2("section", { "aria-label": "Agent Pixels office camera", style: styles.camera, children: [
      /* @__PURE__ */ jsx2(
        PixelOfficeCanvas,
        {
          camera: view === "map" ? "map" : camera,
          builtMap,
          meetings: data?.meetings,
          companyId: companyId ?? null,
          mapId: settings.mapId,
          themeId: settings.themeId,
          resetToken,
          roomLabels,
          selectedAgentId,
          onSelectAgent: setSelectedAgentId,
          roomFocus: view === "camera" ? roomFocus : null,
          onRoomFocus: (room) => {
            setSelectedAgentId(null);
            setCameraValue("total");
            setRoomFocus(room);
            setView("camera");
          },
          agents: agents.length ? agents : [{ id: "placeholder", name: "No agents yet", status: "waiting", activityKind: "idle" }]
        }
      ),
      /* @__PURE__ */ jsx2("div", { style: styles.scanlines }),
      view === "camera" && !roomFocus && /* @__PURE__ */ jsx2(
        RoomNavArrows,
        {
          camera,
          nav,
          labelFor: cameraLabel,
          onNavigate: (next) => {
            setCamera(next);
          }
        }
      )
      ] }),
      selectedAgent && jsx2(AgentDetailPanel, {
        agent: selectedAgent,
        companyId,
        onClose: () => setSelectedAgentId(null)
      }, companyId + ":" + selectedAgent.id)
    ] })
  ] });
}
var STATUS_LABELS = {
  running: "Working",
  active: "Active",
  idle: "Idle",
  paused: "Paused",
  pending_approval: "Waiting for approval",
  error: "Error",
  terminated: "Terminated"
};
function AgentDetailPanel({
  agent,
  companyId,
  onClose
}) {
  const hostNavigation = useHostNavigation();
  const status = agent.status ?? "idle";
  const agentHref = agent.urlKey ? `/agents/${agent.urlKey}` : null;
  const row = (label, value) => /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gridTemplateColumns: "72px minmax(0, 1fr)", gap: 8, fontSize: 12 }, children: [
    /* @__PURE__ */ jsx2("span", { style: { opacity: 0.6 }, children: label }),
    /* @__PURE__ */ jsx2("span", { style: { minWidth: 0, wordBreak: "break-word" }, children: value })
  ] });
  return /* @__PURE__ */ jsxs2(
    "aside",
    {
      "aria-label": `Details for ${agent.name}`,
      className: "pixel-agent-task-panel",
      style: {
        display: "grid",
        alignContent: "start",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(17,24,39,0.94)",
        color: "#e5e7eb",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)"
      },
      children: [
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", alignItems: "start", justifyContent: "space-between", gap: 8 }, children: [
          /* @__PURE__ */ jsxs2("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx2("div", { style: { fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: agent.name }),
            agent.title ? /* @__PURE__ */ jsx2("div", { style: { fontSize: 12, opacity: 0.65 }, children: agent.title }) : null
          ] }),
          /* @__PURE__ */ jsx2(
            "button",
            {
              type: "button",
              onClick: onClose,
              "aria-label": "Close details",
              style: { border: 0, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2 },
              children: "\xD7"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gap: 5 }, children: [
          row("Status", STATUS_LABELS[status] ?? status),
          agent.role ? row("Role", agent.role) : null,
          row("Current task", agent.taskTitle ?? "—"),
          row("Cuộc họp", agent.meetingTopic ?? "—"),
          agent.meetingSpeech?row("Trao đổi",agent.meetingSpeech):null,
          agent.meetingKey?jsx2("a",{href:"/"+(typeof window!=="undefined"?window.location.pathname.split("/")[1]:"QLD")+"/agent-chat-rooms?room="+encodeURIComponent(agent.meetingKey),target:"_blank",rel:"noopener",children:"Mở cuộc thảo luận"}):null
        ] }),
        jsx2(AgentTaskList, { companyId, agentId: agent.id }),
        agentHref ? /* @__PURE__ */ jsx2(
          "a",
          {
            ...hostNavigation.linkProps(agentHref),
            style: {
              display: "block",
              textAlign: "center",
              padding: "7px 10px",
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(59,130,246,0.22)",
              color: "inherit",
              textDecoration: "none",
              fontSize: 12
            },
            children: "Open in Paperclip"
          }
        ) : null
      ]
    }
  );
}
async function listPixelAgentTasks(companyId, agentId, signal) {
  const tasks = [];
  const pageSize = 100;
  const params = new URLSearchParams({
    assigneeAgentId: agentId,
    view: "compact",
    limit: String(pageSize),
    sortField: "id",
    sortDir: "asc"
  });
  while (true) {
    const response = await fetch("/api/companies/" + encodeURIComponent(companyId) + "/issues?" + params, { signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const page = await response.json();
    tasks.push(...page);
    const afterId = page.at(-1)?.id;
    if (page.length < pageSize) break;
    if (!afterId || afterId === params.get("afterId")) throw new Error("Task pagination did not advance");
    params.set("afterId", afterId);
  }
  return tasks.sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
}

function AgentTaskList({ companyId, agentId }) {
  const navigation = useHostNavigation();
  const [result, setResult] = useState2({ state: "loading" });
  const [attempt, setAttempt] = useState2(0);
  useEffect2(() => {
    const controller = new AbortController();
    setResult({ state: "loading" });
    listPixelAgentTasks(companyId, agentId, controller.signal)
      .then((tasks) => {
        if (!controller.signal.aborted) setResult({ state: "ready", tasks });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ state: "error" });
      });
    return () => controller.abort();
  }, [companyId, agentId, attempt]);
  const tasks = result.tasks ?? [];
  return jsxs2("section", { className: "pixel-agent-tasks", children: [
    jsx2("h2", { children: result.state === "ready" ? "Assigned tasks (" + tasks.length + ")" : "Assigned tasks" }),
    result.state === "loading" && jsx2("p", { role: "status", children: "Loading tasks…" }),
    result.state === "error" && jsxs2("p", { role: "alert", children: [
      "Could not load tasks. ",
      jsx2("button", { type: "button", onClick: () => setAttempt((n) => n + 1), children: "Retry" })
    ] }),
    result.state === "ready" && (tasks.length === 0
      ? jsx2("p", { children: "No assigned tasks." })
      : jsx2("ul", { children: tasks.map((task) => jsx2("li", {
        children: jsxs2("a", {
          ...navigation.linkProps("/issues/" + encodeURIComponent(task.identifier || task.id)),
          "data-task-status": task.status,
          children: [
            jsx2("strong", { children: task.title }),
            jsxs2("div", { className: "pixel-task-meta", children: [
              task.identifier && jsx2("span", { className: "pixel-task-id", children: task.identifier }),
              jsx2("span", { className: "pixel-task-status", children: task.status?.replaceAll("_", " ") || "Unknown" })
            ] })
          ]
        })
      }, task.id)) }))
  ] });
}

var pixelAgentLayout = `
  .pixel-agent-page:has(> .pixel-agent-workspace) { display: flex; flex-direction: column; box-sizing: border-box; height: calc(100dvh - 5rem); }
  .pixel-office-view .pixel-agent-page:has(> .pixel-agent-workspace) { height: 100dvh; }
  .pixel-agent-page > header { flex-wrap: wrap; gap: 8px; flex-shrink: 0; }
  .pixel-agent-page > header > div:last-child { flex-wrap: wrap; }
  .pixel-agent-workspace { display: grid; flex: 1; min-height: 0; gap: 12px; grid-template-columns: minmax(0, 1fr); }
  .pixel-agent-workspace:has(> .pixel-agent-task-panel) { grid-template-columns: minmax(0, 1fr) clamp(16rem, 26vw, 25rem); }
  .pixel-agent-workspace > section { height: 100% !important; min-height: 0 !important; }
  .pixel-agent-workspace > section > div:has(> canvas) { height: 100% !important; min-height: 0 !important; }
  .pixel-agent-task-panel { min-height: 0; overflow: auto; }
  .pixel-agent-tasks { font-size: 13px; overflow-wrap: anywhere; }
  .pixel-agent-tasks h2 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .pixel-agent-tasks ul { display: grid; gap: 6px; list-style: none; margin: 0; padding: 0; }
  .pixel-agent-tasks a { display: grid; gap: 2px; padding: 8px; background: #1f2937; border-radius: 5px; color: inherit; }
  .pixel-agent-tasks a:hover, .pixel-agent-tasks a:focus-visible { background: #334155; }
  .pixel-agent-tasks a { --pixel-task-accent: #cbd5e1; border-inline-start: 3px solid var(--pixel-task-accent); }
  .pixel-agent-tasks a[data-task-status="todo"] { --pixel-task-accent: #fbbf24; }
  .pixel-agent-tasks a[data-task-status="in_progress"] { --pixel-task-accent: #7dbaff; }
  .pixel-agent-tasks a[data-task-status="in_review"] { --pixel-task-accent: #d8b4fe; }
  .pixel-agent-tasks a[data-task-status="done"] { --pixel-task-accent: #86efac; }
  .pixel-agent-tasks a[data-task-status="blocked"] { --pixel-task-accent: #fda4af; }
  .pixel-agent-tasks a[data-task-status="cancelled"] { --pixel-task-accent: #94a3b8; }
  .pixel-agent-tasks a:focus-visible { outline: 2px solid var(--pixel-task-accent); outline-offset: 2px; }
  .pixel-task-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px 8px; margin-top: 3px; }
  .pixel-task-id { color: #aebcce; }
  .pixel-task-status {
    display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 1px 7px;
    color: var(--pixel-task-accent); background: color-mix(in srgb, var(--pixel-task-accent) 13%, transparent);
    border: 1px solid color-mix(in srgb, var(--pixel-task-accent) 40%, transparent);
    font-size: 11px; font-weight: 700; text-transform: capitalize;
  }
  .pixel-task-status::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .pixel-agent-tasks button { text-decoration: underline; }
  @media (max-width: 760px) {
    .pixel-agent-page { padding: 10px !important; }
    .pixel-agent-workspace:has(> .pixel-agent-task-panel) {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(9rem, 1fr) minmax(0, 40%);
    }
  }
`;

var ARROW_POSITIONS = {
  up: { top: 10, left: "50%", transform: "translateX(-50%)" },
  down: { bottom: 10, left: "50%", transform: "translateX(-50%)" },
  left: { left: 10, top: "50%", transform: "translateY(-50%)" },
  right: { right: 10, top: "50%", transform: "translateY(-50%)" }
};
function RoomNavArrows({
  camera,
  nav,
  labelFor,
  onNavigate
}) {
  const directions = nav[camera] ?? {};
  return /* @__PURE__ */ jsx2(Fragment, { children: Object.keys(directions).map((direction) => {
    const target = directions[direction];
    if (!target) return null;
    return /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        title: labelFor(target),
        "aria-label": `Go ${direction} to ${labelFor(target)}`,
        onClick: () => onNavigate(target),
        style: { ...styles.navArrow, ...ARROW_POSITIONS[direction] },
        children: ARROW_GLYPHS[direction]
      },
      direction
    );
  }) });
}
function useCharacterAssets() {
  const [assets, setAssets] = useState2([]);
  const [error, setError] = useState2(null);
  useEffect2(() => {
    let cancelled = false;
    const baseUrl = getPluginAssetBaseUrl();
    fetch(`${baseUrl}agent-pixels-assets.json`).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch character index: ${res.status}`);
      return res.json();
    }).then((index) => {
      if (cancelled) return;
      setAssets(index.characters.map((path, index2) => ({ index: index2, path, url: `${baseUrl}${path}` })));
      setError(null);
    }).catch((nextError) => {
      if (cancelled) return;
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { assets, error };
}
function SpritePreview({ url, scale = 2 }) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "aria-hidden": "true",
      style: {
        width: 16 * scale,
        height: 32 * scale,
        backgroundImage: `url(${url})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 0",
        backgroundSize: `${16 * scale * 7}px ${32 * scale * 3}px`,
        imageRendering: "pixelated"
      }
    }
  );
}
function CharacterAssignmentsPanel({
  companyId,
  assignments,
  onAssignmentsChange
}) {
  const { data, loading, error, refresh } = usePluginData("character-settings", companyId ? { companyId } : {});
  const { assets, error: assetError } = useCharacterAssets();
  const [savingAgentId, setSavingAgentId] = useState2(null);
  const [storedAssignments, setStoredAssignments] = useState2(() => assignments ?? readStoredAssignments(companyId));
  const [selectedAgentId, setSelectedAgentId] = useState2(null);
  const [draftIndex, setDraftIndex] = useState2(null);
  useEffect2(() => {
    setStoredAssignments(assignments ?? readStoredAssignments(companyId));
  }, [assignments, companyId]);
  const agents = data?.agents ?? [];
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;
  const selectedIndex = selectedAgent ? storedAssignments[selectedAgent.id] : void 0;
  const visibleIndex = draftIndex ?? selectedIndex;
  useEffect2(() => {
    setDraftIndex(null);
  }, [selectedAgent?.id, selectedIndex]);
  async function updateAssignment(agentId, characterIndex) {
    setSavingAgentId(agentId);
    try {
      const next = { ...storedAssignments };
      if (characterIndex === null) delete next[agentId];
      else next[agentId] = characterIndex;
      writeStoredAssignments(companyId, next);
      setStoredAssignments(next);
      onAssignmentsChange?.(next);
      refresh();
    } finally {
      setSavingAgentId(null);
    }
  }
  if (loading) return /* @__PURE__ */ jsx2("div", { style: { padding: 24, fontSize: 13 }, children: "Loading Agent Pixels settings..." });
  if (error) return /* @__PURE__ */ jsxs2("div", { style: { padding: 24, fontSize: 13 }, children: [
    "Settings failed: ",
    error.message
  ] });
  function randomIndex() {
    if (assets.length === 0) return null;
    const used = new Set(Object.values(storedAssignments));
    const open = assets.filter((asset) => !used.has(asset.index) || asset.index === selectedIndex);
    const pool = open.length > 0 ? open : assets;
    return pool[Math.floor(Math.random() * pool.length)]?.index ?? null;
  }
  return /* @__PURE__ */ jsxs2("section", { style: { padding: "18px", display: "grid", gap: "14px", color: "var(--foreground)", background: "var(--background, #111827)", border: "1px solid rgba(255,255,255,0.14)", fontFamily: "inherit" }, children: [
    assetError ? /* @__PURE__ */ jsx2("div", { style: { fontSize: "13px", color: "var(--destructive, #ef4444)" }, children: assetError }) : null,
    /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: "16px", alignItems: "start" }, children: [
      /* @__PURE__ */ jsxs2("aside", { style: { border: "1px solid rgba(148,163,184,0.25)", borderRadius: 6, overflow: "hidden", background: "rgba(15,23,42,0.35)" }, children: [
        /* @__PURE__ */ jsx2("div", { style: { padding: "12px", fontSize: "18px", fontWeight: 800, borderBottom: "1px solid rgba(148,163,184,0.25)" }, children: "Agents" }),
        /* @__PURE__ */ jsx2("div", { style: { maxHeight: "610px", overflow: "auto" }, children: agents.map((agent) => {
          const assigned = storedAssignments[agent.id];
          const assignedAsset = assets[assigned] ?? null;
          const isSelected = selectedAgent?.id === agent.id;
          return /* @__PURE__ */ jsxs2(
            "button",
            {
              type: "button",
              onClick: () => setSelectedAgentId(agent.id),
              style: {
                width: "100%",
                display: "grid",
                gridTemplateColumns: "1fr 42px",
                gap: "8px",
                alignItems: "center",
                padding: "9px 10px",
                border: 0,
                borderBottom: "1px solid rgba(148,163,184,0.16)",
                background: isSelected ? "rgba(59,130,246,0.18)" : "transparent",
                color: "inherit",
                cursor: "pointer",
                textAlign: "left"
              },
              children: [
                /* @__PURE__ */ jsxs2("span", { style: { minWidth: 0 }, children: [
                  /* @__PURE__ */ jsx2("span", { style: { display: "block", fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: agent.name }),
                  /* @__PURE__ */ jsx2("span", { style: { display: "block", fontSize: "11px", opacity: 0.65 }, children: assignedAsset ? `char_${assigned}` : "Auto" })
                ] }),
                /* @__PURE__ */ jsx2("span", { style: { width: 36, height: 48, display: "grid", placeItems: "center", background: "rgba(148,163,184,0.12)", borderRadius: 4 }, children: assignedAsset ? /* @__PURE__ */ jsx2(SpritePreview, { url: assignedAsset.url, scale: 1.5 }) : /* @__PURE__ */ jsx2("span", { style: { fontSize: 10, opacity: 0.65 }, children: "Auto" }) })
              ]
            },
            agent.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs2("section", { style: { display: "grid", gap: "12px" }, children: [
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxs2("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx2("div", { style: { fontSize: "15px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: selectedAgent?.name ?? "No agents" }),
            /* @__PURE__ */ jsx2("div", { style: { fontSize: "12px", opacity: 0.7 }, children: visibleIndex !== void 0 && visibleIndex !== null ? `Selected char_${visibleIndex}` : "Using automatic sprite" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
            selectedAgent ? /* @__PURE__ */ jsx2(
              "button",
              {
                type: "button",
                disabled: savingAgentId === selectedAgent.id || draftIndex === null,
                onClick: () => void updateAssignment(selectedAgent.id, draftIndex),
                style: { padding: "7px 10px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.35)", background: "rgba(59,130,246,0.22)", color: "inherit", cursor: draftIndex === null ? "default" : "pointer" },
                children: "Save"
              }
            ) : null,
            selectedAgent ? /* @__PURE__ */ jsx2(
              "button",
              {
                type: "button",
                disabled: savingAgentId === selectedAgent.id || assets.length === 0,
                onClick: () => {
                  const next = randomIndex();
                  if (next !== null) setDraftIndex(next);
                },
                style: { padding: "7px 10px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.35)", background: "transparent", color: "inherit", cursor: "pointer" },
                children: "Random"
              }
            ) : null,
            selectedAgent && selectedIndex !== void 0 ? /* @__PURE__ */ jsx2(
              "button",
              {
                type: "button",
                disabled: savingAgentId === selectedAgent.id,
                onClick: () => void updateAssignment(selectedAgent.id, null),
                style: { padding: "7px 10px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.35)", background: "transparent", color: "inherit", cursor: "pointer" },
                children: "Reset"
              }
            ) : null
          ] })
        ] }),
        /* @__PURE__ */ jsx2(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))",
              gap: "8px",
              maxHeight: "610px",
              overflow: "auto",
              padding: "10px",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: 6,
              background: "rgba(15,23,42,0.3)"
            },
            children: assets.map((asset) => /* @__PURE__ */ jsx2(
              "button",
              {
                type: "button",
                disabled: !selectedAgent || savingAgentId === selectedAgent.id,
                onClick: () => setDraftIndex(asset.index),
                title: asset.path.replace("characters/", "").replace(".png", ""),
                style: {
                  height: 82,
                  display: "grid",
                  placeItems: "center",
                  border: asset.index === visibleIndex ? "2px solid #60a5fa" : "1px solid rgba(148,163,184,0.25)",
                  borderRadius: 6,
                  background: asset.index === visibleIndex ? "rgba(59,130,246,0.2)" : "rgba(148,163,184,0.08)",
                  cursor: selectedAgent ? "pointer" : "default"
                },
                children: /* @__PURE__ */ jsx2(SpritePreview, { url: asset.url, scale: 2 })
              },
              asset.path
            ))
          }
        )
      ] })
    ] })
  ] });
}
function AgentChatRoomsPage() {
  const {companyId}=useHostContext();
  const {data,loading,error,refresh}=usePluginData('agent-chat-rooms',{companyId});
  const act=usePluginAction('office-chat');
  const [selected,setSelected]=useState2(()=>typeof window!=='undefined'?new URLSearchParams(window.location.search).get('room'):null),[showNew,setShowNew]=useState2(false),[issueId,setIssueId]=useState2(''),[leaderId,setLeaderId]=useState2(''),[members,setMembers]=useState2(null),[text,setText]=useState2(''),[busy,setBusy]=useState2(false),[problem,setProblem]=useState2('');
  const requestId=useRef2(null),bottom=useRef2(null),composer=useRef2(null),answerRequest=useRef2(null);
  const rooms=(data?.rooms??[]).slice().reverse(), agents=data?.agents??[], issues=data?.issues??[];
  const room=rooms.find(r=>r.key===selected)??rooms[0]??null;
  const leaders=agents.filter(a=>['ceo','cto','cmo','pm'].includes(a.name.toLowerCase())&&!['paused','terminated'].includes(a.status));
  const owner=leaderId||leaders.find(a=>a.name==='CEO')?.id||leaders[0]?.id||'';
  const team=agents.filter(a=>a.reportsTo===owner&&!['terminated','paused'].includes(a.status));
  const statuses={queued:'Chờ lượt',running:'Đang trao đổi',completed:'Đã tổng kết',needs_user:'Cần bạn xử lý',cancelled:'Đã dừng'};
  const prefix=typeof window!=='undefined'?window.location.pathname.split('/')[1]:'QLD';
  const link=id=>'/'+prefix+'/issues/'+encodeURIComponent(id);
  const h=(tag,props,...children)=>jsx2(tag,children.length?{...props,children:children.length===1?children[0]:children}:props);
  const button=(label,onClick,disabled=false,primary=false)=>h('button',{type:'button',onClick,disabled:disabled||busy,className:'ai-chat-button'+(primary?' primary':'')},label);
  useEffect2(()=>{const timer=window.setInterval(()=>{if(!document.hidden)refresh();},5000);return()=>window.clearInterval(timer);},[refresh]);
  useEffect2(()=>{bottom.current?.scrollIntoView({block:'nearest'});},[room?.key,room?.messages?.length]);
  useEffect2(()=>{setSelected(typeof window!=='undefined'?new URLSearchParams(window.location.search).get('room'):null);setShowNew(false);setProblem('');setText('');setLeaderId('');setMembers(null);},[companyId]);
  async function run(action,extra={}) {
    setBusy(true);setProblem('');
    try {const result=await act({companyId,action,...extra});if(result?.key)setSelected(result.key);await refresh();return true;}catch(e){setProblem(e?.message??String(e));return false;}finally{setBusy(false);}
  }
  async function answer(extra){
    const q=room?.humanRequest;if(!q)return false;
    if(answerRequest.current?.question!==q.id)answerRequest.current={question:q.id,id:'answer-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)};
    return run('answer',{key:room.key,requestId:q.id,responseId:answerRequest.current.id,...extra});
  }
  async function start(){
    if(!requestId.current)requestId.current='chat-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    const ok=await run('start',{issueId,organizerId:owner,participants:members??team.map(a=>a.id),requestId:requestId.current});
    if(ok){setShowNew(false);requestId.current=null;}
  }
  return h('main',{className:'ai-chat-page'},
    h('style',{},`
      .ai-chat-page{height:calc(100dvh - 64px);min-height:480px;display:flex;flex-direction:column;padding:20px;gap:14px;box-sizing:border-box;color:var(--foreground);background:var(--background)}
      .ai-chat-page h1{font-size:22px;font-weight:700;margin:0}.ai-chat-page p{margin:0}.ai-chat-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px}.ai-chat-subtitle{font-size:13px;color:var(--muted-foreground);margin-top:4px!important}
      .ai-chat-button{padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--background);color:var(--foreground);font:inherit;cursor:pointer}.ai-chat-button.primary{background:#6d28d9;color:white;border-color:#6d28d9}.ai-chat-button:disabled{opacity:.5;cursor:default}
      .ai-chat-layout{display:grid;grid-template-columns:270px minmax(0,1fr);flex:1;min-height:0;border:1px solid var(--border);border-radius:12px;overflow:hidden}.ai-chat-list{overflow:auto;border-right:1px solid var(--border);padding:10px;background:rgba(139,92,246,.04)}
      .ai-chat-room{width:100%;display:block;text-align:left;padding:12px;margin-bottom:8px;border:1px solid transparent;border-radius:9px;background:transparent;color:inherit;cursor:pointer}.ai-chat-room.active{border-color:#a78bfa;background:rgba(139,92,246,.12)}.ai-chat-room strong{display:block;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.ai-chat-room small{display:block;color:var(--muted-foreground);margin-top:5px}
      .ai-chat-thread{display:flex;flex-direction:column;min-width:0;min-height:0}.ai-chat-thread-header{border-bottom:1px solid var(--border);padding:14px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.ai-chat-messages{flex:1;min-height:0;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:16px}.ai-chat-message{max-width:90%;border:1px solid var(--border);border-left:3px solid #8b5cf6;border-radius:10px;padding:12px 14px;background:rgba(139,92,246,.04)}.ai-chat-message.user{align-self:flex-end;background:rgba(59,130,246,.08);border-left-color:#3b82f6}.ai-chat-message-head{display:flex;gap:10px;align-items:center;margin-bottom:7px;font-size:13px}.ai-chat-message-head time{font-size:11px;color:var(--muted-foreground)}.ai-chat-message-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.65}.ai-chat-status{font-size:12px;color:var(--muted-foreground);padding:10px 14px;border-radius:8px;background:rgba(139,92,246,.07)}
      .ai-chat-compose{padding:14px;border-top:1px solid var(--border);display:flex;gap:10px;align-items:flex-end}.ai-chat-compose textarea,.ai-chat-new select{border:1px solid var(--border);background:var(--background);color:var(--foreground);border-radius:8px;padding:9px;font:inherit}.ai-chat-compose textarea{flex:1;min-width:0;resize:vertical;min-height:44px;max-height:150px}.ai-chat-new{border:1px solid #a78bfa;background:rgba(139,92,246,.04);border-radius:10px;padding:14px;display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}.ai-chat-new label{display:flex;flex-direction:column;gap:6px;font-size:13px}.ai-chat-new select{max-width:420px}.ai-chat-alert{padding:10px 14px;border:1px solid #f59e0b;border-radius:8px;background:rgba(245,158,11,.08);font-size:13px}.ai-chat-empty{margin:auto;max-width:480px;text-align:center;padding:30px;color:var(--muted-foreground);line-height:1.7}.ai-chat-member{display:inline-flex!important;flex-direction:row!important;align-items:center;gap:5px!important;margin-right:12px}
      @media(max-width:760px){.ai-chat-page{padding:10px;height:calc(100dvh - 56px)}.ai-chat-layout{grid-template-columns:1fr;grid-template-rows:100px minmax(0,1fr)}.ai-chat-list{border-right:0;border-bottom:1px solid var(--border);display:flex;gap:8px}.ai-chat-room{min-width:200px;margin-bottom:0}.ai-chat-message{max-width:100%}.ai-chat-new select{max-width:100%;width:100%}.ai-chat-new label{width:100%}.ai-chat-messages{padding:12px}}
    `),
    h('header',{className:'ai-chat-toolbar'},h('div',{},h('h1',{},'💬 Chat room'),h('p',{className:'ai-chat-subtitle'},'Theo dõi các agent trao đổi và chốt phương án theo từng task.')),button('＋ Mở thảo luận',()=>{setShowNew(!showNew);setMembers(null);},false,true)),
    (problem||error)&&h('div',{role:'alert',className:'ai-chat-alert'},problem||error?.message||String(error)),
    showNew&&h('section',{className:'ai-chat-new','aria-label':'Mở thảo luận'},
      h('label',{},'Task liên quan',h('select',{value:issueId,onChange:e=>{setIssueId(e.target.value);requestId.current=null;}},h('option',{value:''},'Chọn task đang mở'),...issues.map(i=>h('option',{key:i.id,value:i.id},(i.identifier??'')+' · '+i.title)))),
      h('label',{},'Người chủ trì',h('select',{value:owner,onChange:e=>{setLeaderId(e.target.value);setMembers(null);requestId.current=null;}},...leaders.map(a=>h('option',{key:a.id,value:a.id},a.name)))),
      h('div',{},h('div',{style:{fontSize:13,marginBottom:6}},'Người tham gia'),...team.map(a=>h('label',{key:a.id,className:'ai-chat-member'},h('input',{type:'checkbox',checked:(members??team.map(a=>a.id)).includes(a.id),onChange:e=>{const ids=members??team.map(a=>a.id);setMembers(e.target.checked?[...ids,a.id]:ids.filter(id=>id!==a.id));requestId.current=null;}}),a.name))),
      button('Bắt đầu trao đổi',start,!issueId||!(members??team).length,true),h('p',{className:'ai-chat-subtitle'},'Chủ trì chọn người trả lời tiếp và có thể kết thúc sớm. Tối đa 9 lượt chạy model.')),
    h('div',{className:'ai-chat-layout'},
      h('nav',{className:'ai-chat-list','aria-label':'Danh sách phòng'},rooms.length?rooms.map(r=>h('button',{key:r.key,type:'button',className:'ai-chat-room'+(r.key===room?.key?' active':''),onClick:()=>{setSelected(r.key);setProblem('');}},h('strong',{},r.topic),h('small',{},statuses[r.status]??r.status),h('small',{},agents.filter(a=>r.participants.includes(a.id)).map(a=>a.name).join(' · ')))):h('p',{className:'ai-chat-empty'},loading?'Đang tải…':'Chưa có cuộc thảo luận.')),
      room?h('section',{className:'ai-chat-thread','aria-label':'Nội dung thảo luận'},
        h('header',{className:'ai-chat-thread-header'},h('div',{},h('strong',{},room.topic),h('p',{className:'ai-chat-subtitle'},(room.mode==='moderated'?'Chủ trì điều phối · ':'Theo lượt · ')+statuses[room.status]+' · '+Math.min(room.turn,room.maxTurns??room.order.length)+'/'+(room.maxTurns??room.order.length)+' lượt · ',h('a',{href:link(room.issueIdentifier??room.issueId)},'Mở task'))),h('div',{style:{display:'flex',gap:8}},['running','queued','needs_user'].includes(room.status)&&button('Dừng',()=>run('stop',{key:room.key})),(room.status==='needs_user'||room.stalled)&&button('Thử lại',()=>run('retry',{key:room.key})))),
        h('div',{className:'ai-chat-messages','aria-live':'polite'},
          !room.messages.length&&h('div',{className:'ai-chat-status'},room.status==='queued'?'Phòng đang xếp hàng sau cuộc thảo luận trước.':'Đã giao lượt đầu. Chờ agent phản hồi…'),
          ...room.messages.map((m,i)=>h('article',{key:m.id??i,className:'ai-chat-message'+(!m.agentId?' user':'')},h('div',{className:'ai-chat-message-head'},h('strong',{},m.speaker),h('time',{},new Date(m.createdAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})),m.taskId&&h('a',{href:link(m.taskId),style:{fontSize:11}},'Task lượt')),h('div',{className:'ai-chat-message-text'},m.text))),
          room.status==='running'&&h('div',{className:'ai-chat-status'},'Đang chờ '+(agents.find(a=>a.id===room.order[room.turn])?.name??'agent')+' trả lời.',room.currentTaskId&&h('a',{href:link(room.currentTaskId),style:{marginLeft:8}},'Xem tiến trình')),
          room.status==='needs_user'&&room.humanRequest?.status==='pending'&&(room.humanRequest.choices?.length>0)&&h('section',{'aria-label':'Chọn phương án',className:'ai-chat-status'},h('strong',{},'Chọn một phương án'),h('div',{style:{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}},...room.humanRequest.choices.map(choice=>button(choice.label,()=>answer({choiceId:choice.id}),false,true)),button('Trả lời khác',()=>composer.current?.focus()))),
          room.humanRequest?.status==='pending'&&h('div',{className:'ai-chat-status'},room.humanRequest.deliveredAt?'Đã gửi câu hỏi qua Telegram. Bạn có thể bấm phương án tại đây hoặc trên Telegram, hoặc nhập câu trả lời khác.':'Đang chuyển câu hỏi sang Telegram…'),
          (room.error||room.notice||room.stalled)&&h('div',{className:'ai-chat-alert'},room.error||room.notice||'Lượt này chưa có phản hồi sau 20 phút. Kiểm tra task trước khi thử lại.'),
          room.status==='completed'&&h('div',{className:'ai-chat-status'},'Đã lưu kết luận về task nguồn và yêu cầu người phụ trách tiếp tục công việc.'),
          h('div',{ref:bottom})),
        h('form',{className:'ai-chat-compose',onSubmit:async e=>{e.preventDefault();if(await (room.status==='needs_user'&&room.humanRequest?.status==='pending'?answer({text}):run('send',{key:room.key,text})))setText('');}},h('textarea',{ref:composer,'aria-label':'Tin nhắn bổ sung',placeholder:'Bổ sung yêu cầu; agent sẽ đọc ở lượt tiếp theo…',value:text,maxLength:4000,onChange:e=>setText(e.target.value),disabled:busy||['completed','cancelled'].includes(room.status)}),h('button',{className:'ai-chat-button primary',type:'submit',disabled:busy||!text.trim()||['completed','cancelled'].includes(room.status)},room.status==='needs_user'&&room.humanRequest?.status==='pending'?'Trả lời và tiếp tục':'Gửi'))
      ):h('section',{className:'ai-chat-empty'},h('strong',{},'Để các agent cùng bàn cách làm'),h('p',{},'Mở thảo luận từ một task, chọn người chủ trì và nhóm tham gia. Câu trả lời thật sẽ xuất hiện tại đây; bạn có thể bổ sung yêu cầu trong lúc họ trao đổi.'))
    )
  );
}

function AgentPixelsSettingsPage({ context }) {
  return /* @__PURE__ */ jsx2("main", { style: { padding: 24 }, children: /* @__PURE__ */ jsx2(CharacterAssignmentsPanel, { companyId: context.companyId ?? null }) });
}
export {
  AgentChatRoomsPage,
  AgentPixelsCameraPage,
  AgentPixelsSettingsPage,
  AgentPixelsSidebarLink
};
