/** Helpers for previewing 3D model (.glb) task attachments and their saved color palettes. */

export const MODEL_PREVIEW_MAX_BYTES = 50 * 1024 * 1024;

export type HousePalette = { categories: Record<string, string>; parts: Record<string, string> };

export const PART_CATEGORY_LABELS: Record<string, string> = {
  floor: "Sàn",
  wall: "Tường",
  door: "Cửa đi",
  glass: "Kính",
  stairs: "Cầu thang",
  furniture: "Nội thất",
  garden: "Sân vườn",
  fence: "Hàng rào",
  roof: "Mái",
  frame: "Khung cửa",
  railing: "Lan can",
  trim: "Phào, gờ, diềm",
  column: "Cột",
};

const GLB_CONTENT_TYPE = "model/gltf-binary";
const PALETTE_HEADING = "Bảng màu cho ";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isModelAttachment(attachment: { contentType?: string | null; originalFilename?: string | null }): boolean {
  if (attachment.contentType?.split(";")[0].trim().toLowerCase() === GLB_CONTENT_TYPE) return true;
  return attachment.originalFilename?.toLowerCase().endsWith(".glb") ?? false;
}

export function buildPaletteComment(fileName: string, palette: HousePalette): string {
  const payload = { houseColors: { file: fileName, categories: palette.categories, parts: palette.parts } };
  return `${PALETTE_HEADING}${fileName}\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
}

function readPalette(body: string, fileName: string): HousePalette | null {
  if (!body.startsWith(`${PALETTE_HEADING}${fileName}\n`)) return null;
  const block = body.match(/```json\s*([\s\S]*?)```/);
  if (!block) return null;
  try {
    const colors = JSON.parse(block[1]).houseColors;
    if (!colors || colors.file !== fileName) return null;
    const pick = (value: unknown) =>
      Object.fromEntries(
        Object.entries(value && typeof value === "object" ? value : {}).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string" && HEX_COLOR.test(entry[1]),
        ),
      );
    return { categories: pick(colors.categories), parts: pick(colors.parts) };
  } catch {
    return null;
  }
}

/** The newest valid palette comment saved for `fileName`, or null. */
export function parseLatestPalette(comments: { body: string; createdAt: string | Date }[], fileName: string): HousePalette | null {
  const newestFirst = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  for (const comment of newestFirst) {
    const palette = readPalette(comment.body, fileName);
    if (palette) return palette;
  }
  return null;
}

/** Original part name from glTF extras; three.js rewrites node names (spaces and dots become "_"). */
export function partName(userData: Record<string, unknown>, fallback: string): string {
  return typeof userData.name === "string" && userData.name ? userData.name : fallback;
}

/** Camera distance that keeps a bounding sphere fully in view on the narrower of the two axes. */
export function fitCameraDistance(radius: number, fovDegrees: number, aspect: number): number {
  const vertical = (fovDegrees * Math.PI) / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  return (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.1;
}

/** Camera directions (from the model's center) for the preset views; the house front faces +Z. */
export const VIEW_DIRECTIONS = {
  iso: { label: "Góc 3/4", vector: [0.55, 0.45, 0.7] },
  top: { label: "Nhìn từ trên", vector: [0, 1, 0.0001] },
  front: { label: "Mặt tiền", vector: [0, 0.15, 1] },
} as const satisfies Record<string, { label: string; vector: readonly [number, number, number] }>;
export type ViewName = keyof typeof VIEW_DIRECTIONS;

/** Floors to hide so the given floor is seen from above with everything over it removed. */
export function floorsAbove(floors: number[], floor: number): Set<number> {
  return new Set(floors.filter((value) => value > floor));
}

/** "rộng × sâu × cao" of a part in meters (glTF Y is up); floors also get their area. */
export function formatSize(size: { x: number; y: number; z: number }, category?: string): string {
  const m = (value: number) => value.toFixed(2).replace(/\.?0+$/, "");
  const text = `Rộng ${m(size.x)} m × sâu ${m(size.z)} m × cao ${m(size.y)} m`;
  return category === "floor" ? `${text} · ${(size.x * size.z).toFixed(1)} m²` : text;
}

/** File name for a screenshot of a model, e.g. "nha-pho.glb" -> "nha-pho-anh.png". */
export function screenshotName(fileName: string): string {
  return `${fileName.replace(/\.glb$/i, "") || "mo-hinh"}-anh.png`;
}

/** Layer `overlay` over `base`, dropping part colors for parts the model no longer has. */
/** Garden materials that keep their own color when the whole "Sân vườn" category is recolored (trees, water, paving...). */
const GARDEN_OWN_COLOR = new Set(["leaves", "bark", "water", "soil", "paving", "gravel"]);

/** The palette color of a part: its own, else its category's. Mirrors resolve_color in house_builder.py. */
export function paletteColor(palette: HousePalette, part: { id: string; category: string; material?: string }): string | undefined {
  if (palette.parts[part.id]) return palette.parts[part.id];
  if (part.category === "garden" && part.material && GARDEN_OWN_COLOR.has(part.material)) return undefined;
  return palette.categories[part.category];
}

export function applyPalette(base: HousePalette, overlay: HousePalette, knownPartIds: Set<string>): HousePalette {
  const parts = { ...base.parts };
  for (const [id, color] of Object.entries(overlay.parts)) {
    if (knownPartIds.has(id)) parts[id] = color;
  }
  return { categories: { ...base.categories, ...overlay.categories }, parts };
}
