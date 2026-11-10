import { siAmd, siMeta } from "simple-icons";
import { Spine } from "./Workflow";

/*
 * Where the team worked: David's own statement, and the page's only team claim.
 * The marks are the trademarks of their owners (Meta Platforms, AMD), used here
 * only to name the engineers' former employers; they imply no endorsement or partnership.
 * Paths from simple-icons 16.35.0 (the collection is CC0-1.0; see its DISCLAIMER.md),
 * drawn monochrome in the muted text colour with their shapes unaltered. Amazon and
 * Klaviyo have no Simple Icons mark, so they are set in type like the other names.
 */

type Mark = { path: string; viewBox: string };

/** A 24-unit square, as Simple Icons draws it. */
const square = (path: string): Mark => ({ path, viewBox: "0 0 24 24" });

const names: { name: string; mark?: Mark; markOnly?: boolean }[] = [
  { name: "Meta", mark: square(siMeta.path) },
  // AMD's mark is its wordmark, so it stands alone. The viewBox is cropped to the glyph
  // (y 9.137 to 14.814 of the 24-unit square), so its letters can match the names' cap height.
  { name: "AMD", mark: { path: siAmd.path, viewBox: "0 9.137 24 5.677" }, markOnly: true },
  { name: "Amazon" },
  { name: "Klaviyo" },
];

/** The strip under the hero. A div, not a section: ScrollField warms the crease for every section. */
export default function BuiltBy() {
  return (
    <div className="ys-wrap ys-rail ys-built">
      <Spine />
      <div className="ys-built-inner ys-scrim">
        <p className="ys-eyebrow ys-built-label">Built by engineers from</p>
        <ul className="ys-built-list">
          {names.map(({ name, mark, markOnly }) => (
            <li key={name} className="ys-built-item" data-mark={markOnly ? "word" : mark ? "symbol" : undefined}>
              {mark && (
                <svg className="ys-built-mark" viewBox={mark.viewBox} aria-hidden="true" focusable="false">
                  <path d={mark.path} />
                </svg>
              )}
              <span className={markOnly ? "sr-only" : "ys-built-name"}>{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
