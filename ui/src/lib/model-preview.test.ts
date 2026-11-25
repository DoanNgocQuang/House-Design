import { describe, expect, it } from "vitest";
import {
  applyPalette,
  buildPaletteComment,
  fitCameraDistance,
  floorsAbove,
  formatSize,
  screenshotName,
  VIEW_DIRECTIONS,
  isModelAttachment,
  partName,
  paletteColor,
  PART_CATEGORY_LABELS,
  parseLatestPalette,
  type HousePalette,
} from "./model-preview";

describe("isModelAttachment", () => {
  it("recognizes .glb names regardless of case or generic content type", () => {
    expect(isModelAttachment({ originalFilename: "MODEL.GLB", contentType: "application/octet-stream" })).toBe(true);
  });

  it("recognizes the glTF binary content type without a file name", () => {
    expect(isModelAttachment({ contentType: "model/gltf-binary", originalFilename: null })).toBe(true);
  });

  it("does not treat other files as 3D models", () => {
    expect(isModelAttachment({ originalFilename: "plan.svg", contentType: "image/svg+xml" })).toBe(false);
    expect(isModelAttachment({ originalFilename: null, contentType: null })).toBe(false);
  });
});

describe("palette comments", () => {
  const palette: HousePalette = { categories: { roof: "#112233" }, parts: { "t1-gara-san": "#ff0000" } };

  it("round-trips a palette through a task comment", () => {
    const body = buildPaletteComment("model.glb", palette);
    expect(body.startsWith("Bảng màu cho model.glb")).toBe(true);
    expect(parseLatestPalette([{ body, createdAt: "2026-11-23T01:00:00Z" }], "model.glb")).toEqual(palette);
  });

  it("takes the newest comment for the same file and ignores other files and broken JSON", () => {
    const older = buildPaletteComment("model.glb", { categories: { roof: "#000000" }, parts: {} });
    const newer = buildPaletteComment("model.glb", palette);
    const otherFile = buildPaletteComment("khac.glb", { categories: { wall: "#ffffff" }, parts: {} });
    const broken = "Bảng màu cho model.glb\n```json\n{\"houseColors\": \n```";
    const comments = [
      { body: newer, createdAt: "2026-11-23T02:00:00Z" },
      { body: otherFile, createdAt: "2026-11-23T03:00:00Z" },
      { body: broken, createdAt: "2026-11-23T04:00:00Z" },
      { body: older, createdAt: new Date("2026-11-23T01:00:00Z") },
    ];
    expect(parseLatestPalette(comments, "model.glb")).toEqual(palette);
    expect(parseLatestPalette([{ body: broken, createdAt: "2026-11-23T04:00:00Z" }], "model.glb")).toBeNull();
  });
});

describe("applyPalette", () => {
  it("drops part colors for parts that no longer exist", () => {
    const merged = applyPalette(
      { categories: { wall: "#eeeeee" }, parts: {} },
      { categories: { roof: "#112233" }, parts: { "t1-gara-san": "#ff0000", "khong-ton-tai": "#00ff00" } },
      new Set(["t1-gara-san", "mai"]),
    );
    expect(merged).toEqual({ categories: { wall: "#eeeeee", roof: "#112233" }, parts: { "t1-gara-san": "#ff0000" } });
  });
});

describe("partName", () => {
  it("prefers the original name saved in glTF extras over three.js's sanitized node name", () => {
    expect(partName({ name: "T1 · Gara · Sàn" }, "T1_-_Gara_-_Sàn")).toBe("T1 · Gara · Sàn");
    expect(partName({}, "T1_-_Gara_-_Sàn")).toBe("T1_-_Gara_-_Sàn");
  });
});

describe("fitCameraDistance", () => {
  it("backs off far enough to show the whole bounding sphere on the narrower side", () => {
    const wide = fitCameraDistance(10, 45, 2);
    const narrow = fitCameraDistance(10, 45, 0.5);
    expect(wide).toBeGreaterThan(10 / Math.sin((45 * Math.PI) / 360));
    expect(narrow).toBeGreaterThan(wide);
  });
});

describe("paletteColor", () => {
  it("uses the part color, then the category color, and leaves trees and water alone in the garden", () => {
    const palette: HousePalette = { categories: { garden: "#ffffff", roof: "#112233" }, parts: { "cay-1": "#00ff00" } };
    expect(paletteColor(palette, { id: "mai", category: "roof" })).toBe("#112233");
    expect(paletteColor(palette, { id: "san", category: "garden", material: "grass" })).toBe("#ffffff");
    expect(paletteColor(palette, { id: "cay-2", category: "garden", material: "leaves" })).toBeUndefined();
    expect(paletteColor(palette, { id: "cay-1", category: "garden", material: "leaves" })).toBe("#00ff00");
  });
});

describe("PART_CATEGORY_LABELS", () => {
  it("names the garden and fence categories in Vietnamese", () => {
    expect(PART_CATEGORY_LABELS.garden).toBe("Sân vườn");
    expect(PART_CATEGORY_LABELS.fence).toBe("Hàng rào");
    expect(PART_CATEGORY_LABELS.railing).toBe("Lan can");
    expect(PART_CATEGORY_LABELS.frame).toBe("Khung cửa");
  });
});

describe("viewer helpers", () => {
  it("hides only the floors above the one being looked into", () => {
    expect([...floorsAbove([1, 2, 3], 1)]).toEqual([2, 3]);
    expect([...floorsAbove([1, 2, 3], 3)]).toEqual([]);
  });

  it("names screenshots after the model", () => {
    expect(screenshotName("nha-pho.GLB")).toBe("nha-pho-anh.png");
    expect(screenshotName(".glb")).toBe("mo-hinh-anh.png");
  });

  it("looks at the house front from +Z and straight down for the top view", () => {
    expect(VIEW_DIRECTIONS.front.vector[2]).toBeGreaterThan(0);
    expect(VIEW_DIRECTIONS.top.vector[1]).toBe(1);
  });
});

describe("formatSize", () => {
  it("prints width, depth, height in meters and the area of floors", () => {
    expect(formatSize({ x: 5, y: 0.15, z: 4.5 })).toBe("Rộng 5 m × sâu 4.5 m × cao 0.15 m");
    expect(formatSize({ x: 5, y: 0.15, z: 4.5 }, "floor")).toBe("Rộng 5 m × sâu 4.5 m × cao 0.15 m · 22.5 m²");
  });
});
