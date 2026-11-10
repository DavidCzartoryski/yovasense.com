import Link from "next/link";
import Header, { Footer } from "@/components/yovasense/Header";

// Old paths (/artemis, /demo, /architecture) land on the right page instead of this one.
const normalize = `(function(){var p=location.pathname;var t=p.replace(/^\\/artemis(?=\\/|$)/i,"").replace(/^\\/demo(?=\\/|$)/i,"/Demo").replace(/^\\/architecture(?=\\/|$)/i,"/Architecture");t="/"+t.replace(/^\\/+/,"");if(t!==p)location.replace(t+location.search+location.hash)})()`;

export default function NotFound() {
  return (
    <div className="ys-page">
      <script dangerouslySetInnerHTML={{ __html: normalize }} />
      <Header />
      <main id="main" tabIndex={-1} className="ys-404">
        <div className="ys-wrap ys-rail">
          <span className="ys-404-line" aria-hidden="true" />
          <span className="ys-404-end" aria-hidden="true" />
          <p className="ys-eyebrow">404 · not found</p>
          <h1 className="ys-display ys-h1 ys-404-title">The line doesn&apos;t run here.</h1>
          <p className="ys-lede">There is no page at this address. These are the ones that exist:</p>
          <ul className="ys-404-links">
            <li><Link className="ys-link" href="/">YovaSense home <span aria-hidden="true">→</span></Link></li>
            <li><a className="ys-link" href="/Demo/">The interactive demo <span aria-hidden="true">→</span></a></li>
            <li><Link className="ys-link" href="/product/">Inside YovaSense <span aria-hidden="true">→</span></Link></li>
            <li><a className="ys-link" href="/Architecture/">The architecture explorer <span aria-hidden="true">→</span></a></li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
