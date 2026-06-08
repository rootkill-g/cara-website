import { For, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { Section, Eyebrow, Pill } from "../components/ui";
import CaraScene from "../scene/CaraScene";
import ProcessDiagram from "../components/diagrams/ProcessDiagram";

const pillars = [
  {
    title: "One language for structure",
    body: "Pages are written in Glyph, a small declarative grammar. No quirks mode, no compatibility tax.",
  },
  {
    title: "One language for behavior",
    body: "Logic lives in Lua, sandboxed. Documents declare. Code stays behind a single $.",
  },
  {
    title: "One render path",
    body: "Scene graph → display list → shared memory → screen. Two channels, no third.",
  },
];

const refuses = [
  "No HTML, and so none of its error-correcting state machines.",
  "No DOM, no CSS cascade, no quirks mode.",
  "No JavaScript runtime baked into the page.",
  "No telemetry, no phone-home, no analytics.",
  "No marketplace, no extension store, no add-on economy.",
  "No opinion about what your homepage should be.",
];

const roadmap = [
  { n: "01", title: "The ring", tone: "live" as const, body: "Framed shared-memory channel, strict Release/Acquire. Done, unit-tested." },
  { n: "02", title: "Wire protocols", tone: "live" as const, body: "Draw-command vocabulary and the IPC control socket. Frames signal over the channel, the busy-wait is gone." },
  { n: "03", title: "Host renderer", tone: "soon" as const, body: "A wgpu surface clears and presents, the first DrawRect on screen. ID buffer and O(1) hit-test next." },
  { n: "04", title: "Text", tone: "plan" as const, body: "Glyph atlas, with bidi, line-breaking, shaping, raster." },
  { n: "05", title: "Renderer brain", tone: "plan" as const, body: "Scene-graph engine, parser, style, layout, paint." },
  { n: "06", title: "Interactivity", tone: "plan" as const, body: "Lua bindings, reactivity, events, components." },
];

export default function Home() {
  const [ready, setReady] = createSignal(false);

  return (
    <>
      {/* ── Cinematic hero ─────────────────────────────────────────────── */}
      <section class="relative h-dvh min-h-[640px] w-full overflow-hidden">
        <CaraScene class="absolute inset-0 h-full w-full" onReveal={() => setReady(true)} />

        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 pb-[10vh] text-center transition-opacity duration-1000 sm:pb-0"
          style={{ opacity: ready() ? "1" : "0" }}
        >
          <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-glyph-400 sm:text-xs sm:tracking-[0.3em]">
            A from-scratch browser engine · written in Zig
          </p>
          <h1 class="font-mono uppercase mt-4 max-w-3xl text-2xl text-glyph-400 font-medium leading-[1.12] tracking-tight text-paper drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)] sm:mt-5 sm:text-4xl sm:leading-[1.08]">
            Let's <span class="text-glyph-500">rewrite</span> the internet
          </h1>
          <p class="mt-5 max-w-xl text-sm leading-relaxed text-fog-300 sm:mt-6 sm:text-lg">
            We gathered around a different fire <br />
            Not to patch the old web, but to rewrite it
          </p>
          <div class="pointer-events-auto mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
            <A
              href="/architecture"
              class="rounded-lg bg-glyph-500 px-5 py-3 text-center text-sm font-medium text-ink-950 transition hover:bg-glyph-400 sm:py-2.5 font-mono text-glyph-500 uppercase"
            >
              Read the Architecture
            </A>
            <A
              href="/glyph"
              class="rounded-lg border border-ink-600 bg-ink-950/40 px-5 py-3 text-center text-sm font-medium text-fog-200 backdrop-blur-sm transition hover:border-fog-400 hover:text-paper sm:py-2.5 font-mono text-glyph-500 uppercase"
            >
              See the Glyph language
            </A>
          </div>
        </div>

        <div
          class="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-fog-500 transition-opacity duration-1000"
          style={{ opacity: ready() ? "1" : "0" }}
        >
          <span class="anim-float inline-block">scroll ↓</span>
        </div>
      </section>

      {/* ── Manifesto ──────────────────────────────────────────────────── */}
      <Section class="border-t border-ink-800 py-20 sm:py-28">
        <div class="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Thesis</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Stop patching the past. Let's rewrite the internet.
            </h2>
          </div>
          <div class="space-y-5 text-base leading-relaxed text-fog-300">
            <p>
              The web is thirty years of patches on patches. HTML, CSS, and
              JavaScript still drag every compromise ever shipped, haunted by
              ghosts no one would choose today. You can't refactor your way out.
              You light a new fire.
            </p>
            <p>
              Cara is that fire. A browser small enough to read end to end, built
              for the people who write and read pages, not the few who own the
              engines. Not a simpler web. An internet worth calling an evolution.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Pillars ────────────────────────────────────────────────────── */}
      <Section class="py-16">
        <div class="grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 md:grid-cols-3">
          <For each={pillars}>
            {(p) => (
              <div class="bg-ink-900/80 p-8">
                <h3 class="text-lg font-medium text-paper">{p.title}</h3>
                <p class="mt-3 text-sm leading-relaxed text-fog-400">{p.body}</p>
              </div>
            )}
          </For>
        </div>
      </Section>

      {/* ── What it refuses ────────────────────────────────────────────── */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Deliberately absent</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Most of a browser is what it agrees to carry.
            </h2>
            <p class="mt-5 text-sm leading-relaxed text-fog-500">
              Like Tails leaving no trace and Tor trusting no relay, Cara's
              strength is in what it declines.
            </p>
          </div>
          <ul class="grid gap-3 sm:grid-cols-2">
            <For each={refuses}>
              {(item) => (
                <li class="flex gap-3 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 text-sm leading-relaxed text-fog-300">
                  <span class="select-none text-glyph-500">—</span>
                  <span>{item}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Section>

      {/* ── Architecture teaser ────────────────────────────────────────── */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>Architecture</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Two processes. Two channels. No third.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              A privileged <strong class="text-fog-200">host</strong> owns every
              OS resource: the window, GPU, network, storage. A sandboxed{" "}
              <strong class="text-fog-200">renderer</strong>, one per origin,
              turns a page into a display list. Bulk per-frame data flows through
              a shared-memory ring. Small control messages flow over an IPC
              channel. A renderer compromise stays trapped behind the sandbox.
            </p>
            <A
              href="/architecture"
              class="mt-7 inline-block text-sm font-medium text-glyph-400 transition hover:text-glyph-500"
            >
              The full design →
            </A>
          </div>
          <ProcessDiagram />
        </div>
      </Section>

      {/* ── Glyph teaser ───────────────────────────────────────────────── */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div class="order-2 md:order-1 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700">
            <For
              each={[
                ["Nodes", "Lowercase are primitives. Capitalized are your components."],
                ["Utilities", "Dot-prefixed style tokens, mapped at compile time."],
                ["Attributes", "key=\"value\", or $name for a Lua binding."],
                ["Children", "Live in braces. Braces are authoritative."],
              ]}
            >
              {([t, d]) => (
                <div class="bg-ink-900/80 p-5">
                  <p class="text-sm font-medium text-paper">{t}</p>
                  <p class="mt-1.5 text-xs leading-relaxed text-fog-500">{d}</p>
                </div>
              )}
            </For>
          </div>
          <div class="order-1 md:order-2">
            <Eyebrow>The document language</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Pages are written in Glyph.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              Four grammar rules. That is the entire language. A glyph is an
              inscribed mark, named for what it produces. It keeps the parts of
              Markdown and component systems that work, and discards the rest.
              Invalid input is a parse error with a position, never a guess.
            </p>
            <A
              href="/glyph"
              class="mt-7 inline-block text-sm font-medium text-glyph-400 transition hover:text-glyph-500"
            >
              Learn the grammar →
            </A>
          </div>
        </div>
      </Section>

      {/* ── Mantra ─────────────────────────────────────────────────────── */}
      <Section class="border-t border-ink-800 py-20">
        <Eyebrow>The mantra</Eyebrow>
        <blockquote class="mt-7 max-w-3xl space-y-1 font-mono text-sm leading-relaxed text-fog-300 sm:text-base">
          <p>One language for structure (Glyph).</p>
          <p>One language for behavior (Lua).</p>
          <p>One vocabulary for style (utilities).</p>
          <p>One layout algorithm (strict-box).</p>
          <p>One data structure for everything visible (the scene graph).</p>
          <p>One render path. One reactive primitive. One sandbox boundary.</p>
          <p>No pointers across the boundary. No accreted legacy in any layer.</p>
          <p class="pt-3 text-paper">
            One person should be able to hold this in their head.
          </p>
        </blockquote>
      </Section>

      {/* ── Roadmap ────────────────────────────────────────────────────── */}
      <Section class="border-t border-ink-800 py-20 pb-28">
        <div class="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Status</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Built up, never out.
            </h2>
          </div>
          <p class="hidden max-w-xs text-sm leading-relaxed text-fog-500 sm:block">
            Each layer sits on a proven one. The ring is real and tested, and
            the first frames now reach the GPU.
          </p>
        </div>

        <ol class="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-3">
          <For each={roadmap}>
            {(item) => (
              <li class="bg-ink-900/80 p-6">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-xs text-fog-500">{item.n}</span>
                  <Pill tone={item.tone}>
                    {item.tone === "live"
                      ? "Done"
                      : item.tone === "soon"
                        ? "In progress"
                        : "Planned"}
                  </Pill>
                </div>
                <h3 class="mt-4 text-base font-medium text-paper">{item.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-fog-400">{item.body}</p>
              </li>
            )}
          </For>
        </ol>
      </Section>
    </>
  );
}
