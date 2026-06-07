import { For } from "solid-js";
import { useInView } from "../useInView";

// A vertical numbered timeline that lights up step by step as it scrolls into
// view. Used for the page-load lifecycle — the steps, not the source.
export default function Stepper(props: { steps: { title: string; body: string }[] }) {
  const { ref, visible } = useInView();
  return (
    <ol ref={ref} class="relative ml-3 space-y-7 border-l border-ink-700 pl-8">
      <For each={props.steps}>
        {(s, i) => (
          <li
            class="relative"
            style={
              visible()
                ? `animation: rise-fade .6s var(--ease-out-soft) both; animation-delay:${i() * 0.1}s`
                : "opacity:0"
            }
          >
            <span
              class="absolute -left-[42px] flex h-6 w-6 items-center justify-center rounded-full border border-glyph-500/50 bg-ink-950 font-mono text-[10px] text-glyph-400"
            >
              {String(i() + 1).padStart(2, "0")}
            </span>
            <h3 class="text-base font-medium text-paper">{s.title}</h3>
            <p class="mt-1 text-sm leading-relaxed text-fog-400">{s.body}</p>
          </li>
        )}
      </For>
    </ol>
  );
}
