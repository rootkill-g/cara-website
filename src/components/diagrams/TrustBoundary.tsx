import { useInView } from "../useInView";

// §5.17, made visible. The renderer is the hostile input source the whole
// design posits, so the host treats every renderer-supplied byte (frame slots,
// atlas stream, cursor words, IPC envelopes) as attacker-controlled. Its
// display-list consumer is a validating parser, not a trusting cast: lengths
// bounded, indices range-checked, each field read once. A well-formed run flows
// through to paint; an out-of-bounds run is refused at the gate.
//
// Side-by-side on wide screens; stacked top-to-bottom on phones, where the wide
// SVG would only scale down to an illegible size.
export default function TrustBoundary() {
  const { ref, visible } = useInView();
  const flow = (dur: string) => (visible() ? `animation: flow-dash ${dur} linear infinite` : "");

  // checks live inside the wide gate box (centered at x=340, ~210 wide)
  const checks = ["command_bytes ≤ slot", "index < capacity", "rect ⊂ viewport", "read once into a local"];

  // a short vertical animated connector for the stacked phone layout
  const VSeam = (p: { color: string }) => (
    <svg viewBox="0 0 12 44" class="h-10 w-3 shrink-0" aria-hidden="true">
      <line x1="6" y1="2" x2="6" y2="42" stroke="var(--color-ink-700)" stroke-width="5" stroke-linecap="round" />
      <line x1="6" y1="2" x2="6" y2="42" stroke={p.color} stroke-width="2.5" stroke-linecap="round"
        stroke-dasharray="5 12" data-flow style={flow("2.4s")} />
    </svg>
  );

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-4 sm:p-6">
      {/* wide screens: renderer → gate → host, left to right */}
      <svg viewBox="0 0 680 250" class="mx-auto hidden w-full max-w-3xl sm:block" role="img"
        aria-label="Hostile renderer bytes meeting a validating parser gate before reaching the trusted host">
        {/* renderer — hostile */}
        <rect x="16" y="90" width="150" height="120" rx="14" fill="var(--color-ink-850)"
          stroke="var(--color-glyph-500)" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.95" />
        <text x="91" y="140" text-anchor="middle" class="fill-paper" style="font-size:15px;font-weight:600">Renderer</text>
        <text x="91" y="164" text-anchor="middle" class="fill-glyph-400 font-mono" style="font-size:10px">hostile by design</text>
        <text x="91" y="186" text-anchor="middle" class="fill-fog-500" style="font-size:10px">emits frame bytes</text>

        {/* the gate — wide enough for the monospace checks */}
        <rect x="235" y="40" width="210" height="196" rx="14" fill="var(--color-ink-850)"
          stroke="var(--color-star-500)" stroke-width="1.5" />
        <text x="340" y="72" text-anchor="middle" class="fill-star-300 font-mono" style="font-size:12px;letter-spacing:.18em">VALIDATE</text>
        {checks.map((c, i) => (
          <text x="340" y={104 + i * 24} text-anchor="middle" class="fill-fog-400 font-mono" style="font-size:11px">{c}</text>
        ))}
        <text x="340" y={104 + 4 * 24} text-anchor="middle" class="fill-fog-500 font-mono" style="font-size:9.5px">then @ptrCast in place</text>

        {/* host — trusted */}
        <rect x="514" y="90" width="150" height="120" rx="14" fill="var(--color-ink-850)"
          stroke="var(--color-star-500)" stroke-width="1.5" opacity="0.95" />
        <text x="589" y="140" text-anchor="middle" class="fill-paper" style="font-size:15px;font-weight:600">Host</text>
        <text x="589" y="164" text-anchor="middle" class="fill-star-300 font-mono" style="font-size:10px">trusted</text>
        <text x="589" y="186" text-anchor="middle" class="fill-fog-500" style="font-size:10px">paints validated</text>

        {/* renderer → gate (all bytes, hostile) */}
        <line x1="166" y1="150" x2="235" y2="150" stroke="var(--color-ink-700)" stroke-width="6" stroke-linecap="round" />
        <line x1="166" y1="150" x2="235" y2="150" stroke="var(--color-glyph-500)" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="5 14" data-flow style={flow("2.4s")} />

        {/* gate → host (validated only) */}
        <line x1="445" y1="150" x2="514" y2="150" stroke="var(--color-ink-700)" stroke-width="6" stroke-linecap="round" />
        <line x1="445" y1="150" x2="514" y2="150" stroke="var(--color-star-500)" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="5 14" data-flow style={flow("2.4s")} />
        <text x="479" y="140" text-anchor="middle" class="fill-fog-500" style="font-size:9px">in bounds ▸</text>

        {/* a rejected, out-of-bounds run: rises toward the gate, then recoils */}
        <g data-reject style={visible() ? "animation: reject 2.4s ease-in-out infinite" : "opacity:0"}>
          <rect x="184" y="112" width="16" height="16" rx="2" fill="none" stroke="#c2554f" stroke-width="1.5" />
          <text x="192" y="124" text-anchor="middle" style="font-size:11px;fill:#c2554f">✕</text>
        </g>
        <text x="200" y="104" text-anchor="middle" class="font-mono" style="font-size:9px;fill:#c2554f">refused</text>
      </svg>

      {/* phones: renderer → gate → host, stacked top-to-bottom */}
      <div class="sm:hidden" role="img"
        aria-label="Hostile renderer bytes meeting a validating parser gate before reaching the trusted host">
        {/* renderer — hostile */}
        <div class="mx-auto max-w-[300px] rounded-xl border border-dashed border-glyph-500/95 bg-ink-850 px-4 py-3 text-center">
          <p class="text-sm font-semibold text-paper">Renderer</p>
          <p class="mt-1 font-mono text-[10px] text-glyph-400">hostile by design</p>
          <p class="mt-0.5 text-[10px] text-fog-500">emits frame bytes</p>
        </div>

        {/* renderer → gate, with a refused run recoiling off the gate */}
        <div class="relative flex justify-center">
          <VSeam color="var(--color-glyph-500)" />
          <div class="absolute left-1/2 top-1 ml-5 flex items-center gap-1.5"
            data-reject style={visible() ? "animation: reject-y 2.4s ease-in-out infinite" : "opacity:0"}>
            <span class="flex h-4 w-4 items-center justify-center rounded-[2px] border text-[9px]"
              style="color:#c2554f;border-color:#c2554f">✕</span>
            <span class="font-mono text-[9px]" style="color:#c2554f">refused</span>
          </div>
        </div>

        {/* the gate */}
        <div class="mx-auto max-w-[300px] rounded-xl border border-star-500 bg-ink-850 px-4 py-4 text-center">
          <p class="font-mono text-xs tracking-[0.18em] text-star-300">VALIDATE</p>
          <div class="mt-2 space-y-1.5 font-mono text-[11px] text-fog-400">
            {checks.map((c) => (
              <p>{c}</p>
            ))}
          </div>
          <p class="mt-2 font-mono text-[9.5px] text-fog-500">then @ptrCast in place</p>
        </div>

        {/* gate → host (validated only) — label beside the connector, matching
            "refused" above and the wide-screen layout */}
        <div class="relative flex justify-center">
          <VSeam color="var(--color-star-500)" />
          <p class="absolute left-1/2 top-1/2 ml-5 -translate-y-1/2 whitespace-nowrap text-[10px] text-fog-500">in bounds ▾</p>
        </div>

        {/* host — trusted */}
        <div class="mx-auto max-w-[300px] rounded-xl border border-star-500/95 bg-ink-850 px-4 py-3 text-center">
          <p class="text-sm font-semibold text-paper">Host</p>
          <p class="mt-1 font-mono text-[10px] text-star-300">trusted</p>
          <p class="mt-0.5 text-[10px] text-fog-500">paints validated</p>
        </div>
      </div>

      <p class="mt-2 text-center text-sm leading-relaxed text-fog-400 sm:mt-4">
        Robust to a mutating producer: each field is read once into a local, the arithmetic bounded so the
        worst case is garbage pixels, never an out-of-bounds access. Zero-copy kept, memory safety not conceded.
      </p>
    </div>
  );
}
