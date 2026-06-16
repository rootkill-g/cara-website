import { useInView } from "../useInView";

// The atlas stream: the one flow in the system that is genuinely a stream, and
// the only place a wrapping cursor survived the move to latest-wins frames.
// Glyph bitmaps travel exactly once, in order, under monotonic
// `atlas_head` / `atlas_tail` cursors (Release-advance, Acquire-load, wrapping
// `-%`). A skipped frame must never drop a bitmap, so bitmaps never ride inside
// frame slots — they ride here.
export default function AtlasStream() {
  const { ref, visible } = useInView();
  const spin = visible()
    ? "transform-origin:160px 150px;transform-box:view-box;animation:ring-spin 16s linear infinite"
    : "transform-origin:160px 150px;transform-box:view-box";

  const ticks = Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2);
  const R = 92;
  const cx = 160;
  const cy = 150;

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      <svg viewBox="0 0 320 320" class="mx-auto w-full max-w-sm" role="img"
        aria-label="A monotonic stream where the producer's atlas_head cursor leads the consumer's atlas_tail cursor, wrapping forever">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--color-ink-700)" stroke-width="10" />
        {ticks.map((a) => {
          const x1 = cx + Math.cos(a) * (R - 6);
          const y1 = cy + Math.sin(a) * (R - 6);
          const x2 = cx + Math.cos(a) * (R + 6);
          const y2 = cy + Math.sin(a) * (R + 6);
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-ink-600)" stroke-width="2" />;
        })}

        <g style={spin} data-spin>
          {/* the unread span: bitmaps appended but not yet drained */}
          <path d="M 84.6 97.2 A 92 92 0 0 1 160 58" fill="none"
            stroke="var(--color-glyph-500)" stroke-width="10" stroke-linecap="round" opacity="0.9" />
          <circle cx="160" cy="58" r="8" fill="var(--color-glyph-400)" />
          <circle cx="160" cy="58" r="8" fill="none" stroke="var(--color-glyph-400)" stroke-width="6" opacity="0.35"
            data-flow style={visible() ? "animation:pulse-soft 2.2s ease-in-out infinite" : ""} />
          <circle cx="84.6" cy="97.2" r="7" fill="var(--color-star-400)" />
        </g>

        <text x={cx} y={cy - 6} text-anchor="middle" class="fill-fog-300 font-mono" style="font-size:11px;letter-spacing:.08em">exactly once,</text>
        <text x={cx} y={cy + 12} text-anchor="middle" class="fill-fog-300 font-mono" style="font-size:11px;letter-spacing:.08em">in order</text>
      </svg>

      <div class="mt-4 flex justify-center gap-6 text-xs">
        <span class="flex items-center gap-2 text-fog-400">
          <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:var(--color-glyph-400)" /> atlas_head (renderer)
        </span>
        <span class="flex items-center gap-2 text-fog-400">
          <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:var(--color-star-400)" /> atlas_tail (host)
        </span>
      </div>
    </div>
  );
}
