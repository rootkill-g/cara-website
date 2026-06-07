import { For } from "solid-js";
import { useInView } from "../useInView";

// Markdown inside a content string is expanded into a flat run of styled spans
// at parse time — shown here as the transformation, not the parser. The text
// pipeline never sees the markup.
const spans: { text: string; cls: string; label: string }[] = [
  { text: "Read the ", cls: "text-fog-200", label: "span" },
  { text: "docs", cls: "font-bold text-paper", label: "span · bold" },
  { text: " for ", cls: "text-fog-200", label: "span" },
  { text: "details", cls: "text-star-300 underline decoration-star-500/60", label: "link" },
  { text: ".", cls: "text-fog-200", label: "span" },
];

export default function DesugarDemo() {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} class="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 sm:p-8">
      <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-fog-500">What you write</p>
      <p class="mt-3 font-mono text-sm text-fog-300">
        Read the <span class="text-glyph-400">**</span>docs<span class="text-glyph-400">**</span> for{" "}
        <span class="text-glyph-400">[</span>details<span class="text-glyph-400">](…)</span>.
      </p>

      <div class="my-6 flex items-center gap-3 text-fog-500">
        <span class="h-px flex-1 bg-ink-700" />
        <span class="text-xs">desugars at parse time ↓</span>
        <span class="h-px flex-1 bg-ink-700" />
      </div>

      <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-fog-500">What layout sees</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <For each={spans}>
          {(s, i) => (
            <span
              class="flex flex-col items-center"
              style={
                visible()
                  ? `animation: rise-fade .5s var(--ease-out-soft) both; animation-delay:${i() * 0.1}s`
                  : "opacity:0"
              }
            >
              <span class={`rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5 text-sm ${s.cls}`}>
                {s.text.trim() === "" ? "␣" : s.text}
              </span>
              <span class="mt-1.5 font-mono text-[10px] text-fog-500">{s.label}</span>
            </span>
          )}
        </For>
      </div>
      <p class="mt-6 max-w-xl text-sm leading-relaxed text-fog-400">
        One <span class="text-fog-200">u32</span> bitmask tracks the styles, zero allocations.
        Triple-quoted strings opt out; attribute values never desugar.
      </p>
    </div>
  );
}
