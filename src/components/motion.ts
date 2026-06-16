import { createEffect, createSignal, onCleanup } from "solid-js";

/** True when the OS asks for reduced motion. Safe during SSR/first paint. */
export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A discrete stepped timeline for the animated diagrams. Returns a `step`
 * signal that advances `0 → length-1 → 0 …` on an interval, but only once the
 * element is on screen (`visible`). Honors reduced-motion by parking on a
 * chosen rest step and never starting the interval. Cleans itself up.
 */
export function useTimeline(opts: {
  length: number;
  visible: () => boolean;
  intervalMs?: number;
  restStep?: number;
}): () => number {
  const [step, setStep] = createSignal(0);
  let started = false;

  createEffect(() => {
    if (started || !opts.visible()) return;
    started = true;

    if (prefersReducedMotion()) {
      setStep(opts.restStep ?? opts.length - 1);
      return;
    }

    const id = setInterval(
      () => setStep((s) => (s + 1) % opts.length),
      opts.intervalMs ?? 1300,
    );
    onCleanup(() => clearInterval(id));
  });

  return step;
}
