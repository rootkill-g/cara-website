import { Fire, Embers } from "./Fire";
import { Figures } from "./Figures";
import { Logo } from "./Logo";
import { ShootingStar } from "./ShootingStar";
import { Starfield } from "./Starfield";
import { TAU, clamp, easeInCubic, lerp, rgba, smoothstep } from "./math";

// Phase boundaries, in seconds since the scene began. Kept deliberately short —
// the star streaks in, loops once, strikes the wood, and the night settles in
// under four seconds. No slow build-up before the page is usable.
const STRIKE_END = 2.2; // star finishes its descent and strikes the wood
const REVEAL_END = 3.6; // sky, treeline, people, logo settle in
export const AMBIENT_AT = REVEAL_END; // everything settled, loops forever

/**
 * The whole cinematic. Owns every subsystem and drives them off a single clock.
 * `update(dt)` advances time and the path of the travelling light; `render`
 * composites black → star → campfire → night. After AMBIENT_AT it just loops
 * the living elements (twinkle, flicker, embers, logo bob).
 */
export class Scene {
  t = 0;
  private w = 0;
  private h = 0;
  private flash = 0;
  private introFired = false;

  private campfire: Fire;
  private embers: Embers;
  private star = new ShootingStar();
  private stars = new Starfield();
  private figures = new Figures();
  private logo = new Logo();

  constructor(
    reduced: boolean,
    private onIntroDone: () => void,
  ) {
    this.campfire = new Fire({ x: 0, y: 0, spread: 46, scale: 1.25, rate: 300 });
    this.embers = new Embers(0, 0, 1.2);
    if (reduced) {
      // Respect reduced-motion: jump straight to the settled night and let the
      // host render a single calm frame (no RAF loop). The host fires the
      // intro-done callback itself in this path.
      this.t = AMBIENT_AT + 0.5;
      this.star.visible = false;
      this.introFired = true;
    }
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.figures.layout(w, h);
    const cf = this.campfirePt();
    this.campfire.moveTo(cf.x, cf.y);
    this.embers.moveTo(cf.x, cf.y);
  }

  // ── geometry (derived from current size) ─────────────────────────────────
  private campfirePt() {
    return { x: this.w * 0.5, y: this.h * 0.82 };
  }
  private spiralCenter() {
    // on portrait phones the logo sits higher and smaller so it never crowds
    // the hero text stacked below it
    const portrait = this.h > this.w;
    return { x: this.w * 0.5, y: this.h * (portrait ? 0.15 : 0.2) };
  }
  /**
   * The star's whole flight as one continuous curve, p in 0..1. A spiral whose
   * center *descends* from the sky to the campfire while its radius collapses to
   * zero — so the star coils smoothly down and lands exactly on the wood at
   * p=1, with no phase change, no pause, and no kink in its velocity. The
   * vertical drift eases in (gravity-like) so it plunges into the fire.
   */
  private starPath(p: number) {
    const m = Math.min(this.w, this.h);
    const cx = this.w * 0.5;
    const startY = this.h * 0.22;
    const fireY = this.campfirePt().y;
    const R0 = m * 0.45; // entry radius — large enough to start off-screen, up top
    const turns = 1.35;
    const ang = -Math.PI / 2 + turns * TAU * p;
    const radius = R0 * Math.pow(1 - p, 1.3); // shrinks to 0 at the fire
    const cy = lerp(startY, fireY, easeInCubic(p)); // whirl descends, accelerating
    return { x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius * 0.62 };
  }

  skip() {
    if (this.t < AMBIENT_AT) this.t = AMBIENT_AT + 0.5;
    this.star.extinguish();
  }

  private fireDone() {
    if (!this.introFired) {
      this.introFired = true;
      this.onIntroDone();
    }
  }

  update(dt: number) {
    const prev = this.t;
    this.t += dt;
    const t = this.t;

    // travelling light — one continuous descent from off-screen into the fire
    this.star.visible = t < STRIKE_END;
    if (this.star.visible) {
      const s = this.starPath(t / STRIKE_END);
      this.star.setHead(s.x, s.y);
    } else if (prev < STRIKE_END && t >= STRIKE_END) {
      this.star.extinguish();
    }

    // strike flash + campfire ignition
    if (prev < STRIKE_END && t >= STRIKE_END) this.flash = 1;
    this.flash = Math.max(0, this.flash - dt * 3);

    this.campfire.intensity = smoothstep(STRIKE_END - 0.2, REVEAL_END - 0.7, t);
    this.campfire.update(dt, t);
    this.embers.intensity = smoothstep(STRIKE_END, REVEAL_END, t);
    this.embers.update(dt, t);

    if (!this.introFired && t >= AMBIENT_AT) this.fireDone();
  }

  render(ctx: CanvasRenderingContext2D) {
    const { w, h, t } = this;

    // night — pitch black sky
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    // sky — stars come up behind the streak almost immediately
    this.stars.render(ctx, w, h, t, smoothstep(0.2, REVEAL_END - 0.4, t));

    // floating logo (behind the travelling star so the star can pass in front)
    const sc = this.spiralCenter();
    const portrait = h > w;
    const logoSize = portrait
      ? clamp(w * 0.32, 92, 170)
      : clamp(Math.min(w, h) * 0.3, 140, 340);
    this.logo.render(ctx, sc.x, sc.y - logoSize * 0.06, logoSize, t, smoothstep(STRIKE_END + 0.2, AMBIENT_AT + 0.6, t));

    // travelling star (quick fade-in so it doesn't pop on the first frame)
    this.star.render(ctx, this.star.visible ? smoothstep(0, 0.12, t) : 0);

    // strike flash at the wood
    if (this.flash > 0.001) {
      const c = this.campfirePt();
      const r = lerp(10, Math.min(w, h) * 0.5, 1 - this.flash) ;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
      g.addColorStop(0, rgba(255, 240, 210, 0.9 * this.flash));
      g.addColorStop(0.4, rgba(255, 180, 90, 0.5 * this.flash));
      g.addColorStop(1, rgba(255, 140, 60, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // foreground: ground, treeline, wood, people
    this.figures.render(ctx, w, h, smoothstep(STRIKE_END - 0.15, REVEAL_END, t), this.campfire.flicker);

    // campfire + embers sit in front of the wood/people bases
    this.campfire.render(ctx);
    this.embers.render(ctx);
  }
}
