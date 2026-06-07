import { createSignal, onCleanup } from "solid-js";

/**
 * One-shot scroll reveal. Attach the returned `ref` to an element; `visible`
 * flips to true the first time it scrolls into view and stays true. Diagrams
 * use this to start their animation only once they're on screen.
 */
export function useInView(opts?: IntersectionObserverInit) {
  const [visible, setVisible] = createSignal(false);

  const ref = (el: Element) => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35, ...opts },
    );
    io.observe(el);
    onCleanup(() => io.disconnect());
  };

  return { ref, visible };
}
