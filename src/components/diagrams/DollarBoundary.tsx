import { useInView } from "../useInView";

// The single grammatical seam between document and code. `$name` is the only
// place Glyph references Luau. A click looks the name up in the page's Luau
// state; a missing function logs and drops the event, and the page does not crash.
export default function DollarBoundary() {
  const { ref, visible } = useInView();
  const flow = visible() ? "animation: flow-dash 2.5s linear infinite" : "";

  return (
    <div ref={ref} class="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 sm:p-8">
      <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        {/* document side */}
        <div class="rounded-xl border border-glyph-500/40 bg-glyph-500/5 px-5 py-4 text-center">
          <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-glyph-400">Document · Glyph</p>
          <p class="mt-2 font-mono text-sm text-fog-200">
            button … onClick=<span class="text-glyph-400">$save</span>
          </p>
        </div>

        {/* the seam */}
        <svg viewBox="0 0 160 60" class="h-12 w-40 shrink-0" aria-hidden="true">
          <line x1="6" y1="24" x2="154" y2="24" stroke="var(--color-ink-700)" stroke-width="4" stroke-linecap="round" />
          <line x1="6" y1="24" x2="154" y2="24" stroke="var(--color-glyph-500)" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="4 14" data-flow style={flow} />
          <text x="80" y="14" text-anchor="middle" class="fill-glyph-400 font-mono" style="font-size:13px;font-weight:700">$</text>
          <text x="80" y="46" text-anchor="middle" class="fill-fog-500 font-mono" style="font-size:9px">look up &amp; invoke</text>
          <path d="M150 24 l-8 -4 l0 8 z" fill="var(--color-glyph-400)" />
        </svg>

        {/* code side */}
        <div class="rounded-xl border border-star-500/40 bg-star-500/5 px-5 py-4 text-center">
          <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-star-400">Behavior · Luau</p>
          <p class="mt-2 font-mono text-sm text-fog-200">
            <span class="text-star-300">save</span> = function … end
          </p>
        </div>
      </div>

      <p class="mt-7 max-w-xl text-sm leading-relaxed text-fog-400">
        No <span class="text-fog-200">&lt;script&gt;</span> tag, no expression syntax, no template
        directive. The boundary is grammatical, not contextual: documents declare, computation
        lives in Luau, and exactly two characters cross between them.
      </p>
    </div>
  );
}
