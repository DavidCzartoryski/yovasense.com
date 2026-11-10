import { yovasense, mailto } from "@/data/yovasense";
import BuiltBy from "./BuiltBy";
import Difference from "./Difference";
import Families from "./Families";
import Faq from "./Faq";
import { EVALUATE_SUBJECT, WRITE_SUBJECT } from "./Header";
import SlackShowcase from "./SlackShowcase";
import Workflow, { Spine } from "./Workflow";

/** The final call to action: the line ends here. */
function Access() {
  return (
    <section id="access" className="ys-sec ys-sec-end" aria-labelledby="access-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <span className="ys-terminal" data-reader-mark aria-hidden="true" />
        <div className="ys-pilot ys-scrim">
          <p className="ys-eyebrow">Get access</p>
          <h2 id="access-title" className="ys-display ys-h1">See it on your own fleet.</h2>
          <p className="ys-lede">
            Tell us about your fleet, and we&apos;ll show you what YovaSense would find, fix and escalate on it.
          </p>
          <div className="ys-cta-row">
            <a className="ys-btn ys-btn-primary ys-btn-lg" href={mailto(EVALUATE_SUBJECT)}>
              Evaluate YovaSense on your fleet <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="ys-fine ys-pilot-addr">
            Or write to <a href={mailto(WRITE_SUBJECT)}>{yovasense.email}</a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Everything after the hero, in reading order. */
export default function Homepage() {
  return (
    <>
      <BuiltBy />
      <Difference />
      <Workflow />
      <SlackShowcase />
      <Families />
      <Faq />
      <Access />
    </>
  );
}
