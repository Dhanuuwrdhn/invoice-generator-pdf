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

/* ── Couple photo section — full bleed with Ken Burns ────────────── */
export function CouplePhotoSection({
  inv, color, theme = 'light',
}: {
  inv: Invitation; color: string; theme?: 'light' | 'dark' | 'jawa';
}) {
  if (!inv.couple_image_url) return null;
  const isDark = theme === 'dark';
  const isJawa = theme === 'jawa';
  const gold   = '#C9A96E';

  return (
    <Reveal direction="none">
      <section className="relative overflow-hidden">
        {/* Full-width photo with Ken Burns */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(420px, 90vw, 620px)' }}>
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${inv.couple_image_url})`, animation: 'ken-burns 18s ease-in-out infinite alternate' }}
          />
          {/* Dark gradient overlay bottom */}
          <div className="absolute inset-0" style={{
            background: isDark
              ? 'linear-gradient(to bottom, rgba(13,17,23,0.1) 0%, rgba(13,17,23,0.9) 100%)'
              : isJawa
              ? 'linear-gradient(to bottom, rgba(28,10,0,0.1) 0%, rgba(28,10,0,0.9) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)',
          }} />

          {/* Floating hearts */}
          {!isDark && !isJawa && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(7)].map((_, i) => (
                <span key={i} className="absolute select-none"
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: `${10 + i * 3}px`,
                    left: `${8 + i * 12}%`,
                    bottom: '25%',
                    animation: `float-heart ${3.5 + i * 0.4}s ease-in-out ${i * 0.55}s infinite`,
                  }}>♡</span>
              ))}
            </div>
          )}

          {/* Gold sparkles — jawa */}
          {isJawa && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="absolute select-none"
                  style={{ color: `${gold}99`, fontSize: `${8 + i * 3}px`, left: `${6 + i * 16}%`, top: '15%', animation: `sparkle 2.5s ease-in-out ${i * 0.4}s infinite` }}>✦</span>
              ))}
            </div>
          )}

          {/* Names overlay — bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 text-center">
            <p className="text-xs tracking-[0.3em] uppercase mb-2"
              style={{ color: isJawa ? `${gold}88` : 'rgba(255,255,255,0.55)' }}>
              {isJawa ? 'Foto Mempelai' : 'Our Story'}
            </p>
            <p style={{
              fontFamily: "'Dancing Script',cursive",
              fontSize: 'clamp(2.2rem,8vw,3.8rem)',
              color: isJawa ? gold : '#fff',
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              lineHeight: 1.1,
            }}>
              {inv.groom_name} &amp; {inv.bride_name}
            </p>
          </div>
        </div>

        {/* Ayat / quote strip */}
        <div className="py-8 px-8 text-center" style={{
          backgroundColor: isDark ? '#161B22' : isJawa ? 'rgba(255,255,255,0.03)' : `${color}09`,
        }}>
          <p className="text-sm italic leading-relaxed max-w-md mx-auto"
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : isJawa ? `${gold}88` : 'rgba(0,0,0,0.4)' }}>
            &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu cenderung dan merasa tenteram kepadanya.&rdquo;
          </p>
          <p className="text-xs mt-2" style={{ color: isDark ? 'rgba(255,255,255,0.18)' : isJawa ? `${gold}44` : `${color}55` }}>
            QS. Ar-Rum: 21
          </p>
        </div>

        <style>{`
          @keyframes ken-burns{0%{transform:scale(1) translateX(0)}33%{transform:scale(1.06) translateX(-1%) translateY(-1%)}66%{transform:scale(1.04) translateX(1%) translateY(0.5%)}100%{transform:scale(1.08) translateX(-0.5%) translateY(-0.5%)}}
          @keyframes float-heart{0%{transform:translateY(0);opacity:0}20%{opacity:0.8}80%{opacity:0.2}100%{transform:translateY(-90px);opacity:0}}
          @keyframes sparkle{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        `}</style>
      </section>
    </Reveal>
  );
}

/* ── Love Story section ───────────────────────────────────────────── */
export function LoveStorySection({
  inv, color, theme = 'light',
}: {
  inv: Invitation; color: string; theme?: 'light' | 'dark' | 'jawa';
}) {
  if (!inv.photo_2_url && !inv.photo_3_url && !inv.love_story_text) return null;
  const isDark = theme === 'dark';
  const isJawa = theme === 'jawa';
  const gold   = '#C9A96E';
  const accentColor = isJawa ? gold : color;
  const textColor   = isDark || isJawa ? '#fff' : '#1a1a1a';
  const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : isJawa ? `${gold}88` : 'rgba(0,0,0,0.5)';

  return (
    <Reveal direction="none">
      <section style={{ backgroundColor: isDark ? '#0D1117' : isJawa ? '#1C0A00' : '#FDFAF6' }}>

        {/* Section header — photo_2 as full bg */}
        {inv.photo_2_url && (
          <div className="relative overflow-hidden" style={{ height: 'clamp(320px,70vw,500px)' }}>
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${inv.photo_2_url})`, animation: 'ken-burns 22s ease-in-out infinite alternate' }}
            />
            <div className="absolute inset-0" style={{
              background: isDark
                ? 'linear-gradient(rgba(13,17,23,0.45), rgba(13,17,23,0.85))'
                : isJawa
                ? 'linear-gradient(rgba(28,10,0,0.4), rgba(28,10,0,0.88))'
                : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7))',
            }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: 'clamp(2.5rem,10vw,4.5rem)', color: isJawa ? gold : '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Our Love Story
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-10 h-px" style={{ backgroundColor: isJawa ? `${gold}88` : 'rgba(255,255,255,0.4)' }} />
                <span style={{ color: isJawa ? `${gold}66` : 'rgba(255,255,255,0.5)', fontSize: 12 }}>✦</span>
                <div className="w-10 h-px" style={{ backgroundColor: isJawa ? `${gold}88` : 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Love story text + photo_3 side by side */}
        <div className="max-w-2xl mx-auto px-6 py-16">
          {!inv.photo_2_url && (
            <Reveal>
              <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.8rem', color: accentColor, textAlign: 'center', marginBottom: 16 }}>
                Our Love Story
              </p>
            </Reveal>
          )}
          <div className={`flex flex-col ${inv.photo_3_url ? 'sm:flex-row' : ''} gap-8 items-center`}>
            {inv.photo_3_url && (
              <Reveal direction="left" className="sm:w-1/2 w-full">
                <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: `2px solid ${accentColor}33`, aspectRatio: '3/4', position: 'relative' }}>
                  <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${inv.photo_3_url})`, animation: 'ken-burns 20s ease-in-out infinite alternate' }} />
                </div>
              </Reveal>
            )}
            {inv.love_story_text && (
              <Reveal direction={inv.photo_3_url ? 'right' : 'up'} delay={100} className={inv.photo_3_url ? 'sm:w-1/2' : 'w-full text-center'}>
                <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: `${accentColor}88` }}>Cerita Kami</p>
                <p className="leading-relaxed whitespace-pre-line text-sm" style={{ color: subtextColor, fontStyle: 'italic' }}>
                  {inv.love_story_text}
                </p>
                <p className="mt-6" style={{ fontFamily: "'Dancing Script',cursive", fontSize: '1.6rem', color: accentColor }}>
                  {inv.groom_name} &amp; {inv.bride_name}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

/* ── Photo background section (parallax-style) ───────────────────── */
export function PhotoBgSection({
  url, children, theme = 'light',
}: {
  url: string; children: React.ReactNode; theme?: 'light' | 'dark' | 'jawa';
}) {
  if (!url) return <>{children}</>;
  const overlay = theme === 'dark' ? 'rgba(13,17,23,0.82)' : theme === 'jawa' ? 'rgba(28,10,0,0.80)' : 'rgba(255,255,255,0.82)';
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${url})`, filter: 'blur(3px) brightness(0.9)', transform: 'scale(1.06)', animation: 'kb-slow 20s ease-in-out infinite alternate' }} />
      <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
      <div className="relative z-10">{children}</div>
      <style>{`@keyframes kb-slow{0%{transform:scale(1.06) translateX(0)}100%{transform:scale(1.1) translateX(-1%)}}`}</style>
    </div>
  );
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
