export function createOfficeBreaks(office, rooms, findPath, getCatalogEntry) {
  const restRooms = rooms.filter(room => ["pantry", "lounge", "courtyard"].includes(room.role) || room.id === "kitchen");
  const inRoom = (room, col, row) => {
    const { rect } = room;
    return col >= rect.col && row >= rect.row && col < rect.col + rect.cols && row < rect.row + rect.rows;
  };
  const inRestArea = (col, row) => restRooms.some(room => inRoom(room, col, row));
  const spotKey = ({ col, row }) => `${col},${row}`;
  const restTiles = office.walkableTiles.filter(tile => inRestArea(tile.col, tile.row));
  const spots = [];
  for (const item of office.getLayout().furniture) {
    const activity = item.type === "COFFEE" ? "coffee" : item.type === "POOL_TABLE" ? "pool" : null;
    if (!activity) continue;
    const room = restRooms.find(room => inRoom(room, item.col, item.row));
    if (!room) continue;
    const entry = getCatalogEntry(item.type);
    const centerCol = item.col + ((entry?.footprintW ?? 1) - 1) / 2;
    const centerRow = item.row + ((entry?.footprintH ?? 1) - 1) / 2;
    const distance = tile => Math.abs(tile.col - centerCol) + Math.abs(tile.row - centerRow);
    const near = restTiles.filter(tile => inRoom(room, tile.col, tile.row))
      .sort((a, b) => distance(a) - distance(b)).slice(0, activity === "pool" ? 3 : 2);
    for (const tile of near) {
      const dx = centerCol - tile.col;
      const dy = centerRow - tile.row;
      spots.push({ ...tile, activity, facingDir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : (dy > 0 ? 0 : 3) });
    }
  }
  for (const [uid, seat] of office.seats) {
    if (inRestArea(seat.seatCol, seat.seatRow)) {
      spots.push({ col: seat.seatCol, row: seat.seatRow, facingDir: seat.facingDir, seatUid: uid, activity: "rest" });
    }
  }
  for (const tile of restTiles) spots.push({ ...tile, activity: "rest" });

  const previousHome = new WeakMap();
  const retryAt = new WeakMap();
  const preferences = ["rest", "coffee", "pool"].filter(activity => spots.some(spot => spot.activity === activity));
  let elapsed = 0;

  function routeTo(character, target) {
    const key = spotKey(target);
    const wasBlocked = target.seatUid && office.blockedTiles.delete(key);
    try {
      return office.withOwnSeatUnblocked(character, () =>
        findPath(character.tileCol, character.tileRow, target.col, target.row, office.tileMap, office.blockedTiles));
    } finally {
      if (wasBlocked) office.blockedTiles.add(key);
    }
  }

  function startWalking(character, path) {
    Object.assign(character, { path, moveProgress: 0, state: path.length ? "walk" : "idle", frame: 0, frameTimer: 0 });
  }

  return function updateOfficeBreaks(dt) {
    if (!spots.length) return;
    elapsed += dt;
    const characters = [...office.characters.values()];
    const workingSeats = new Set(characters.filter(ch => ch.isActive).map(ch => ch.seatId));
    const reserved = new Set(characters.flatMap(ch => {
      const target = ch.officeMeeting?.target ?? (ch.officeBreakEligible && !ch.isActive && ch.officeBreak?.target);
      return target ? [spotKey(target)] : [];
    }));

    for (const ch of characters) {
      if (ch.matrixEffect) continue;
      const current = ch.officeBreak;
      if (!ch.officeBreakEligible || ch.isActive || ch.officeMeeting) {
        if (current) {
          delete ch.officeBreak;
          ch.seatTimer = 0;
          ch.wanderTimer = 0;
          if (!ch.officeMeeting) {
            startWalking(ch, []);
            if (ch.isActive && ch.seatId) office.sendToSeat(ch.id);
            else if (ch.isActive) {
              const home = ch.homeWorkTile ?? previousHome.get(ch);
              if (home) startWalking(ch, routeTo(ch, home));
            }
          }
        }
        previousHome.delete(ch);
        continue;
      }

      ch.wanderTimer = Infinity;
      if (current) {
        if (ch.tileCol !== current.target.col || ch.tileRow !== current.target.row || ch.path.length) {
          if (ch.path.length) continue;
        } else {
          if (!current.arrived) {
            current.arrived = true;
            const activity = current.target.activity;
            const variation = Math.abs(ch.id);
            current.until = current.target.seatUid ? Infinity :
              elapsed + (activity === "rest" ? 4 : 14 + variation % 7);
            if (current.target.facingDir !== undefined) ch.dir = current.target.facingDir;
          }
          if (elapsed < current.until) {
            ch.state = current.target.activity === "rest" ? "type" : "idle";
            ch.seatTimer = Infinity;
            continue;
          }
        }
        reserved.delete(spotKey(current.target));
        delete ch.officeBreak;
      }

      if ((retryAt.get(ch) ?? 0) > elapsed) continue;
      retryAt.set(ch, elapsed + 2);
      const settle = Boolean(current || ch.officeBreakSitOnly);
      const nextActivity = settle ? "rest" : preferences[Math.abs(ch.id) % preferences.length];
      const score = spot => (spot.activity === nextActivity ? 0 : 200) + (spot.activity === "rest" && !spot.seatUid ? 100 : 0)
        + Math.abs(ch.tileCol - spot.col) + Math.abs(ch.tileRow - spot.row);
      const available = spots
        .filter(spot => (!settle || spot.activity === "rest") &&
          !reserved.has(spotKey(spot)) && (!spot.seatUid || !workingSeats.has(spot.seatUid)))
        .sort((a, b) => score(a) - score(b));
      for (const target of available.slice(0, 18)) {
        const path = routeTo(ch, target);
        if (!path.length && (ch.tileCol !== target.col || ch.tileRow !== target.row)) continue;
        if (!previousHome.has(ch)) previousHome.set(ch, { col: ch.tileCol, row: ch.tileRow });
        const alreadyResting = current?.arrived && current.target.activity === "rest" &&
          target.activity === "rest" && !path.length && spotKey(current.target) === spotKey(target);
        ch.officeBreak = { target, arrived: Boolean(alreadyResting), until: elapsed + 4 };
        if (!alreadyResting) startWalking(ch, path);
        reserved.add(spotKey(target));
        break;
      }
    }
  };
}

export function drawOfficeBreakActivity(ctx, characters, positionFor, dpr) {
  ctx.save();
  ctx.font = `600 ${Math.round(11 * dpr)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const ch of characters) {
    if (!ch.officeBreak?.arrived || ch.officeMeeting) continue;
    const { activity } = ch.officeBreak.target;
    if (activity === "rest") continue;
    const label = activity === "coffee" ? "☕ Uống cà phê" : "🎱 Chơi bi-a";
    const point = positionFor(ch);
    const y = point.y - Math.sin(Date.now() / 310 + ch.id) * 2 * dpr;
    const width = ctx.measureText(label).width + 12 * dpr;
    ctx.fillStyle = "rgba(10, 18, 34, 0.88)";
    ctx.beginPath();
    ctx.roundRect(point.x - width / 2, y - 9 * dpr, width, 18 * dpr, 5 * dpr);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(label, point.x, y);
  }
  ctx.restore();
}
