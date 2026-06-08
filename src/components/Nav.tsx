import { For, createSignal, onCleanup, onMount } from "solid-js";
import { A } from "@solidjs/router";
import Logo from "./Logo";

const links = [
  { href: "/architecture", label: "Architecture" },
  { href: "/glyph", label: "Glyph" },
];

const SOURCE_URL = "https://codeberg.org/rootkill/cara";

export default function Nav() {
  // Transparent over the cinematic hero, gains a backdrop once you scroll.
  const [solid, setSolid] = createSignal(false);
  onMount(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => window.removeEventListener("scroll", onScroll));
  });

  return (
    <header
      class="sticky top-0 z-50 transition-colors duration-300"
      classList={{
        "border-b border-ink-700/60 bg-ink-950/75 backdrop-blur-md": solid(),
        "border-b border-transparent bg-transparent": !solid(),
      }}
    >
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <A href="/" class="group flex items-center gap-2.5" aria-label="Cara home">
          <Logo class="h-6 w-6 text-glyph-500 transition group-hover:text-glyph-400" />
          <span class="font-mono text-sm font-medium uppercase tracking-[0.22em] text-paper">
            Cara
          </span>
        </A>

        <div class="flex items-center gap-7 text-sm">
          <For each={links}>
            {(l) => (
              <A
                href={l.href}
                class="text-fog-400 transition hover:text-paper"
                activeClass="text-paper"
                end
              >
                {l.label}
              </A>
            )}
          </For>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="text-fog-400 transition hover:text-paper"
          >
            Source&nbsp;↗
          </a>
        </div>
      </nav>
    </header>
  );
}
