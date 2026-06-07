import { TAU, fireColor, rgba } from "./math";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // remaining seconds
  max: number; // total lifespan
  size: number;
  seed: number;
}

export interface FireOpts {
  x: number;
  y: number;
  /** Horizontal spread of the flame base, px. */
  spread: number;
  /** Visual scale (particle size + rise speed). */
  scale: number;
  /** Particles spawned per second at full intensity. */
  rate?: number;
}

/**
 * A buoyant particle flame. Used twice: the lone center flame at the start and
 * the wood campfire. Drawn additively so overlapping particles bloom into a
 * single warm body of light. `flicker` (0–1) is read by the scene to modulate
 * the rim light on the silhouettes.
 */
export class Fire {
  private ps: P[] = [];
  private acc = 0; // fractional spawn accumulator
  flicker = 0;
  intensity = 1;

  constructor(private o: FireOpts) {
    this.o.rate ??= 220;
  }

  moveTo(x: number, y: number) {
    this.o.x = x;
    this.o.y = y;
  }

  private spawn() {
    const o = this.o;
    const a = Math.random();
    const r = (Math.random() - 0.5) * o.spread;
    // narrower, faster particles near the centre → flame-tongue shape
    const centerBias = 1 - Math.abs(r) / (o.spread * 0.5 + 1e-3);
    this.ps.push({
      x: o.x + r,
      y: o.y + (Math.random() - 0.5) * o.spread * 0.25,
      vx: (Math.random() - 0.5) * 18 * o.scale,
      vy: -(40 + a * 60) * o.scale * (0.6 + 0.4 * centerBias),
      life: 0.5 + Math.random() * 0.7,
      max: 0.5 + Math.random() * 0.7,
      size: (2.5 + Math.random() * 4) * o.scale * (0.6 + 0.6 * centerBias),
      seed: Math.random() * TAU,
    });
  }

  update(dt: number, t: number) {
    const o = this.o;
    // spawn
    if (this.intensity > 0) {
      this.acc += o.rate! * this.intensity * dt;
      while (this.acc >= 1) {
        this.spawn();
        this.acc -= 1;
      }
    }
    // integrate, swap-pop dead
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        const last = this.ps.pop()!;
        if (i < this.ps.length) this.ps[i] = last;
        continue;
      }
      // buoyancy + curling turbulence
      p.vy -= 26 * o.scale * dt;
      p.vx += Math.sin(t * 3 + p.seed) * 16 * o.scale * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    // flicker: a little noise driven by particle population
    const target = Math.min(1, this.ps.length / (o.rate! * 0.45));
    this.flicker += (target - this.flicker) * Math.min(1, dt * 8);
    this.flicker *= 0.92 + 0.08 * Math.sin(t * 13.3);
  }

  render(ctx: CanvasRenderingContext2D) {
    const o = this.o;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // ground glow pool (only meaningful for the campfire scale)
    if (this.intensity > 0 || this.ps.length) {
      const gl = 90 * o.scale * (0.7 + 0.3 * this.flicker);
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, gl);
      grad.addColorStop(0, rgba(255, 170, 70, 0.32 * this.flicker));
      grad.addColorStop(1, rgba(255, 120, 40, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, gl, 0, TAU);
      ctx.fill();
    }

    for (const p of this.ps) {
      const lf = p.life / p.max;
      const [r, g, b] = fireColor(lf);
      // fade in at birth, out at death
      const a = Math.min(1, lf * 1.6) * 0.5;
      ctx.fillStyle = rgba(r, g, b, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + lf * 0.8), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  seed: number;
}

/** Rising embers that drift up off the fire, flicker, and burn out. */
export class Embers {
  private ps: Spark[] = [];
  private acc = 0;
  intensity = 1;

  constructor(
    private x: number,
    private y: number,
    private scale: number,
  ) {}

  moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, t: number) {
    if (this.intensity > 0) {
      this.acc += 14 * this.intensity * dt;
      while (this.acc >= 1) {
        this.ps.push({
          x: this.x + (Math.random() - 0.5) * 26 * this.scale,
          y: this.y,
          vx: (Math.random() - 0.5) * 14,
          vy: -(50 + Math.random() * 70) * this.scale,
          life: 1.4 + Math.random() * 1.8,
          max: 1.4 + Math.random() * 1.8,
          seed: Math.random() * TAU,
        });
        this.acc -= 1;
      }
    }
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        const last = this.ps.pop()!;
        if (i < this.ps.length) this.ps[i] = last;
        continue;
      }
      p.vy += 8 * dt; // gravity gently reasserts as it cools
      p.vx += Math.sin(t * 2 + p.seed) * 10 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.ps) {
      const lf = p.life / p.max;
      const tw = 0.5 + 0.5 * Math.sin(p.seed + p.life * 18);
      const a = lf * tw * 0.9;
      ctx.fillStyle = rgba(255, 180 + 60 * lf, 90, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1 * this.scale * (0.6 + lf), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
