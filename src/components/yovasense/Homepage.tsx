import AccessForm from "./AccessForm";
import BuiltBy from "./BuiltBy";
import Difference from "./Difference";
import Families from "./Families";
import Faq from "./Faq";
import SlackShowcase from "./SlackShowcase";
import Workflow, { Spine } from "./Workflow";

/** The final call to action, where every "Get access" lands: the line ends here. */
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
            Leave your work email, and we&apos;ll show you what YovaSense would find, fix and escalate on your fleet.
          </p>
          <AccessForm />
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
