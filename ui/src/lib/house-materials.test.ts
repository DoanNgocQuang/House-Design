import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { addBoxUVs, applyRealisticLook } from "./house-materials";

describe("addBoxUVs", () => {
  it("maps floors by plan position and walls by width and height, in meters per tile", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([2, 0, -4, 3, 2.4, 0]), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 0, 1]), 3));
    addBoxUVs(geometry, 2);
    const uv = geometry.getAttribute("uv");
    expect([uv.getX(0), uv.getY(0)]).toEqual([1, -2]); // floor vertex: (x, z) / 2
    expect(uv.getX(1)).toBeCloseTo(1.5); // front wall vertex: (x, y) / 2
    expect(uv.getY(1)).toBeCloseTo(1.2);
  });
});

describe("applyRealisticLook", () => {
  it("gives railings a metallic finish and keeps unknown categories (furniture) untouched", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const railing = new THREE.MeshStandardMaterial();
    applyRealisticLook(new THREE.Mesh(geometry, railing), railing, "railing");
    expect(railing.metalness).toBeGreaterThan(0.3);
    const furniture = new THREE.MeshStandardMaterial({ roughness: 0.42 });
    applyRealisticLook(new THREE.Mesh(geometry, furniture), furniture, "furniture");
    expect(furniture.roughness).toBe(0.42);
  });

  it("lets the caller widen the texture tile (the big ground plane)", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([12, 0, 0]), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array([0, 1, 0]), 3));
    const material = new THREE.MeshStandardMaterial();
    applyRealisticLook(new THREE.Mesh(geometry, material), material, "garden", "grass", 6);
    expect(geometry.getAttribute("uv").getX(0)).toBeCloseTo(2); // 12 m / 6 m per tile
  });
});
