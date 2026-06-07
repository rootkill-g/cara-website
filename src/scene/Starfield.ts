import { TAU, mulberry32, ranger, rgba } from "./math";

interface Star {
  x: number; // fraction of width
  y: number; // fraction of height
  r: number; // radius px
  base: number; // base alpha
  phase: number; // twinkle phase
  speed: number; // twinkle speed
  tint: [number, number, number];
  glint: boolean; // a few bright ones get cross flares
}

const WHITE: [number, number, number] = [255, 255, 255];
const COOL: [number, number, number] = [205, 214, 247];
const WARM: [number, number, number] = [242, 200, 150];

/** A field of twinkling stars laid out across the viewport. */
export class Starfield {
  private stars: Star[] = [];

  constructor(count = 220, seed = 0x5eed) {
    const rng = mulberry32(seed);
    const rand = ranger(rng);
    for (let i = 0; i < count; i++) {
      const big = rng() > 0.94;
      const t = rng();
      const tint = t > 0.82 ? WARM : t > 0.4 ? COOL : WHITE;
      this.stars.push({
        x: rng(),
        y: rng() * 0.82, // keep stars in the sky, not on the ground
        r: big ? rand(1.1, 1.9) : rand(0.4, 1.0),
        base: big ? rand(0.7, 1) : rand(0.25, 0.7),
        phase: rng() * TAU,
        speed: rand(0.4, 1.6),
        tint,
        glint: big && rng() > 0.5,
      });
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    reveal: number,
  ) {
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(s.phase + t * s.speed);
      const a = s.base * tw * reveal;
      if (a <= 0.01) continue;
      const x = s.x * w;
      const y = s.y * h;
      const [r, g, b] = s.tint;
      ctx.fillStyle = rgba(r, g, b, a);
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, TAU);
      ctx.fill();
      if (s.glint && a > 0.4) {
        // soft cross flare on the brightest stars
        const len = s.r * 6 * tw;
        ctx.strokeStyle = rgba(r, g, b, a * 0.5);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.lineTo(x + len, y);
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y + len);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
