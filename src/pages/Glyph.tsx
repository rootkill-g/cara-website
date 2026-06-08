import { For } from "solid-js";
import { Section, Eyebrow } from "../components/ui";
import GlyphAnatomy from "../components/diagrams/GlyphAnatomy";
import DesugarDemo from "../components/diagrams/DesugarDemo";
import DollarBoundary from "../components/diagrams/DollarBoundary";

const rules = [
  {
    n: "01",
    title: "Nodes are identifiers",
    body: "Lowercase names (box, text, button) are built-in primitives. Capitalized names (Card, TodoItem) are your own components.",
  },
  {
    n: "02",
    title: "Utilities are dot-prefixed",
    body: "Tokens like .flow-col or .p-4. A compile-time perfect hash maps each to a concrete style value as the page is parsed.",
  },
  {
    n: "03",
    title: "Attributes are key=value",
    body: "Quoted strings, bare numbers, or a $name that binds to Lua. A leading #name is shorthand for an id.",
  },
  {
    n: "04",
    title: "Children live in braces",
    body: "Braces are authoritative. Indentation is for humans. There is no significant whitespace anywhere in Glyph.",
  },
];

const excluded = [
  "Indentation-significant syntax (braces are the truth).",
  "Inline expressions, conditionals, or loops in markup.",
  "Template inheritance, partials, or includes.",
  "Comments inside attribute values, CDATA, quirks mode.",
  "Error recovery (invalid input fails loudly, with a position).",
  "Runtime component registration.",
];

export default function Glyph() {
  return (
    <>
      <Section class="pt-28 pb-10">
        <Eyebrow>The document language</Eyebrow>
        <h1 class="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl">
          Glyph, the smallest unit of writing.
        </h1>
        <p class="mt-7 max-w-2xl text-lg leading-relaxed text-fog-300">
          A glyph is an inscribed mark, named for what it produces. It takes the
          parts of Markdown, KDL, and component systems that work, and discards
          the rest. Invalid input is a parse error with a position. There is no
          quirks mode and no second chance.
        </p>
      </Section>

      {/* anatomy of a node */}
      <Section class="py-8">
        <GlyphAnatomy />
      </Section>

      {/* the four rules */}
      <Section class="border-t border-ink-800 py-16">
        <Eyebrow>The grammar</Eyebrow>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Four rules. That is the entire language.
        </h2>
        <div class="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 sm:grid-cols-2">
          <For each={rules}>
            {(r) => (
              <div class="bg-ink-900/80 p-7">
                <span class="font-mono text-xs text-glyph-500">{r.n}</span>
                <h3 class="mt-3 text-lg font-medium text-paper">{r.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-fog-400">{r.body}</p>
              </div>
            )}
          </For>
        </div>
      </Section>

      {/* markdown desugaring */}
      <Section class="border-t border-ink-800 py-16">
        <div class="grid gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>Content strings</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Markdown desugars at parse time.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              A content string is expanded into a flat sequence of styled spans
              while the page is parsed. By the time layout runs, the scene graph
              holds a plain, cache-friendly array of spans. The text pipeline
              never sees a single character of markup syntax.
            </p>
          </div>
          <DesugarDemo />
        </div>
      </Section>

      {/* the $ boundary */}
      <Section class="border-t border-ink-800 py-16">
        <div class="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <DollarBoundary />
          <div>
            <Eyebrow>The $ boundary</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Two characters of Lua surface.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              The <span class="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-glyph-400">$</span>{" "}
              prefix is the only point in Glyph that references code. On a click,
              a bound name is looked up in the page's Lua state and invoked. If
              that name is missing, the event is logged and dropped. The page
              does not crash.
            </p>
            <p class="mt-4 text-base leading-relaxed text-fog-300">
              Documents declare. Computation lives in Lua. The boundary between
              them is grammatical, not contextual, and exactly that wide.
            </p>
          </div>
        </div>
      </Section>

      {/* non-features */}
      <Section class="border-t border-ink-800 py-16 pb-28">
        <Eyebrow>Deliberately excluded</Eyebrow>
        <h2 class="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          What Glyph will never grow.
        </h2>
        <ul class="mt-8 grid max-w-3xl gap-3 text-sm leading-relaxed text-fog-400 sm:grid-cols-2">
          <For each={excluded}>
            {(item) => (
              <li class="flex gap-3">
                <span class="select-none text-glyph-500">—</span>
                <span>{item}</span>
              </li>
            )}
          </For>
        </ul>
      </Section>
    </>
  );
}
