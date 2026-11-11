import Link from "next/link";
import Mark from "./Mark";

/** Mail subjects for the remaining mailto links (the access form's fallback and the unlisted /product/). */
export const GET_ACCESS_SUBJECT = "YovaSense: get access";
export const WRITE_SUBJECT = "YovaSense";

/** Every "Get access" goes to the email form at the end of the home page. */
export const ACCESS_HREF = "/#access";

/** Shared by /, /product/ and the 404. Sticky: the brand and "Get access", nothing else. */
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
          <a href={ACCESS_HREF} className="ys-btn ys-btn-pilot ys-btn-sm">
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
          <a href={ACCESS_HREF}>Get access</a>
        </nav>
      </div>
    </footer>
  );
}
