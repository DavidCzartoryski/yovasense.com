import { yovasense } from "@/data/yovasense";
import { Container, SectionHead, Tag } from "./bits";

const { evidence } = yovasense;

const SCOPE = {
  detector: { label: "YovaSense · 4×V100", tone: "ctl" },
  gpubridge: { label: "GPUBridge · V100 + MI50", tone: "data" },
} as const;

export default function Evidence() {
  return (
    <section id="evidence" aria-labelledby="evidence-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <SectionHead id="evidence-title" n="06" eyebrow={evidence.eyebrow} title={evidence.heading} lede={evidence.body} />

        <ul className="mt-14 grid gap-px border border-ar-line bg-ar-line md:grid-cols-2 xl:grid-cols-3">
          {evidence.items.map((e) => {
            const scope = SCOPE[e.scope];
            return (
              <li key={e.value} className="flex flex-col bg-ar-bg p-6 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Tag tone={scope.tone}>{scope.label}</Tag>
                  <span className="ar-label text-[11px] text-ar-faint">Real GPUs</span>
                </div>
                <p className="ar-display mt-8 text-[clamp(2.2rem,3.6vw,3rem)] leading-none text-ar-fg">{e.value}</p>
                <p className="mt-4 text-[15.5px] font-medium leading-snug text-ar-fg">{e.result}</p>
                <p className="mt-auto pt-5 text-[14px] leading-snug text-ar-faint">{e.setup}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
