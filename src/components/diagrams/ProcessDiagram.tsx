import { useInView } from "../useInView";

// Two processes, two channels. The renderer (sandboxed, per origin) produces
// display lists that flow over shared memory (latest-wins frame slots) to the
// host (privileged); small control messages flow both ways over the IPC
// channel. The dashes show the direction of flow without a line of code.
//
// Two layouts share one source of truth: a side-by-side SVG on wide screens,
// and a vertically stacked div layout on phones (the wide SVG only scales down,
// so on a narrow screen its text turns illegibly small). The phone layout flows
// top-to-bottom: renderer, the two channels, host.
export default function ProcessDiagram() {
  const { ref, visible } = useInView();
  const flow = (dur: string, reverse = false) =>
    visible()
      ? `animation: flow-dash ${dur} linear infinite${reverse ? " reverse" : ""}`
      : "";

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-4 sm:p-6">
      {/* wide screens: renderer and host side by side */}
      <svg viewBox="0 0 640 300" class="hidden w-full sm:block" role="img" aria-label="Renderer and host processes connected by a shared-memory ring and an IPC control channel">
        {/* sandbox boundary around the renderer */}
        <rect x="14" y="40" width="240" height="220" rx="16" fill="none"
          stroke="var(--color-star-600)" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.7" />
        <text x="134" y="30" text-anchor="middle" class="fill-star-400 font-mono" style="font-size:11px;letter-spacing:.18em">SANDBOX</text>

        {/* renderer node */}
        <rect x="34" y="78" width="200" height="144" rx="14" fill="var(--color-ink-850)"
          stroke="var(--color-glyph-500)" stroke-width="1.5" opacity="0.95" />
        <text x="134" y="120" text-anchor="middle" class="fill-paper" style="font-size:17px;font-weight:600">Renderer</text>
        <text x="134" y="146" text-anchor="middle" class="fill-fog-400" style="font-size:12px">one per origin</text>
        <text x="134" y="186" text-anchor="middle" class="fill-fog-500" style="font-size:11px">parses · styles · lays out</text>
        <text x="134" y="204" text-anchor="middle" class="fill-fog-500" style="font-size:11px">paints → display list</text>

        {/* host node */}
        <rect x="406" y="78" width="200" height="144" rx="14" fill="var(--color-ink-850)"
          stroke="var(--color-star-500)" stroke-width="1.5" opacity="0.95" />
        <text x="506" y="120" text-anchor="middle" class="fill-paper" style="font-size:17px;font-weight:600">Host</text>
        <text x="506" y="146" text-anchor="middle" class="fill-fog-400" style="font-size:12px">privileged · owns the OS</text>
        <text x="506" y="186" text-anchor="middle" class="fill-fog-500" style="font-size:11px">window · GPU · network</text>
        <text x="506" y="204" text-anchor="middle" class="fill-fog-500" style="font-size:11px">consumes → presents</text>

        {/* shared-memory channel: renderer → host */}
        <text x="320" y="104" text-anchor="middle" class="fill-glyph-400 font-mono" style="font-size:10px;letter-spacing:.12em">SHARED MEMORY · SLOTS</text>
        <line x1="234" y1="122" x2="406" y2="122" stroke="var(--color-ink-700)" stroke-width="6" stroke-linecap="round" />
        <line x1="234" y1="122" x2="406" y2="122" stroke="var(--color-glyph-500)" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="6 16" data-flow style={flow("3s")} />
        <text x="320" y="140" text-anchor="middle" class="fill-fog-500" style="font-size:10px">display lists ▸</text>

        {/* IPC channel: both directions */}
        <text x="320" y="184" text-anchor="middle" class="fill-star-400 font-mono" style="font-size:10px;letter-spacing:.12em">IPC CONTROL</text>
        <line x1="234" y1="200" x2="406" y2="200" stroke="var(--color-ink-700)" stroke-width="6" stroke-linecap="round" />
        <line x1="234" y1="200" x2="406" y2="200" stroke="var(--color-star-500)" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="5 18" data-flow style={flow("4s", true)} />
        <text x="320" y="220" text-anchor="middle" class="fill-fog-500" style="font-size:10px">◂ 13 typed messages ▸</text>
      </svg>

      {/* phones: stacked top-to-bottom so every label stays legible */}
      <div class="sm:hidden" role="img" aria-label="Renderer and host processes connected by a shared-memory ring and an IPC control channel">
        {/* sandbox boundary around the renderer */}
        <div class="relative mx-auto max-w-[320px] rounded-2xl border border-dashed border-star-600/70 px-3 pb-3 pt-6">
          <span class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-ink-900 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-star-400">Sandbox</span>
          <div class="rounded-xl border border-glyph-500/95 bg-ink-850 px-4 py-4 text-center">
            <p class="text-base font-semibold text-paper">Renderer</p>
            <p class="mt-1 text-xs text-fog-400">one per origin</p>
            <p class="mt-3 text-[11px] leading-relaxed text-fog-500">parses · styles · lays out</p>
            <p class="text-[11px] leading-relaxed text-fog-500">paints → display list</p>
          </div>
        </div>

        {/* the two channels run in PARALLEL between the boxes — shared memory
            carries display lists renderer → host, IPC control carries messages
            both ways — so each rail bridges renderer and host on its own, never
            in series. Colour ties each rail to its flanking label. */}
        <div class="flex items-stretch justify-center gap-2 py-1">
          <div class="flex flex-1 flex-col items-end justify-center">
            <div class="text-center">
              <p class="font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-glyph-400">Shared memory<br />·<br />Slots</p>
              <p class="mt-1 text-[10px] text-fog-500">display lists ▾</p>
            </div>
          </div>
          <svg viewBox="0 0 48 150" class="h-36 w-12 shrink-0" aria-hidden="true">
            {/* shared memory (renderer → host) */}
            <line x1="11" y1="3" x2="11" y2="147" stroke="var(--color-ink-700)" stroke-width="5" stroke-linecap="round" />
            <line x1="11" y1="3" x2="11" y2="147" stroke="var(--color-glyph-500)" stroke-width="2.5"
              stroke-linecap="round" stroke-dasharray="6 16" data-flow style={flow("3s")} />
            {/* IPC control (both directions) */}
            <line x1="37" y1="3" x2="37" y2="147" stroke="var(--color-ink-700)" stroke-width="5" stroke-linecap="round" />
            <line x1="37" y1="3" x2="37" y2="147" stroke="var(--color-star-500)" stroke-width="2.5"
              stroke-linecap="round" stroke-dasharray="5 18" data-flow style={flow("4s", true)} />
          </svg>
          <div class="flex flex-1 flex-col items-start justify-center">
            <div class="text-center">
              <p class="font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-star-400">IPC Control</p>
              <p class="mt-1 text-[10px] text-fog-500">▴ 13 typed messages ▾</p>
            </div>
          </div>
        </div>

        {/* host node */}
        <div class="mx-auto max-w-[320px] rounded-xl border border-star-500/95 bg-ink-850 px-4 py-4 text-center">
          <p class="text-base font-semibold text-paper">Host</p>
          <p class="mt-1 text-xs text-fog-400">privileged · owns the OS</p>
          <p class="mt-3 text-[11px] leading-relaxed text-fog-500">window · GPU · network</p>
          <p class="text-[11px] leading-relaxed text-fog-500">consumes → presents</p>
        </div>
      </div>
    </div>
  );
}
