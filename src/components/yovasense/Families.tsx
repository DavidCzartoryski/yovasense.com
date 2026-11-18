import { Spine } from "./Workflow";

/**
 * The incident families YovaSense handles, one per layer of the stack from the GPU outward,
 * then the two that cut across layers. Nine, so the grid fills three rows of three.
 */
const families = [
  { title: "GPUs and accelerators", body: "Faulty GPUs, memory errors and GPUs that drop off the node." },
  { title: "Servers", body: "The CPUs, memory and disks every GPU depends on." },
  { title: "Network and interconnect", body: "Slow or failing links, ports, cables and switches, from one GPU to the whole fabric." },
  { title: "Storage and data", body: "Slow filesystems and stalled input pipelines that starve a job." },
  { title: "Power and cooling", body: "Thermal and power faults, from one GPU to a whole rack." },
  { title: "Drivers, firmware and software", body: "Version drift and bad updates across drivers, firmware and the software stack." },
  { title: "Scheduler and jobs", body: "Failed jobs, stuck queues and work placed on unhealthy nodes." },
  { title: "Performance regressions", body: "Jobs that slow down without failing: stragglers, throttling, drift." },
  { title: "Capacity out of service", body: "Nodes pulled out of service, and the capacity stranded with them." },
];

export default function Families() {
  return (
    <section id="incidents" className="ys-sec" aria-labelledby="incidents-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <span className="ys-node" data-reader-mark aria-hidden="true" />
          <p className="ys-eyebrow">What it covers</p>
          <h2 id="incidents-title" className="ys-display ys-h2">The full AI infrastructure stack.</h2>
          <p className="ys-lede">Nine families of incidents, and the same three steps for every one, across training and inference.</p>
        </div>
        <ul className="ys-families ys-scrim">
          {families.map((f) => (
            <li key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
