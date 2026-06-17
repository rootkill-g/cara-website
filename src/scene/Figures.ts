import { TAU, mulberry32, rgba } from "./math";

// The hero range is built from the Codeberg mark's *mountain* (not the circular
// badge): a clean symmetric peak whose base half-width is CB_SLOPE x its height
// - the logo's own slope - carrying a moonlit glacier facet on its right face.
// A few at varied size and position read as a range while staying unmistakably
// the Codeberg mountain. The official icon measures run-over-rise ~= 0.773;
// broadened to 0.9 here so each summit still reads as a broad Codeberg peak
// even though the treeline hides its lower third.
const CB_SLOPE = 0.9;

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
  // The moonlit ridge stroke follows only the visible skyline (upper envelope of
  // the peaks), NOT the raw fill polygon. The polygon self-intersects wherever
  // peak bases overlap (heavily so in portrait, where peak height scales with h
  // but spacing scales with the narrow w), and stroking it draws the hidden
  // back-slope of one peak crossing the face of the next - the "edges showing
  // through" artifact. The envelope has no internal crossings by construction.
  private mFarSky: Pt[] = [];
  private mNearSky: Pt[] = [];
  // Glacier facets to paint on the prominent near peaks (the logo's signature
  // light face): each holds the peak apex, its valley baseline, and a strength.
  private glaciers: { x: number; y: number; valleyY: number; bright: boolean; faceLeft: boolean }[] = [];
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
    this.seed = seed;
    this.rng = mulberry32(seed);
    if (typeof Image !== "undefined" && typeof document !== "undefined") {
      const img = new Image();
      img.onload = () => this.buildZiggy(img);
      img.src = "/ziggy.svg";
    }
  }
  private readonly seed: number;
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

  // A connected ridgeline of symmetric Codeberg peaks rising from a flat valley
  // baseline (the treeline hides the floor, so only the summits read). Each
  // peak's half-width follows the logo slope, so every summit *is* the Codeberg
  // mountain. Returned as a fill polygon, same shape drawRidge expects.
  private mountainRidge(peaks: { x: number; y: number }[], valleyY: number): Pt[] {
    const pts: Pt[] = [{ x: -40, y: valleyY }];
    for (const pk of peaks) {
      const hw = CB_SLOPE * (valleyY - pk.y);
      pts.push({ x: pk.x - hw, y: valleyY });
      pts.push({ x: pk.x, y: pk.y });
      pts.push({ x: pk.x + hw, y: valleyY });
    }
    pts.push({ x: this.w + 40, y: valleyY });
    return pts;
  }

  // The visible skyline of a range: the upper envelope of its peak triangles
  // over a flat valley baseline. At each x the silhouette top is the highest
  // (smallest y) peak edge covering it, or the valley floor where none does.
  // Sampled once per layout, then collinear runs are collapsed so the stored
  // polyline is just the true vertices (apexes, the V-notches where two slopes
  // cross, and the flat valley lips). Stroking this never traces a hidden edge.
  private ridgeSkyline(peaks: { x: number; y: number }[], valleyY: number): Pt[] {
    const x0 = -40;
    const x1 = this.w + 40;
    const topAt = (x: number) => {
      let y = valleyY;
      for (const pk of peaks) {
        const hw = CB_SLOPE * (valleyY - pk.y);
        const d = Math.abs(x - pk.x);
        if (d < hw) {
          const ey = valleyY - (valleyY - pk.y) * (1 - d / hw);
          if (ey < y) y = ey;
        }
      }
      return y;
    };
    const raw: Pt[] = [];
    for (let x = x0; x < x1; x += 1) raw.push({ x, y: topAt(x) });
    raw.push({ x: x1, y: topAt(x1) });
    // collapse collinear interior samples down to vertices
    const out: Pt[] = [raw[0]];
    for (let i = 1; i < raw.length - 1; i++) {
      const a = out[out.length - 1];
      const b = raw[i];
      const c = raw[i + 1];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(cross) > 1e-3) out.push(b);
    }
    out.push(raw[raw.length - 1]);
    return out;
  }

  layout(w: number, h: number) {
    // Re-seed from the fixed seed every layout. The mountains, treeline and
    // people all draw from this one PRNG; without the reset each resize would
    // continue the sequence and roll *different* geometry — which is exactly
    // what made the mountains change shape on every mobile URL-bar scroll.
    this.rng = mulberry32(this.seed);
    const r = this.rng;
    this.w = w;
    this.h = h;
    this.cx = w * 0.5;
    this.groundY = h * 0.82;
    this.scale = Math.max(0.7, Math.min(1.4, w / 1100));
    const s = this.scale;

    // Codeberg mountain ranges (back to front). Prominent peaks rise in the
    // open margins left and right; the centre stays low, behind the gathering
    // and clear of the hero copy. The right-hand near peak is the hero summit
    // and carries the strongest glacier facet. Apex heights are fractions of h
    // (smaller = taller) - the main knobs for tuning the skyline.
    const valFar = h * 0.74; // far valley floor (hidden behind the treeline)
    const valNear = h * 0.775; // near valley floor
    const farPeaks = [
      { x: this.cx - w * 0.42, y: h * 0.59 },
      { x: this.cx + w * 0.04, y: h * 0.63 },
      { x: this.cx + w * 0.44, y: h * 0.58 },
    ];
    this.mFar = this.mountainRidge(farPeaks, valFar);
    this.mFarSky = this.ridgeSkyline(farPeaks, valFar);
    const nearPeaks = [
      { x: this.cx - w * 0.3, y: h * 0.52 }, // left, prominent (glacier)
      { x: this.cx - w * 0.07, y: h * 0.66 }, // low centre-left, behind people
      { x: this.cx + w * 0.12, y: h * 0.64 }, // low centre-right
      { x: this.cx + w * 0.3, y: h * 0.5 }, // hero summit, right (glacier)
    ];
    this.mNear = this.mountainRidge(nearPeaks, valNear);
    this.mNearSky = this.ridgeSkyline(nearPeaks, valNear);
    // Glacier facets: the two prominent near summits get the bright signature
    // face; the far skyline peaks get a dim one so the two-tone reads across the
    // whole range. The low centre peaks stay plain dark behind the warm fire.
    // `faceLeft` puts the lit face on whichever side faces the fire at centre,
    // so the whole range is lit consistently from the gathering, not from off
    // the edge of the scene.
    const lit = (p: { x: number; y: number }, valleyY: number, bright: boolean) => ({
      ...p,
      valleyY,
      bright,
      faceLeft: p.x > this.cx,
    });
    this.glaciers = [
      ...farPeaks.map((p) => lit(p, valFar, false)),
      lit(nearPeaks[0], valNear, true),
      lit(nearPeaks[3], valNear, true),
    ];

    // treeline — two parallax layers of pines
    const horizon = this.groundY - 4;
    this.far = [];
    this.near = [];
    // Trees tower over the seated people (a person is ~60 units tall): near
    // pines run ~82-138 units, far ones smaller with distance.
    for (let x = -20; x < w + 20; x += 28 + r() * 22) {
      this.far.push({ x, h: (44 + r() * 40) * s, w: (16 + r() * 14) * s });
    }
    for (let x = -30; x < w + 30; x += 38 + r() * 30) {
      this.near.push({ x, h: (82 + r() * 56) * s, w: (28 + r() * 20) * s });
    }
    this.horizon = horizon;

    // a few people huddled close around the fire. The innermost two flank the
    // flame at ±0.8 — near enough to share the warmth, but clear of the narrow
    // column directly behind it: the translucent additive fire can't occlude a
    // silhouette, so a centred figure's amber rim would read through the flames.
    const slots = [-2.6, -1.7, -0.8, 0.8, 1.7];
    this.people = slots.map((k, i) => ({
      x: this.cx + k * 64 * s,
      ground: this.groundY + (i % 2 === 0 ? 6 : 12) * s,
      s: (0.92 + (i % 3) * 0.12) * s,
      lean: (k > 0 ? -1 : 1) * (0.04 + r() * 0.05),
      fireOnRight: k < 0,
    }));

    // Ziggy nestled in the gap between the two inner-left people, head peeking
    // toward the fire — the people in front give it depth (underlaid, not pasted
    // on). Tracks the left cluster's inward shift so it stays in the gap.
    this.igX = this.cx - 91 * s;
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

  private drawRidge(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, skyline?: Pt[]) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(this.w + 40, this.h);
    ctx.lineTo(-40, this.h);
    ctx.closePath();
    ctx.fill();
    if (skyline) {
      // a faint cool light catching the ridgeline, like moonlight on the peaks.
      // Trace only the upper envelope so overlapping peaks never stroke a hidden
      // back-slope across the face of the peak in front of them.
      ctx.strokeStyle = rgba(150, 165, 205, 0.22);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(skyline[0].x, skyline[0].y);
      for (const p of skyline) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  // The glacier facet - the logo's light face. A crisp, clearly lighter cool
  // face filling one side of the peak, with a hard dividing ridge from the apex
  // (the two-tone is the Codeberg signature). `faceLeft` mirrors it onto the
  // fire-facing side; its outer edge IS the peak's slope; it darkens down the
  // face so it reads as moonlit, not flat-white.
  private drawGlacier(
    ctx: CanvasRenderingContext2D,
    g: { x: number; y: number; valleyY: number; bright: boolean; faceLeft: boolean },
  ) {
    const hw = CB_SLOPE * (g.valleyY - g.y);
    const dir = g.faceLeft ? -1 : 1; // which side catches the light (toward the fire)
    const innerX = g.x + dir * hw * 0.15; // dividing ridge meets the base
    const grad = ctx.createLinearGradient(g.x, g.y, g.x + dir * hw * 0.55, g.valleyY);
    if (g.bright) {
      grad.addColorStop(0, rgba(92, 108, 144, 1));
      grad.addColorStop(0.5, rgba(50, 62, 90, 1));
      grad.addColorStop(1, rgba(24, 32, 50, 1));
    } else {
      grad.addColorStop(0, rgba(40, 50, 74, 1));
      grad.addColorStop(0.5, rgba(26, 34, 54, 1));
      grad.addColorStop(1, rgba(16, 22, 38, 1));
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + dir * hw, g.valleyY);
    ctx.lineTo(innerX, g.valleyY);
    ctx.closePath();
    ctx.fill();
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

  // A small teepee of firewood: log bottoms spread on the ground, tops meeting
  // at a low apex, with the flame (raised by the Scene) on top. The logs use
  // the scene's own language — near-black silhouettes like the people, with a
  // thin gold rim catching the fire on their upper edge — rather than bright
  // gradient faces, which read as light beams instead of wood.
  private drawWood(ctx: CanvasRenderingContext2D, flicker: number) {
    const ls = this.scale * 0.7; // the woodpile is 30% smaller than the figures
    const cx = this.cx;
    // matches the fire's forward drop in Scene.campfirePt so wood + flame stay aligned
    const gy = this.groundY + 5 * this.scale;
    const apexY = gy - 12 * ls;
    // [bottomX, bottomY, topX, topY, thickness]; bottoms fan out, tops meet
    const logs: [number, number, number, number, number][] = [
      [cx - 16 * ls, gy + 5 * ls, cx - 2 * ls, apexY, 4.5 * ls],
      [cx - 8 * ls, gy + 6 * ls, cx + 1 * ls, apexY - 1 * ls, 4 * ls],
      [cx + 0.5 * ls, gy + 6 * ls, cx - 0.5 * ls, apexY - 1.5 * ls, 4 * ls],
      [cx + 8 * ls, gy + 6 * ls, cx - 1 * ls, apexY - 1 * ls, 4 * ls],
      [cx + 16 * ls, gy + 5 * ls, cx + 2 * ls, apexY, 4.5 * ls],
    ];

    // dark log bodies — a cool bluish dark so the pile blends into the
    // mountains/treeline rather than standing out as a warm-brown block
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = rgba(9, 12, 19, 1);
    for (const [bx, by, tx, ty, lw] of logs) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    ctx.restore();

    if (flicker > 0.02) {
      // thin gold rim on the upper (fire-facing) edge of each log, brightest up
      // near the flame and fading toward the ground — the same cartoony edge the
      // people and ziggy carry, so the wood belongs to the scene
      ctx.save();
      ctx.lineCap = "round";
      for (const [bx, by, tx, ty, lw] of logs) {
        const dx = tx - bx;
        const dy = ty - by;
        const len = Math.hypot(dx, dy) || 1;
        let nx = -dy / len;
        let ny = dx / len;
        if (ny > 0) {
          nx = -nx;
          ny = -ny;
        } // normal points up, toward the fire
        const off = lw * 0.34;
        const x1 = bx + nx * off;
        const y1 = by + ny * off;
        const x2 = tx + nx * off;
        const y2 = ty + ny * off;
        const g = ctx.createLinearGradient(x2, y2, x1, y1); // apex → base
        g.addColorStop(0, rgba(255, 178, 92, 0.75 * flicker));
        g.addColorStop(0.65, rgba(255, 150, 80, 0.12 * flicker));
        g.addColorStop(1, rgba(255, 150, 80, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5 * ls;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // a faint ember glow at the base so the foot of the pile sits in warmth
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const eg = ctx.createRadialGradient(cx, gy + 3 * ls, 0, cx, gy + 3 * ls, 18 * ls);
      eg.addColorStop(0, rgba(255, 120, 44, 0.26 * flicker));
      eg.addColorStop(1, rgba(255, 90, 30, 0));
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.ellipse(cx, gy + 4 * ls, 18 * ls, 7 * ls, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, reveal: number, flicker: number) {
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalAlpha = reveal;

    // Codeberg mountains: far range + its dim facets, then the near range + its
    // bright facets (each facet behind the ridge of the next layer up)
    this.drawRidge(ctx, this.mFar, rgba(13, 17, 27, 1), this.mFarSky);
    for (const g of this.glaciers) if (!g.bright) this.drawGlacier(ctx, g);
    this.drawRidge(ctx, this.mNear, rgba(7, 10, 15, 1), this.mNearSky);
    for (const g of this.glaciers) if (g.bright) this.drawGlacier(ctx, g);

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
      const rad = 340 * this.scale;
      const clearing = ctx.createRadialGradient(this.cx, this.groundY, 0, this.cx, this.groundY, rad);
      // A concave (ease-out) falloff with a long faint tail: bright near the
      // fire, softening fast, then dissolving to nothing with no defined disk
      // edge — so the warmth blends into the dark instead of reading as an oval.
      clearing.addColorStop(0, rgba(255, 150, 62, 0.22 * flicker));
      clearing.addColorStop(0.12, rgba(255, 142, 58, 0.15 * flicker));
      clearing.addColorStop(0.3, rgba(255, 130, 52, 0.075 * flicker));
      clearing.addColorStop(0.55, rgba(255, 118, 46, 0.03 * flicker));
      clearing.addColorStop(0.8, rgba(255, 108, 42, 0.008 * flicker));
      clearing.addColorStop(1, rgba(255, 100, 40, 0));
      ctx.fillStyle = clearing;
      ctx.beginPath();
      ctx.ellipse(this.cx, this.groundY, rad, rad * 0.78, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Ziggy, underlaid — drawn before the people so they sit in front of it,
    // giving the little creature real depth in the scene
    this.drawIguana(ctx, flicker, reveal);

    // wood pile — a small teepee of logs assembled around the fire
    this.drawWood(ctx, flicker);

    // people — fill black, then warm rim on the fire-facing edge
    ctx.fillStyle = rgba(3, 4, 6, 1);
    for (const p of this.people) this.body(ctx, p);
    if (flicker > 0.02) for (const p of this.people) this.rim(ctx, p, flicker);

    ctx.restore();
  }
}
