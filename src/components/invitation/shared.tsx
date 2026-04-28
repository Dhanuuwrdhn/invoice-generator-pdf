'use client';

import { useEffect, useRef, useState } from 'react';
import { Invitation } from '@/types/invitation';

export function MusicPlayer({ url, color }: { url: string; color: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) { audioRef.current.loop = true; audioRef.current.volume = 0.45; }
  }, []);

  function toggle() {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  }

  return (
    <>
      <audio ref={audioRef} src={url} preload="none" />
      <button
        onClick={toggle}
        title={playing ? 'Pause music' : 'Play music'}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ width: 52, height: 52, backgroundColor: color, boxShadow: `0 4px 20px ${color}66` }}
      >
        {playing ? (
          <span className="flex items-end gap-[3px]" style={{ height: 20 }}>
            {[1, 2, 3].map(i => (
              <span key={i} className="w-[3px] rounded-full bg-white block"
                style={{ animation: `inv-bar${i} 0.7s ease-in-out infinite alternate`, animationDelay: `${(i - 1) * 0.12}s` }} />
            ))}
          </span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18V5l12-2v13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" fill="white"/>
            <circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
        )}
      </button>
      <style>{`
        @keyframes inv-bar1{from{height:30%}to{height:90%}}
        @keyframes inv-bar2{from{height:60%}to{height:25%}}
        @keyframes inv-bar3{from{height:45%}to{height:100%}}
      `}</style>
    </>
  );
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const translate = direction === 'up' ? 'translateY(36px)'
      : direction === 'left'  ? 'translateX(-36px)'
      : direction === 'right' ? 'translateX(36px)'
      : 'none';

    el.style.opacity = '0';
    el.style.transform = translate;
    el.style.transition = `opacity 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms`;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        obs.unobserve(el);
      }
    }, { threshold: 0.12 });

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, direction]);

  return <div ref={ref} className={className}>{children}</div>;
}

/* ── Gift / Payment section — shared across all templates ────────── */
export function GiftSection({ inv, color }: { inv: Invitation; color: string }) {
  const hasBank = inv.bank_name || inv.bank_account_number;
  const hasQris = inv.qris_image_url;
  if (!hasBank && !hasQris) return null;

  const [copied, setCopied] = useState(false);

  function copyAcct() {
    navigator.clipboard.writeText(inv.bank_account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Reveal>
      <section className="py-16 px-6 max-w-xl mx-auto text-center">
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${color}88` }}>Hadiah</p>
        <h2 style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.2rem', color, marginBottom: 8 }}>
          Wedding Gift
        </h2>
        <p className="text-sm text-slate-400 mb-8 italic">
          Doa restu Anda adalah hadiah terbaik. Namun jika ingin memberi, berikut informasinya:
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Bank transfer */}
          {hasBank && (
            <div className="flex-1 rounded-2xl border bg-white p-5 text-left shadow-sm" style={{ borderColor: `${color}22` }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: `${color}88` }}>Transfer Bank</p>
              <p className="font-bold text-slate-700">{inv.bank_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono font-semibold text-slate-800 text-lg">{inv.bank_account_number}</p>
                <button
                  onClick={copyAcct}
                  title="Salin nomor rekening"
                  className="ml-auto shrink-0 transition-all"
                  style={{ color: copied ? '#16a34a' : `${color}88` }}
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/></svg>
                  )}
                </button>
              </div>
              {inv.bank_account_name && (
                <p className="text-sm text-slate-500 mt-1">a.n. {inv.bank_account_name}</p>
              )}
            </div>
          )}

          {/* QRIS */}
          {hasQris && (
            <div className="flex-1 rounded-2xl border bg-white p-5 text-center shadow-sm" style={{ borderColor: `${color}22` }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: `${color}88` }}>QRIS</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inv.qris_image_url}
                alt="QRIS"
                className="w-40 h-40 mx-auto object-contain rounded-lg"
              />
              <p className="text-xs text-slate-400 mt-2">Scan untuk transfer</p>
            </div>
          )}
        </div>
      </section>
    </Reveal>
  );
}
