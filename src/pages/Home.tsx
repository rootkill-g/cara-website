import { For, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { Section, Eyebrow, Pill } from "../components/ui";
import CaraScene from "../scene/CaraScene";
import ProcessDiagram from "../components/diagrams/ProcessDiagram";

const pillars = [
  {
    title: "One language for structure",
    body: "Pages are written in Glyph — a small declarative grammar with no quirks mode, no parser-as-state-machine, and no thirty-year compatibility tax to carry.",
  },
  {
    title: "One language for behavior",
    body: "Logic lives in Lua, sandboxed and budgeted. The document declares; computation stays in one place, reached through a single two-character seam.",
  },
  {
    title: "One render path",
    body: "Scene graph to display list to shared memory to screen. A renderer process produces; a privileged host consumes and paints. Two channels, no third.",
  },
];

const refuses = [
  "No HTML — and so none of its error-correcting state machines.",
  "No DOM, no CSS cascade, no quirks mode.",
  "No JavaScript runtime baked into the page.",
  "No telemetry, no phone-home, no analytics.",
  "No marketplace, no extension store, no add-on economy.",
  "No opinion about what your homepage should be.",
];

const roadmap = [
  { n: "01", title: "The ring", tone: "live" as const, body: "Framed shared-memory channel under strict Release/Acquire ordering. Done and unit-tested." },
  { n: "02", title: "Wire protocols", tone: "soon" as const, body: "The draw-command format and the IPC control channel; then kill the busy-wait." },
  { n: "03", title: "Host renderer", tone: "plan" as const, body: "GPU surface, framebuffer, an ID buffer, O(1) hit-testing, resize." },
  { n: "04", title: "Text", tone: "plan" as const, body: "A glyph atlas and the text pipeline: bidi, line-breaking, shaping, rasterization." },
  { n: "05", title: "Renderer brain", tone: "plan" as const, body: "The scene-graph engine, the Glyph parser, style, strict-box layout, paint." },
  { n: "06", title: "Interactivity", tone: "plan" as const, body: "Lua bindings, reactivity, event dispatch, the standard component library." },
];

export default function Home() {
  const [ready, setReady] = createSignal(false);

  return (
    <>
      {/* ── Cinematic hero ─────────────────────────────────────────────── */}
      <section class="relative h-dvh min-h-[640px] w-full overflow-hidden">
        <CaraScene class="absolute inset-0 h-full w-full" onIntroDone={() => setReady(true)} />

        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-1000"
          style={{ opacity: ready() ? "1" : "0" }}
        >
          <p class="font-mono text-[11px] uppercase tracking-[0.3em] text-glyph-400 sm:text-xs">
            A from-scratch browser engine · written in Zig
          </p>
          <h1 class="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-paper drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] sm:text-6xl">
            A browser that refuses to render the current web.
          </h1>
          <p class="mt-6 max-w-xl text-base leading-relaxed text-fog-300 sm:text-lg">
            We gathered around a different fire. No HTML, no DOM, no JavaScript
            runtime, no telemetry — just a small engine you can hold in your head.
          </p>
          <div class="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-4">
            <A
              href="/architecture"
              class="rounded-lg bg-glyph-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-glyph-400"
            >
              Read the architecture
            </A>
            <A
              href="/glyph"
              class="rounded-lg border border-ink-600 bg-ink-950/40 px-5 py-2.5 text-sm font-medium text-fog-200 backdrop-blur-sm transition hover:border-fog-400 hover:text-paper"
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
            <Eyebrow>The thesis</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              The web is what was built when no one was paying attention.
            </h2>
          </div>
          <div class="space-y-5 text-base leading-relaxed text-fog-300">
            <p>
              HTML, CSS, and JavaScript were not designed for the people writing
              pages. Three decades of standards committees and ad-funded browser
              vendors shaped them to keep the people who own the rendering
              engines in business. Cara is what happens when you stop accepting
              that as the only option.
            </p>
            <p>
              The whole project — the rendering engine, the browser built on it,
              and the channel between them — is small enough that one person can
              read all of it. That constraint is the feature: legibility over
              surface area, correctness over compatibility theater, your
              attention over someone else's quarter.
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
              OS resource — window, GPU, network, storage. A sandboxed{" "}
              <strong class="text-fog-200">renderer</strong>, one per origin,
              turns a page into a display list. Bulk per-frame data flows through
              a shared-memory ring; small control messages flow over an IPC
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
                ["Nodes", "Lowercase are primitives; Capitalized are your components."],
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
              Four grammar rules — that is the entire language. A glyph is an
              inscribed mark; the language is named for what it produces. It
              keeps the parts of Markdown and component systems that work, and
              discards the rest. Invalid input is a parse error with a position,
              never a guess.
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
            Each layer sits on a proven one. The window is up; the shared-memory
            ring is real and tested.
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
