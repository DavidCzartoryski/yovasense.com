import Link from "next/link";
import { yovasense, mailto } from "@/data/yovasense";
import Mark from "./Mark";

/** The page's three mail subjects. Every mailto on the site uses one of these. */
export const GET_ACCESS_SUBJECT = "YovaSense: get access";
export const WRITE_SUBJECT = "YovaSense";

/** Shared by /, /product/ and the 404. Sticky, with "Get access" always one Tab away. */
export default function Header() {
  return (
    <header className="ys-header">
      <a href="#main" className="ys-skip">Skip to content</a>
      <div className="ys-wrap ys-header-bar">
        <Link href="/" className="ys-brand" aria-label="YovaSense home">
          <Mark size={26} />
          <span className="ys-wordmark">YOVASENSE</span>
        </Link>
        <nav className="ys-nav" aria-label="Main">
          <Link href="/#how" className="ys-nav-link ys-nav-wide">How it works</Link>
          <Link href="/#faq" className="ys-nav-link ys-nav-wide">FAQ</Link>
          <a href={mailto(GET_ACCESS_SUBJECT)} className="ys-btn ys-btn-pilot ys-btn-sm">
            Get access
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
          <p className="ys-foot-line">YovaSense. Autonomous operations for GPU infrastructure.</p>
          <p className="ys-foot-fine">© {new Date().getFullYear()} YovaSense</p>
        </div>
        <nav aria-label="Footer" className="ys-foot-nav">
          <a href={mailto(GET_ACCESS_SUBJECT)}>Get access</a>
          <a href={mailto(WRITE_SUBJECT)}>{yovasense.email}</a>
        </nav>
      </div>
    </footer>
  );
}
