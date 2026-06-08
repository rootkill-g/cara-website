import { TAU, mulberry32, rgba } from "./math";

interface Tree {
  x: number;
  h: number;
  w: number;
}
interface Pt {
  x: number;
  y: number;
}
interface Person {
  x: number;
  ground: number;
  s: number; // scale
  lean: number; // body tilt, radians
  fireOnRight: boolean; // which side catches the rim light
}

/**
 * The dark foreground: a moonlit mountain range, a pine treeline, the wood pile,
 * a few people around the fire, and — perched on a ledge, watching it all — the
 * Zig ziguana. Everything is a flat silhouette; the only color is the warm rim
 * light the fire throws on the people, which pulses with the fire's `flicker`.
 */
export class Figures {
  private far: Tree[] = [];
  private near: Tree[] = [];
  private mFar: Pt[] = [];
  private mNear: Pt[] = [];
  private people: Person[] = [];
  private cx = 0;
  private groundY = 0;
  private scale = 1;
  private w = 0;
  private h = 0;
  // Ziggy (the ziguana) perch — the colored mascot is prebaked into a dark
  // silhouette plus a warm fire-facing layer, so it sits in the scene the way
  // the people do rather than reading as a colored sticker.
  private igX = 0;
  private igScale = 1;
  private ziggyDark: HTMLCanvasElement | null = null;
  private ziggyRim: HTMLCanvasElement | null = null;

  constructor(seed = 0xb00f) {
    this.rng = mulberry32(seed);
    if (typeof Image !== "undefined" && typeof document !== "undefined") {
      const img = new Image();
      img.onload = () => this.buildZiggy(img);
      img.src = "/ziggy.svg";
    }
  }
  private rng: () => number;

  // Flatten the mascot into two layers: a dark silhouette, and a warm wash kept
  // to its fire-facing (right) side and faded across the body.
  private buildZiggy(img: HTMLImageElement) {
    const W = 379;
    const H = 316;
    const make = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      return c;
    };
    const dark = make();
    const dc = dark.getContext("2d");
    const solid = make();
    const so = solid.getContext("2d");
    const rim = make();
    const rc = rim.getContext("2d");
    if (!dc || !so || !rc) return;

    // crisp dark silhouette from the art (keeps the spiky frill)
    dc.drawImage(img, 0, 0, W, H);
    dc.globalCompositeOperation = "source-in";
    dc.fillStyle = rgba(9, 10, 14, 1);
    dc.fillRect(0, 0, W, H);

    // a hole-filled (dilated) copy — the art smeared in a ring of small offsets
    // so the gaps between the frill spikes close up. The rim is built from this
    // so it follows only the OUTER contour, never the interior detail.
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * TAU;
      so.drawImage(img, Math.cos(ang) * 7, Math.sin(ang) * 7, W, H);
    }
    so.drawImage(img, 0, 0, W, H);

    // warm rim: a thin halo just OUTSIDE the solid's fire-facing (right) edge —
    // the solid shifted right, recolored warm, then the solid subtracted. The
    // glow can only land on the outer edge; it can never bleed inside the body.
    rc.drawImage(solid, 16, 0, W, H);
    rc.globalCompositeOperation = "source-in";
    rc.fillStyle = rgba(255, 184, 100, 1);
    rc.fillRect(0, 0, W, H);
    rc.globalCompositeOperation = "destination-out";
    rc.drawImage(solid, 0, 0, W, H);

    this.ziggyDark = dark;
    this.ziggyRim = rim;
  }

  private ridge(baseY: number, hiY: number, segments: number): Pt[] {
    const r = this.rng;
    const w = this.w;
    const pts: Pt[] = [{ x: -40, y: baseY }];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * (w + 80) - 40;
      const y = baseY - (baseY - hiY) * (0.2 + r() * 0.8);
      pts.push({ x, y });
    }
    pts.push({ x: w + 40, y: baseY });
    return pts;
  }

  layout(w: number, h: number) {
    const r = this.rng;
    this.w = w;
    this.h = h;
    this.cx = w * 0.5;
    this.groundY = h * 0.82;
    this.scale = Math.max(0.7, Math.min(1.4, w / 1100));
    const s = this.scale;

    // mountain ranges (back to front)
    this.mFar = this.ridge(h * 0.8, h * 0.62, 7);
    this.mNear = this.ridge(h * 0.83, h * 0.7, 11);

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

    // Ziggy tucked behind the 1st person, head peeking into the gap toward the
    // fire — the people in front give it depth (it's underlaid, not pasted on)
    this.igX = this.cx - 110 * s;
    this.igScale = s;
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

  private drawRidge(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, moonlit: boolean) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(this.w + 40, this.h);
    ctx.lineTo(-40, this.h);
    ctx.closePath();
    ctx.fill();
    if (moonlit) {
      // a faint cool light catching the ridgeline, like moonlight on the peaks
      ctx.strokeStyle = rgba(150, 165, 205, 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.stroke();
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

  // Ziggy on a rock, watching the fire — a dark silhouette with firelight on
  // its fire-facing side (dimmer than the people, since it's farther off), and
  // a faint glow so it separates from the dark hillside.
  private drawIguana(ctx: CanvasRenderingContext2D, flicker: number, reveal: number) {
    ctx.save();
    ctx.translate(this.igX, this.groundY);
    ctx.scale(this.igScale, this.igScale);

    const dh = 28;
    const dw = (dh * 379) / 316;
    const dx = -dw / 2;
    const dy = -dh; // feet on the rock top, not floating
    const midY = dy + dh * 0.5;

    // a faint backlight so the small dark body separates from the dark ground
    if (flicker > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const r = dw * 1.05;
      const g = ctx.createRadialGradient(0, midY, 0, 0, midY, r);
      g.addColorStop(0, rgba(255, 150, 70, 0.07 * flicker));
      g.addColorStop(1, rgba(255, 120, 50, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, midY, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // a proper little rock to stand on — solid foreground dark (same depth as
    // the near trees, not the faded far ones)
    const rock = new Path2D();
    rock.moveTo(-20, 9);
    rock.lineTo(-22, 2);
    rock.quadraticCurveTo(-15, -4, -5, -3);
    rock.lineTo(6, -5);
    rock.quadraticCurveTo(16, -4, 21, 2);
    rock.lineTo(22, 9);
    rock.closePath();
    ctx.fillStyle = rgba(6, 7, 10, 1);
    ctx.fill(rock);
    // a thin warm rim along the rock's fire-facing (right) edge — the same
    // cartoony outline the lizard and the people have, not a soft wash
    if (flicker > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(255, 184, 100, 0.5 * flicker);
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(2, -5);
      ctx.lineTo(6, -5);
      ctx.quadraticCurveTo(16, -4, 21, 2);
      ctx.lineTo(22, 9);
      ctx.stroke();
      ctx.restore();
    }

    // the lizard, facing the fire (head/front to the right) so its front edge
    // catches the rim light
    if (this.ziggyDark) ctx.drawImage(this.ziggyDark, dx, dy, dw, dh);
    if (this.ziggyRim && flicker > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = reveal * 0.62 * flicker; // pure-flicker, like the people/rock — pulses with the fire
      ctx.drawImage(this.ziggyRim, dx, dy, dw, dh);
      ctx.restore();
    }

    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, reveal: number, flicker: number) {
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalAlpha = reveal;

    // mountains (furthest)
    this.drawRidge(ctx, this.mFar, rgba(13, 17, 27, 1), true);
    this.drawRidge(ctx, this.mNear, rgba(7, 10, 15, 1), false);

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

    // Ziggy, underlaid — drawn before the people so they sit in front of it,
    // giving the little creature real depth in the scene
    this.drawIguana(ctx, flicker, reveal);

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
