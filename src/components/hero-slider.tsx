"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  text: string;
  /** kelas Tailwind gradien latar */
  bg: string;
  /** opsional: foto di /public (mis. "/hero/gotong-royong.jpg"); jika diisi tampil di bawah lapisan gelap */
  image?: string;
  ctas: { href: string; label: string; primary?: boolean }[];
};

const INTERVAL = 6000;

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const paused = useRef(false);
  const [i, setI] = useState(0);

  const go = (n: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const n = Math.round(el.scrollLeft / el.clientWidth);
    current.current = n;
    setI(n);
  };

  // Geser otomatis; berhenti saat disentuh/disorot, dan dimatikan bila pengguna memilih "kurangi gerakan".
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current && !document.hidden) go((current.current + 1) % slides.length);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);

  const pause = () => (paused.current = true);
  const resume = () => (paused.current = false);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Sorotan"
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div ref={track} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {slides.map((s, idx) => (
          <div
            key={s.title}
            aria-hidden={idx !== i}
            className={`relative min-h-[280px] w-full shrink-0 snap-center overflow-hidden px-6 pb-14 pt-10 text-white sm:min-h-[320px] sm:px-10 ${s.bg}`}
            style={s.image ? { backgroundImage: `linear-gradient(rgba(18,64,42,.78),rgba(18,64,42,.78)), url(${s.image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            {/* hiasan ringan, murni CSS */}
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/[.07]" />
            <span aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/[.05]" />
            <div className="relative max-w-xl">
              <p className="text-sm text-brand-200">{s.eyebrow}</p>
              <h2 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">{s.title}</h2>
              <p className="mt-3 text-brand-100">{s.text}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {s.ctas.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    tabIndex={idx === i ? 0 : -1}
                    className={c.primary
                      ? "rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50"
                      : "rounded-lg border border-brand-200/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-current={idx === i}
              onClick={() => go(idx)}
              className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
