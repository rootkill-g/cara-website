import { TAU, rgba } from "./math";

interface Pt {
  x: number;
  y: number;
}

/**
 * The travelling light: the center flame collapses into this, it spirals
 * inward, then dives to strike the wood. This class only owns the *look* — a
 * bright head plus a fading, tapering trail. The path itself is computed by the
 * Scene (which knows the geometry and phase timings) and pushed in via `setHead`.
 */
export class ShootingStar {
  private trail: Pt[] = [];
  private readonly maxTrail = 26;
  visible = false;
  private hx = 0;
  private hy = 0;

  setHead(x: number, y: number) {
    this.hx = x;
    this.hy = y;
    this.trail.push({ x, y });
    if (this.trail.length > this.maxTrail) this.trail.shift();
  }

  /** Called once at strike, to stop drawing the streak afterwards. */
  extinguish() {
    this.visible = false;
    this.trail.length = 0;
  }

  render(ctx: CanvasRenderingContext2D, intensity = 1) {
    if (!this.visible || this.trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // tapering trail
    const n = this.trail.length;
    for (let i = 1; i < n; i++) {
      const a = (i / n) * intensity;
      const p0 = this.trail[i - 1];
      const p1 = this.trail[i];
      ctx.strokeStyle = rgba(255, 220 + 30 * a, 160, a * 0.8);
      ctx.lineWidth = a * 3.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    // glowing head
    const r = 7 * intensity;
    const grad = ctx.createRadialGradient(this.hx, this.hy, 0, this.hx, this.hy, r * 3);
    grad.addColorStop(0, rgba(255, 250, 230, intensity));
    grad.addColorStop(0.4, rgba(255, 200, 120, 0.7 * intensity));
    grad.addColorStop(1, rgba(255, 150, 70, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.hx, this.hy, r * 3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(255, 255, 245, intensity);
    ctx.beginPath();
    ctx.arc(this.hx, this.hy, r * 0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
