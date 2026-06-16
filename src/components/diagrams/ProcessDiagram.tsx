import { useInView } from "../useInView";

// Two processes, two channels. The renderer (sandboxed, per origin) produces
// display lists that flow over shared memory (latest-wins frame slots) to the
// host (privileged); small control messages flow both ways over the IPC
// channel. The dashes show the direction of flow without a line of code.
export default function ProcessDiagram() {
  const { ref, visible } = useInView();
  const flow = (dur: string, reverse = false) =>
    visible()
      ? `animation: flow-dash ${dur} linear infinite${reverse ? " reverse" : ""}`
      : "";

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-4 sm:p-6">
      <svg viewBox="0 0 640 300" class="w-full" role="img" aria-label="Renderer and host processes connected by a shared-memory ring and an IPC control channel">
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
    </div>
  );
}
