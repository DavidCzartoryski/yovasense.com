import { Spine } from "./Workflow";

const monitoring = ["A node is drained.", "A GPU stopped reporting.", "A link is flapping.", "A job failed."];

const adds = [
  "One incident instead of four alerts.",
  "A named GPU and a likely cause.",
  "Capacity back in the scheduler, checked.",
  "A technician ticket only when needed.",
];

/** What YovaSense adds to monitoring: the alert is where it starts, not where it ends. */
export default function Difference() {
  return (
    <section id="difference" className="ys-sec" aria-labelledby="difference-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-two ys-scrim">
          <div>
            <span className="ys-node" data-reader-mark aria-hidden="true" />
            <p className="ys-eyebrow">Beyond monitoring</p>
            <h2 id="difference-title" className="ys-display ys-h2">Monitoring raises the alert. YovaSense drives it to resolution.</h2>
          </div>
          <div className="ys-sec-body">
            <p>
              Monitoring tells an operator that a GPU disappeared or a job failed. The evidence for why is spread across the scheduler, the host, the GPU, the fabric and the job, and an engineer still connects it by hand.
            </p>
          </div>
        </div>
        <div className="ys-diff ys-scrim">
          <div className="ys-diff-col" data-side="monitoring">
            <h3 className="ys-diff-h">What monitoring tells you</h3>
            <ul>
              {monitoring.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="ys-diff-col" data-side="yovasense">
            <h3 className="ys-diff-h">What YovaSense adds</h3>
            <ul>
              {adds.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
