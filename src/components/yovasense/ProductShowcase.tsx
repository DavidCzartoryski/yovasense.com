import demoShots from "@/data/demo-shots.json";
import { Spine } from "./Workflow";

const { shots } = demoShots;

/** The demo's own step titles, matched to the stage each one shows. */
const beats = [
  { n: "2/12", title: "speech-asr stalls", verb: "Collect" },
  { n: "3/12", title: "YovaSense diagnoses it", verb: "Diagnose" },
  { n: "4/12", title: "A simulated fix", verb: "Remediate" },
  { n: "5/12", title: "The recovery check", verb: "Verify" },
  { n: "6/12", title: "A ticket for a person", verb: "Escalate" },
];

const crops = [
  { key: "finding", shot: shots.finding, alt: "Interactive demo, the incident's diagnosis: a GPU fell off the bus, so the node can no longer reach it. YovaSense names r1n2/4; five signs in the evidence point to it and none against.", note: "The diagnosis: one GPU, five signs for it, none against." },
  { key: "evidence", shot: shots.evidence, alt: "Interactive demo, the evidence behind the diagnosis: the node reports 7 of its 8 GPUs, and the kernel log reports Xid 79, a GPU fallen off the bus.", note: "The readings it compared, each one a click from its raw fields." },
  { key: "approval", shot: shots.approval, alt: "Interactive demo, a ticket waiting for approval: a person needs to approve the cooling or power fix for node r4n4, because YovaSense does not make that kind of change on its own.", note: "A change YovaSense won't make on its own waits for a person." },
] as const;

export default function ProductShowcase() {
  const o = shots.overview;
  return (
    <section id="product" className="ys-sec ys-product" aria-labelledby="product-title">
      <div className="ys-fold" aria-hidden="true">
        <div className="ys-fold-back" />
        <div className="ys-fold-field">
          <div className="ys-fold-sweep" data-sweep />
          <div className="ys-fold-face" />
        </div>
        <div className="ys-fold-edge" data-arrive />
        <div className="ys-fold-under" />
      </div>
      <div className="ys-wrap ys-rail ys-rail-ink">
        <Spine ink />
        <div className="ys-product-grid">
          <div className="ys-product-copy">
            <span className="ys-node ys-node-ink" data-reader-mark aria-hidden="true" />
            <p className="ys-eyebrow">The product · interactive demo</p>
            <h2 id="product-title" className="ys-display ys-h2">Watch YovaSense run a demo fleet through a day.</h2>
            <p className="ys-product-lede">
              The interactive demo runs YovaSense on a demo fleet of 192 GPUs. Over one day a GPU falls off the bus, a GPU overheats, an input pipeline stalls and a leaf switch fails. Follow each incident from the first signal to a verified fix, or to the hand-off when a person has to approve or repair.
            </p>
            <p className="ys-product-caption">The demo walks through signature-based diagnosis on a simulated fleet, with a scripted model standing in for the AI.</p>
            <ol className="ys-beats" aria-label="The demo's story, matched to the workflow">
              {beats.map((b) => (
                <li key={b.n}>
                  <span className="ys-beat-n ys-mono">{b.n}</span>
                  <span>{b.title}</span>
                  <span className="ys-beat-k ys-mono">{b.verb}</span>
                </li>
              ))}
            </ol>
            <a className="ys-btn ys-btn-ink" href="/Demo/">
              Open the interactive demo <span aria-hidden="true">→</span>
            </a>
            <p className="ys-product-fine">Demo fleet: 192 GPUs, 24 nodes, 6 racks.</p>
          </div>
          <figure className="ys-console">
            <figcaption className="ys-console-bar ys-mono">
              <span className="ys-chip" data-kind="demo">Demo</span>
              <span>Interactive demo · story {o.story} · {o.title}</span>
            </figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
            <img src={o.src} width={o.width} height={o.height} loading="lazy" decoding="async" alt="The YovaSense interactive demo at 05:00 on its demo fleet: 7 of 8 jobs running and 1 job has a problem. speech-asr stopped, and its diagnosis waits under Needs attention." />
            <p className="ys-console-note">Demo fleet and data. Open the interactive demo to follow the whole day.</p>
          </figure>
        </div>
        <ul className="ys-crops" aria-label="Close up, from the same demo day">
          {crops.map((c) => (
            <li key={c.key} className={`ys-crop ys-crop-${c.key}`}>
              <figure>
                <figcaption className="ys-crop-bar ys-mono">
                  <span className="ys-chip" data-kind="demo">Demo</span>
                  <span>Story {c.shot.story} · {c.shot.title}</span>
                </figcaption>
                <div className="ys-crop-img">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
                  <img src={c.shot.src} width={c.shot.width} height={c.shot.height} loading="lazy" decoding="async" alt={c.alt} />
                </div>
                <p className="ys-crop-note">{c.note}</p>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
