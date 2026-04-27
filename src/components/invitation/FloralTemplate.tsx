'use client';

import { useEffect, useRef, useState } from 'react';
import { Invitation } from '@/types/invitation';
import { MusicPlayer, Reveal } from './shared';

function Divider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div className="w-12 h-px" style={{ backgroundColor: `${color}44` }} />
      <span className="text-lg" style={{ color: `${color}88` }}>✦</span>
      <div className="w-12 h-px" style={{ backgroundColor: `${color}44` }} />
    </div>
  );
}

export function FloralTemplate({ inv }: { inv: Invitation }) {
  const P   = inv.primary_color || '#9F1239';
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ fontFamily: "'Cormorant Garamond','Caladea',Georgia,serif", backgroundColor: '#FFFBF5' }}>
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{
          background: inv.cover_image_url
            ? `linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.50)), url(${inv.cover_image_url}) center/cover`
            : `linear-gradient(160deg, #FFF0F3 0%, #FDEEF4 50%, #FFF8F0 100%)`,
        }}
      >
        {/* Decorative corner flowers */}
        {!inv.cover_image_url && (
          <>
            <div className="absolute top-0 left-0 text-6xl pointer-events-none select-none leading-none" style={{ color: `${P}22`, lineHeight: 1 }}>❀</div>
            <div className="absolute top-0 right-0 text-6xl pointer-events-none select-none leading-none" style={{ color: `${P}22`, lineHeight: 1 }}>❀</div>
            <div className="absolute bottom-0 left-0 text-6xl pointer-events-none select-none leading-none" style={{ color: `${P}22`, lineHeight: 1 }}>❀</div>
            <div className="absolute bottom-0 right-0 text-6xl pointer-events-none select-none leading-none" style={{ color: `${P}22`, lineHeight: 1 }}>❀</div>
          </>
        )}

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'none' : 'translateY(24px)',
          transition: 'opacity 1.2s cubic-bezier(.22,1,.36,1), transform 1.2s cubic-bezier(.22,1,.36,1)',
        }}>
          <p className="text-xs tracking-[0.35em] uppercase mb-4 font-semibold"
            style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.7)' : `${P}99` }}>
            The Wedding Of
          </p>

          <h1
            className="leading-tight mb-1"
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(3.5rem, 12vw, 6.5rem)',
              color: inv.cover_image_url ? '#fff' : P,
              textShadow: inv.cover_image_url ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {inv.groom_name}
          </h1>

          <div style={{
            opacity: heroVisible ? 1 : 0,
            transition: 'opacity 1.2s ease 0.3s',
            color: inv.cover_image_url ? 'rgba(255,255,255,0.6)' : `${P}77`,
            fontFamily: "'Dancing Script', cursive",
            fontSize: '2rem',
          }}>
            &amp;
          </div>

          <h1
            className="leading-tight"
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(3.5rem, 12vw, 6.5rem)',
              color: inv.cover_image_url ? '#fff' : P,
              textShadow: inv.cover_image_url ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'none' : 'translateY(16px)',
              transition: 'opacity 1.2s cubic-bezier(.22,1,.36,1) 0.2s, transform 1.2s cubic-bezier(.22,1,.36,1) 0.2s',
            }}
          >
            {inv.bride_name}
          </h1>

          {inv.reception_date && (
            <div style={{
              opacity: heroVisible ? 1 : 0,
              transition: 'opacity 1s ease 0.6s',
              marginTop: '1.5rem',
            }}>
              <p className="text-sm tracking-[0.25em] uppercase"
                style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.7)' : `${P}99` }}>
                {inv.reception_date}
              </p>
            </div>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'inv-bounce 2s ease-in-out infinite' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7l5 6 5-6" stroke={inv.cover_image_url ? 'rgba(255,255,255,0.5)' : `${P}66`} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* ── Opening quote ── */}
      <section className="py-20 px-6 text-center max-w-lg mx-auto">
        <Reveal delay={0}>
          <Divider color={P} />
          <p className="text-slate-500 leading-relaxed mt-6 text-base italic" style={{ fontStyle: 'italic' }}>
            {inv.opening_message || 'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud mengundang kehadiran Bapak/Ibu/Saudara/i pada pernikahan putra-putri kami.'}
          </p>
          <Divider color={P} />
        </Reveal>
      </section>

      {/* ── Couple ── */}
      <section className="py-10 px-6" style={{ backgroundColor: `${P}07` }}>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { name: inv.groom_name, parents: inv.groom_parents, label: 'Mempelai Pria', dir: 'left' as const },
            { name: inv.bride_name, parents: inv.bride_parents, label: 'Mempelai Wanita', dir: 'right' as const },
          ].map((p) => (
            <Reveal key={p.label} direction={p.dir}>
              <div className="text-center rounded-3xl p-8 bg-white shadow-sm border" style={{ borderColor: `${P}18` }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                  style={{ background: `linear-gradient(135deg, ${P}22, ${P}44)` }}>
                  <span style={{ fontFamily: "'Dancing Script', cursive", color: P, fontSize: '1.8rem' }}>
                    {p.name?.[0]}
                  </span>
                </div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${P}88` }}>{p.label}</p>
                <h3 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem', color: P }}>{p.name}</h3>
                {p.parents && (
                  <p className="text-sm text-slate-400 mt-2 italic leading-relaxed">
                    Putra/Putri dari<br />
                    <span className="text-slate-600 not-italic font-medium">{p.parents}</span>
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="py-20 px-6">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${P}88` }}>Rangkaian</p>
            <h2 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2.8rem', color: P }}>Acara</h2>
            <Divider color={P} />
          </div>
        </Reveal>

        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {inv.akad_date && (
            <Reveal delay={100} direction="left">
              <div className="rounded-3xl overflow-hidden shadow-sm border bg-white" style={{ borderColor: `${P}18` }}>
                <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${P}, ${P}88)` }} />
                <div className="p-7 text-center">
                  <p className="text-3xl mb-3" style={{ color: `${P}66` }}>☽</p>
                  <h3 className="font-semibold mb-3" style={{ color: P }}>Akad Nikah</h3>
                  <p className="font-semibold text-slate-700">{inv.akad_date}</p>
                  {inv.akad_time && <p className="text-sm text-slate-500 mt-1">{inv.akad_time}</p>}
                  {inv.akad_venue && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: `${P}18` }}>
                      <p className="font-medium text-slate-700">{inv.akad_venue}</p>
                      {inv.akad_address && <p className="text-xs text-slate-400 mt-1">{inv.akad_address}</p>}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {inv.reception_date && (
            <Reveal delay={200} direction="right">
              <div className="rounded-3xl overflow-hidden shadow-sm border bg-white" style={{ borderColor: `${P}18` }}>
                <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${P}88, ${P})` }} />
                <div className="p-7 text-center">
                  <p className="text-3xl mb-3" style={{ color: `${P}66` }}>♡</p>
                  <h3 className="font-semibold mb-3" style={{ color: P }}>Resepsi</h3>
                  <p className="font-semibold text-slate-700">{inv.reception_date}</p>
                  {inv.reception_time && <p className="text-sm text-slate-500 mt-1">{inv.reception_time}</p>}
                  {inv.reception_venue && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: `${P}18` }}>
                      <p className="font-medium text-slate-700">{inv.reception_venue}</p>
                      {inv.reception_address && <p className="text-xs text-slate-400 mt-1">{inv.reception_address}</p>}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="py-20 px-6 text-center max-w-lg mx-auto">
        <Reveal>
          <Divider color={P} />
          <p className="text-slate-500 text-base italic leading-relaxed mt-6">
            {inv.closing_message || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.'}
          </p>
          <div className="mt-10">
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2.2rem', color: P }}>
              {inv.groom_name} &amp; {inv.bride_name}
            </p>
            <p className="text-xs tracking-widest uppercase text-slate-400 mt-2">Beserta Keluarga Besar</p>
          </div>
          <Divider color={P} />
        </Reveal>
      </section>

      <style>{`
        @keyframes inv-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
