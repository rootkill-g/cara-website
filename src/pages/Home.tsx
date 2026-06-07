import { For } from "solid-js";
import { A } from "@solidjs/router";
import { Section, Eyebrow, CodeBlock, Pill } from "../components/ui";

const glyphExample = `box #settings-panel .flow-col .p-4 .bg-gray-900 .w-full {
    image src="avatar.png" .w-12 .h-12 .rounded-full

    box .flow-row .gap-2 {
        text .text-xl .bold .text-white "Settings"
        button .bg-blue-500 .rounded .p-2 onClick=$saveData {
            text "Save"
        }
    }
}`;

const pillars = [
  {
    title: "One language for structure",
    body: "Pages are written in Glyph — a small declarative grammar with no quirks mode, no parser-as-state-machine, and no thirty-year compatibility tax.",
  },
  {
    title: "One language for behavior",
    body: "Logic lives in Lua, sandboxed and budgeted. The document layer declares; computation stays in one place with a two-character surface ($).",
  },
  {
    title: "One render path",
    body: "Scene graph → display list → shared memory → GPU. A renderer process produces; a privileged host consumes and paints. Two channels, no third.",
  },
];

const roadmap = [
  { n: "01", title: "The ring", tone: "live" as const, body: "Framed shared-memory channel under strict Release/Acquire ordering. Done & unit-tested." },
  { n: "02", title: "Wire protocols", tone: "soon" as const, body: "Draw-command format and the IPC control channel; kill the busy-wait." },
  { n: "03", title: "Host renderer", tone: "plan" as const, body: "GPU surface, framebuffer, ID buffer, O(1) hit-test, resize." },
  { n: "04", title: "Text", tone: "plan" as const, body: "Glyph atlas and the Text Trinity: SheenBidi → libunibreak → HarfBuzz → FreeType." },
  { n: "05", title: "Renderer brain", tone: "plan" as const, body: "Scene-graph ECS, the Glyph parser, style, strict-box layout, paint." },
  { n: "06", title: "Interactivity", tone: "plan" as const, body: "LuaJIT bindings, reactivity, event dispatch, the standard component library." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <Section class="pt-20 pb-24 sm:pt-28 sm:pb-32">
        <Eyebrow>A from-scratch browser engine · written in Zig</Eyebrow>
        <h1 class="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-6xl">
          A browser that refuses to render the current web.
        </h1>
        <p class="mt-7 max-w-2xl text-lg leading-relaxed text-fog-300">
          HTML, CSS, and JavaScript weren't designed for the people writing
          pages — they were designed to keep the people who own the rendering
          engines in business. Cara is what happens when you stop accepting
          that as the only option.
        </p>
        <div class="mt-10 flex flex-wrap items-center gap-4">
          <A
            href="/architecture"
            class="rounded-lg bg-glyph-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-glyph-400"
          >
            Read the architecture
          </A>
          <A
            href="/glyph"
            class="rounded-lg border border-ink-600 px-5 py-2.5 text-sm font-medium text-fog-200 transition hover:border-fog-400 hover:text-paper"
          >
            See the Glyph language
          </A>
        </div>
      </Section>

      {/* Thesis */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>The thesis</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Thirty years of compatibility tax, removed.
            </h2>
          </div>
          <div class="space-y-5 text-base leading-relaxed text-fog-300">
            <p>
              Cara does not render HTML, so its parser inherits none of the
              error-correcting state machines, quirks modes, and accreted legacy
              that every existing engine carries. There is no DOM, no JavaScript
              runtime, no telemetry, no marketplace, and no opinion about what
              your homepage should be.
            </p>
            <p>
              The whole project — the rendering engine, the browser built on it,
              and the IPC layer between them — is small enough that one person
              can read all of it. That constraint is the feature: legibility
              over surface area, correctness over compatibility theater.
            </p>
          </div>
        </div>
      </Section>

      {/* Pillars */}
      <Section class="py-20">
        <div class="grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 md:grid-cols-3">
          <For each={pillars}>
            {(p) => (
              <div class="bg-ink-900 p-8">
                <h3 class="text-lg font-medium text-paper">{p.title}</h3>
                <p class="mt-3 text-sm leading-relaxed text-fog-400">{p.body}</p>
              </div>
            )}
          </For>
        </div>
      </Section>

      {/* Architecture teaser */}
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
          <CodeBlock
            label="the data path, in one line"
            code={`Renderer paints
  → Display List Writer
  → [ ring | Release head ]
  → [ Acquire head ]
  → Display List Executor
  → GPU → screen`}
          />
        </div>
      </Section>

      {/* Glyph teaser */}
      <Section class="border-t border-ink-800 py-20">
        <div class="grid items-start gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>The document language</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Pages are written in Glyph.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              Four grammar rules: nodes, dot-prefixed utilities, attributes, and
              brace-delimited children. Capitalized names are your Lua
              components. The only point that references code is a single{" "}
              <code class="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-sm text-glyph-400">
                $
              </code>
              .
            </p>
            <A
              href="/glyph"
              class="mt-7 inline-block text-sm font-medium text-glyph-400 transition hover:text-glyph-500"
            >
              Learn the grammar →
            </A>
          </div>
          <CodeBlock label="settings-panel.glyph" code={glyphExample} />
        </div>
      </Section>

      {/* Mantra */}
      <Section class="border-t border-ink-800 py-20">
        <Eyebrow>The mantra</Eyebrow>
        <blockquote class="mt-7 max-w-3xl space-y-1 font-mono text-sm leading-relaxed text-fog-300 sm:text-base">
          <p>One language for structure (Glyph).</p>
          <p>One language for behavior (Lua).</p>
          <p>One vocabulary for style (utilities).</p>
          <p>One layout algorithm (Strict-Box).</p>
          <p>One data structure for everything visible (the scene graph).</p>
          <p>One render path. One reactive primitive. One sandbox boundary.</p>
          <p>No pointers across the boundary. No accreted legacy in any layer.</p>
          <p class="pt-3 text-paper">
            One person should be able to hold this in their head.
          </p>
        </blockquote>
      </Section>

      {/* Roadmap */}
      <Section class="border-t border-ink-800 py-20">
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
              <li class="bg-ink-900 p-6">
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
                <h3 class="mt-4 text-base font-medium text-paper">
                  {item.title}
                </h3>
                <p class="mt-2 text-sm leading-relaxed text-fog-400">
                  {item.body}
                </p>
              </li>
            )}
          </For>
        </ol>
      </Section>
    </>
  );
}
