/** The page's spine: dim ahead of the reader, lit behind (ScrollReader moves the fill). */
export function Spine({ ink = false }: { ink?: boolean }) {
  return (
    <span className={ink ? "ys-spine ys-spine-ink" : "ys-spine"} aria-hidden="true">
      <span className="ys-spine-fill" />
    </span>
  );
}

/** The five stages on the line; Escalate is the branch below them. io: what the stage reads or does, in the column on the right. */
const stations: { title: string; body: string; io: string }[] = [
  {
    title: "Collect",
    body: "Ingests GPU metrics, Xid and ECC errors, host logs, NIC and switch counters, scheduler state and job telemetry.",
    io: "DCGM · kernel log · NIC and switch counters · Slurm · Kubernetes · job telemetry",
  },
  {
    title: "Correlate",
    body: "Aligns events in time and maps every job to its GPUs, hosts, NICs, switches and racks, so one fault becomes one incident, not a page of alerts.",
    io: "job → GPU → host → NIC → switch → rack",
  },
  {
    title: "Diagnose",
    body: "Combines known failure signatures with AI reasoning to rank likely causes, and shows the evidence for and against each one.",
    io: "failure signatures · AI reasoning · evidence",
  },
  {
    title: "Remediate",
    body: "Executes policy-approved recovery actions: GPU resets, service recovery, node isolation or workload rescheduling. Anything outside policy waits for your approval.",
    io: "reset GPU · restart service · drain node · reschedule job",
  },
  {
    title: "Verify",
    body: "Checks hardware health, scheduler availability and workload recovery before it closes an incident, so what comes back is healthy, usable GPU capacity.",
    io: "hardware health · back in the scheduler · job at normal pace",
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="ys-sec" aria-labelledby="workflow-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <p className="ys-eyebrow">How it works</p>
          <h2 id="workflow-title" className="ys-display ys-h2">From infrastructure failure to verified recovery.</h2>
          <p className="ys-lede">
            One loop for every incident, across GPUs, hosts, networking, schedulers, storage and workloads. YovaSense fixes what your policy allows and sends the rest to a person with the evidence attached.
          </p>
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
              <span className="ys-st-num ys-mono ys-esc-num">06 · branch</span>
              <div className="ys-st-head">
                <h3>Escalate</h3>
              </div>
              <div className="ys-esc-text">
                <p>Opens a prioritized ticket with the component&apos;s identity, the evidence and repair instructions for anything that needs a technician.</p>
                <p className="ys-esc-terminal ys-mono"><span aria-hidden="true">→</span> An engineer in the loop. Not an engineer on every alert.</p>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
