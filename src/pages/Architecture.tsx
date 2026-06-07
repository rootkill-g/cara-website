import { For } from "solid-js";
import { Section, Eyebrow, CodeBlock } from "../components/ui";

const rendererParts: [string, string][] = [
  ["Glyph Parser", "Single-pass, zero-allocation recursive-descent parse of .glyph."],
  ["Lua Runtime", "LuaJIT, JIT on — safe behind the OS sandbox. Page behavior."],
  ["Reactivity", "signal / compute / bind; mutations set DirtyFlags."],
  ["Scene Graph", "ECS — entities are u32, hierarchy is first-child / next-sibling, dense SoA pools."],
  ["Systems", "Style → Strict-Box Layout → Paint → A11y."],
  ["Text Trinity", "SheenBidi (bidi), libunibreak (breaks), HarfBuzz (shaping), FreeType (raster)."],
  ["Display List Writer", "Serializes paint output into the shared-memory ring."],
];

const hostParts: [string, string][] = [
  ["Window + Event Pump", "The OS window and raw input events."],
  ["Process Spawner", "Launches one renderer per origin."],
  ["Display List Executor", "Reads the ring, submits draw commands to the GPU."],
  ["GPU", "Render backend, color framebuffer, and a parallel ID buffer for hit-testing."],
  ["Hit-Test", "Reads one ID-buffer pixel — O(1), correct under overlap and clipping by construction."],
  ["Net · Storage · Clipboard", "libcurl/HTTP-2, per-origin SQLite, system clipboard."],
  ["AccessKit Bridge", "Projects the a11y tree to platform APIs."],
];

const messages = [
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
  "Fetch — host negotiates HTTP/2 + TLS, retrieves the bundle.",
  "Spawn + deliver — host spawns a renderer, sends the bundle over IPC.",
  "Parse — renderer parses .glyph in one zero-allocation pass.",
  "Build — scene graph constructed, initial DirtyFlags set.",
  "Style — utility tokens resolved during the parse.",
  "Script — Lua entry script registers signals, bindings, handlers.",
  "First frame — layout → paint → display list → FrameReady → a11y.",
  "Render — host Acquire-loads head, walks the list, submits to GPU, presents.",
  "Input loop — OS event → ID-buffer read → InputEvent → dispatch → DirtyFlags → next frame.",
];

function ProcessCard(props: {
  label: string;
  sub: string;
  parts: [string, string][];
  accent?: boolean;
}) {
  return (
    <div
      class={`rounded-2xl border p-6 ${
        props.accent
          ? "border-glyph-500/30 bg-glyph-500/5"
          : "border-ink-700 bg-ink-900"
      }`}
    >
      <div class="flex items-baseline justify-between">
        <h3 class="font-mono text-sm uppercase tracking-[0.2em] text-paper">
          {props.label}
        </h3>
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
      <Section class="pt-20 pb-12">
        <Eyebrow>Architecture</Eyebrow>
        <h1 class="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl">
          A privileged host. A sandboxed renderer. Two channels between them.
        </h1>
        <p class="mt-7 max-w-2xl text-lg leading-relaxed text-fog-300">
          Every decision in Cara lives inside one of two OS processes, or
          describes how the two communicate. The split is the security boundary,
          the performance boundary, and the conceptual boundary all at once.
        </p>
      </Section>

      {/* The two processes */}
      <Section class="py-12">
        <div class="grid gap-5 lg:grid-cols-2">
          <ProcessCard
            label="Renderer"
            sub="sandboxed · per origin"
            parts={rendererParts}
            accent
          />
          <ProcessCard label="Host" sub="privileged · owns the OS" parts={hostParts} />
        </div>

        {/* Channels between them */}
        <div class="mt-5 grid gap-5 md:grid-cols-2">
          <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6">
            <h3 class="text-base font-medium text-paper">Shared-memory ring</h3>
            <p class="mt-2 text-sm leading-relaxed text-fog-400">
              Bulk per-frame display lists, mapped read-write into both
              processes. The producer Release-stores <code class="font-mono text-glyph-400">head</code>;
              the consumer Acquire-loads it. Never relaxed — relaxed ordering
              would let the consumer read uninitialized memory.
            </p>
          </div>
          <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6">
            <h3 class="text-base font-medium text-paper">IPC control channel</h3>
            <p class="mt-2 text-sm leading-relaxed text-fog-400">
              Small typed messages over a Unix socket. No pointers ever cross the
              boundary — resources are host-assigned integer IDs, variable data
              is referenced by byte offset from the ring base.
            </p>
          </div>
        </div>
      </Section>

      {/* IPC message catalog */}
      <Section class="border-t border-ink-800 py-16">
        <Eyebrow>The control channel</Eyebrow>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Twelve message types. That's the whole catalog.
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

      {/* Lifecycle */}
      <Section class="border-t border-ink-800 py-16">
        <div class="grid gap-12 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <Eyebrow>How a page loads</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Steps 1–7 run once. Steps 8–9 are the steady state.
            </h2>
          </div>
          <ol class="space-y-4">
            <For each={lifecycle}>
              {(step, i) => (
                <li class="flex gap-4">
                  <span class="font-mono text-sm text-glyph-500">
                    {String(i() + 1).padStart(2, "0")}
                  </span>
                  <span class="text-sm leading-relaxed text-fog-300">{step}</span>
                </li>
              )}
            </For>
          </ol>
        </div>
      </Section>

      {/* Ordering invariant */}
      <Section class="border-t border-ink-800 py-16 pb-24">
        <Eyebrow>The one rule that cannot be broken</Eyebrow>
        <h2 class="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Release on write, Acquire on read. Never relaxed.
        </h2>
        <p class="mt-5 max-w-2xl text-base leading-relaxed text-fog-300">
          The producer writes draw commands, then Release-stores the head
          cursor. The consumer Acquire-loads head, then reads. Cursor arithmetic
          is wrapping; raw cursors are never order-compared. This is the single
          invariant that, if violated, produces intermittent corruption that is
          nearly impossible to reproduce.
        </p>
        <div class="mt-8 max-w-2xl">
          <CodeBlock
            label="src/ipc/ring.zig — the publish point"
            code={`// producer: write payload, then publish with ONE release-store
@memcpy(payload[idx + record_header_size ..][0..len], record);
self.head +%= want;            // local cursor — not yet visible

pub fn commit(self: *Writer) void {
    @atomicStore(u32, &self.ring.header.head, self.head, .release);
}`}
          />
        </div>
      </Section>
    </>
  );
}
