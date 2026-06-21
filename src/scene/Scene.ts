import { Fire, Embers } from "./Fire";
import { Figures } from "./Figures";
import { Logo } from "./Logo";
import { ShootingStar } from "./ShootingStar";
import { Starfield } from "./Starfield";
import { TAU, clamp, easeInCubic, lerp, rgba, smoothstep } from "./math";

// Phase boundaries, in seconds since the scene began. Kept snappy: the star
// streaks in, loops, strikes the wood, and the night settles in ~2 seconds.
// No slow build-up before the page is usable.
const STRIKE_END = 1.2; // star finishes its descent and strikes the wood
const REVEAL_END = 2.0; // sky, treeline, people, logo settle in
export const AMBIENT_AT = REVEAL_END; // everything settled, loops forever
// the hero text comes in here — the moment the fire takes and the gathering
// and logo begin to appear, so the words arrive *with* the scene rather than
// after the whole cinematic has settled
const REVEAL_AT = STRIKE_END;

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
  private revealFired = false;
  private introFired = false;

  private campfire: Fire;
  private embers: Embers;
  private star = new ShootingStar();
  private stars = new Starfield();
  private figures = new Figures();
  private logo = new Logo();

  constructor(
    reduced: boolean,
    private onReveal: () => void,
    private onIntroDone: () => void,
  ) {
    this.campfire = new Fire({ x: 0, y: 0, spread: 34, scale: 0.95, rate: 300 });
    this.embers = new Embers(0, 0, 0.95);
    if (reduced) {
      // Respect reduced-motion: jump straight to the settled night and let the
      // host render a single calm frame (no RAF loop). The host fires the
      // reveal + intro-done callbacks itself in this path.
      this.t = AMBIENT_AT + 0.5;
      this.star.visible = false;
      this.revealFired = true;
      this.introFired = true;
    }
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.figures.layout(w, h);
    // Scale the fire with the viewport so it stays proportionate to the
    // gathering — the people/trees clamp to 0.7 on phones (w/1100), but the
    // fire was a fixed 0.95, which read ~35% oversized on a narrow screen. Cap
    // at 1 so wide/laptop screens keep the size that already looked right.
    const figScale = Math.max(0.7, Math.min(1.4, w / 1100));
    const vf = Math.min(1, figScale);
    // sized to sit on the small wood cone (which is 0.7 of the figure scale),
    // so the flame doesn't overflow the pile
    this.campfire.setScale(0.7 * vf, 24 * vf);
    this.embers.setScale(0.7 * vf);
    // Sit the flame on the apex of the small wood cone (drawn by Figures with
    // its tips ~8*scale above the ground) rather than at ground level, so the
    // fire burns on top of the woodpile.
    const cf = this.campfirePt();
    const lift = 6 * figScale;
    this.campfire.moveTo(cf.x, cf.y - lift);
    this.embers.moveTo(cf.x, cf.y - lift);
  }

  // ── geometry (derived from current size) ─────────────────────────────────
  private campfirePt() {
    // a touch below the open ground line so the fire + wood sit forward, in
    // among the gathering, rather than reading as set back behind it
    const s = Math.max(0.7, Math.min(1.4, this.w / 1100));
    return { x: this.w * 0.5, y: this.h * 0.82 + 5 * s };
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
    const portrait = this.h > this.w;
    const R0 = m * 0.45; // entry radius — large enough to start off-screen, up top
    // A wide screen gives the spiral room to read as proper loops. On a narrow
    // portrait phone the radius is bound by the small width, so the landscape
    // squash flattens the loop into a horizontal sweep that snaps back like a
    // bounce. The fix is *taller* loops, not fewer: a phone has vertical room to
    // spare, so make the ellipse a touch taller than wide (squash > 1) and keep
    // the full turns — the star coils down, swings back up, then dives into the
    // fire, instead of drooping straight down.
    const turns = portrait ? 1.45 : 1.35;
    const squash = portrait ? 1.2 : 0.62; // loop's vertical : horizontal ratio
    const ang = -Math.PI / 2 + turns * TAU * p;
    const radius = R0 * Math.pow(1 - p, 1.3); // shrinks to 0 at the fire
    const cy = lerp(startY, fireY, easeInCubic(p)); // whirl descends, accelerating
    return { x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius * squash };
  }

  skip() {
    if (this.t < AMBIENT_AT) this.t = AMBIENT_AT + 0.5;
    this.star.extinguish();
  }

  private fireReveal() {
    if (!this.revealFired) {
      this.revealFired = true;
      this.onReveal();
    }
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

    this.campfire.intensity = smoothstep(STRIKE_END - 0.15, REVEAL_END - 0.25, t);
    this.campfire.update(dt, t);
    this.embers.intensity = smoothstep(STRIKE_END, REVEAL_END, t);
    this.embers.update(dt, t);

    if (!this.revealFired && t >= REVEAL_AT) this.fireReveal();
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
    this.logo.render(ctx, sc.x, sc.y - logoSize * 0.06, logoSize, t, smoothstep(STRIKE_END + 0.15, AMBIENT_AT + 0.3, t));

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
