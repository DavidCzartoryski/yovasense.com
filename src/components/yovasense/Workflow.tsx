import IncidentFrame, { type Step } from "./IncidentFrame";

/** The page's spine: dim ahead of the reader, lit behind (ScrollReader moves the fill). */
export function Spine({ ink = false }: { ink?: boolean }) {
  return (
    <span className={ink ? "ys-spine ys-spine-ink" : "ys-spine"} aria-hidden="true">
      <span className="ys-spine-fill" />
    </span>
  );
}

type Kind = "prototype" | "direction" | "planned" | "simulated";

const stations: {
  step: Step;
  title: string;
  body: string;
  status: { kind: Kind; label: string; note: string };
  frame: string;
}[] = [
  {
    step: "detect",
    title: "Detect",
    body: "Times every rank at the collectives it already joins and compares it with its peers and its own history. A persistent slowdown is flagged while the job is still running, not in a postmortem.",
    status: { kind: "prototype", label: "Prototype", note: "Tested on one node of four V100s." },
    frame: "Rank 2 reaches every all-reduce late.",
  },
  {
    step: "diagnose",
    title: "Diagnose with evidence",
    body: "Re-tests under matched conditions, then narrows the problem to the rank, node, link or software change responsible, with the measurements behind the conclusion, including when the evidence isn't enough to call it.",
    status: { kind: "prototype", label: "Prototype · planned", note: "Rule ranking, tested on synthetic data. Cross-stack diagnosis is planned." },
    frame: "GPU, link, host or a change: the evidence narrows it down.",
  },
  {
    step: "fix",
    title: "Apply a supported fix",
    body: "Within the policies you set: rebalance work away from the slow rank, recommend a targeted fix, or apply a supported correction.",
    status: { kind: "prototype", label: "Prototype · direction", note: "Opt-in rebalancing is a prototype. Other fixes are product direction." },
    frame: "Work moves off rank 2.",
  },
  {
    step: "verify",
    title: "Verify recovery",
    body: "Re-measures useful training throughput after the action. If it didn't recover, you see that too. The evidence is kept, and reversible actions can be rolled back.",
    status: { kind: "direction", label: "Direction", note: "Product direction." },
    frame: "The ranks meet the all-reduce together again.",
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="ys-sec" aria-labelledby="workflow-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <p className="ys-eyebrow">How it works · product direction</p>
          <h2 id="workflow-title" className="ys-display ys-h2">From signal to recovery.</h2>
          <p className="ys-lede">
            One line from slowdown to verified recovery, with a branch to an engineer for anything that needs a restart, a repair or your approval. The full workflow is our product direction, not a claim that every capability is production-ready, so each step says what exists today.
          </p>
          <p className="ys-fine ys-frames-note">The frames follow one illustrated incident: eight ranks of one job, and rank 2 is slow.</p>
        </div>
        <ol className="ys-stations">
          {stations.map((s, i) => (
            <li key={s.step} className="ys-station">
              <span className="ys-node" data-reader-mark aria-hidden="true" />
              <div className="ys-station-body ys-scrim">
                <span className="ys-st-num ys-mono">0{i + 1}</span>
                <div className="ys-st-head">
                  <h3>{s.title}</h3>
                  <p className="ys-st-status">
                    <span className="ys-chip" data-kind={s.status.kind}>{s.status.label}</span>
                    <span>{s.status.note}</span>
                  </p>
                </div>
                <p className="ys-st-text">{s.body}</p>
                <figure className="ys-st-frame">
                  <IncidentFrame step={s.step} />
                  <figcaption>{s.frame}</figcaption>
                </figure>
              </div>
            </li>
          ))}
          <li className="ys-station ys-escalate">
            <span className="ys-branch" data-reader-mark aria-hidden="true" />
            <div className="ys-esc-card ys-scrim">
              <span className="ys-st-num ys-mono ys-esc-num">05 · branch</span>
              <div className="ys-st-head">
                <h3>Escalate</h3>
                <p className="ys-st-status">
                  <span className="ys-chip" data-kind="direction">Direction</span>
                  <span>Product direction. The demo shows simulated tickets.</span>
                </p>
              </div>
              <div className="ys-esc-text">
                <p>Anything that needs a restart, a repair or your approval goes to an engineer with the evidence attached. Never hidden.</p>
                <p className="ys-esc-terminal ys-mono"><span aria-hidden="true">→</span> An engineer in the loop. Not an engineer on every alert.</p>
              </div>
              <figure className="ys-st-frame">
                <IncidentFrame step="escalate" />
                <figcaption>Rank 2 needs a person: the ticket carries the evidence.</figcaption>
              </figure>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
