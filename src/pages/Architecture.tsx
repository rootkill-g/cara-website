import { For } from "solid-js";
import { Section, Eyebrow, Reveal } from "../components/ui";
import ProcessDiagram from "../components/diagrams/ProcessDiagram";
import FrameSlots from "../components/diagrams/FrameSlots";
import AtlasStream from "../components/diagrams/AtlasStream";
import IdleMeter from "../components/diagrams/IdleMeter";
import TrustBoundary from "../components/diagrams/TrustBoundary";
import Stepper from "../components/diagrams/Stepper";

const rendererParts: [string, string][] = [
  ["Glyph parser", "Single-pass, zero-allocation parse of a page."],
  ["Luau runtime", "Page behavior, interpreter-only, with no executable memory."],
  ["Reactivity", "Signals and bindings. Mutations mark what is dirty."],
  ["Scene graph", "A dense, cache-friendly tree of everything visible."],
  ["Style · layout · paint", "Utility tokens, then strict-box layout, then paint."],
  ["Text + atlas", "Bidi, line-breaking, shaping, raster, and atlas layout."],
  ["Image decode", "Decoders stay jailed. Pixels travel the staging region."],
];

const hostParts: [string, string][] = [
  ["Window + events", "The OS window and the raw input stream."],
  ["Process spawner", "Launches one renderer per origin."],
  ["Validating consumer", "Reads the slots as a parser, never a trusting cast."],
  ["GPU", "Framebuffer plus a parallel ID buffer for hit-testing."],
  ["Hit-test", "Reads one ID-buffer pixel. O(1), correct under overlap."],
  ["Net · storage · clipboard", "HTTP/2, per-origin SQLite, the system clipboard."],
  ["Accessibility bridge", "Projects the a11y tree to platform APIs."],
];

const transports: [string, string, string][] = [
  ["Frame slots", "latest-wins · skippable", "Three fixed slots. The host paints the newest and skips the stale, never walking an intermediate frame."],
  ["Atlas stream", "exactly once · ordered", "Glyph bitmaps under a wrapping cursor. A skipped frame must never drop one, so they never ride inside a slot."],
  ["Image staging", "idempotent", "Decoded pixels by (id, offset, size). References repeat until UploadDone, so frame-skipping stays safe."],
  ["IPC socket", "13 typed messages", "Length-prefixed control, and the signaling layer itself: the host blocks on it and wakes the GUI thread."],
];

const messages: [string, string, string][] = [
  ["SpawnRenderer", "host (internal)", "Bring up a renderer for an origin"],
  ["LoadPage", "host → renderer", "Deliver the page bundle"],
  ["Fetch / FetchResult", "renderer ⇄ host", "Network; host-origin-enforced and SSRF-filtered"],
  ["StorageOp / StorageResult", "renderer ⇄ host", "Per-origin SQLite, bound to the assigned origin"],
  ["InputEvent", "host → renderer", "Input, with the generational hit entity pre-resolved"],
  ["FrameReady", "renderer → host", "A new slot is published, and carries wants_tick"],
  ["FrameTick", "host → renderer", "Vsync, only while armed. Paces animation"],
  ["UploadDone", "host → renderer", "Image staging consumed and reusable"],
  ["A11yUpdate", "renderer → host", "AccessKit tree projection"],
  ["Resize", "host → renderer", "Viewport, plus staging's new size"],
  ["ProcessHealthcheck", "host ⇄ renderer", "Liveness"],
];

const tcb = [
  "libcurl + HTTP/2 + TLS — the wire",
  "SQLite — the disk",
  "the GPU driver / wgpu-native",
  "AccessKit — the a11y tree",
];

const lifecycle = [
  { title: "Fetch", body: "The host negotiates HTTP/2 and TLS and retrieves the page bundle." },
  { title: "Spawn & deliver", body: "The host spawns a renderer for the origin and sends the bundle over IPC." },
  { title: "Parse", body: "The renderer parses the page in one zero-allocation pass." },
  { title: "Build", body: "The scene graph is constructed and the initial dirty flags are set." },
  { title: "Style", body: "Utility tokens are resolved into concrete values during the parse." },
  { title: "Script", body: "The Luau entry script registers signals, bindings, and handlers." },
  { title: "First frame", body: "Layout, then paint, then the display list into a slot. Publish, then the page appears." },
  { title: "Render", body: "The host takes the newest slot, drains the atlas, uploads images, encodes one pass, presents." },
  { title: "Idle", body: "Nothing dirty means no frame and no tick. Zero CPU until the next input wakes it." },
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
          once. No pointer ever crosses either channel.
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
      </Section>

      {/* the transports */}
      <Section class="border-t border-ink-800 py-16">
        <Eyebrow>The transports</Eyebrow>
        <h2 class="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Bulk data crosses shared memory. Control crosses a socket. There is no third.
        </h2>
        <div class="mt-9 grid gap-5 sm:grid-cols-2">
          <For each={transports}>
            {([name, kind, body], i) => (
              <Reveal delay={i() * 0.06}>
                <div class="h-full rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
                  <div class="flex items-baseline justify-between gap-3">
                    <h3 class="text-base font-medium text-paper">{name}</h3>
                    <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-glyph-400">{kind}</span>
                  </div>
                  <p class="mt-2.5 text-sm leading-relaxed text-fog-400">{body}</p>
                </div>
              </Reveal>
            )}
          </For>
        </div>
      </Section>

      {/* latest frame wins */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>The frame path</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Latest frame wins.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              Three fixed slots, not a stream. The renderer never blocks: it
              writes a back slot and publishes by exchanging one packed{" "}
              <span class="font-mono text-glyph-300">latest</span> word that holds
              the slot index, a dirty bit, and a generation.
            </p>
            <p class="mt-4 text-base leading-relaxed text-fog-300">
              The host checks <span class="text-glyph-300">dirty</span>, then
              exchange-takes the newest slot. A slow host paints only the freshest
              frame and skips the stale ones. It never walks a half-written or
              intermediate frame, because a slot is either fully published or not
              visible at all.
            </p>
          </div>
          <FrameSlots />
        </div>
      </Section>

      {/* release / acquire + the surviving cursor */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <AtlasStream />
          <div>
            <Eyebrow>The rule that cannot be broken</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Release on publish. Acquire on take. Never relaxed.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              The release half of the exchange publishes every frame byte written
              before it. The acquire half makes them visible. Relaxed ordering
              here is a data race that corrupts intermittently and is almost
              impossible to reproduce.
            </p>
            <p class="mt-4 text-base leading-relaxed text-fog-300">
              The frame path is replace-semantics, so it needs no cursors. The one
              place a wrapping cursor survived is the atlas stream: glyph bitmaps
              travel it exactly once, in order, under monotonic{" "}
              <span class="text-glyph-300">atlas_head</span> and{" "}
              <span class="text-star-300">atlas_tail</span>. A skipped frame must
              never drop a bitmap.
            </p>
          </div>
        </div>
      </Section>

      {/* idle is zero */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>Idle is zero</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              A browser nobody is looking at should cost nothing.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              There is no frame loop. A frame is produced only when a dirty flag is
              set, and the host paces animation over an armed FrameTick. Clean
              means no frame, no tick, no wakeup: zero CPU and zero GPU.
            </p>
            <p class="mt-4 text-base leading-relaxed text-fog-300">
              The only things that wake the system are input, an armed tick, and
              IPC traffic. The trace below rests on the floor and rises only on a
              real event.
            </p>
          </div>
          <IdleMeter />
        </div>
      </Section>

      {/* the renderer is hostile */}
      <Section class="border-t border-ink-800 py-20">
        <Eyebrow>The trust boundary</Eyebrow>
        <h2 class="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          The renderer is hostile. The host validates every byte it is handed.
        </h2>
        <p class="mt-5 max-w-2xl text-base leading-relaxed text-fog-300">
          A typed surface over hostile input is an attack surface, not a safety
          property. The renderer is exactly the hostile input the design posits,
          so frame slots, the atlas stream, the cursor words, and IPC envelopes
          are all treated as attacker-controlled and checked against host-owned
          bounds before use.
        </p>
        <div class="mt-9">
          <TrustBoundary />
        </div>

        <div class="mt-6 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div class="h-full rounded-2xl border border-star-500/25 bg-ink-900/60 p-6">
              <h3 class="text-base font-medium text-paper">No executable memory in the jail</h3>
              <p class="mt-2 text-sm leading-relaxed text-fog-400">
                Luau is interpreter-only, so the sandbox denies executable mappings
                outright. The renderer allocates no executable pages. Bytecode is
                never loaded across the trust boundary: Luau is always compiled
                from source inside the jail.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div class="h-full rounded-2xl border border-star-500/25 bg-ink-900/60 p-6">
              <h3 class="text-base font-medium text-paper">Fetch is origin-enforced and SSRF-filtered</h3>
              <p class="mt-2 text-sm leading-relaxed text-fog-400">
                The origin checked is the one the host assigned, never one the
                renderer names. Loopback, link-local, private, and metadata
                addresses are refused, and the resolved IP is pinned for the dial
                and re-checked after every redirect. DNS rebinding is closed.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div class="mt-5 rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
            <h3 class="text-base font-medium text-paper">The trusted base, named honestly</h3>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-fog-400">
              The parsers history punishes most (font shaping, image decode, script
              compile) are jailed in the renderer. But the host stays trusted, and
              inside it run vendored parsers that also touch hostile or persisted
              bytes. A memory-safety bug in any of these is direct host compromise.
              They are kept thin, and named rather than hidden:
            </p>
            <ul class="mt-4 flex flex-wrap gap-2.5">
              <For each={tcb}>
                {(item) => (
                  <li class="rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 font-mono text-xs text-fog-300">
                    {item}
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Reveal>
      </Section>

      {/* IPC message catalog */}
      <Section class="border-t border-ink-800 py-16">
        <Eyebrow>The control channel</Eyebrow>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Thirteen message types. That is the whole catalog.
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
