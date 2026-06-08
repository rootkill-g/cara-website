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
    let layoutH = 0;
    const resize = () => {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      // The hero is `h-dvh`, so on mobile the URL bar showing/hiding mid-scroll
      // changes our height and fires this observer on *every* scroll. Reflowing
      // the scene each time made it visibly "breathe" and re-rolled the
      // mountains. Instead we size the scene to the tallest height seen at this
      // width and let the section's `overflow-hidden` clip when the viewport is
      // momentarily shorter — so the URL bar toggling never reflows the scene.
      // A genuine resize (width change / orientation) re-establishes the height.
      const widthChanged = w !== lastW;
      if (!widthChanged && h <= layoutH) return; // URL-bar shrink or no change
      lastW = w;
      layoutH = widthChanged ? h : Math.max(layoutH, h);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(layoutH * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = layoutH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(w, layoutH);
      // repaint immediately so a resize never leaves the canvas blank — the
      // backing-store write above clears it to black, and rAF may be throttled
      // mid-scroll, which is exactly when the cleared canvas would flash through
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
