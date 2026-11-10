import { Spine } from "./Workflow";

/** The incident families YovaSense handles. Titles are matched exactly by the positioning check. */
const families = [
  { title: "GPU hardware failures", body: "Faulty GPUs, memory errors and GPUs that drop off the node." },
  { title: "Network and interconnect", body: "Slow or failing links between GPUs, servers and racks." },
  { title: "Performance degradation", body: "Jobs that slow down without failing: stragglers, throttling, regressions." },
  { title: "Drivers and services", body: "The drivers, firmware and services every GPU depends on." },
  { title: "Unavailable GPU nodes", body: "Nodes pulled out of service, and the capacity stranded with them." },
  { title: "Power and cooling", body: "Thermal and power faults, from one GPU to a whole rack." },
];

export default function Families() {
  return (
    <section id="incidents" className="ys-sec" aria-labelledby="incidents-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <span className="ys-node" data-reader-mark aria-hidden="true" />
          <p className="ys-eyebrow">What it handles</p>
          <h2 id="incidents-title" className="ys-display ys-h2">Six families of infrastructure incidents.</h2>
          <p className="ys-lede">The same three steps run for every one, across training and inference.</p>
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
