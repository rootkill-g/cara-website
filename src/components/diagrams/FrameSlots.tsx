import { For, Show } from "solid-js";
import { useInView } from "../useInView";
import { useTimeline } from "../motion";

// Latest-wins triple buffer. The renderer writes a back slot, then publishes by
// release-exchanging the packed `latest` word (slot | dirty | gen). The host
// checks `dirty`, then exchange-takes the newest slot and *skips* any stale one
// in between — it never walks an intermediate frame. This is the frame path
// that replaced the old streaming ring.

type Frame = {
  write?: number; // slot being written this step
  latest: number; // slot `latest` points at
  gen: number; // generation in the packed word
  dirty: boolean; // freshly published, not yet taken
  host?: number; // slot the host currently holds
  skipped?: number; // a stale slot the host jumped over
  note: string;
};

// A short scripted timeline. Steps 5-7 are the point: two publishes race ahead
// of a busy host, so slot 1 goes stale and is skipped, never painted.
const SCRIPT: Frame[] = [
  { write: 0, latest: 0, gen: 0, dirty: false, note: "renderer writes slot 0" },
  { latest: 0, gen: 1, dirty: true, note: "publish · release-exchange latest → 0" },
  { latest: 0, gen: 1, dirty: false, host: 0, note: "host: dirty? yes → take slot 0" },
  { write: 1, latest: 0, gen: 1, dirty: false, host: 0, note: "renderer writes slot 1" },
  { latest: 1, gen: 2, dirty: true, host: 0, note: "publish · latest → 1" },
  { write: 2, latest: 1, gen: 2, dirty: true, host: 0, note: "renderer writes slot 2 — host still busy" },
  { latest: 2, gen: 3, dirty: true, host: 0, skipped: 1, note: "publish · latest → 2 — slot 1 is now stale" },
  { latest: 2, gen: 3, dirty: false, host: 2, skipped: 1, note: "host takes the newest, skips stale slot 1" },
];

type Role = "writing" | "host" | "stale" | "ready" | "held" | "idle";

function roleOf(f: Frame, i: number): Role {
  if (f.write === i) return "writing";
  if (f.host === i) return "host";
  if (f.skipped === i) return "stale";
  if (f.latest === i) return f.dirty ? "ready" : "held";
  return "idle";
}

const SLOT_STYLE: Record<Role, string> = {
  writing: "border-glyph-500 bg-glyph-500/10",
  host: "border-star-400 bg-star-500/10",
  ready: "border-glyph-400 bg-glyph-500/5",
  held: "border-ink-600 bg-ink-850",
  stale: "border-ink-700 bg-ink-900/40 opacity-40",
  idle: "border-ink-700 bg-ink-900/40",
};

const TAG: Record<Role, { label: string; cls: string }> = {
  writing: { label: "writing", cls: "text-glyph-400" },
  host: { label: "host reads", cls: "text-star-300" },
  ready: { label: "published", cls: "text-glyph-400" },
  held: { label: "last taken", cls: "text-fog-500" },
  stale: { label: "stale · skipped", cls: "text-fog-500 line-through" },
  idle: { label: "free", cls: "text-fog-500" },
};

export default function FrameSlots() {
  const { ref, visible } = useInView();
  const step = useTimeline({ length: SCRIPT.length, visible, intervalMs: 1500 });
  const f = () => SCRIPT[step()];

  return (
    <div ref={ref} class="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      {/* the packed `latest` word */}
      <div class="flex items-center justify-center gap-2 font-mono text-[11px]">
        <span class="text-fog-500">latest =</span>
        <span class="rounded-md border border-glyph-500/40 bg-glyph-500/10 px-2 py-1 text-glyph-300">
          slot {f().latest}
        </span>
        <span class="text-ink-600">·</span>
        <span
          class="rounded-md border border-ink-600 bg-ink-850 px-2 py-1"
          classList={{ "text-glyph-400": f().dirty, "text-fog-500": !f().dirty }}
          data-blink
          style={visible() && f().dirty ? "animation: blink 1s ease-in-out infinite" : ""}
        >
          dirty {f().dirty ? 1 : 0}
        </span>
        <span class="text-ink-600">·</span>
        {/* keyed on step so the pop re-fires each publish */}
        <Show when={step() + 1} keyed>
          <span
            class="rounded-md border border-ink-600 bg-ink-850 px-2 py-1 text-star-300"
            data-tick
            style={visible() ? "animation: tick-pop .5s var(--ease-out-soft)" : ""}
          >
            gen {f().gen}
          </span>
        </Show>
      </div>

      {/* the three slots */}
      <div class="mt-6 grid grid-cols-3 gap-3">
        <For each={[0, 1, 2]}>
          {(i) => {
            const role = () => roleOf(f(), i);
            return (
              <div
                class={`relative rounded-xl border p-3 transition-all duration-500 ${SLOT_STYLE[role()]}`}
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[11px] text-fog-400">slot {i}</span>
                  {role() === "ready" && (
                    <span class="h-2 w-2 rounded-full bg-glyph-400" data-blink
                      style={visible() ? "animation: blink 1s ease-in-out infinite" : ""} />
                  )}
                  {role() === "host" && <span class="h-2 w-2 rounded-full bg-star-400" />}
                </div>
                {/* fill bar: full when written, animating while writing */}
                <div class="mt-3 h-8 overflow-hidden rounded-md bg-ink-950/60">
                  <div
                    class="h-full transition-all duration-700"
                    classList={{
                      "w-full bg-glyph-500/40": role() === "writing" || role() === "ready",
                      "w-full bg-star-500/30": role() === "host",
                      "w-full bg-ink-700": role() === "held",
                      "w-0": role() === "idle",
                      "w-full bg-ink-800": role() === "stale",
                    }}
                  />
                </div>
                <p class={`mt-2 font-mono text-[10px] ${TAG[role()].cls}`}>{TAG[role()].label}</p>
              </div>
            );
          }}
        </For>
      </div>

      {/* live caption */}
      <p class="mt-5 text-center font-mono text-[11px] leading-relaxed text-fog-400">
        {f().note}
      </p>

      <div class="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[11px] text-fog-500">
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:var(--color-glyph-400)" /> renderer publishes
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:var(--color-star-400)" /> host takes newest
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-ink-600" /> stale, skipped
        </span>
      </div>
    </div>
  );
}
