import type { CSSProperties, ReactNode } from "react";
import glow from "@/data/product-glow.json";
import SlackThread from "./SlackThread";
import { Spine } from "./Workflow";
import styles from "./SlackShowcase.module.css";

/** Where a cropped glow layer sits on the drift layer, desktop and phone (scripts/build-product-gradient.mjs). */
const place = (layer: "current" | "bloom") =>
  ({ "--ys-glow-desk": glow.desk[layer], "--ys-glow-phone": glow.phone[layer] }) as CSSProperties;

const glyph = (d: ReactNode) => (
  <svg className={styles.pointGlyph} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {d}
  </svg>
);

/** The three points under the panel (copy deck, "Three points"). */
const POINTS = [
  {
    title: "The cause comes first",
    line: "Each incident arrives as one message, with the root cause named.",
    glyph: glyph(
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5M10.5 7.5v3.2l2.2 1.6" />
      </>,
    ),
  },
  {
    title: "Approve from the thread",
    line: "A fix outside your policy waits for one click from your team.",
    glyph: glyph(
      <>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5Z" />
        <path d="m8.6 10.2 2.3 2.3 4.6-4.8" />
      </>,
    ),
  },
  {
    title: "Closed with proof",
    line: "YovaSense confirms the recovery and tickets whatever is left.",
    glyph: glyph(
      <>
        <path d="M12 3.2 19 6v5.4c0 4.2-2.9 7.7-7 9.4-4.1-1.7-7-5.2-7-9.4V6Z" />
        <path d="m8.8 12 2.3 2.3 4.3-4.6" />
      </>,
    ),
  },
] as const;

/**
 * The homepage's gradient section, now the Slack integration: the copy on the left, the animated
 * #gpu-ops thread on the right, and three points under an open stretch of the field where the
 * orange current glows. The fold (field, grain, glow, warm cut) is the product section's, unchanged:
 * ScrollReader finds its layers by their data attributes.
 */
export default function SlackShowcase() {
  return (
    <section id="slack" className="ys-sec ys-product" aria-labelledby="slack-title">
      <div className="ys-fold" aria-hidden="true">
        <div className="ys-fold-back" />
        <div className="ys-fold-field">
          <div className="ys-fold-drift" data-drift>
            <div className="ys-glow ys-glow-bloom" style={place("bloom")} data-glow="bloom" />
            <div className="ys-glow ys-glow-current" style={place("current")} data-glow="current" />
          </div>
        </div>
        <div className="ys-fold-edge" data-arrive />
        <div className="ys-fold-under" />
      </div>
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-product-grid">
          <div className="ys-product-copy">
            <span className="ys-node" data-reader-mark aria-hidden="true" />
            <p className="ys-eyebrow">YovaSense in Slack</p>
            <h2 id="slack-title" className="ys-display ys-h2">From alert to resolved, in one Slack thread.</h2>
            <p className="ys-product-lede">
              YovaSense posts what broke and why, runs the fixes your policy allows, asks before anything else, and confirms the recovery in the channel your team already watches.
            </p>
            <p className={styles.works}>
              <svg className={styles.worksGlyph} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M6.2 2.5 4.8 13.5M11.2 2.5 9.8 13.5M2.8 5.8h11M2.2 10.2h11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Works with Slack
            </p>
          </div>
          <SlackThread />
        </div>
        <ul className={styles.points}>
          {POINTS.map((p) => (
            <li key={p.title} className={styles.point}>
              {p.glyph}
              <h3>{p.title}</h3>
              <p>{p.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
