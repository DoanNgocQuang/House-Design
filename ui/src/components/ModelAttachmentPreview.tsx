import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Camera, Download, Expand, Eye, EyeOff, Footprints, PanelRightClose, PanelRightOpen, RotateCw, Ruler, Shrink } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { IssueAttachment } from "@paperclipai/shared";
import { issuesApi } from "@/api/issues";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { queryKeys } from "@/lib/queryKeys";
import { applyRealisticLook, TEXTURE_BASE } from "@/lib/house-materials";
import { floorAt, nextFeet, resolveMove, STEP_UP } from "@/lib/house-walk";
import {
  applyPalette,
  buildPaletteComment,
  fitCameraDistance,
  floorsAbove,
  formatSize,
  paletteColor,
  parseLatestPalette,
  partName,
  PART_CATEGORY_LABELS,
  screenshotName,
  VIEW_DIRECTIONS,
  type HousePalette,
  type ViewName,
} from "@/lib/model-preview";

type Part = {
  id: string;
  name: string;
  category: string;
  material?: string;
  floor: number;
  order: number;
  object: THREE.Object3D;
  materials: { material: THREE.MeshStandardMaterial; original: THREE.Color }[];
};

type Scene = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scene: THREE.Scene;
  frame: number;
  /** Center and distance that frame the whole model; preset views orbit around it. */
  home: { center: THREE.Vector3; distance: number; bounds: THREE.Box3 } | null;
  /** Top of each floor's slab (meters), for walking at eye height. */
  floorLevels: Map<number, number>;
  walk: PointerLockControls;
  measure: THREE.Group;
  /** Draw one frame through the post-processing chain (ambient occlusion, tone mapping). */
  draw: () => void;
};

const EYE_HEIGHT = 1.6;
const ORBIT_FOV = 45;
const WALK_FOV = 75; // wide like human sight; 45 feels zoomed in when standing inside a room
const WALK_SPEED = 2.2; // m/s
const OUTDOOR_GROUND = -0.2; // the grass plane, just below the ground-floor slab
const BLOCKING = new Set(["wall", "glass", "fence", "furniture", "railing", "column"]); // doors stay walkable
const WALKABLE = new Set(["floor", "stairs", "garden"]);
const DOWN = new THREE.Vector3(0, -1, 0);
const SKY_TOP = "#9fc3e6";
const SKY_BOTTOM = "#c9d6e2"; // horizon haze; matches the HDR sky's horizon so the ground fades into it
const GRASS = ["#6f9a4b", "#7aa653", "#638c42", "#86b05c", "#5a8239", "#8fb563"];
const GROUND_SIZE = 400; // m
const GRASS_TILE = 4; // m per texture repeat
const GROUND_TILE = 6; // m per real grass photo repeat; smaller shows a stripe grid across the 400 m ground

/** Procedural grass: speckled greens with a few dry patches, tiled across the ground. */
function grassTexture(): THREE.Texture | null {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = GRASS[0];
  ctx.fillRect(0, 0, size, size);
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // fixed seed: same look every time
  for (let i = 0; i < 40; i++) { // soft darker/lighter patches
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = random() < 0.25 ? "#a7a46a" : GRASS[Math.floor(random() * GRASS.length)];
    ctx.beginPath();
    ctx.arc(random() * size, random() * size, 10 + random() * 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 9000; i++) { // blades
    ctx.fillStyle = GRASS[Math.floor(random() * GRASS.length)];
    ctx.fillRect(random() * size, random() * size, 1, 1 + random() * 2);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(GROUND_SIZE / GRASS_TILE, GROUND_SIZE / GRASS_TILE);
  texture.anisotropy = 8;
  return texture;
}

/** Soft vertical sky gradient, independent of the app theme so models read the same in light and dark mode. */
function skyTexture(): THREE.Texture | THREE.Color {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Color(SKY_BOTTOM);
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, SKY_TOP);
  gradient.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const EMPTY_PALETTE: HousePalette = { categories: {}, parts: {} };
const ASSEMBLE_MS = 8000;
const DROP_MS = 400;
const DROP_HEIGHT = 3;
const FLOOR_GAP = 2.5;

/** Resolve a CSS color token (any syntax, including oklch) to an sRGB THREE.Color via a 1x1 canvas. */
function tokenColor(variable: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !value) return new THREE.Color(0.5, 0.5, 0.5);
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function floorLabel(floor: number, topFloor: number) {
  return floor === topFloor ? "Mái" : `Tầng ${floor}`;
}

export default function ModelAttachmentPreview({ issueId, attachment, downloadUrl, headerAction }: {
  issueId: string;
  attachment: Pick<IssueAttachment, "id" | "originalFilename">;
  downloadUrl: string;
  /** Extra control at the end of the header row, e.g. a sheet's close button. */
  headerAction?: ReactNode;
}) {
  const fileName = attachment.originalFilename ?? "model.glb";
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const partsRef = useRef<Part[]>([]);
  const animationRef = useRef<{ assembleStart: number | null; explode: number; explodeTarget: number }>({
    assembleStart: null, explode: 0, explodeTarget: 0,
  });
  const [parts, setParts] = useState<Part[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applyToCategory, setApplyToCategory] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hiddenFloors, setHiddenFloors] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 768);
  const [spinning, setSpinning] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measured, setMeasured] = useState<{ points: number; distance: number | null }>({ points: 0, distance: null });
  const [walking, setWalking] = useState(false);
  const [walkFloor, setWalkFloor] = useState(1);
  const measuringRef = useRef(false);
  const walkKeysRef = useRef(new Set<string>());
  const walkFeetRef = useRef(0);
  const walkFloorRef = useRef(1);
  const [palette, setPalette] = useState<HousePalette>(EMPTY_PALETTE);
  const [exploded, setExploded] = useState(false);
  const queryClient = useQueryClient();

  const comments = useQuery({
    queryKey: queryKeys.issues.comments(issueId),
    queryFn: () => issuesApi.listComments(issueId, { order: "desc", limit: 100 }),
  });
  const savedPalette = useMemo(
    () => (comments.data ? parseLatestPalette(comments.data, fileName) : null),
    [comments.data, fileName],
  );
  const save = useMutation({
    mutationFn: () => issuesApi.addComment(issueId, buildPaletteComment(fileName, palette)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) }),
  });

  const topFloor = useMemo(() => parts.reduce((max, part) => Math.max(max, part.floor), 0), [parts]);
  const selected = parts.find((part) => part.id === selectedId) ?? null;
  const categories = useMemo(
    () => Object.keys(PART_CATEGORY_LABELS).filter((category) => parts.some((part) => part.category === category)),
    [parts],
  );
  const floors = useMemo(() => {
    const byFloor = new Map<number, Part[]>();
    for (const part of parts) byFloor.set(part.floor, [...(byFloor.get(part.floor) ?? []), part]);
    return [...byFloor.entries()].sort(([a], [b]) => a - b);
  }, [parts]);

  // Load the model and build the scene once per attachment.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = new AbortController();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85; // the HDR sky adds its own daylight; higher washes walls and roof out
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = skyTexture();
    const grass = grassTexture();
    const groundMaterial = new THREE.MeshStandardMaterial({ map: grass, color: grass ? "#ffffff" : GRASS[0], roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2; // below the ground-floor slab so it never fights with it
    groundMaterial.color.set("#4a7232");
    applyRealisticLook(ground, groundMaterial, "garden", "grass", GROUND_TILE); // real grass photo once loaded
    scene.add(ground);
    ground.receiveShadow = true;
    const hemisphere = new THREE.HemisphereLight(0xcfe3f5, 0x6f8a55, 1.1);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.3);
    sun.position.set(8, 20, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    // Soft reflections for glass and glossy floors.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();
    // Real sky (CC0 HDR): lights the house with daylight and shows clouds; the studio room light stays as fallback.
    let sky: THREE.Texture | null = null;
    new HDRLoader().loadAsync(`${TEXTURE_BASE}sky_1k.hdr`).then((texture) => {
      if (controller.signal.aborted) { texture.dispose(); return; }
      texture.mapping = THREE.EquirectangularReflectionMapping;
      sky = texture;
      scene.background = texture;
      scene.environment = texture;
      scene.environmentIntensity = 0.9;
      hemisphere.intensity = 0.25;
    }).catch(() => undefined);
    const camera = new THREE.PerspectiveCamera(ORBIT_FOV, 1, 0.05, 500);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const walk = new PointerLockControls(camera, renderer.domElement);
    const measure = new THREE.Group();
    scene.add(measure);
    // Ambient occlusion darkens corners and contact edges, the main cue that makes boxes read as built walls.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const occlusion = new GTAOPass(scene, camera, 1, 1);
    occlusion.blendIntensity = 0.85;
    composer.addPass(occlusion);
    composer.addPass(new OutputPass());
    const draw = () => composer.render();
    const state: Scene = { renderer, camera, controls, scene, frame: 0, home: null, floorLevels: new Map(), walk, measure, draw };
    walk.addEventListener("unlock", () => setWalking(false));
    let last = performance.now();
    sceneRef.current = state;

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(width, height);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const anim = animationRef.current;
      anim.explode += (anim.explodeTarget - anim.explode) * 0.15;
      const list = partsRef.current;
      const step = list.length ? Math.max(20, ASSEMBLE_MS / list.length) : 0;
      const top = topFloorOf(list);
      list.forEach((part, index) => {
        let drop = 0;
        let shown = true;
        if (anim.assembleStart !== null) {
          const elapsed = now - anim.assembleStart - index * step;
          shown = elapsed >= 0;
          const progress = Math.min(1, Math.max(0, elapsed / DROP_MS));
          drop = DROP_HEIGHT * (1 - progress) * (1 - progress);
        }
        const lift = part.floor === top ? (top - 1) * FLOOR_GAP + 2 : (part.floor - 1) * FLOOR_GAP;
        part.object.position.y = drop + lift * anim.explode;
        part.object.userData.assembling = !shown;
        part.object.visible = shown && part.object.userData.categoryVisible !== false && part.object.userData.floorVisible !== false;
      });
      if (walk.isLocked) {
        const keys = walkKeysRef.current;
        const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
        const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
        const speed = WALK_SPEED * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 2 : 1) * dt;
        const look = camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize();
        const move = { x: look.x * forward - look.z * strafe, z: look.z * forward + look.x * strafe };
        const length = Math.hypot(move.x, move.z);
        const delta = length ? { x: (move.x / length) * speed, z: (move.z / length) * speed } : { x: 0, z: 0 };
        const feet = walkFeetRef.current;
        const visible = partsRef.current.filter((part) => part.object.visible);
        const walls = visible.filter((part) => BLOCKING.has(part.category)).map((part) => part.object);
        const surfaces = visible.filter((part) => WALKABLE.has(part.category)).map((part) => part.object);
        const ray = new THREE.Raycaster();
        const blocked = (from: { x: number; z: number }, direction: { x: number; z: number }, distance: number) =>
          [0.3, 0.87, 1.2].some((height) => { // 0.87 m catches railing handrails between their bars
            ray.set(new THREE.Vector3(from.x, feet + height, from.z), new THREE.Vector3(direction.x, 0, direction.z));
            ray.far = distance;
            return ray.intersectObjects(walls, true).length > 0;
          });
        const next = resolveMove({ x: camera.position.x, z: camera.position.z }, delta, blocked);
        ray.set(new THREE.Vector3(next.x, feet + STEP_UP, next.z), DOWN);
        ray.far = 100;
        const below = ray.intersectObjects(surfaces, true)[0];
        const newFeet = nextFeet(feet, below ? below.point.y : null, OUTDOOR_GROUND, dt);
        walkFeetRef.current = newFeet;
        camera.position.set(next.x, newFeet + EYE_HEIGHT, next.z);
        const floor = floorAt(newFeet, state.floorLevels);
        if (floor !== walkFloorRef.current) {
          walkFloorRef.current = floor;
          setWalkFloor(floor);
        }
      } else {
        controls.update();
      }
      draw();
      state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);

    fetch(`/api/attachments/${encodeURIComponent(attachment.id)}/content`, { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const total = Number(response.headers.get("content-length")) || 0;
        if (!response.body || !total) return response.arrayBuffer();
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          setProgress(Math.min(100, Math.round((received / total) * 100)));
        }
        return new Blob(chunks).arrayBuffer();
      })
      .then((buffer) => new GLTFLoader().parseAsync(buffer, ""))
      .then((gltf) => {
        if (controller.signal.aborted) return;
        const loaded: Part[] = [];
        gltf.scene.traverse((object) => {
          const extras = object.userData as { partId?: string; category?: string; floor?: number; order?: number; material?: string };
          if (!extras.partId) return;
          const materials: Part["materials"] = [];
          object.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            const cloned = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((material) => {
              const copy = (material as THREE.MeshStandardMaterial).clone();
              applyRealisticLook(mesh, copy, extras.category ?? "wall", extras.material);
              materials.push({ material: copy, original: copy.color.clone() });
              return copy;
            });
            mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
          });
          loaded.push({
            id: extras.partId, name: partName(object.userData, object.name), category: extras.category ?? "wall",
            material: extras.material, floor: extras.floor ?? 1, order: extras.order ?? 0, object, materials,
          });
        });
        loaded.sort((a, b) => a.order - b.order || a.floor - b.floor);
        scene.add(gltf.scene);
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const center = bounds.getCenter(new THREE.Vector3());
        const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius || 1;
        const distance = fitCameraDistance(radius, camera.fov, camera.aspect);
        camera.position.copy(center).add(new THREE.Vector3(0.55, 0.45, 0.7).normalize().multiplyScalar(distance));
        camera.near = distance / 100;
        camera.far = distance * 20;
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        state.home = { center, distance, bounds };
        sun.target.position.copy(center);
        sun.position.copy(center).add(new THREE.Vector3(0.45, 1, 0.6).normalize().multiplyScalar(radius * 2.5));
        Object.assign(sun.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, near: 0.5, far: radius * 5 });
        sun.shadow.camera.updateProjectionMatrix();
        // Haze the far ground into the sky so the horizon has no hard edge; starts well behind the house.
        scene.fog = new THREE.Fog(SKY_BOTTOM, distance * 2.5, distance * 7);
        occlusion.setSceneClipBox(bounds);
        for (const part of loaded) {
          if (part.category !== "floor") continue;
          const top = new THREE.Box3().setFromObject(part.object).max.y;
          state.floorLevels.set(part.floor, Math.max(state.floorLevels.get(part.floor) ?? -Infinity, top));
        }
        partsRef.current = loaded;
        setParts(loaded);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      controller.abort();
      cancelAnimationFrame(state.frame);
      walk.unlock();
      walk.dispose();
      environment.dispose();
      sky?.dispose();
      composer.dispose();
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      partsRef.current = [];
    };
  }, [attachment.id]);

  // Colors: explicit part color > category color > original material color.
  useEffect(() => {
    for (const part of parts) {
      const hex = paletteColor(palette, part);
      for (const { material, original } of part.materials) {
        if (hex) material.color.set(hex);
        else material.color.copy(original);
      }
    }
  }, [parts, palette]);

  // Selection highlight and category visibility.
  useEffect(() => {
    const highlight = tokenColor("--primary");
    for (const part of parts) {
      for (const { material } of part.materials) {
        material.emissive.copy(part.id === selectedId ? highlight : new THREE.Color(0, 0, 0));
        material.emissiveIntensity = part.id === selectedId ? 0.25 : 0;
      }
      part.object.userData.categoryVisible = !hidden.has(part.category);
      part.object.userData.floorVisible = !hiddenFloors.has(part.floor);
    }
  }, [parts, selectedId, hidden, hiddenFloors]);

  // Click to select (ignore drags used to rotate the camera).
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const canvas = state.renderer.domElement;
    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
    const onUp = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 4) return;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, state.camera);
      const hit = raycaster.intersectObjects(parts.map((part) => part.object).filter((object) => object.visible), true)[0];
      if (measuringRef.current) {
        if (hit) addMeasurePoint(state, hit.point);
        return;
      }
      let object: THREE.Object3D | null = hit?.object ?? null;
      while (object && !object.userData.partId) object = object.parent;
      setSelectedId((object?.userData.partId as string | undefined) ?? null);
    };
    const addMeasurePoint = (current: Scene, point: THREE.Vector3) => {
      const group = current.measure;
      if (group.userData.points?.length === 2) group.clear();
      const points: THREE.Vector3[] = [...(group.userData.points?.length === 2 ? [] : group.userData.points ?? []), point.clone()];
      group.userData.points = points;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: "#e8590c", depthTest: false }));
      dot.position.copy(point);
      dot.renderOrder = 10;
      group.add(dot);
      if (points.length === 2) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: "#e8590c", depthTest: false }));
        line.renderOrder = 10;
        group.add(line);
      }
      setMeasured({ points: points.length, distance: points.length === 2 ? points[0].distanceTo(points[1]) : null });
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [parts]);

  useEffect(() => { animationRef.current.explodeTarget = exploded ? 1 : 0; }, [exploded]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    state.controls.autoRotate = spinning && !walking;
    state.controls.enabled = !walking;
  }, [spinning, walking, parts]);

  useEffect(() => {
    measuringRef.current = measuring;
    const state = sceneRef.current;
    if (!measuring && state) {
      state.measure.clear();
      state.measure.userData.points = [];
      setMeasured({ points: 0, distance: null });
    }
  }, [measuring]);

  // Walk mode: WASD/arrow keys move, mouse looks around, Q/E change floor, Esc leaves.
  useEffect(() => {
    if (!walking) return;
    const keys = walkKeysRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.type === "keydown") keys.add(event.code); else keys.delete(event.code);
      if (event.type === "keydown" && (event.code === "KeyQ" || event.code === "KeyE")) {
        const levels = sceneRef.current?.floorLevels ?? new Map<number, number>();
        const floors = [...levels.keys()].sort((a, b) => a - b);
        const index = floors.indexOf(walkFloorRef.current) + (event.code === "KeyE" ? 1 : -1);
        const target = floors[Math.max(0, Math.min(floors.length - 1, index))];
        if (target !== undefined) walkFeetRef.current = levels.get(target) ?? walkFeetRef.current;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      keys.clear();
    };
  }, [walking]);

  const startWalk = () => {
    const state = sceneRef.current;
    if (!state?.home) return;
    setExploded(false);
    setMeasuring(false);
    setSpinning(false);
    // Start in front of the ground floor (the house front faces +Z), looking into the house.
    const groundFloor = new THREE.Box3();
    for (const part of parts) if (part.category === "floor" && part.floor === 1) groundFloor.expandByObject(part.object);
    const house = groundFloor.isEmpty() ? state.home.bounds : groundFloor;
    const front = house.getCenter(new THREE.Vector3());
    walkFeetRef.current = OUTDOOR_GROUND;
    walkFloorRef.current = 1;
    state.camera.position.set(front.x, OUTDOOR_GROUND + EYE_HEIGHT, house.max.z + 1.2);
    state.camera.lookAt(front.x, OUTDOOR_GROUND + EYE_HEIGHT, front.z);
    state.camera.near = 0.05;
    state.camera.fov = WALK_FOV;
    state.camera.updateProjectionMatrix();
    setWalkFloor(1);
    setWalking(true);
    state.walk.lock();
  };

  // Leaving walk mode returns to the overview camera.
  useEffect(() => {
    const state = sceneRef.current;
    if (walking || !state?.home) return;
    state.camera.near = state.home.distance / 100;
    state.camera.fov = ORBIT_FOV;
    state.camera.updateProjectionMatrix();
    setView("iso");
  }, [walking]);

  const assemble = useCallback(() => {
    animationRef.current.assembleStart = prefersReducedMotion() ? null : performance.now();
  }, []);

  const setView = (name: ViewName) => {
    const state = sceneRef.current;
    if (!state?.home) return;
    const [x, y, z] = VIEW_DIRECTIONS[name].vector;
    state.camera.position.copy(state.home.center).add(new THREE.Vector3(x, y, z).normalize().multiplyScalar(state.home.distance));
    state.controls.target.copy(state.home.center);
    state.controls.update();
  };
  const takeScreenshot = () => {
    const state = sceneRef.current;
    if (!state) return;
    state.draw(); // read right after drawing, so no preserveDrawingBuffer is needed
    const link = document.createElement("a");
    link.href = state.renderer.domElement.toDataURL("image/png");
    link.download = screenshotName(fileName);
    link.click();
  };
  const floorNumbers = floors.map(([floor]) => floor);
  const toggleFloor = (floor: number) => setHiddenFloors((current) => {
    const next = new Set(current);
    if (next.has(floor)) next.delete(floor); else next.add(floor);
    return next;
  });

  const originalHex = (part: Part | undefined) => `#${(part?.materials[0]?.original ?? new THREE.Color()).getHexString()}`;
  const colorOf = (part: Part) => paletteColor(palette, part) ?? originalHex(part);
  const categoryColor = (category: string) =>
    palette.categories[category] ?? originalHex(parts.find((part) => part.category === category));
  const setColor = (part: Part, hex: string) => {
    setPalette((current) => applyToCategory
      ? { categories: { ...current.categories, [part.category]: hex }, parts: Object.fromEntries(Object.entries(current.parts).filter(([id]) => parts.find((p) => p.id === id)?.category !== part.category)) }
      : { ...current, parts: { ...current.parts, [part.id]: hex } });
    save.reset();
  };
  const toggleCategory = (category: string) => setHidden((current) => {
    const next = new Set(current);
    if (next.has(category)) next.delete(category); else next.add(category);
    return next;
  });
  const changed = Object.keys(palette.categories).length + Object.keys(palette.parts).length > 0;

  const iconTool = (label: string, icon: ReactNode, onClick: () => void, options: { active?: boolean; disabled?: boolean } = {}) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon-sm" variant={options.active ? "default" : "ghost"} onClick={onClick} disabled={options.disabled}
          aria-label={label} aria-pressed={options.active}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
  const colorDot = (value: string, label: string, onChange: (hex: string) => void) => (
    <label className="relative inline-flex size-6 shrink-0 cursor-pointer rounded-full border border-border shadow-xs focus-within:ring-2 focus-within:ring-ring"
      style={{ backgroundColor: value }} title={value}>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}
        className="absolute inset-0 size-full cursor-pointer opacity-0" />
    </label>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-background text-foreground">
      <header className="flex min-w-0 items-center gap-3 border-b border-border bg-card px-4 py-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold" title={fileName}>{fileName}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {parts.length ? `${parts.length} bộ phận · ${floorNumbers.length} tầng` : "Đang tải mô hình…"}
          </p>
        </div>
        <Button size="sm" onClick={() => save.mutate()} disabled={!changed || save.isPending}>
          {save.isPending ? "Đang lưu…" : "Lưu bảng màu"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon-sm">
              <a href={downloadUrl} download aria-label={`Tải ${fileName}`}><Download aria-hidden /></a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tải file .glb</TooltipContent>
        </Tooltip>
        {iconTool(panelOpen ? "Thu gọn bảng bên" : "Mở bảng bên",
          panelOpen ? <PanelRightClose aria-hidden /> : <PanelRightOpen aria-hidden />, () => setPanelOpen((value) => !value))}
        {headerAction}
      </header>
      {save.isSuccess ? <p className="border-b border-border bg-muted px-4 py-1 text-xs text-muted-foreground" role="status">Đã lưu bảng màu vào task.</p> : null}
      {save.isError ? (
        <p className="flex items-center gap-2 border-b border-border bg-muted px-4 py-1 text-xs text-destructive" role="alert">
          Không lưu được bảng màu: {save.error instanceof Error ? save.error.message : String(save.error)}
          <Button size="xs" variant="outline" onClick={() => save.mutate()}>Thử lại</Button>
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <div ref={hostRef} className="relative min-h-0 min-w-0 flex-1" aria-label={`Mô hình 3D ${fileName}`}>
          {loadError ? <p className="absolute inset-0 p-4 text-sm text-destructive" role="alert">Không mở được mô hình 3D: {loadError}. Tải file về để xem.</p>
            : !parts.length ? <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/90 px-4 py-2 text-sm text-muted-foreground shadow" role="status">
              Đang tải mô hình…{progress !== null && progress < 100 ? ` ${progress}%` : ""}
            </p> : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
            {measuring ? (
              <p className="rounded-full bg-background/90 px-3 py-1 text-sm shadow" role="status">
                {measured.distance !== null ? `Khoảng cách: ${measured.distance.toFixed(2)} m. Bấm điểm mới để đo lại.`
                  : measured.points === 1 ? "Bấm điểm thứ hai." : "Bấm điểm thứ nhất trên mô hình."}
              </p>
            ) : null}
            {walking ? (
              <p className="max-w-2xl rounded-lg bg-background/90 px-3 py-2 text-center text-sm shadow" role="status">
                Tầng {walkFloor} · W A S D để đi, chuột để nhìn, Shift chạy nhanh. Đi qua cửa, bước lên cầu thang để lên tầng (Q / E để nhảy tầng). Esc để thoát.
              </p>
            ) : null}
            {parts.length && !walking ? (
              <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-background/90 px-2 py-1 shadow-lg backdrop-blur"
                role="toolbar" aria-label="Công cụ xem mô hình">
                <div className="flex items-center gap-1" role="group" aria-label="Góc nhìn">
                  {(Object.keys(VIEW_DIRECTIONS) as ViewName[]).map((name) => (
                    <Button key={name} size="xs" variant="ghost" className="rounded-full" onClick={() => setView(name)}>{VIEW_DIRECTIONS[name].label}</Button>
                  ))}
                </div>
                <Separator orientation="vertical" className="mx-1 h-5" />
                {iconTool("Tự xoay quanh ngôi nhà", <RotateCw aria-hidden />, () => setSpinning((value) => !value), { active: spinning })}
                {iconTool("Đo khoảng cách: bấm hai điểm trên mô hình", <Ruler aria-hidden />, () => setMeasuring((value) => !value), { active: measuring })}
                {iconTool("Đi dạo bên trong nhà ở tầm mắt", <Footprints aria-hidden />, startWalk)}
                <Separator orientation="vertical" className="mx-1 h-5" />
                {iconTool("Lắp ráp: dựng lại từng bộ phận", <Boxes aria-hidden />, assemble)}
                {iconTool(exploded ? "Ghép các tầng lại" : "Tách rời các tầng", exploded ? <Shrink aria-hidden /> : <Expand aria-hidden />,
                  () => setExploded((value) => !value), { active: exploded })}
                <Separator orientation="vertical" className="mx-1 h-5" />
                {iconTool("Chụp ảnh góc đang xem", <Camera aria-hidden />, takeScreenshot)}
              </div>
            ) : null}
          </div>
        </div>
        {panelOpen ? <aside className="flex w-72 max-w-[45%] shrink-0 flex-col border-l border-border bg-card text-sm" aria-label="Bảng điều khiển mô hình">
          <Tabs defaultValue="mau" className="min-h-0 flex-1 gap-0">
            <TabsList variant="line" className="w-full shrink-0 border-b border-border px-2">
              <TabsTrigger value="mau">Màu sắc</TabsTrigger>
              {floorNumbers.length > 1 ? <TabsTrigger value="tang">Tầng</TabsTrigger> : null}
              <TabsTrigger value="bo-phan">Bộ phận</TabsTrigger>
            </TabsList>
            <TabsContent value="mau" className="flex min-h-0 flex-col gap-4 overflow-auto p-4">
              {selected ? (
                <section className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
                  <h3 className="font-medium">{selected.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatSize(new THREE.Box3().setFromObject(selected.object).getSize(new THREE.Vector3()), selected.category)}</p>
                  <div className="flex items-center gap-2">
                    {colorDot(colorOf(selected), `Màu của ${selected.name}`, (hex) => setColor(selected, hex))}
                    <span className="font-mono text-xs text-muted-foreground">{colorOf(selected)}</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox checked={applyToCategory} onCheckedChange={(value) => setApplyToCategory(value === true)} />
                    Áp dụng cho mọi {PART_CATEGORY_LABELS[selected.category]?.toLowerCase() ?? selected.category}
                  </label>
                </section>
              ) : <p className="text-xs text-muted-foreground">Bấm vào một bộ phận trên mô hình hoặc ở tab Bộ phận để chọn và đổi màu riêng.</p>}
              <section className="flex flex-col gap-1">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">Loại bộ phận</h3>
                {categories.map((category) => (
                  <div key={category} className="flex items-center gap-3 rounded-md px-1 py-1 hover:bg-accent/50">
                    {colorDot(categoryColor(category), `Màu cho mọi ${PART_CATEGORY_LABELS[category]}`, (hex) => {
                      setPalette((current) => ({ ...current, categories: { ...current.categories, [category]: hex } }));
                      save.reset();
                    })}
                    <span className={`flex-1 ${hidden.has(category) ? "text-muted-foreground line-through" : ""}`}>{PART_CATEGORY_LABELS[category]}</span>
                    <Button size="icon-xs" variant="ghost" onClick={() => toggleCategory(category)} aria-label={hidden.has(category) ? `Hiện ${PART_CATEGORY_LABELS[category]}` : `Ẩn ${PART_CATEGORY_LABELS[category]}`}>
                      {hidden.has(category) ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                    </Button>
                  </div>
                ))}
              </section>
              {savedPalette ? (
                <Button size="sm" variant="outline" onClick={() => setPalette((current) => applyPalette(current, savedPalette, new Set(parts.map((part) => part.id))))}>
                  Áp dụng bảng màu đã lưu
                </Button>
              ) : null}
            </TabsContent>
            {floorNumbers.length > 1 ? (
              <TabsContent value="tang" className="flex min-h-0 flex-col gap-1 overflow-auto p-4">
                {floorNumbers.map((floor) => (
                  <div key={floor} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50">
                    <span className={`flex-1 ${hiddenFloors.has(floor) ? "text-muted-foreground line-through" : ""}`}>{floorLabel(floor, topFloor)}</span>
                    {floor !== topFloor ? (
                      <Button size="xs" variant="ghost" onClick={() => setHiddenFloors(floorsAbove(floorNumbers, floor))}
                        title={`Ẩn các tầng phía trên để nhìn vào ${floorLabel(floor, topFloor).toLowerCase()}`}>Xem trong</Button>
                    ) : null}
                    <Button size="icon-xs" variant="ghost" onClick={() => toggleFloor(floor)}
                      aria-label={hiddenFloors.has(floor) ? `Hiện ${floorLabel(floor, topFloor)}` : `Ẩn ${floorLabel(floor, topFloor)}`}>
                      {hiddenFloors.has(floor) ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                    </Button>
                  </div>
                ))}
                {hiddenFloors.size ? <Button size="sm" variant="outline" className="mt-2" onClick={() => setHiddenFloors(new Set())}>Hiện tất cả tầng</Button> : null}
              </TabsContent>
            ) : null}
            <TabsContent value="bo-phan" className="flex min-h-0 flex-col gap-1 overflow-auto p-4">
              {floors.map(([floor, floorParts]) => (
                <details key={floor} open={floor === 1}>
                  <summary className="cursor-pointer rounded-md px-1 py-1 font-medium hover:bg-accent/50">{floorLabel(floor, topFloor)} ({floorParts.length})</summary>
                  <ul className="flex flex-col">
                    {floorParts.map((part) => (
                      <li key={part.id}>
                        <button type="button" onClick={() => setSelectedId(part.id)}
                          className={`w-full truncate rounded-md px-2 py-1 text-left text-xs ${part.id === selectedId ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                          title={part.name}>
                          {part.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </TabsContent>
          </Tabs>
        </aside> : null}
      </div>
    </div>
  );
}

function topFloorOf(list: Part[]) {
  return list.reduce((max, part) => Math.max(max, part.floor), 0);
}
