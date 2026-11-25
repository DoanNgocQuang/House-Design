export function drawOfficeAgentLabels(ctx, characters, agents, project, zoom, dpr, sittingOffset, selection) {
  const fontSize = Math.max(11 * dpr, Math.min(15 * dpr, 5 * zoom));
  const gap = 4 * dpr;
  const height = fontSize + 5 * dpr;
  const maxNameWidth = Math.min(150 * dpr, ctx.canvas.width - 34 * dpr);
  if (maxNameWidth <= 0) return;

  ctx.save();
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const pill = (x, y, width, working = false) => {
    ctx.fillStyle = working ? "#dcfce7" : "rgba(10, 18, 34, 0.88)";
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - height / 2, width, height, 4 * dpr);
    ctx.fill();
    ctx.fillStyle = working ? "#166534" : "#f9fafb";
  };

  for (const ch of characters) {
    const name = agents.get(ch.id)?.name;
    if (!name) continue;
    const feet = project(ch.x, ch.y);
    const head = feet.y + (ch.state === "type" ? sittingOffset : 0) * zoom - 24 * zoom;
    const y = head - height / 2 - 2 * dpr;
    if (feet.x < 0 || feet.x > ctx.canvas.width || y + height / 2 < 0 || y > ctx.canvas.height) continue;
    const onBreak = ch.officeBreak && !ch.isActive && !ch.officeMeeting;
    const activity = onBreak ? (ch.officeBreak.arrived ? ch.officeBreak.target.activity : "walking") : null;
    const icon = { coffee: "☕", pool: "🎱", rest: "🪑", walking: "→" }[activity] ?? "";
    const iconWidth = icon ? Math.max(fontSize, ctx.measureText(icon).width) + gap : 0;
    const nameWidth = Math.min(maxNameWidth, ctx.measureText(name).width);
    const width = nameWidth + iconWidth + 3 * gap;
    const x = Math.max(width / 2, Math.min(ctx.canvas.width - width / 2, feet.x));
    pill(x, y, width, ch.isActive);
    ctx.fillText(name, x - iconWidth / 2, y, maxNameWidth);
    if (icon) ctx.fillText(icon, x + (nameWidth + gap) / 2, y);

    if (activity && (selection.hovered === ch.id || selection.selected === ch.id)) {
      const action = { coffee: "Uống cà phê", pool: "Chơi bi-a", rest: "Đang nghỉ", walking: "Đang đi đến khu nghỉ" }[activity];
      const detailY = y - height - gap / 2;
      if (action && detailY >= height / 2) {
        const detailWidth = ctx.measureText(action).width + 3 * gap;
        const detailX = Math.max(detailWidth / 2, Math.min(ctx.canvas.width - detailWidth / 2, x));
        pill(detailX, detailY, detailWidth);
        ctx.fillText(action, detailX, detailY);
      }
    }
  }
  ctx.restore();
}

export function drawOfficeRoomLabels(ctx, rooms, { offsetX, offsetY, zoom, tileSize, dpr }) {
  const unit = tileSize * zoom;
  const size = Math.max(9 * dpr, Math.min(15 * dpr, 4.8 * zoom));
  const padding = 4 * dpr;
  const lineHeight = size * 1.25;
  ctx.save();
  ctx.font = `600 ${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const { label, rect, open } of rooms) {
    const roomLeft = offsetX + rect.col * unit;
    const roomTop = offsetY + rect.row * unit;
    const left = Math.max(0, roomLeft);
    const right = Math.min(ctx.canvas.width, roomLeft + rect.cols * unit);
    const top = Math.max(0, roomTop);
    const bottom = Math.min(ctx.canvas.height, roomTop + rect.rows * unit);
    const maxWidth = right - left - padding * 4;
    if (!label || maxWidth < 22 * dpr || bottom - top < lineHeight + padding * 2) continue;

    let lines = [label];
    if (ctx.measureText(label).width > maxWidth && bottom - top >= lineHeight * 2 + padding * 2) {
      const words = label.split(/\s+/);
      let balance = Infinity;
      for (let i = 1; i < words.length; i++) {
        const candidate = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
        const width = Math.max(...candidate.map(line => ctx.measureText(line).width));
        if (width < balance) {
          lines = candidate;
          balance = width;
        }
      }
    }

    const textWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)));
    const boxWidth = textWidth + 2 * padding;
    const boxHeight = lines.length * lineHeight + padding;
    const x = Math.max(left + padding + boxWidth / 2,
      Math.min(right - padding - boxWidth / 2, roomLeft + rect.cols * unit / 2));
    const y = Math.max(top + padding,
      Math.min(bottom - boxHeight - padding, roomTop + unit * (open ? 0.25 : 0.85)));
    ctx.fillStyle = "rgba(9, 13, 24, 0.84)";
    ctx.beginPath();
    ctx.roundRect(x - boxWidth / 2, y, boxWidth, boxHeight, 4 * dpr);
    ctx.fill();
    ctx.fillStyle = "#f3f4f6";
    lines.forEach((line, index) => ctx.fillText(line, x, y + padding / 2 + lineHeight * (index + 0.5), maxWidth));
  }
  ctx.restore();
}
