import { Spine } from "./Workflow";

/** The incident families YovaSense handles. Titles are matched exactly by the positioning check. */
const families = [
  { title: "GPU hardware failures", body: "Xid errors, ECC faults, GPUs that fall off the bus." },
  { title: "Network and interconnect", body: "RDMA failures, NCCL timeouts, NVLink degradation." },
  { title: "Performance degradation", body: "Training stragglers, throttling, throughput regressions." },
  { title: "Drivers and services", body: "CUDA, GPU drivers, Fabric Manager, firmware." },
  { title: "Unavailable GPU nodes", body: "Slurm drains, Kubernetes health checks, stranded capacity." },
  { title: "Power and cooling", body: "Thermal throttling, rack-level power and cooling faults." },
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
          <p className="ys-lede">Built for GPU infrastructure operations teams running training and inference. The same loop runs for every family.</p>
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
