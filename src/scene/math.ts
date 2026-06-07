// Tiny math toolkit for the canvas scene. No dependencies — deterministic
// randomness (seeded) so the starfield and treeline look the same every frame
// without storing every value, and the usual easing/lerp helpers.

export const TAU = Math.PI * 2;

export const clamp = (x: number, lo: number, hi: number) =>
  x < lo ? lo : x > hi ? hi : x;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 below `edge0`, 1 above `edge1`, smooth Hermite in between. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Mulberry32 — a compact, fast, decent-quality seeded PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a function giving the next random in [min, max). */
export function ranger(rng: () => number) {
  return (min: number, max: number) => min + rng() * (max - min);
}

/** Compose an `rgba()` string. */
export const rgba = (r: number, g: number, b: number, a: number) =>
  `rgba(${r | 0},${g | 0},${b | 0},${a})`;

/**
 * Fire color ramp: life goes 1 (just born, white-hot core) → 0 (dying smoke).
 * Returns [r,g,b]. White → gold → amber → ember red → dark.
 */
export function fireColor(life: number): [number, number, number] {
  const l = clamp(life, 0, 1);
  if (l > 0.85) return [255, 248, 220]; // white-hot core
  if (l > 0.6) return [255, lerp(190, 235, (l - 0.6) / 0.25), 90]; // gold
  if (l > 0.35) return [255, lerp(120, 190, (l - 0.35) / 0.25), 50]; // amber
  if (l > 0.15) return [lerp(150, 235, (l - 0.15) / 0.2), 60, 30]; // ember red
  return [70, 24, 18]; // smoke / fade
}
