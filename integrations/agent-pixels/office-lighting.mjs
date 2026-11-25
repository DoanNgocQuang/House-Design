export function createOfficeLighting(canvas, tileSize, rooms) {
  const officeView = canvas.closest(".pixel-office-view");
  const lamps = rooms.flatMap(({ col, row, cols, rows }) => {
    const count = cols >= 14 ? 2 : 1;
    return Array.from({ length: count }, (_, index) => ({
      x: (col + cols * (index + 1) / (count + 1)) * tileSize,
      y: (row + rows * 0.48) * tileSize,
      radius: Math.max(2, Math.min(cols / count, rows) * 0.76) * tileSize,
    }));
  });
  let mask;
  let cacheKey;

  return function drawNightLighting(ctx, project, scale) {
    if (officeView?.dataset.lighting !== "night" || canvas.width === 0 || canvas.height === 0) return;
    const lights = lamps.map(lamp => ({ ...project(lamp.x, lamp.y), radius: lamp.radius * scale }));
    const key = [canvas.width, canvas.height, ...lights.flatMap(({ x, y, radius }) => [x, y, radius])].join(",");

    if (key !== cacheKey) {
      mask ??= canvas.ownerDocument.createElement("canvas");
      if (mask.width !== canvas.width) mask.width = canvas.width;
      if (mask.height !== canvas.height) mask.height = canvas.height;
      const lightCtx = mask.getContext("2d");
      if (!lightCtx) return;
      lightCtx.clearRect(0, 0, mask.width, mask.height);
      lightCtx.fillStyle = "rgba(12, 24, 52, 0.48)";
      lightCtx.fillRect(0, 0, mask.width, mask.height);

      for (const { x, y, radius } of lights) {
        if (x + radius < 0 || y + radius < 0 || x - radius > mask.width || y - radius > mask.height) continue;
        lightCtx.globalCompositeOperation = "destination-out";
        const opening = lightCtx.createRadialGradient(x, y, 0, x, y, radius);
        opening.addColorStop(0, "rgba(0, 0, 0, 1)");
        opening.addColorStop(0.48, "rgba(0, 0, 0, 0.88)");
        opening.addColorStop(1, "rgba(0, 0, 0, 0)");
        lightCtx.fillStyle = opening;
        lightCtx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);

        lightCtx.globalCompositeOperation = "source-over";
        const glow = lightCtx.createRadialGradient(x, y, 0, x, y, radius * 0.72);
        glow.addColorStop(0, "rgba(255, 222, 152, 0.30)");
        glow.addColorStop(0.32, "rgba(255, 197, 101, 0.17)");
        glow.addColorStop(1, "rgba(255, 197, 101, 0)");
        lightCtx.fillStyle = glow;
        lightCtx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
      }
      cacheKey = key;
    }

    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
  };
}
