'use client';

import { useEffect, useState } from 'react';
import { Invitation } from '@/types/invitation';
import { MusicPlayer, Reveal, GiftSection } from './shared';

/* ── Batik-inspired SVG pattern ─────────────────────────────────── */
function BatikPattern({ color, opacity = 0.07 }: { color: string; opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern id="kawung" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* Kawung motif — 4 oval petals around center */}
          <ellipse cx="20" cy="10" rx="6" ry="9" fill="none" stroke={color} strokeWidth="0.8"/>
          <ellipse cx="20" cy="30" rx="6" ry="9" fill="none" stroke={color} strokeWidth="0.8"/>
          <ellipse cx="10" cy="20" rx="9" ry="6" fill="none" stroke={color} strokeWidth="0.8"/>
          <ellipse cx="30" cy="20" rx="9" ry="6" fill="none" stroke={color} strokeWidth="0.8"/>
          <circle  cx="20" cy="20" r="2.5" fill={color} opacity="0.4"/>
          {/* Corner dots */}
          <circle cx="0"  cy="0"  r="1.5" fill={color} opacity="0.3"/>
          <circle cx="40" cy="0"  r="1.5" fill={color} opacity="0.3"/>
          <circle cx="0"  cy="40" r="1.5" fill={color} opacity="0.3"/>
          <circle cx="40" cy="40" r="1.5" fill={color} opacity="0.3"/>
        </pattern>
        <pattern id="parang" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 30 Q10 15 15 0 Q20 15 30 0" fill="none" stroke={color} strokeWidth="0.6"/>
          <path d="M-15 30 Q-5 15 0 0"            fill="none" stroke={color} strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kawung)"/>
    </svg>
  );
}

/* ── Ornamental divider ─────────────────────────────────────────── */
function JawaDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-3">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}55)` }} />
      <span className="text-xl" style={{ color: `${color}99` }}>❧</span>
      <span className="text-sm"  style={{ color: `${color}66` }}>✦</span>
      <span className="text-xl"  style={{ color: `${color}99` }}>❧</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color}55)` }} />
    </div>
  );
}

/* ── Keris / gunungan border top ─────────────────────────────────── */
function GununganBorder({ color }: { color: string }) {
  return (
    <div className="w-full flex items-center justify-center py-3 select-none pointer-events-none">
      <span className="text-2xl mx-1" style={{ color: `${color}44` }}>◆</span>
      <span className="text-base mx-1" style={{ color: `${color}33` }}>◇</span>
      <span className="text-2xl mx-1" style={{ color: `${color}55` }}>◆</span>
      <span className="text-base mx-1" style={{ color: `${color}33` }}>◇</span>
      <span className="text-3xl mx-1" style={{ color: `${color}66` }}>◆</span>
      <span className="text-base mx-1" style={{ color: `${color}33` }}>◇</span>
      <span className="text-2xl mx-1" style={{ color: `${color}55` }}>◆</span>
      <span className="text-base mx-1" style={{ color: `${color}33` }}>◇</span>
      <span className="text-2xl mx-1" style={{ color: `${color}44` }}>◆</span>
    </div>
  );
}

/* ── Splash screen ─────────────────────────────────────────────── */
function JawaSplash({ inv, color, onOpen }: { inv: Invitation; color: string; onOpen: () => void }) {
  const [leaving,  setLeaving]  = useState(false);
  const [visible,  setVisible]  = useState(false);
  const initials = `${inv.groom_name?.[0] ?? ''}${inv.bride_name?.[0] ?? ''}`;

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  function handle() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onOpen, 900);
  }

  /* Gold / warm accent derived from primary */
  const gold = '#C9A96E';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{
        backgroundColor: '#1C0A00',
        backgroundImage: `linear-gradient(160deg, #1C0A00 0%, #2D1500 60%, #1A0800 100%)`,
        opacity:    leaving ? 0 : 1,
        transform:  leaving ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 0.85s ease, transform 0.85s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <BatikPattern color={gold} opacity={0.12} />

      {/* Gold border frame */}
      <div className="absolute inset-4 rounded-none pointer-events-none" style={{ border: `1px solid ${gold}33` }} />
      <div className="absolute inset-6 rounded-none pointer-events-none" style={{ border: `0.5px solid ${gold}1a` }} />

      {/* Top ornament */}
      <div className="absolute top-8 left-0 right-0">
        <GununganBorder color={gold} />
      </div>

      <div style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : 'translateY(20px)',
        transition: 'opacity 1.2s ease, transform 1.2s ease',
      }}>
        {/* Monogram medallion */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${gold}cc, ${color}dd)`,
            border: `2px solid ${gold}66`,
            boxShadow: `0 0 30px ${gold}33, 0 0 0 6px ${gold}11`,
          }}
        >
          <span style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2rem', color: '#fff', fontWeight: 700 }}>
            {initials}
          </span>
        </div>

        {/* Bismillah / opening script */}
        <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: `${gold}99` }}>
          Bismillahirrahmanirrahim
        </p>
        <p className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: `${gold}66` }}>
          Undangan Pernikahan
        </p>

        <JawaDivider color={gold} />

        <h1
          className="mt-4 leading-tight"
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 'clamp(2.8rem, 9vw, 5rem)',
            color: '#fff',
            textShadow: `0 0 30px ${gold}55`,
          }}
        >
          {inv.groom_name}
        </h1>
        <p style={{ color: `${gold}88`, fontFamily: "'Dancing Script',cursive", fontSize: '1.8rem' }}>&amp;</p>
        <h1
          className="leading-tight"
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 'clamp(2.8rem, 9vw, 5rem)',
            color: '#fff',
            textShadow: `0 0 30px ${gold}55`,
          }}
        >
          {inv.bride_name}
        </h1>

        {inv.reception_date && (
          <p className="mt-4 text-sm tracking-widest" style={{ color: `${gold}77` }}>
            {inv.reception_date}
          </p>
        )}

        <JawaDivider color={gold} />

        <button
          onClick={handle}
          className="mt-8 px-10 py-3 text-sm tracking-[0.25em] uppercase font-semibold transition-all hover:opacity-80"
          style={{
            background: `linear-gradient(135deg, ${gold}cc, ${gold})`,
            color: '#1C0A00',
            borderRadius: 2,
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.2em',
          }}
        >
          {leaving ? 'Membuka…' : 'Buka Undangan'}
        </button>
      </div>

      {/* Bottom ornament */}
      <div className="absolute bottom-8 left-0 right-0">
        <GununganBorder color={gold} />
      </div>
    </div>
  );
}

/* ── Main invitation content ────────────────────────────────────── */
function InvitationContent({ inv, color }: { inv: Invitation; color: string }) {
  const [visible, setVisible] = useState(false);
  const gold = '#C9A96E';
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
        backgroundColor: '#FDFAF2',
        fontFamily: "'Cormorant Garamond','Caladea',Georgia,serif",
      }}
    >

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{
          background: inv.cover_image_url
            ? `linear-gradient(rgba(28,10,0,0.55),rgba(28,10,0,0.65)), url(${inv.cover_image_url}) center/cover`
            : `linear-gradient(165deg, #1C0A00 0%, #2D1500 60%, #3D2200 100%)`,
        }}
      >
        <BatikPattern color={gold} opacity={0.08} />

        {/* Border frame */}
        <div className="absolute inset-4 pointer-events-none" style={{ border: `1px solid ${gold}33` }} />

        <div className="relative z-10">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${gold}88` }}>Bismillahirrahmanirrahim</p>
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: `${gold}66` }}>Undangan Pernikahan</p>

          <GununganBorder color={gold} />

          <h1 style={{ fontFamily: "'Dancing Script',cursive", fontSize: 'clamp(3rem,11vw,6rem)', color: '#fff', lineHeight: 1.1, textShadow: `0 0 40px ${gold}44`, marginTop: '1rem' }}>
            {inv.groom_name}
            <span className="block" style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2rem', color: `${gold}99`, margin: '4px 0' }}>&amp;</span>
            {inv.bride_name}
          </h1>

          {inv.reception_date && (
            <div className="flex items-center gap-3 justify-center mt-6">
              <div className="w-10 h-px" style={{ backgroundColor: `${gold}66` }} />
              <p className="text-sm tracking-widest uppercase" style={{ color: `${gold}88` }}>{inv.reception_date}</p>
              <div className="w-10 h-px" style={{ backgroundColor: `${gold}66` }} />
            </div>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'jawa-bounce 2s ease-in-out infinite' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7l5 6 5-6" stroke={`${gold}66`} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* ── Opening ── */}
      <section className="py-16 px-6 text-center max-w-xl mx-auto relative overflow-hidden">
        <BatikPattern color={color} opacity={0.04} />
        <Reveal>
          <JawaDivider color={color} />
          <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
            {inv.opening_message || 'Assalamu\'alaikum Warahmatullahi Wabarakatuh\n\nDengan memohon rahmat, taufiq, serta hidayah Allah SWT, kami bermaksud menyelenggarakan tasyakuran pernikahan putra-putri kami.'}
          </p>
          <JawaDivider color={color} />
        </Reveal>
      </section>

      {/* ── Couple ── */}
      <section className="py-10 px-6" style={{ backgroundColor: `${color}09` }}>
        <Reveal>
          <div className="text-center mb-8">
            <GununganBorder color={color} />
            <h2 className="text-xl font-semibold mt-2" style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2rem', color }}>Mempelai</h2>
          </div>
        </Reveal>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { name: inv.groom_name, parents: inv.groom_parents, label: 'Mempelai Kakung', dir: 'left'  as const },
            { name: inv.bride_name, parents: inv.bride_parents, label: 'Mempelai Putri',  dir: 'right' as const },
          ].map(p => (
            <Reveal key={p.label} direction={p.dir}>
              <div className="relative text-center rounded-sm p-7 bg-white overflow-hidden border" style={{ borderColor: `${color}22` }}>
                <BatikPattern color={color} opacity={0.04} />
                {/* Gold corner accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l" style={{ borderColor: gold }} />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r" style={{ borderColor: gold }} />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" style={{ borderColor: gold }} />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" style={{ borderColor: gold }} />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${gold}88, ${color}cc)` }}>
                    <span style={{ fontFamily: "'Dancing Script',cursive", color: '#fff', fontSize: '1.6rem' }}>{p.name?.[0]}</span>
                  </div>
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: `${color}77` }}>{p.label}</p>
                  <h3 style={{ fontFamily: "'Dancing Script',cursive", fontSize: '1.8rem', color }}>{p.name}</h3>
                  {p.parents && (
                    <p className="text-sm text-slate-400 mt-2 italic leading-relaxed">
                      Putra/Putri saking<br />
                      <span className="text-slate-600 not-italic font-medium">{p.parents}</span>
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="py-16 px-6 relative overflow-hidden" style={{ backgroundColor: '#1C0A00' }}>
        <BatikPattern color={gold} opacity={0.1} />
        <Reveal>
          <div className="text-center mb-10 relative z-10">
            <GununganBorder color={gold} />
            <h2 style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.5rem', color: '#fff', marginTop: 8 }}>Adicara</h2>
            <p className="text-xs tracking-widest uppercase mt-1" style={{ color: `${gold}66` }}>Rangkaian Acara</p>
          </div>
        </Reveal>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
          {inv.akad_date && (
            <Reveal delay={100} direction="left">
              <div className="relative rounded-sm p-6 text-center overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${gold}33` }}>
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l" style={{ borderColor: `${gold}66` }} />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r" style={{ borderColor: `${gold}66` }} />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l" style={{ borderColor: `${gold}66` }} />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r" style={{ borderColor: `${gold}66` }} />
                <p className="text-2xl mb-3" style={{ color: `${gold}88` }}>☽</p>
                <h3 className="font-semibold mb-2 text-white">Ijab Kabul</h3>
                <p className="text-sm font-medium" style={{ color: `${gold}cc` }}>{inv.akad_date}</p>
                {inv.akad_time    && <p className="text-sm text-white/60 mt-1">{inv.akad_time}</p>}
                {inv.akad_venue   && <p className="text-sm font-medium text-white/80 mt-3">{inv.akad_venue}</p>}
                {inv.akad_address && <p className="text-xs text-white/40 mt-1">{inv.akad_address}</p>}
              </div>
            </Reveal>
          )}
          {inv.reception_date && (
            <Reveal delay={200} direction="right">
              <div className="relative rounded-sm p-6 text-center overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${gold}33` }}>
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l" style={{ borderColor: `${gold}66` }} />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r" style={{ borderColor: `${gold}66` }} />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l" style={{ borderColor: `${gold}66` }} />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r" style={{ borderColor: `${gold}66` }} />
                <p className="text-2xl mb-3" style={{ color: `${gold}88` }}>♡</p>
                <h3 className="font-semibold mb-2 text-white">Pawiwahan / Resepsi</h3>
                <p className="text-sm font-medium" style={{ color: `${gold}cc` }}>{inv.reception_date}</p>
                {inv.reception_time    && <p className="text-sm text-white/60 mt-1">{inv.reception_time}</p>}
                {inv.reception_venue   && <p className="text-sm font-medium text-white/80 mt-3">{inv.reception_venue}</p>}
                {inv.reception_address && <p className="text-xs text-white/40 mt-1">{inv.reception_address}</p>}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <GiftSection inv={inv} color={color} />

      {/* ── Closing ── */}
      <section className="py-16 px-6 text-center max-w-lg mx-auto relative overflow-hidden">
        <BatikPattern color={color} opacity={0.04} />
        <Reveal>
          <div className="relative z-10">
            <JawaDivider color={color} />
            <p className="mt-6 text-sm text-slate-500 italic leading-relaxed">
              {inv.closing_message || 'Mugi-mugi Allah SWT tansah maringi berkah lan rahmat dhateng kekalihipun. Dados kulawarga ingkang sakinah, mawaddah, warahmah.\n\nAmin Ya Rabbal Alamin.'}
            </p>
            <p className="mt-8" style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2rem', color }}>
              {inv.groom_name} &amp; {inv.bride_name}
            </p>
            <p className="text-xs tracking-widest uppercase text-slate-400 mt-2">Saha Kulawarga Ageng</p>
            <JawaDivider color={color} />
          </div>
        </Reveal>
      </section>

      <style>{`
        @keyframes jawa-bounce {
          0%,100% { transform:translateX(-50%) translateY(0); }
          50%      { transform:translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}

/* ── Export ──────────────────────────────────────────────────────── */
export function JawaTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#7C2D12';
  const [opened, setOpened] = useState(false);
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}
      {!opened && <JawaSplash  inv={inv} color={P} onOpen={() => setOpened(true)} />}
      {opened  && <InvitationContent inv={inv} color={P} />}
    </div>
  );
}
