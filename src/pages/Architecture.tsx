import { For } from "solid-js";
import { Section, Eyebrow } from "../components/ui";
import ProcessDiagram from "../components/diagrams/ProcessDiagram";
import RingDiagram from "../components/diagrams/RingDiagram";
import Stepper from "../components/diagrams/Stepper";

const rendererParts: [string, string][] = [
  ["Glyph parser", "Single-pass, zero-allocation parse of a page."],
  ["Lua runtime", "Page behavior, safe behind the OS sandbox."],
  ["Reactivity", "Signals and bindings; mutations mark what is dirty."],
  ["Scene graph", "A dense, cache-friendly tree of everything visible."],
  ["Systems", "Style, then strict-box layout, then paint, then a11y."],
  ["Text pipeline", "Bidi, line-breaking, shaping, and rasterization."],
  ["Display-list writer", "Serializes paint output into the shared ring."],
];

const hostParts: [string, string][] = [
  ["Window + events", "The OS window and the raw input stream."],
  ["Process spawner", "Launches one renderer per origin."],
  ["Display-list executor", "Reads the ring, submits draw commands to the GPU."],
  ["GPU", "Framebuffer plus a parallel ID buffer for hit-testing."],
  ["Hit-test", "Reads one ID-buffer pixel — O(1), correct under overlap."],
  ["Net · storage · clipboard", "HTTP/2, per-origin storage, the system clipboard."],
  ["Accessibility bridge", "Projects the a11y tree to platform APIs."],
];

const messages: [string, string, string][] = [
  ["SpawnRenderer", "host (internal)", "Create a renderer for an origin"],
  ["LoadPage", "host → renderer", "Deliver the page bundle"],
  ["Fetch / FetchResult", "renderer ⇄ host", "Network request and response"],
  ["StorageOp / StorageResult", "renderer ⇄ host", "Key-value read / write"],
  ["InputEvent", "host → renderer", "Input, with the hit entity pre-resolved"],
  ["FrameReady", "renderer → host", "Display list ready (offset, length)"],
  ["FrameDone", "host → renderer", "Frame presented"],
  ["A11yUpdate", "renderer → host", "Accessibility tree projection"],
  ["Resize", "host → renderer", "Viewport changed"],
  ["ProcessHealthcheck", "host ⇄ renderer", "Liveness"],
];

const lifecycle = [
  { title: "Fetch", body: "The host negotiates HTTP/2 and TLS and retrieves the page bundle." },
  { title: "Spawn & deliver", body: "The host spawns a renderer for the origin and sends the bundle over IPC." },
  { title: "Parse", body: "The renderer parses the page in one zero-allocation pass." },
  { title: "Build", body: "The scene graph is constructed and the initial dirty flags are set." },
  { title: "Style", body: "Utility tokens are resolved into concrete values during the parse." },
  { title: "Script", body: "The Lua entry script registers signals, bindings, and handlers." },
  { title: "First frame", body: "Layout, then paint, then the display list, then a11y — the page appears." },
  { title: "Render", body: "The host acquires the new head, walks the list, submits to the GPU, presents." },
  { title: "Input loop", body: "An OS event resolves to an entity, dispatches, marks dirty, draws the next frame." },
];

function ProcessCard(props: { label: string; sub: string; parts: [string, string][]; accent?: boolean }) {
  return (
    <div class={`rounded-2xl border p-6 ${props.accent ? "border-glyph-500/30 bg-glyph-500/5" : "border-star-500/25 bg-ink-900/60"}`}>
      <div class="flex items-baseline justify-between">
        <h3 class="font-mono text-sm uppercase tracking-[0.2em] text-paper">{props.label}</h3>
        <span class="font-mono text-xs text-fog-500">{props.sub}</span>
      </div>
      <ul class="mt-5 space-y-3">
        <For each={props.parts}>
          {([name, desc]) => (
            <li class="border-l-2 border-ink-700 pl-4">
              <p class="text-sm font-medium text-fog-200">{name}</p>
              <p class="text-sm leading-relaxed text-fog-500">{desc}</p>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

export default function Architecture() {
  return (
    <>
      <Section class="pt-28 pb-10">
        <Eyebrow>Architecture</Eyebrow>
        <h1 class="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl">
          A privileged host. A sandboxed renderer. Two channels between them.
        </h1>
        <p class="mt-7 max-w-2xl text-lg leading-relaxed text-fog-300">
          Every decision in Cara lives inside one of two operating-system
          processes, or describes how the two talk. That split is the security
          boundary, the performance boundary, and the conceptual boundary all at
          once.
        </p>
      </Section>

      <Section class="py-8">
        <ProcessDiagram />
      </Section>

      {/* the two processes */}
      <Section class="py-10">
        <div class="grid gap-5 lg:grid-cols-2">
          <ProcessCard label="Renderer" sub="sandboxed · per origin" parts={rendererParts} accent />
          <ProcessCard label="Host" sub="privileged · owns the OS" parts={hostParts} />
        </div>

        <div class="mt-5 grid gap-5 md:grid-cols-2">
          <div class="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
            <h3 class="text-base font-medium text-paper">Shared-memory ring</h3>
            <p class="mt-2 text-sm leading-relaxed text-fog-400">
              Bulk per-frame display lists, mapped read-write into both
              processes. No per-frame copies cross between them. The producer
              publishes; the consumer drains — and the ordering rule below keeps
              that safe.
            </p>
          </div>
          <div class="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
            <h3 class="text-base font-medium text-paper">IPC control channel</h3>
            <p class="mt-2 text-sm leading-relaxed text-fog-400">
              Small typed messages over a Unix socket. No pointers ever cross the
              boundary: resources are host-assigned integer IDs, and variable
              data is referenced by its byte offset from the ring's base.
            </p>
          </div>
        </div>
      </Section>

      {/* the ring + ordering rule */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>The one rule that cannot be broken</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Release on write. Acquire on read. Never relaxed.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              The renderer writes draw commands into the ring, then publishes the{" "}
              <span class="text-glyph-300">head</span> cursor with a single
              release-store. The host acquires that cursor before it reads, which
              guarantees the writes are visible first. The consumer's{" "}
              <span class="text-star-300">tail</span> chases the head around the
              ring forever.
            </p>
            <p class="mt-4 text-base leading-relaxed text-fog-300">
              Cursor arithmetic wraps, and raw cursors are never compared with
              less-than. This is the single invariant that, if violated, produces
              intermittent corruption that is almost impossible to reproduce.
            </p>
          </div>
          <RingDiagram />
        </div>
      </Section>

      {/* IPC message catalog */}
      <Section class="border-t border-ink-800 py-16">
        <Eyebrow>The control channel</Eyebrow>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Twelve message types. That is the whole catalog.
        </h2>
        <div class="mt-8 overflow-hidden rounded-2xl border border-ink-700">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-ink-850 text-left font-mono text-xs uppercase tracking-[0.18em] text-fog-500">
                <th class="px-5 py-3 font-normal">Message</th>
                <th class="px-5 py-3 font-normal">Direction</th>
                <th class="px-5 py-3 font-normal">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <For each={messages}>
                {([msg, dir, purpose]) => (
                  <tr class="border-t border-ink-800">
                    <td class="px-5 py-3 font-mono text-fog-200">{msg}</td>
                    <td class="px-5 py-3 font-mono text-xs text-fog-500">{dir}</td>
                    <td class="px-5 py-3 text-fog-400">{purpose}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Section>

      {/* lifecycle */}
      <Section class="border-t border-ink-800 py-16 pb-28">
        <div class="grid gap-12 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <Eyebrow>How a page loads</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Steps one to seven run once. Eight and nine are the steady state.
            </h2>
          </div>
          <Stepper steps={lifecycle} />
        </div>
      </Section>
    </>
  );
}
