/** Walking physics for the 3D house viewer, kept free of three.js so it can be unit tested. */

export type Vec2 = { x: number; z: number };

/** Highest step (m) a walker climbs without help; stair risers are 0.17 m. */
export const STEP_UP = 0.45;
/** Distance (m) kept between the walker and a wall. */
export const BODY_RADIUS = 0.3;
const FALL_SPEED = 6; // m/s

/**
 * Move by `delta` unless a wall is in the way; slide along the wall on the free axis instead of stopping dead.
 * `blocked(from, direction, distance)` says whether something stands within `distance` along `direction`.
 */
export function resolveMove(position: Vec2, delta: Vec2, blocked: (from: Vec2, direction: Vec2, distance: number) => boolean): Vec2 {
  const tryMove = (d: Vec2): Vec2 | null => {
    const length = Math.hypot(d.x, d.z);
    if (length < 1e-6) return null;
    const direction = { x: d.x / length, z: d.z / length };
    return blocked(position, direction, length + BODY_RADIUS) ? null : { x: position.x + d.x, z: position.z + d.z };
  };
  return tryMove(delta) ?? tryMove({ x: delta.x, z: 0 }) ?? tryMove({ x: 0, z: delta.z }) ?? position;
}

/**
 * New foot height given the surface under the walker (`ground`, or null when there is none).
 * Steps up instantly (stairs feel natural), falls smoothly, and treats "nothing below" as the outdoor ground.
 */
export function nextFeet(feet: number, ground: number | null, outdoorGround: number, dt: number): number {
  const target = ground ?? outdoorGround;
  if (target >= feet) return target;
  return Math.max(target, feet - FALL_SPEED * dt);
}

/** The floor whose slab top is closest below the walker's feet (for the "Tầng N" hint). */
export function floorAt(feet: number, levels: Map<number, number>): number {
  let best = 1;
  let bestLevel = -Infinity;
  for (const [floor, level] of levels) {
    if (level <= feet + 0.1 && level > bestLevel) {
      best = floor;
      bestLevel = level;
    }
  }
  return best;
}
