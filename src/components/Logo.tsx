// The Cara mark — a carved "C" with an inscribed point. Inline SVG so it
// inherits color and ships no extra request.
export default function Logo(props: { class?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      class={props.class}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M42 21 Q26 19 24 32 Q22 45 42 44"
        stroke="currentColor"
        stroke-width="5"
        stroke-linecap="round"
      />
      <circle cx="43" cy="32" r="3.2" fill="currentColor" />
    </svg>
  );
}
