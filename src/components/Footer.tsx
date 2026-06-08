import { A } from "@solidjs/router";
import Logo from "./Logo";
import CodebergLogo from "./CodebergLogo";

export default function Footer() {
  return (
    <footer class="border-t border-ink-700/60">
      <div class="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2.5">
          <Logo class="h-5 w-5 text-glyph-500" />
          <span class="font-mono text-sm uppercase tracking-[0.22em] text-fog-300">
            Cara
          </span>
        </div>

        <nav class="flex flex-wrap gap-x-7 gap-y-2 text-sm text-fog-400">
          <A href="/" class="transition hover:text-paper">
            Home
          </A>
          <A href="/architecture" class="transition hover:text-paper">
            Architecture
          </A>
          <A href="/glyph" class="transition hover:text-paper">
            Glyph
          </A>
          <a
            href="https://codeberg.org/rootkill/cara-website"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center transition hover:text-paper"
            aria-label="Source code on Codeberg"
            title="Source on Codeberg"
          >
            <CodebergLogo class="h-5 w-5" />
          </a>
        </nav>
      </div>

      <div class="mx-auto max-w-5xl px-6 pb-10">
        <p class="font-mono text-xs leading-relaxed text-fog-500">
          This page makes no network requests on its own behalf. No fonts, no
          analytics, no trackers. The same opinion the browser holds.
        </p>
      </div>
    </footer>
  );
}
