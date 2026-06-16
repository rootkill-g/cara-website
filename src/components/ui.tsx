import type { ParentComponent } from "solid-js";
import { useInView } from "./useInView";

// Small shared presentational primitives, kept in one place so spacing and
// type scale stay consistent across pages.

// Scroll-reveal wrapper: fades + rises its children in the first time they
// enter the viewport. `delay` staggers siblings. Reduced-motion users get the
// content immediately (the keyframe is disabled in CSS, opacity stays 1).
export const Reveal: ParentComponent<{ delay?: number; class?: string }> = (
  props,
) => {
  const { ref, visible } = useInView({ threshold: 0.2 });
  return (
    <div
      ref={ref}
      class={props.class}
      style={
        visible()
          ? `animation: rise-fade .7s var(--ease-out-soft) both; animation-delay:${props.delay ?? 0}s`
          : "opacity:0"
      }
    >
      {props.children}
    </div>
  );
};

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
