import { createSignal, onCleanup, onMount } from "solid-js";
import { Scene } from "./Scene";

/**
 * Mounts the cinematic onto a full-bleed <canvas>. Handles devicePixelRatio,
 * resizing, the rAF clock, reduced-motion (renders one calm frame, no loop),
 * and an unobtrusive skip control that jumps to the settled night.
 */
export default function CaraScene(props: {
  class?: string;
  /** Fired when the hero content should fade in — as the fire takes and the
   *  scene reveals, not after the whole cinematic has settled. */
  onReveal?: () => void;
  /** Fired when the intro is fully settled (hides the skip control). */
  onIntroDone?: () => void;
}) {
  let canvas!: HTMLCanvasElement;
  let skipFn: () => void = () => {};
  const [showSkip, setShowSkip] = createSignal(false);

  onMount(() => {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    let done = false;
    const onReveal = () => props.onReveal?.();
    const onDone = () => {
      done = true;
      setShowSkip(false);
      props.onIntroDone?.();
    };
    const scene = new Scene(reduced, onReveal, onDone);

    let dpr = 1;
    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      // skip spurious observer fires where nothing actually changed — touching
      // the backing store (canvas.width/height) clears the canvas to black
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(w, h);
      // repaint immediately so a resize never leaves the canvas blank — on
      // mobile the URL bar shows/hides mid-scroll and resizes us while rAF is
      // throttled, which is exactly when the cleared (black) canvas would show
      scene.render(ctx);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    resize();

    let raf = 0;
    let last = 0;
    if (reduced) {
      scene.render(ctx);
      onReveal();
      onDone();
    } else {
      setShowSkip(true);
      const frame = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
        last = now;
        if (!document.hidden) {
          scene.update(dt);
          scene.render(ctx);
        } else {
          last = 0; // avoid a dt spike when the tab returns
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    onCleanup(() => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    });

    // expose skip via closure
    skipFn = () => {
      if (done) return;
      scene.skip();
    };
  });

  return (
    <div class={props.class ?? "relative"}>
      <canvas ref={canvas} class="block h-full w-full" aria-hidden="true" />
      {showSkip() && (
        <button
          type="button"
          onClick={() => skipFn()}
          class="absolute bottom-5 right-5 z-10 rounded-full border border-ink-600/70 bg-ink-950/40 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-fog-400 backdrop-blur-sm transition hover:border-glyph-500/60 hover:text-glyph-400"
        >
          Skip ↵
        </button>
      )}
    </div>
  );
}
