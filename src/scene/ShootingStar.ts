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
  // The trail is sampled by *distance*, not per frame: between two head updates
  // we fill in points no more than `step` px apart, and keep only the most
  // recent `maxLen` px. This keeps the streak smooth and the same length whether
  // the head crawls or (post speed-up) leaps across the screen each frame.
  private readonly step = 3;
  private readonly maxLen = 130;
  visible = false;
  private hx = 0;
  private hy = 0;

  setHead(x: number, y: number) {
    this.hx = x;
    this.hy = y;
    const last = this.trail[this.trail.length - 1];
    if (!last) {
      this.trail.push({ x, y });
      return;
    }
    // interpolate evenly-spaced samples from the previous head to the new one,
    // so a big per-frame jump becomes a smooth run of points instead of one
    // long straight segment
    const dx = x - last.x;
    const dy = y - last.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / this.step));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      this.trail.push({ x: last.x + dx * f, y: last.y + dy * f });
    }
    this.trimToLength();
  }

  // drop points off the tail so the trail spans at most `maxLen` px from the head
  private trimToLength() {
    let len = 0;
    for (let i = this.trail.length - 1; i > 0; i--) {
      len += Math.hypot(this.trail[i].x - this.trail[i - 1].x, this.trail[i].y - this.trail[i - 1].y);
      if (len > this.maxLen) {
        this.trail.splice(0, i);
        return;
      }
    }
  }

  /** Called once at strike, to stop drawing the streak afterwards. */
  extinguish() {
    this.visible = false;
    this.trail.length = 0;
  }

  render(ctx: CanvasRenderingContext2D, intensity = 1) {
    if (!this.visible || this.trail.length < 2) return;
    const pts = this.trail;
    const n = pts.length;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // one smooth path through the samples (quadratic through the midpoints),
    // stroked a single time with a tail→head gradient so the streak can't bead
    // at the joints or additively blow out where it overlaps itself
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[n - 1].x, pts[n - 1].y);

    const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y);
    g.addColorStop(0, rgba(255, 210, 140, 0));
    g.addColorStop(0.6, rgba(255, 224, 160, 0.45 * intensity));
    g.addColorStop(1, rgba(255, 240, 185, 0.9 * intensity));
    ctx.strokeStyle = g;
    ctx.lineWidth = 3 * intensity;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

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
