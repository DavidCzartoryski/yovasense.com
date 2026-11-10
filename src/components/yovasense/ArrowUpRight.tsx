/**
 * The "opens elsewhere" arrow, drawn instead of typed: iOS sets U+2197 (↗) as a boxed
 * emoji, so the text glyph looked different on phones than on desktop.
 */
export default function ArrowUpRight() {
  return (
    <svg className="ys-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 12.5 12.5 3.5M5 3.5h7.5V11" />
    </svg>
  );
}
