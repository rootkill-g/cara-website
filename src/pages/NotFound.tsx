import { A } from "@solidjs/router";
import { Section } from "../components/ui";

export default function NotFound() {
  return (
    <Section class="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p class="font-mono text-sm uppercase tracking-[0.3em] text-glyph-500">
        404
      </p>
      <h1 class="mt-6 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
        No parse for this path.
      </h1>
      <p class="mt-4 max-w-md text-base leading-relaxed text-fog-400">
        There is no quirks mode and no error recovery. But there is a way home.
      </p>
      <A
        href="/"
        class="mt-8 rounded-lg bg-glyph-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-glyph-400"
      >
        Back to start
      </A>
    </Section>
  );
}
