/**
 * Compute value V that is fraction T of the way from A to B
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * lerp, but clamped between A and B
 */
export function lerpClamp(a: number, b: number, t: number): number {
  return Math.max(Math.min(a, b), Math.min(Math.max(a, b), lerp(a, b, t)));
}

/**
 * Compute fraction T that value V is along the way from A to B
 */
export function invLerp(a: number, b: number, v: number): number {
  if (b === a) return 0;
  return (v - a) / (b - a);
}

/**
 * invLerp, but clamped between 0 and 1
 */
export function invLerpClamp(a: number, b: number, v: number): number {
  return Math.max(0, Math.min(1, invLerp(a, b, v)));
}