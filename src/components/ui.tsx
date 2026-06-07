import type { ParentComponent } from "solid-js";

// Small shared presentational primitives, kept in one place so spacing and
// type scale stay consistent across pages.

export const Section: ParentComponent<{ id?: string; class?: string }> = (
  props,
) => (
  <section id={props.id} class={`mx-auto max-w-5xl px-6 ${props.class ?? ""}`}>
    {props.children}
  </section>
);

export const Eyebrow: ParentComponent = (props) => (
  <p class="font-mono text-xs uppercase tracking-[0.25em] text-glyph-500">
    {props.children}
  </p>
);

export const Pill: ParentComponent<{ tone?: "live" | "soon" | "plan" }> = (
  props,
) => {
  const tone = props.tone ?? "plan";
  const styles = {
    live: "border-glyph-500/40 bg-glyph-500/10 text-glyph-400",
    soon: "border-star-500/40 bg-star-500/10 text-star-300",
    plan: "border-ink-600 bg-ink-800 text-fog-500",
  }[tone];
  return (
    <span
      class={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${styles}`}
    >
      {props.children}
    </span>
  );
};
