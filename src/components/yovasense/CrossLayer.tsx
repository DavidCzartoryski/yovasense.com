import { Spine } from "./Workflow";

/** What each system sees when a GPU falls off the bus: part of the failure, never the whole incident. */
const signals = [
  { layer: "Scheduler", text: "Slurm reports that the node is drained." },
  { layer: "Kubernetes", text: "The GPU device plugin reports seven GPUs instead of eight." },
  { layer: "Host kernel", text: "The kernel log reports NVIDIA Xid 79: the GPU has fallen off the bus." },
  { layer: "PCIe", text: "PCIe telemetry shows the GPU is no longer reachable." },
];

/** Cross-layer correlation, told as two incidents: a GPU node becomes unavailable, and a degraded InfiniBand link. */
export default function CrossLayer() {
  return (
    <section id="example" className="ys-sec" aria-labelledby="example-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <span className="ys-node" data-reader-mark aria-hidden="true" />
          <p className="ys-eyebrow">Cross-layer correlation</p>
          <h2 id="example-title" className="ys-display ys-h2">A GPU node becomes unavailable.</h2>
          <p className="ys-lede">Four systems each see part of the failure. None of them connects it to the job, the node and the fix.</p>
        </div>
        <div className="ys-xl">
          <div className="ys-xl-main ys-scrim">
            <ol className="ys-xl-list" aria-label="What each system sees, and what YovaSense does">
              {signals.map((s) => (
                <li key={s.layer}>
                  <span className="ys-xl-k ys-mono">{s.layer}</span>
                  <p>{s.text}</p>
                </li>
              ))}
              <li className="ys-xl-yova">
                <span className="ys-xl-k ys-mono">YovaSense</span>
                <p>
                  YovaSense correlates the four signals into one incident on one GPU. It isolates the node, restarts the affected job on healthy GPUs from its last checkpoint, and decides whether a controlled recovery attempt is appropriate or the GPU needs hardware inspection. The node returns to service only after it passes its health checks; if it needs hands, the technician gets a ticket with the node, the GPU slot, the evidence and the repair steps.
                </p>
              </li>
            </ol>
            <p className="ys-xl-cta">
              <a className="ys-link ys-link-wrap" href="/Demo/">
                Watch a GPU fall off the bus in the interactive <span className="ys-nowrap">demo <span aria-hidden="true">→</span></span>
              </a>
            </p>
            <p className="ys-fine">The demo&apos;s guided story opens with this incident.</p>
          </div>
          <article className="ys-xl-second ys-scrim" aria-labelledby="example-2-title">
            <p className="ys-eyebrow">Second example</p>
            <h3 id="example-2-title">A degraded InfiniBand link slows healthy GPUs.</h3>
            <p>
              Every GPU passes its health checks, and the job still runs slow. One switch port is logging symbol errors and link retrains, so every collective that crosses it waits. GPU dashboards show idle time. The fabric shows a rising counter. YovaSense maps the job&apos;s ranks to their NICs and switch ports, finds the one link they share, reschedules the work away from it and opens a ticket to reseat or replace the cable. Then it checks that the job is back at its normal pace.
            </p>
            <p className="ys-fine">
              The interactive demo shows a harder network fault: a leaf switch fails, and YovaSense stops draining nodes at its safety limit and hands the decision to a person (story 11 of 12).
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
