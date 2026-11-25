import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { renderSvgPreview } from "./svg-preview.js";

describe("renderSvgPreview", () => {
  it("draws a small SVG as a large PNG on white", async () => {
    const png = await renderSvgPreview(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="50" height="50" fill="red"/></svg>'));
    const image = sharp(png);
    expect(await image.metadata()).toMatchObject({ format: "png", width: 2000, height: 1000 });
    const corner = await image.extract({ left: 1990, top: 990, width: 1, height: 1 }).raw().toBuffer();
    expect([...corner.subarray(0, 3)]).toEqual([255, 255, 255]);
  });

  it("refuses a file that is not a drawing", async () => {
    await expect(renderSvgPreview(Buffer.from("not svg"))).rejects.toThrow("cannot be shown as an image");
  });
});
