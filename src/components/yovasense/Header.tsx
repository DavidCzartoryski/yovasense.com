import Link from "next/link";
import { yovasense, mailto } from "@/data/yovasense";
import { Container } from "./bits";
import Mark from "./Mark";

export default function Header({ product = false }: { product?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-ar-line bg-ar-bg/90 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-full focus:bg-ar-fg focus:px-4 focus:py-2 focus:text-[13px] focus:text-ar-bg">
        Skip to content
      </a>
      <Container className="flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ar-fg" aria-label="YovaSense home">
          <Mark size={26} />
          <span className="ar-wide text-[14px] font-semibold tracking-[0.16em]">YOVASENSE</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 sm:gap-7">
          <Link href="/product/" aria-current={product ? "page" : undefined} className="py-3 text-[13px] text-ar-muted transition-colors hover:text-ar-fg aria-[current]:text-ar-fg sm:text-[14px]">
            Product
          </Link>
          <a href="/Demo/" className="py-3 text-[13px] text-ar-muted transition-colors hover:text-ar-fg sm:text-[14px]">Demo</a>
          <Link href="/product/#about" className="hidden py-3 text-[14px] text-ar-muted transition-colors hover:text-ar-fg sm:block">About</Link>
          <a href={mailto("YovaSense: let's talk")} className="inline-flex min-h-10 items-center rounded-full bg-ar-fg px-4 text-[13px] font-medium text-ar-bg transition-opacity hover:opacity-85 sm:px-5 sm:text-[14px]">
            Let&apos;s talk <span aria-hidden="true" className="ml-2">↗</span>
          </a>
        </nav>
      </Container>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ar-line">
      <Container className="flex flex-col gap-5 py-8 text-[12px] text-ar-faint sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-ar-muted">YovaSense — performance diagnosis and recovery for distributed AI training.</p>
          <p>© {new Date().getFullYear()} YovaSense · Cofounded by {yovasense.founder}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/product/" className="hover:text-ar-fg">Product</Link>
          <a href={yovasense.github} className="hover:text-ar-fg">GPUBridge ↗</a>
          <a href={mailto("YovaSense: let's talk")} className="hover:text-ar-fg">Contact</a>
        </nav>
      </Container>
    </footer>
  );
}
