import * as THREE from "three";

/**
 * Realistic look for house_builder models, applied in the viewer only (the .glb stays plain colors).
 * Real CC0 texture sets (public/house-textures, from Poly Haven) give relief (normal map), grain and roughness.
 * The color map is turned into a grayscale detail map normalized to the texture's mean brightness, so it
 * multiplies the part color and palette colors still read true. A procedural map shows until the files load.
 */

type Pattern = "plaster" | "tiles" | "wood" | "roofTiles" | "stone" | "noise";
type Look = { pattern: Pattern; set?: string; tile: number; roughness: number; metalness?: number; normal?: number };

export const TEXTURE_BASE = "/house-textures/";

/** Keyed by the part's `material` hint (garden zones, plinth...) or, without one, its category. */
const LOOKS: Record<string, Look> = {
  wall: { pattern: "plaster", set: "beige_wall_001", tile: 2.5, roughness: 0.92, normal: 0.6 },
  floor: { pattern: "tiles", set: "floor_tiles_06", tile: 1.2, roughness: 0.45 },
  door: { pattern: "wood", set: "fine_grained_wood", tile: 1, roughness: 0.55 },
  stairs: { pattern: "stone", set: "large_floor_tiles_02", tile: 1, roughness: 0.6 },
  roof: { pattern: "roofTiles", set: "clay_roof_tiles_02", tile: 2, roughness: 0.75, normal: 1.2 },
  garden: { pattern: "noise", set: "leafy_grass", tile: 2, roughness: 1 },
  fence: { pattern: "stone", set: "grey_plaster_02", tile: 1.5, roughness: 0.9 },
  frame: { pattern: "wood", set: "fine_grained_wood", tile: 0.6, roughness: 0.5 },
  railing: { pattern: "noise", tile: 1, roughness: 0.35, metalness: 0.45 },
  trim: { pattern: "plaster", set: "grey_plaster_02", tile: 1.5, roughness: 0.85, normal: 0.5 },
  column: { pattern: "stone", set: "grey_plaster_02", tile: 1.5, roughness: 0.8, normal: 0.5 },
  // material hints written by house_builder
  grass: { pattern: "noise", set: "leafy_grass", tile: 2, roughness: 1 },
  paving: { pattern: "tiles", set: "large_floor_tiles_02", tile: 1.6, roughness: 0.7 },
  gravel: { pattern: "stone", set: "gravel_floor", tile: 1.5, roughness: 0.95 },
  stone: { pattern: "stone", set: "large_sandstone_blocks", tile: 1.5, roughness: 0.85 },
  plaster: { pattern: "plaster", set: "grey_plaster_02", tile: 1.5, roughness: 0.9 },
  wood: { pattern: "wood", set: "fine_grained_wood", tile: 1, roughness: 0.55 },
  soil: { pattern: "noise", tile: 1, roughness: 1 },
  leaves: { pattern: "noise", tile: 0.5, roughness: 0.9 },
  bark: { pattern: "wood", tile: 0.5, roughness: 1 },
};

const patterns = new Map<Pattern, THREE.Texture | null>();
type TextureSet = { map: THREE.Texture | null; normalMap: THREE.Texture | null; roughnessMap: THREE.Texture | null; waiting: THREE.MeshStandardMaterial[] };
const sets = new Map<string, TextureSet>();
const pending = new Set<Promise<unknown>>();

function randomFrom(seed: number) {
  let value = seed;
  return () => ((value = (value * 16807) % 2147483647) / 2147483647);
}

function drawPattern(pattern: Pattern, ctx: CanvasRenderingContext2D, size: number) {
  const random = randomFrom(pattern.length * 97 + 13);
  const shade = (light: number) => `rgb(${light},${light},${light})`;
  ctx.fillStyle = shade(240);
  ctx.fillRect(0, 0, size, size);
  const speckle = (count: number, min: number, max: number, w = 1, h = 1) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = shade(Math.round(min + random() * (max - min)));
      ctx.fillRect(random() * size, random() * size, w, h);
    }
  };
  if (pattern === "plaster" || pattern === "noise") {
    speckle(pattern === "noise" ? 9000 : 6000, 205, 255, 2, 2);
  } else if (pattern === "stone") {
    speckle(7000, 190, 255, 2, 2);
  } else if (pattern === "tiles") {
    speckle(3000, 225, 255, 2, 2);
    ctx.fillStyle = shade(185); // grout lines: 2x2 tiles per texture
    for (const p of [0, size / 2]) {
      ctx.fillRect(p, 0, 2, size);
      ctx.fillRect(0, p, size, 2);
    }
  } else if (pattern === "wood") {
    for (let y = 0; y < size; y++) {
      const light = 210 + Math.round(25 * Math.sin(y * 0.35 + Math.sin(y * 0.05) * 3) + random() * 8);
      ctx.fillStyle = shade(Math.min(255, light));
      ctx.fillRect(0, y, size, 1);
    }
  } else if (pattern === "roofTiles") {
    const rows = 8;
    const rowHeight = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let x = (r % 2) * (size / 16); x < size; x += size / 8) {
        const gradient = ctx.createLinearGradient(0, r * rowHeight, 0, (r + 1) * rowHeight);
        gradient.addColorStop(0, shade(255));
        gradient.addColorStop(1, shade(175));
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, r * rowHeight, size / 8 - 2, rowHeight - 1);
      }
    }
  }
}

function repeating(texture: THREE.Texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function patternTexture(pattern: Pattern): THREE.Texture | null {
  if (patterns.has(pattern)) return patterns.get(pattern) ?? null;
  const size = 256;
  const canvas = typeof document === "undefined" ? null : document.createElement("canvas");
  const ctx = canvas?.getContext("2d") ?? null;
  let texture: THREE.Texture | null = null;
  if (canvas && ctx) {
    canvas.width = size;
    canvas.height = size;
    drawPattern(pattern, ctx, size);
    texture = repeating(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  patterns.set(pattern, texture);
  return texture;
}

/** Grayscale detail map from a color photo, scaled so its mean brightness is ~0.92 (keeps the part color). */
export function detailFromImage(image: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const mean = sum / (data.length / 4) || 1;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.min(255, Math.round(((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / mean) * 235));
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function track<T>(promise: Promise<T>): Promise<T> {
  pending.add(promise);
  void promise.finally(() => pending.delete(promise));
  return promise;
}

/** Load one Poly Haven set once; materials that asked for it get the maps when they arrive. */
function textureSet(name: string): TextureSet {
  const cached = sets.get(name);
  if (cached) return cached;
  const set: TextureSet = { map: null, normalMap: null, roughnessMap: null, waiting: [] };
  sets.set(name, set);
  if (typeof document === "undefined" || typeof Image === "undefined") return set;
  const loader = new THREE.TextureLoader();
  const load = (suffix: string) => track(loader.loadAsync(`${TEXTURE_BASE}${name}_${suffix}_1k.jpg`).catch(() => null));
  void track(Promise.all([load("diff"), load("nor"), load("rough")]).then(([diff, nor, rough]) => {
    const detail = diff?.image ? detailFromImage(diff.image as HTMLImageElement) : null;
    if (detail) {
      set.map = repeating(new THREE.CanvasTexture(detail));
      set.map.colorSpace = THREE.SRGBColorSpace;
    }
    set.normalMap = nor ? repeating(nor) : null;
    set.roughnessMap = rough ? repeating(rough) : null;
    for (const material of set.waiting.splice(0)) attachSet(material, set);
  }));
  return set;
}

function attachSet(material: THREE.MeshStandardMaterial, set: TextureSet) {
  if (set.map) material.map = set.map;
  if (set.normalMap) material.normalMap = set.normalMap;
  if (set.roughnessMap) material.roughnessMap = set.roughnessMap;
  material.needsUpdate = true;
}

/** Resolves when every texture requested so far has loaded (or failed); used before a still render. */
export async function texturesReady(): Promise<void> {
  while (pending.size) await Promise.all([...pending]);
}

/**
 * Box-projected UVs in meters (1 UV unit = `tile` meters) from positions and normals,
 * since house_builder writes no texture coordinates.
 */
export function addBoxUVs(geometry: THREE.BufferGeometry, tile: number) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  if (!position || !normal) return;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    // Project onto the plane the face lies in, so walls get (horizontal, height) and floors get (x, z).
    const [u, v] = ny >= nx && ny >= nz ? [x, z] : nx >= nz ? [z, y] : [x, y];
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/**
 * Give one part's mesh a material that suits its category or `material` hint (glass and water become glossy).
 * `tile` (meters per texture repeat) overrides the look's own, e.g. a sparser grass tile for the wide ground.
 */
export function applyRealisticLook(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial, category: string, hint?: string, tile?: number) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (category === "glass" || hint === "water") {
    material.transparent = true;
    material.opacity = hint === "water" ? 0.75 : 0.35;
    material.roughness = 0.05;
    material.metalness = 0;
    material.envMapIntensity = 1.2;
    material.depthWrite = false;
    return;
  }
  const look = (hint && LOOKS[hint]) || LOOKS[category];
  if (!look) return; // furniture keeps the library's own materials
  material.roughness = look.roughness;
  material.metalness = look.metalness ?? 0;
  const texture = patternTexture(look.pattern);
  const meters = tile ?? look.tile;
  if (texture) {
    addBoxUVs(mesh.geometry, meters);
    material.map = texture;
    material.needsUpdate = true;
  }
  if (!look.set) return;
  if (!texture) addBoxUVs(mesh.geometry, meters);
  const scale = look.normal ?? 1;
  material.normalScale = new THREE.Vector2(scale, scale);
  const set = textureSet(look.set);
  if (set.map || set.normalMap) attachSet(material, set);
  else set.waiting.push(material);
}
