import { useInView } from "../useInView";

// §5.17, made visible. The renderer is the hostile input source the whole
// design posits, so the host treats every renderer-supplied byte (frame slots,
// atlas stream, cursor words, IPC envelopes) as attacker-controlled. Its
// display-list consumer is a validating parser, not a trusting cast: lengths
// bounded, indices range-checked, each field read once. A well-formed run flows
// through to paint; an out-of-bounds run is refused at the gate.
export default function TrustBoundary() {
  const { ref, visible } = useInView();
  const flow = (dur: string) => (visible() ? `animation: flow-dash ${dur} linear infinite` : "");

  // checks live inside the wide gate box (centered at x=340, ~210 wide)
  const checks = ["command_bytes ≤ slot", "index < capacity", "rect ⊂ viewport", "read once into a local"];

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-4 sm:p-6">
      <svg viewBox="0 0 680 250" class="mx-auto w-full max-w-3xl" role="img"
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

      <p class="mt-2 text-center text-sm leading-relaxed text-fog-400 sm:mt-4">
        Robust to a mutating producer: each field is read once into a local, the arithmetic bounded so the
        worst case is garbage pixels, never an out-of-bounds access. Zero-copy kept, memory safety not conceded.
      </p>
    </div>
  );
}
