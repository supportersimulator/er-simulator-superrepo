"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-400/40">
            <span className="text-lg font-bold text-emerald-300">ER</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">ER Simulator</span>
            <span className="text-xs text-slate-400">
              Emergency Medicine Training
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 text-sm md:flex">
          <Link href="#features" className="text-slate-300 hover:text-white">
            Features
          </Link>
          <Link href="#how-it-works" className="text-slate-300 hover:text-white">
            How it works
          </Link>
          <Link href="/pricing" className="text-slate-300 hover:text-white">
            Pricing
          </Link>
          <Link
            href="#who-its-for"
            className="text-slate-300 hover:text-white"
          >
            Who it’s for
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link
            href="/pricing"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
          >
            Get early access
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex items-center justify-center rounded-md border border-slate-700 p-2 text-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Open main menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-slate-100" />
            <span className="h-0.5 w-5 bg-slate-100" />
            <span className="h-0.5 w-5 bg-slate-100" />
          </div>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-slate-800 bg-slate-950 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm">
            <Link
              href="#features"
              className="text-slate-200"
              onClick={() => setOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-slate-200"
              onClick={() => setOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              className="text-slate-200"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#who-its-for"
              className="text-slate-200"
              onClick={() => setOpen(false)}
            >
              Who it’s for
            </Link>
            <Link
              href="/pricing"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
              onClick={() => setOpen(false)}
            >
              Get early access
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}