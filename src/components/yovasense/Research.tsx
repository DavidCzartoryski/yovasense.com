import { yovasense, mailto } from "@/data/yovasense";
import { Container, SectionHead } from "./bits";

const { research } = yovasense;

/** The diagnosis loop: where the model sits between the incident record and the outcome. */
function Flow() {
  return (
    <figure className="mt-12">
      <figcaption className="ar-label text-ar-faint">The diagnosis loop</figcaption>
      <ol className="mt-4 grid gap-2 md:grid-cols-5 md:gap-0">
        {research.flow.map((step, i) => (
          <li key={step} className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-0">
            <div className="flex flex-1 items-center md:flex-none">
              <div className="flex min-h-[64px] flex-1 flex-col justify-center border border-ar-line-2 bg-ar-bg px-4 py-3">
                <span className="text-[14.5px] font-medium leading-snug text-ar-fg">{step}</span>
              </div>
              {i < research.flow.length - 1 && (
                <span aria-hidden="true" className="ar-mono hidden w-6 shrink-0 text-center text-ar-faint md:block">
                  →
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="ar-mono mt-3 text-[11px] text-ar-faint">
        <span aria-hidden="true">↺ </span>Each verified outcome becomes a labeled example for the next round.
      </p>
    </figure>
  );
}

export default function Research() {
  return (
    <section id="research" aria-labelledby="research-title" className="border-t border-ar-line bg-ar-panel/50 py-20 md:py-28">
      <Container>
        <SectionHead id="research-title" n="07" eyebrow={research.eyebrow} title={research.heading} lede={research.body} />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="border border-ar-line-2 bg-ar-bg p-6 md:p-8">
            <h3 className="ar-display text-[22px] leading-tight text-ar-fg">{research.today.title}</h3>
            <ul className="mt-6 space-y-4">
              {research.today.items.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-[1.6] text-ar-muted">
                  <span aria-hidden="true" className="mt-[11px] h-px w-3 shrink-0 bg-ar-ctl" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-ar-line-2 bg-ar-bg p-6 md:p-8">
            <h3 className="ar-display text-[22px] leading-tight text-ar-fg">{research.next.title}</h3>
            <ul className="mt-6 space-y-4">
              {research.next.items.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-[1.6] text-ar-muted">
                  <span aria-hidden="true" className="mt-[11px] h-px w-3 shrink-0 bg-ar-ctl" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-6 max-w-[760px] text-[14.5px] leading-[1.6] text-ar-muted">{research.demo}</p>

        <Flow />

        <p className="mt-10 text-[16px] leading-[1.6] text-ar-fg">
          {research.ask}{" "}
          <a
            href={mailto(`${yovasense.name}: incident data`)}
            className="underline decoration-ar-line-2 underline-offset-4 transition-colors hover:decoration-ar-fg"
          >
            Write to us
          </a>
          .
        </p>
      </Container>
    </section>
  );
}
