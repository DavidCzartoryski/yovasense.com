import { Container, Eyebrow, Ticks } from "./bits";
export default function About() {
  return <section id="about" aria-labelledby="about-title" className="border-t border-ar-line py-20 md:py-28"><Container>
    <Eyebrow n="08">The cofounders</Eyebrow>
    <h2 id="about-title" className="ar-display mt-5 text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.08]">GPU engineering meets production infrastructure.</h2>
    <div className="mt-10 grid gap-5 md:grid-cols-2">
      <article className="relative border border-ar-line-2 bg-ar-panel p-7 md:p-9"><Ticks /><p className="ar-label text-ar-faint">Cofounder / CEO</p><h3 className="ar-display mt-5 text-[27px]">David Czartoryski</h3><p className="mt-5 text-[16px] leading-[1.7] text-ar-muted">David built YovaSense’s GPU instrumentation, slowdown detector and product prototype. The idea grew out of his GPU reliability research using Northeastern’s Explorer cluster.</p><a href="https://www.linkedin.com/in/david-czartoryski/" className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4">LinkedIn ↗</a></article>
      <article className="relative border border-ar-line-2 bg-ar-panel p-7 md:p-9"><Ticks /><p className="ar-label text-ar-faint">Cofounder / CTO</p><h3 className="ar-display mt-5 text-[27px]">Thomas Czartoryski</h3><p className="mt-5 text-[16px] leading-[1.7] text-ar-muted">Thomas brings production-infrastructure experience from Meta and guides YovaSense’s system architecture. Together, the brothers are building an evidence-backed operational workflow for GPU fleets.</p><a href="https://www.linkedin.com/in/thomas-czartoryski/" className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4">LinkedIn ↗</a></article>
    </div>
  </Container></section>;
}
