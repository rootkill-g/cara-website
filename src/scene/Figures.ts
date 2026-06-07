import { TAU, mulberry32, rgba } from "./math";

interface Tree {
  x: number;
  h: number;
  w: number;
}
interface Person {
  x: number;
  ground: number;
  s: number; // scale
  lean: number; // body tilt, radians
  fireOnRight: boolean; // which side catches the rim light
}

/**
 * The dark foreground: a distant pine treeline, the wood pile, and a few people
 * sitting around the fire looking up at the floating logo. Everything is a flat
 * silhouette; the only color is the warm rim light the fire throws on the
 * figures' edges, which pulses with the fire's `flicker`.
 */
export class Figures {
  private far: Tree[] = [];
  private near: Tree[] = [];
  private people: Person[] = [];
  private cx = 0;
  private groundY = 0;
  private scale = 1;

  constructor(seed = 0xb00f) {
    this.rng = mulberry32(seed);
  }
  private rng: () => number;

  layout(w: number, h: number) {
    const r = this.rng;
    this.cx = w * 0.5;
    this.groundY = h * 0.82;
    this.scale = Math.max(0.7, Math.min(1.4, w / 1100));
    const s = this.scale;

    // treeline — two parallax layers of pines
    const horizon = this.groundY - 4;
    this.far = [];
    this.near = [];
    for (let x = -20; x < w + 20; x += 26 + r() * 22) {
      this.far.push({ x, h: (24 + r() * 30) * s, w: (14 + r() * 12) * s });
    }
    for (let x = -30; x < w + 30; x += 34 + r() * 30) {
      this.near.push({ x, h: (40 + r() * 56) * s, w: (20 + r() * 18) * s });
    }
    this.horizon = horizon;

    // a few people around the fire, fanned to the sides so the fire sits
    // between the viewer and the group — kept close enough to catch its glow
    const slots = [-2.0, -1.1, 1.0, 1.9, -0.35];
    this.people = slots.map((k, i) => ({
      x: this.cx + k * 64 * s,
      ground: this.groundY + (i % 2 === 0 ? 6 : 12) * s,
      s: (0.92 + (i % 3) * 0.12) * s,
      lean: (k > 0 ? -1 : 1) * (0.04 + r() * 0.05),
      fireOnRight: k < 0,
    }));
  }
  private horizon = 0;

  private pine(ctx: CanvasRenderingContext2D, t: Tree, base: number) {
    // a simple stacked-triangle pine
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const frac = i / tiers;
      const top = base - t.h + t.h * frac * 0.55;
      const halfW = (t.w / 2) * (1 - frac * 0.55);
      const bot = base - t.h * frac * 0.55 + t.h * 0.06;
      ctx.moveTo(t.x, top);
      ctx.lineTo(t.x - halfW, bot);
      ctx.lineTo(t.x + halfW, bot);
      ctx.closePath();
    }
  }

  private body(ctx: CanvasRenderingContext2D, p: Person) {
    const s = p.s;
    ctx.save();
    ctx.translate(p.x, p.ground);
    ctx.rotate(p.lean);
    // seated torso — a rounded humped shape
    ctx.beginPath();
    ctx.moveTo(-15 * s, 0);
    ctx.quadraticCurveTo(-17 * s, -34 * s, -6 * s, -42 * s);
    ctx.quadraticCurveTo(0, -47 * s, 6 * s, -42 * s);
    ctx.quadraticCurveTo(17 * s, -34 * s, 16 * s, 0);
    ctx.quadraticCurveTo(18 * s, 4 * s, 0, 4 * s);
    ctx.quadraticCurveTo(-18 * s, 4 * s, -15 * s, 0);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(0, -52 * s, 8 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  private rim(ctx: CanvasRenderingContext2D, p: Person, flicker: number) {
    const s = p.s;
    ctx.save();
    ctx.translate(p.x, p.ground);
    ctx.rotate(p.lean);
    ctx.strokeStyle = rgba(255, 178, 92, 0.85 * flicker);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = "round";
    const side = p.fireOnRight ? 1 : -1;
    ctx.beginPath();
    // trace the lit edge (torso side + head arc) facing the fire
    ctx.moveTo(side * 16 * s, 0);
    ctx.quadraticCurveTo(side * 17 * s, -34 * s, side * 6 * s, -42 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -52 * s, 8 * s, side > 0 ? -1.2 : Math.PI - 1.9, side > 0 ? 0.9 : Math.PI + 1.2);
    ctx.stroke();
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, reveal: number, flicker: number) {
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalAlpha = reveal;

    // ground wash — a near-black band so figures read against the sky
    const g = ctx.createLinearGradient(0, this.horizon - 60, 0, h);
    g.addColorStop(0, rgba(5, 6, 8, 0));
    g.addColorStop(1, rgba(3, 4, 6, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, this.horizon - 60, w, h - this.horizon + 60);

    // far treeline (slightly cool, faint)
    ctx.fillStyle = rgba(10, 13, 20, 0.85);
    ctx.beginPath();
    for (const t of this.far) this.pine(ctx, t, this.horizon - 6);
    ctx.fill();

    // near treeline (darker)
    ctx.fillStyle = rgba(4, 5, 8, 1);
    ctx.beginPath();
    for (const t of this.near) this.pine(ctx, t, this.horizon + 4);
    ctx.fill();

    // warm clearing the fire throws across the ground — without this the
    // silhouettes are the same near-black as the ground and vanish
    if (flicker > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const rad = 320 * this.scale;
      const clearing = ctx.createRadialGradient(this.cx, this.groundY, 0, this.cx, this.groundY, rad);
      clearing.addColorStop(0, rgba(255, 150, 62, 0.3 * flicker));
      clearing.addColorStop(0.5, rgba(255, 120, 50, 0.12 * flicker));
      clearing.addColorStop(1, rgba(255, 100, 40, 0));
      ctx.fillStyle = clearing;
      ctx.beginPath();
      ctx.ellipse(this.cx, this.groundY, rad, rad * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // wood pile — crossed logs under the fire
    ctx.fillStyle = rgba(8, 7, 8, 1);
    const ls = this.scale;
    for (const ang of [-0.5, 0.5, 0.05]) {
      ctx.save();
      ctx.translate(this.cx, this.groundY + 2 * ls);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.roundRect(-26 * ls, -4 * ls, 52 * ls, 8 * ls, 4 * ls);
      ctx.fill();
      ctx.restore();
    }

    // people — fill black, then warm rim on the fire-facing edge
    ctx.fillStyle = rgba(3, 4, 6, 1);
    for (const p of this.people) this.body(ctx, p);
    if (flicker > 0.02) for (const p of this.people) this.rim(ctx, p, flicker);

    ctx.restore();
  }
}
