import { Spine } from "./Workflow";

/**
 * Common questions, answered as the product is designed. Native <details>: keyboard and
 * screen-reader ready, works without JS, needs no client code. No `name`, so several
 * answers may be open at once.
 */
const items: { q: string; a: string }[] = [
  {
    q: "What does YovaSense take off my team's plate?",
    a: "The investigation and the routine recovery. YovaSense works out why GPU capacity went down, runs the fixes your policy allows and checks that the capacity is healthy again, so your engineers only see the incidents that need them, with the evidence already gathered.",
  },
  {
    q: "Does it replace our monitoring?",
    a: "No. YovaSense works on top of the monitoring, schedulers and logs you already run. Monitoring raises the alert, and YovaSense carries it through to a verified recovery.",
  },
  {
    q: "How much does it do on its own?",
    a: "As much as you allow. Your policy sets which recovery actions run automatically, anything beyond it waits for a person to approve, and a limit caps how much capacity YovaSense can take out of service by itself.",
  },
  {
    q: "How does it work with Slack?",
    a: "YovaSense posts each incident to the channel you choose, with the root cause and the proposed fix. Your team approves or escalates from the message, and the thread keeps a record of every step through to recovery.",
  },
  {
    q: "What infrastructure does it support?",
    a: "NVIDIA and AMD GPUs, Slurm and Kubernetes, training and inference, on clusters you own or rent. One deployment covers several clusters, and each keeps its own policy.",
  },
  {
    q: "Where does our data go?",
    a: "YovaSense runs in your environment and reads operational telemetry, not your models or datasets. Incident updates go only to the Slack channels and ticketing tools you connect, and it has only the access you grant it.",
  },
  {
    q: "Couldn't a general AI assistant do this?",
    a: "Because diagnosing a GPU fleet takes context a chat agent doesn't have: how every job maps to its GPUs, servers, network links and racks, and what each kind of failure looks like across them. YovaSense pairs known failure signatures with AI reasoning, and verifies every fix before it closes an incident.",
  },
  {
    q: "How do we evaluate it?",
    a: "Write to us and we'll start with your fleet and the incidents that take the most of your team's time. YovaSense connects to the telemetry you already collect, and you decide what it may do on its own before it does anything.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="ys-sec" aria-labelledby="faq-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <span className="ys-node" data-reader-mark aria-hidden="true" />
          <p className="ys-eyebrow">FAQ</p>
          <h2 id="faq-title" className="ys-display ys-h2">Common questions.</h2>
        </div>
        <div className="ys-faq ys-scrim">
          {items.map(({ q, a }) => (
            <details key={q} data-faq-item className="ys-faq-item">
              <summary className="ys-faq-q">
                <span>{q}</span>
                <span className="ys-faq-icon" aria-hidden="true" />
              </summary>
              <div className="ys-faq-a">
                <p>{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
