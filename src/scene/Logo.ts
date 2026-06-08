import { TAU, easeOutCubic, rgba, smoothstep } from "./math";

// The Cara mark in its native 64×64 space (same path as the SVG logo): a
// carved "C" with an inscribed point.
const C_PATH = new Path2D("M42 21 Q26 19 24 32 Q22 45 42 44");

/**
 * The giant logo the people are watching: the mark hangs in the sky, breathing
 * a soft amber glow and bobbing gently. A faint ring of orbiting sparks makes
 * it feel suspended among the stars rather than pasted on.
 */
export class Logo {
  render(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    t: number,
    reveal: number,
  ) {
    if (reveal <= 0) return;
    const e = easeOutCubic(reveal);
    const bob = Math.sin(t * 0.5) * size * 0.012;
    const y = cy + bob;
    // glow breathes on a slow, held cycle (17s): dark for ~7s, ease up over
    // ~2.5s, hold at three-quarter strength for ~5s, ease back down over ~2.5s.
    // Built from two ramps (rise minus fall). The mark itself stays solid
    // throughout — only the halo + shadow blur ride this value.
    const ph = t % 17;
    const glow = smoothstep(7, 9.5, ph) - smoothstep(14.5, 17, ph);
    const breathe = 0.75 * glow;

    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(cx, y);

    // soft halo
    const halo = size * 0.95;
    const grad = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, halo);
    grad.addColorStop(0, rgba(242, 183, 92, 0.18 * breathe));
    grad.addColorStop(0.5, rgba(232, 163, 61, 0.07 * breathe));
    grad.addColorStop(1, rgba(232, 163, 61, 0));
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, halo, 0, TAU);
    ctx.fill();

    // orbiting sparks
    for (let i = 0; i < 7; i++) {
      const ang = t * 0.18 + (i / 7) * TAU;
      const rr = size * (0.62 + 0.04 * Math.sin(t * 0.7 + i));
      const sx = Math.cos(ang) * rr;
      const sy = Math.sin(ang) * rr * 0.5; // slight elliptical tilt
      const a = (0.3 + 0.3 * Math.sin(t * 1.3 + i * 2)) * e;
      ctx.fillStyle = rgba(205, 214, 247, a);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, TAU);
      ctx.fill();
    }

    // the mark itself — drawn in 64-space, centered
    ctx.globalCompositeOperation = "source-over";
    const k = size / 64;
    ctx.scale(k, k);
    ctx.translate(-33, -32);

    // the carved "C" — a single solid amber stroke in the brand colour
    // (glyph-500, #e8a33d), the same colour as the navbar logo. One pass, so
    // there's no darker rim around a lighter core; the warm glow is the blurred
    // shadow halo, not a second, wider stroke underneath.
    ctx.shadowColor = "rgba(242,183,92,0.9)";
    ctx.shadowBlur = 26 * breathe;
    ctx.strokeStyle = rgba(232, 163, 61, e);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke(C_PATH);

    // the inscribed point — same amber, same soft glow
    ctx.shadowBlur = 18 * breathe;
    ctx.fillStyle = rgba(232, 163, 61, e);
    ctx.beginPath();
    ctx.arc(43, 32, 3.4, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}
