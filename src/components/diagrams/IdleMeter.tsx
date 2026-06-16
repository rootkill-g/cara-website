import { createEffect, createSignal, onCleanup } from "solid-js";
import { useInView } from "../useInView";
import { prefersReducedMotion } from "../motion";

// "Idle is zero." Cara has no frame loop: a frame is produced only when a
// DirtyFlags bit is set, and the host paces animation over FrameTick *only
// while armed*. So the trace sits flat on the floor and spikes only on a real
// event. Each spike is a single-sample needle: the cost is paid instantly and
// the line snaps straight back to zero. The readout is the *instantaneous*
// value at "now" (the right edge), so it reads 0% except at the very tick an
// event is handled, when it flashes that event's brief cost. The work is fast,
// so the number is almost always zero.

type Sample = { v: number; tag?: string };

const TAPE: Sample[] = (() => {
  const t: Sample[] = [];
  const zeros = (n: number) => { for (let i = 0; i < n; i++) t.push({ v: 0 }); };
  zeros(7); t.push({ v: 0.92, tag: "click" });
  zeros(9); t.push({ v: 0.8, tag: "keypress" });
  zeros(7); t.push({ v: 0.7, tag: "FrameTick" });
  zeros(8); t.push({ v: 0.55, tag: "fetch" });
  zeros(6);
  return t;
})();

const WINDOW = 30;
const W = 360;
const H = 124;
const PADX = 10;
const DRAWW = W - PADX * 2;
const FLOOR = H - 20;
const CEIL = 16;

const xAt = (i: number) => PADX + (i / (WINDOW - 1)) * DRAWW;
const yAt = (v: number) => FLOOR - v * (FLOOR - CEIL);
const clampLabel = (x: number) => Math.min(Math.max(x, PADX + 18), W - PADX - 18);

function pointsFor(win: Sample[]): string {
  return win.map((s, i) => `${xAt(i).toFixed(1)},${yAt(s.v).toFixed(1)}`).join(" ");
}

export default function IdleMeter() {
  const { ref, visible } = useInView();
  const [head, setHead] = createSignal(0);

  let started = false;
  createEffect(() => {
    if (started || !visible()) return;
    started = true;
    if (prefersReducedMotion()) { setHead(0); return; }
    const id = setInterval(() => setHead((h) => (h + 1) % TAPE.length), 220);
    onCleanup(() => clearInterval(id));
  });

  const win = (): Sample[] =>
    Array.from({ length: WINDOW }, (_, i) => TAPE[(head() + i) % TAPE.length]);

  // "now" is the newest sample, at the right edge: the live instantaneous cost
  const instant = () => win()[WINDOW - 1].v;
  const active = () => instant() > 0.001;
  const events = () => win().map((s, i) => ({ s, i })).filter((e) => e.s.tag);

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      <div class="mb-3 flex items-baseline justify-between">
        <span class="font-mono text-[11px] uppercase tracking-[0.18em] text-fog-500">CPU · GPU</span>
        <span class="font-mono text-sm tabular-nums" classList={{ "text-fog-500": !active(), "text-glyph-400": active() }}>
          {Math.round(instant() * 100)}%
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} class="w-full" role="img"
        aria-label="An activity trace resting at zero, spiking to its instantaneous cost only at the moment of an event">
        {/* zero baseline */}
        <line x1={PADX} y1={FLOOR} x2={W - PADX} y2={FLOOR} stroke="var(--color-ink-700)" stroke-width="1" stroke-dasharray="2 4" />
        <text x={PADX} y={FLOOR - 5} class="fill-fog-500 font-mono" style="font-size:9px">0% · idle</text>

        {/* the trace: needles that snap back to the floor */}
        <polyline points={pointsFor(win())} fill="none" stroke="var(--color-glyph-500)"
          stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

        {/* event labels travel with their spikes */}
        {events().map((e) => (
          <text x={clampLabel(xAt(e.i))} y={yAt(e.s.v) - 8} text-anchor="middle" class="fill-star-300 font-mono" style="font-size:9px">{e.s.tag}</text>
        ))}

        {/* "now": the live reading at the right edge */}
        <line x1={xAt(WINDOW - 1)} y1={CEIL - 4} x2={xAt(WINDOW - 1)} y2={FLOOR}
          stroke="var(--color-ink-600)" stroke-width="1" stroke-dasharray="2 3" />
        <circle cx={xAt(WINDOW - 1)} cy={yAt(instant())} r="3.5"
          fill={active() ? "var(--color-glyph-400)" : "var(--color-ink-600)"}
          data-blink style={visible() && active() ? "animation: blink .6s ease-in-out" : ""} />
        <text x={xAt(WINDOW - 1)} y={FLOOR + 14} text-anchor="middle" class="fill-fog-500 font-mono" style="font-size:8px">now</text>
      </svg>

      <p class="mt-4 text-center font-mono text-[11px] leading-relaxed text-fog-400">
        no dirty bit, no frame · the needle is zero between events
      </p>
    </div>
  );
}
