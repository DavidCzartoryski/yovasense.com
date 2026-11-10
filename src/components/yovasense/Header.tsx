import Link from "next/link";
import { yovasense, mailto } from "@/data/yovasense";
import Mark from "./Mark";

export const PILOT_SUBJECT = "YovaSense: let's talk";

/** Shared by / and /product/. Sticky, with the pilot path always one Tab away. */
export default function Header({ current }: { current?: "product" }) {
  return (
    <header className="ys-header">
      <a href="#main" className="ys-skip">Skip to content</a>
      <div className="ys-wrap ys-header-bar">
        <Link href="/" className="ys-brand" aria-label="YovaSense home">
          <Mark size={26} />
          <span className="ys-wordmark">YOVASENSE</span>
        </Link>
        <nav className="ys-nav" aria-label="Main">
          <Link href="/product/" className="ys-nav-link ys-nav-wide ys-nav-product" aria-current={current === "product" ? "page" : undefined}>
            Product
          </Link>
          <a href="/Demo/" className="ys-nav-link">Demo</a>
          <a href="/Architecture/" className="ys-nav-link ys-nav-wide">Architecture</a>
          <a href={mailto(PILOT_SUBJECT)} className="ys-btn ys-btn-pilot ys-btn-sm">
            <span className="ys-lbl-wide">Talk to the founders</span>
            <span className="ys-lbl-narrow">Talk to us</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ys-footer">
      <div className="ys-wrap ys-foot-grid">
        <div>
          <p className="ys-foot-line">YovaSense: autonomous operations for GPU infrastructure, across training and inference.</p>
          <p className="ys-foot-fine">© {new Date().getFullYear()} YovaSense · Cofounded by {yovasense.founder}</p>
        </div>
        <nav aria-label="Footer" className="ys-foot-nav">
          <Link href="/product/">Product</Link>
          <a href="/Demo/">Demo</a>
          <a href="/Architecture/">Architecture</a>
          <a href={yovasense.github}>GPUBridge <span aria-hidden="true">↗</span></a>
          <a href={mailto(PILOT_SUBJECT)}>Contact</a>
        </nav>
      </div>
    </footer>
  );
}
