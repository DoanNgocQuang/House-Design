/**
 * Still render of a house_builder .glb with the same materials and lights as the in-app viewer.
 * Loaded by render.mjs in headless Edge: index.html?model=<file>&view=<front|back|top>.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { applyRealisticLook, TEXTURE_BASE, texturesReady } from "../../src/lib/house-materials";

const params = new URLSearchParams(location.search);
const width = Number(params.get("w") ?? 1280);
const height = Number(params.get("h") ?? 860);
const view = params.get("view") ?? "front";

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(width, height, false);
// Slightly taller than the viewport: headless screenshots can be a few pixels taller than innerHeight.
Object.assign(renderer.domElement.style, { width: "100vw", height: "calc(100vh + 80px)", display: "block" });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const sky = document.createElement("canvas");
sky.width = 2;
sky.height = 256;
const skyCtx = sky.getContext("2d")!;
const gradient = skyCtx.createLinearGradient(0, 0, 0, 256);
gradient.addColorStop(0, "#9fc3e6");
gradient.addColorStop(1, "#eef3f7");
skyCtx.fillStyle = gradient;
skyCtx.fillRect(0, 0, 2, 256);
const skyTexture = new THREE.CanvasTexture(sky);
skyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTexture;

const groundMaterial = new THREE.MeshStandardMaterial({ color: "#4a7232", roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMaterial);
applyRealisticLook(ground, groundMaterial, "garden", "grass", 6);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
scene.add(ground);
scene.add(new THREE.HemisphereLight(0xcfe3f5, 0x6f8a55, 0.25));
const sun = new THREE.DirectionalLight(0xfff4e0, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(35, width / height, 0.05, 1000);

async function main() {
  const sky = await new HDRLoader().loadAsync(`${TEXTURE_BASE}sky_1k.hdr`).catch(() => null);
  if (sky) {
    sky.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = sky;
    scene.environment = sky;
    scene.environmentIntensity = 0.9;
  }
  const buffer = await (await fetch(params.get("model") ?? "model.glb")).arrayBuffer();
  const gltf = await new GLTFLoader().parseAsync(buffer, "");
  gltf.scene.traverse((object) => {
    const { category, material } = object.userData as { category?: string; material?: string };
    if (!category) return;
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const copy = (mesh.material as THREE.MeshStandardMaterial).clone();
      applyRealisticLook(mesh, copy, category, material);
      mesh.material = copy;
    });
  });
  scene.add(gltf.scene);
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius || 1;
  // glTF: the street (front, y = 0 on the plan) faces +Z; the house runs toward -Z.
  const direction = {
    front: new THREE.Vector3(-0.6, 0.3, 1),
    back: new THREE.Vector3(0.6, 0.3, -1),
    top: new THREE.Vector3(-0.35, 1.4, 0.75),
  }[view] ?? new THREE.Vector3(-0.6, 0.3, 1);
  const size = bounds.getSize(new THREE.Vector3());
  // Tall, narrow houses need the height to fit too, not just the bounding sphere.
  const fit = Math.max(radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.74,
    size.y / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.95);
  camera.position.copy(center).addScaledVector(direction.normalize(), fit);
  camera.lookAt(center.x, center.y * (size.y > radius ? 0.95 : 0.7), center.z);
  sun.position.set(center.x - radius * 1.2, radius * 2.5, center.z + radius * 1.6);
  sun.target.position.copy(center);
  Object.assign(sun.shadow.camera, { left: -radius * 1.3, right: radius * 1.3, top: radius * 1.3, bottom: -radius * 1.3, near: 0.5, far: radius * 8 });
  sun.shadow.camera.updateProjectionMatrix();
  await texturesReady();
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  const occlusion = new GTAOPass(scene, camera, width, height);
  occlusion.blendIntensity = 0.85;
  occlusion.setSceneClipBox(bounds);
  composer.addPass(occlusion);
  composer.addPass(new OutputPass());
  composer.render();
  document.title = "rendered";
}

main().catch((error) => {
  document.title = "error";
  document.body.textContent = String(error);
});
