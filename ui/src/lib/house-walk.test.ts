import { describe, expect, it } from "vitest";
import { floorAt, nextFeet, resolveMove, STEP_UP } from "./house-walk";

// A wall along x = 1: anything moving in +x from x < 1 is blocked once it would come within reach.
const wallAtX1 = (from: { x: number }, direction: { x: number }, distance: number) =>
  direction.x > 0 && from.x + direction.x * distance >= 1;

describe("resolveMove", () => {
  it("moves freely when nothing is in the way", () => {
    expect(resolveMove({ x: 0, z: 0 }, { x: 0, z: -0.5 }, wallAtX1)).toEqual({ x: 0, z: -0.5 });
  });

  it("slides along a wall instead of walking through it", () => {
    expect(resolveMove({ x: 0.6, z: 0 }, { x: 0.3, z: -0.3 }, wallAtX1)).toEqual({ x: 0.6, z: -0.3 });
  });

  it("stays put when pushing straight into a wall", () => {
    expect(resolveMove({ x: 0.6, z: 0 }, { x: 0.3, z: 0 }, wallAtX1)).toEqual({ x: 0.6, z: 0 });
  });
});

describe("nextFeet", () => {
  it("climbs a stair step at once and falls gradually", () => {
    expect(nextFeet(0, 0.17, 0, 0.016)).toBe(0.17);
    expect(nextFeet(3.4, 0, 0, 0.1)).toBeCloseTo(2.8);
    expect(nextFeet(3.4, null, -0.2, 10)).toBe(-0.2);
  });

  it("has a step limit above a single stair riser", () => {
    expect(STEP_UP).toBeGreaterThan(0.17);
  });
});

describe("floorAt", () => {
  it("names the floor whose slab is just below the feet", () => {
    const levels = new Map([[1, 0], [2, 3.4], [3, 6.8]]);
    expect(floorAt(0, levels)).toBe(1);
    expect(floorAt(2, levels)).toBe(1);
    expect(floorAt(3.4, levels)).toBe(2);
  });
});
