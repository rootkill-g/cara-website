import { For } from "solid-js";
import { Section, Eyebrow, CodeBlock } from "../components/ui";

const rules = [
  {
    n: "01",
    title: "Nodes are identifiers",
    body: "Lowercase names (box, text, button) are built-in primitives. Capitalized names (Card, TodoItem) are your components, imported from Lua.",
  },
  {
    n: "02",
    title: "Utilities are dot-prefixed",
    body: "Tokens like .flow-col, .p-4, .bg-blue-500. A compile-time perfect hash maps each to a (field, value) pair, OR'd onto the entity during the parse.",
  },
  {
    n: "03",
    title: "Attributes are key=\"value\"",
    body: "Quoted strings, bare numbers, or $identifier for a Lua binding. #name is shorthand for id=\"name\".",
  },
  {
    n: "04",
    title: "Children live in braces",
    body: "Braces are authoritative. Indentation is for humans — there is no significant whitespace.",
  },
];

const markdownExample = `text .text-base "Click **here** to read the [docs](/docs)."`;

const dynamicExample = `text {
    "Welcome back, "
    span .bold $username
    "!"
}`;

const componentExample = `-- card.lua — a user-defined, Capitalized component
return component("Card", function(props)
  return [[
    box .flow-col .p-4 .rounded-lg .bg-gray-800 .gap-2 {
      text .text-lg .bold $title
      slot
    }
  ]]
end)`;

export default function Glyph() {
  return (
    <>
      <Section class="pt-20 pb-12">
        <Eyebrow>The document language</Eyebrow>
        <h1 class="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl">
          Glyph — the smallest unit of writing.
        </h1>
        <p class="mt-7 max-w-2xl text-lg leading-relaxed text-fog-300">
          A glyph is an inscribed mark. The language is named for what it
          produces. It takes the parts of Markdown, KDL, and component systems
          that work — and discards the rest. Invalid input is a parse error with
          a position. There is no quirks mode and no second chance.
        </p>
      </Section>

      {/* Example */}
      <Section class="py-8">
        <CodeBlock label="settings-panel.glyph" code={`box #settings-panel .flow-col .p-4 .bg-gray-900 .w-full {
    image src="avatar.png" .w-12 .h-12 .rounded-full

    box .flow-row .gap-2 {
        text .text-xl .bold .text-white "Settings"
        button .bg-blue-500 .rounded .p-2 onClick=$saveData {
            text "Save"
        }
    }
}`} />
        <p class="mt-4 max-w-2xl text-sm leading-relaxed text-fog-500">
          No closing-tag duplication. No string-quoted utility lists. No
          distinction between semantic and presentational classes.
        </p>
      </Section>

      {/* The four rules */}
      <Section class="border-t border-ink-800 py-16">
        <Eyebrow>The grammar</Eyebrow>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Four rules. That is the entire language.
        </h2>
        <div class="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 sm:grid-cols-2">
          <For each={rules}>
            {(r) => (
              <div class="bg-ink-900 p-7">
                <span class="font-mono text-xs text-glyph-500">{r.n}</span>
                <h3 class="mt-3 text-lg font-medium text-paper">{r.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-fog-400">{r.body}</p>
              </div>
            )}
          </For>
        </div>
      </Section>

      {/* Markdown desugaring */}
      <Section class="border-t border-ink-800 py-16">
        <div class="grid gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>Content strings</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Markdown desugars at parse time.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              A content string is expanded into a flat sequence of styled spans
              during parsing — tracked in a single u32 bitmask, zero allocations.
              By the time layout runs, the scene graph holds a cache-friendly
              array of spans. The text pipeline never sees Markdown syntax.
            </p>
            <p class="mt-4 text-sm leading-relaxed text-fog-500">
              Supported: <code class="text-fog-300">**bold**</code>,{" "}
              <code class="text-fog-300">*italic*</code>,{" "}
              <code class="text-fog-300">~~strike~~</code>,{" "}
              <code class="text-fog-300">`code`</code>,{" "}
              <code class="text-fog-300">[link](url)</code>. Triple-quoted
              strings opt out entirely. Attribute values never desugar.
            </p>
          </div>
          <div class="space-y-4">
            <CodeBlock label="input" code={markdownExample} />
            <CodeBlock
              label="→ five sibling spans in the scene graph"
              code={`span  "Click "      .text-base
span  "here"        .text-base + bold
span  " to read the".text-base
link  "docs"        href="/docs"
span  "."           .text-base`}
            />
          </div>
        </div>
      </Section>

      {/* The $ boundary */}
      <Section class="border-t border-ink-800 py-16">
        <div class="grid gap-12 md:grid-cols-2">
          <div class="space-y-4">
            <CodeBlock label="dynamic text — sub-spans" code={dynamicExample} />
            <CodeBlock label="a Lua component" code={componentExample} />
          </div>
          <div>
            <Eyebrow>The $ boundary</Eyebrow>
            <h2 class="mt-5 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Two characters of Lua surface.
            </h2>
            <p class="mt-5 text-base leading-relaxed text-fog-300">
              The <code class="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-glyph-400">$</code>{" "}
              prefix is the only point in Glyph that references Lua. No{" "}
              <code class="text-fog-300">&lt;script&gt;</code> tag, no expression
              syntax, no template directive. On a click,{" "}
              <code class="text-fog-300">onClick=$save</code> looks up{" "}
              <code class="text-fog-300">save</code> in the page's Lua state and
              invokes it. A missing function logs and drops the event — the page
              does not crash.
            </p>
            <p class="mt-4 text-base leading-relaxed text-fog-300">
              Documents declare. Computation lives in Lua. The boundary is
              grammatical, not contextual.
            </p>
          </div>
        </div>
      </Section>

      {/* Non-features */}
      <Section class="border-t border-ink-800 py-16 pb-24">
        <Eyebrow>Deliberately excluded</Eyebrow>
        <h2 class="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          What Glyph will never grow.
        </h2>
        <ul class="mt-8 grid max-w-3xl gap-3 text-sm leading-relaxed text-fog-400 sm:grid-cols-2">
          <For
            each={[
              "Indentation-significant syntax — braces are truth.",
              "Inline expressions, conditionals, or loops.",
              "Template inheritance, partials, includes.",
              "CDATA, comments in attribute values, quirks mode.",
              "Error recovery — invalid input fails loudly.",
              "Runtime component registration.",
            ]}
          >
            {(item) => (
              <li class="flex gap-3">
                <span class="text-glyph-500 select-none">—</span>
                <span>{item}</span>
              </li>
            )}
          </For>
        </ul>
      </Section>
    </>
  );
}
