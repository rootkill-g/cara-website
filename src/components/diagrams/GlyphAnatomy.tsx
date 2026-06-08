import { For } from "solid-js";
import { useInView } from "../useInView";

// The anatomy of one Glyph node, shown as labeled parts rather than source.
// Each part fades up in sequence. This is the grammar, not an API: a name, some
// dot-prefixed utilities, an attribute, and brace-delimited children.
const parts: { token: string; kind: string; tone: string }[] = [
  { token: "box", kind: "a primitive, or your Capitalized component", tone: "glyph" },
  { token: "#panel", kind: "an id, shorthand for a named node", tone: "fog" },
  { token: ".flow-col", kind: "a utility, a style token", tone: "star" },
  { token: ".p-4", kind: "a utility, padding", tone: "star" },
  { token: "{ … }", kind: "children, in braces", tone: "fog" },
];

const toneClass: Record<string, string> = {
  glyph: "border-glyph-500/50 bg-glyph-500/10 text-glyph-300",
  star: "border-star-500/40 bg-star-500/10 text-star-300",
  fog: "border-ink-600 bg-ink-800 text-fog-300",
};

export default function GlyphAnatomy() {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} class="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 sm:p-8">
      <div class="flex flex-wrap items-stretch gap-3">
        <For each={parts}>
          {(p, i) => (
            <div
              class="flex flex-col"
              style={
                visible()
                  ? `animation: rise-fade .5s var(--ease-out-soft) both; animation-delay:${i() * 0.12}s`
                  : "opacity:0"
              }
            >
              <span class={`rounded-lg border px-3 py-2 text-center font-mono text-sm ${toneClass[p.tone]}`}>
                {p.token}
              </span>
              <span class="mt-2 max-w-[9rem] text-center text-[11px] leading-snug text-fog-500">
                {p.kind}
              </span>
            </div>
          )}
        </For>
      </div>
      <p class="mt-7 max-w-xl text-sm leading-relaxed text-fog-400">
        That is the whole grammar: a node is a <span class="text-fog-200">name</span>, then any
        number of dot-prefixed <span class="text-star-300">utilities</span> and{" "}
        <span class="text-fog-200">key=value</span> attributes, then its{" "}
        <span class="text-fog-200">children in braces</span>. No closing-tag duplication, no
        quoted class lists, no significant whitespace. Indentation is for humans.
      </p>
    </div>
  );
}
