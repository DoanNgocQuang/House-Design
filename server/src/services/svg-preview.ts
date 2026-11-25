import sharp from "sharp";
import { unprocessable } from "../errors.js";

export const MAX_SVG_PREVIEW_BYTES = 10 * 1024 * 1024;
const LONG_EDGE = 2000;

/** Raster preview of a drawing for clients that cannot show SVG. Bounded in bytes and pixels; librsvg loads no external files. */
export async function renderSvgPreview(svg: Buffer): Promise<Buffer> {
  try {
    const { width, height } = await sharp(svg, { limitInputPixels: 50_000_000 }).metadata();
    const edge = Math.max(width ?? 0, height ?? 0);
    if (!edge) throw new Error("Empty drawing");
    // Draw small drawings at a higher density, so their text stays sharp.
    const density = Math.min(600, Math.max(72, Math.round((72 * LONG_EDGE) / edge)));
    return await sharp(svg, { density, limitInputPixels: 50_000_000 })
      .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
  } catch {
    throw unprocessable("This drawing cannot be shown as an image");
  }
}
