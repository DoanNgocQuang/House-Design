// Fixed positions keep the new furniture clear of the existing doors and aisles.
const officeDecor = {
  "classic": [
    ["SMALL_TABLE_FRONT", 32, 20],
    ["COFFEE", 32, 21],
    ["PLANT_2", 35, 20],
    ["POT", 34, 20],
    ["LARGE_PLANT", 14, 12],
  ],
  "hub-central": [
    ["POOL_TABLE", 23, 30],
    ["SMALL_TABLE_FRONT", 27, 28],
    ["COFFEE", 27, 29],
    ["PLANT_2", 21, 32],
    ["POT", 23, 28],
    ["LARGE_PLANT", 21, 10],
  ],
  "open-studio": [
    ["POOL_TABLE", 38, 28],
    ["SMALL_TABLE_FRONT", 39, 32],
    ["COFFEE", 39, 33],
    ["PLANT_2", 42, 32],
    ["POT", 43, 31],
    ["LARGE_PLANT", 4, 7],
    ["CUSHIONED_BENCH", 44, 30],
  ],
  "boulevard": [
    ["POOL_TABLE", 23, 30],
    ["SMALL_TABLE_FRONT", 20, 32],
    ["COFFEE", 20, 33],
    ["PLANT_2", 29, 29],
    ["POT", 23, 28],
    ["LARGE_PLANT", 41, 2],
  ],
  "campus-mini": [
    ["POOL_TABLE", 6, 29],
    ["SMALL_TABLE_FRONT", 10, 22],
    ["COFFEE", 10, 23],
    ["PLANT_2", 19, 13],
    ["POT", 12, 22],
    ["LARGE_PLANT", 5, 6],
  ],
  "team-pods": [
    ["POOL_TABLE", 25, 31],
    ["SMALL_TABLE_FRONT", 23, 30],
    ["COFFEE", 23, 31],
    ["PLANT_2", 36, 29],
    ["POT", 31, 29],
    ["LARGE_PLANT", 6, 6],
  ],
  "creative-loft": [
    ["SMALL_TABLE_FRONT", 41, 25],
    ["COFFEE", 41, 26],
    ["PLANT_2", 21, 26],
    ["POT", 20, 26],
    ["LARGE_PLANT", 4, 18],
  ],
  "hybrid-office": [
    ["SMALL_TABLE_FRONT", 10, 27],
    ["COFFEE", 10, 28],
    ["PLANT_2", 13, 27],
    ["POT", 12, 27],
    ["LARGE_PLANT", 5, 6],
  ],
};

export function withOfficeDecor(layout, mapId) {
  const additions = officeDecor[mapId];
  if (!additions) return layout;

  const furniture = layout.furniture.map(item =>
    mapId === "team-pods" && item.type === "SMALL_TABLE_SIDE" && item.col === 25 && item.row === 32
      ? { ...item, col: 30, row: 29 }
      : item,
  );
  for (const [type, col, row] of additions) {
    furniture.push({ uid: `office-decor-${mapId}-${type}-${col}-${row}`, type, col, row });
  }
  return { ...layout, furniture };
}
