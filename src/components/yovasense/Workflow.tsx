/** The page's spine: dim ahead of the reader, lit behind (ScrollReader moves the fill). */
export function Spine({ ink = false }: { ink?: boolean }) {
  return (
    <span className={ink ? "ys-spine ys-spine-ink" : "ys-spine"} aria-hidden="true">
      <span className="ys-spine-fill" />
    </span>
  );
}

/** The first two steps on the line, titled after the hero's lines; the third is the branch below them. io: what the step reads or does. */
const stations: { title: string; body: string; io: string }[] = [
  {
    title: "Find the root cause",
    body: "YovaSense reads your GPUs, servers, network, scheduler and workloads together. A burst of alerts becomes one incident with a named cause.",
    io: "GPUs · servers · network · scheduler · workloads",
  },
  {
    title: "Automate the fix",
    body: "It runs the recovery your policy allows and asks a person before anything beyond it. Nothing closes until YovaSense has checked that the capacity is healthy again.",
    io: "reset · restart · reschedule · verify",
  },
];

export default function Workflow() {
  return (
    <section id="how" className="ys-sec" aria-labelledby="how-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <p className="ys-eyebrow">How it works</p>
          <h2 id="how-title" className="ys-display ys-h2">From the first alert to verified recovery.</h2>
          <p className="ys-lede">Every incident runs the same three steps, day or night.</p>
        </div>
        <ol className="ys-stations">
          {stations.map((s, i) => (
            <li key={s.title} className="ys-station">
              <span className="ys-node" data-reader-mark aria-hidden="true" />
              <div className="ys-station-body ys-scrim">
                <span className="ys-st-num ys-mono">0{i + 1}</span>
                <div className="ys-st-head">
                  <h3>{s.title}</h3>
                </div>
                <p className="ys-st-text">{s.body}</p>
                <p className="ys-st-io ys-mono">{s.io}</p>
              </div>
            </li>
          ))}
          <li className="ys-station ys-escalate">
            <span className="ys-branch" data-reader-mark aria-hidden="true" />
            <div className="ys-esc-card ys-scrim">
              <span className="ys-st-num ys-mono ys-esc-num">03 · to a person</span>
              <div className="ys-st-head">
                <h3>Escalate what remains</h3>
              </div>
              <div className="ys-esc-text">
                <p>Anything that needs hands on hardware becomes a prioritized ticket, with the evidence and the repair steps attached.</p>
                <p className="ys-esc-terminal ys-mono"><span aria-hidden="true">→</span> An engineer in the loop. Not an engineer on every alert.</p>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
