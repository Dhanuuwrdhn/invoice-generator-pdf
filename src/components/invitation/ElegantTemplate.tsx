'use client';

import { useEffect, useState } from 'react';
import { Invitation } from '@/types/invitation';
import { MusicPlayer, Reveal, GiftSection } from './shared';

/* ── Elegant splash — dark veil + monogram ── */
function ElegantSplash({ inv, color, onOpen }: { inv: Invitation; color: string; onOpen: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const initials = `${inv.groom_name?.[0] ?? ''}${inv.bride_name?.[0] ?? ''}`;

  function handle() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onOpen, 900);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8"
      style={{
        background: inv.cover_image_url
          ? `linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.72)), url(${inv.cover_image_url}) center/cover`
          : `linear-gradient(160deg, ${color}f0 0%, ${color}cc 100%)`,
        opacity:   leaving ? 0 : 1,
        transform: leaving ? 'scale(1.06)' : 'scale(1)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {/* Monogram circle */}
      <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center mb-8"
        style={{ borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.2rem', color: '#fff' }}>{initials}</span>
      </div>

      <p className="text-xs tracking-[0.35em] uppercase mb-3 text-white/60">Undangan Pernikahan</p>
      <h1 style={{ fontFamily: "'Dancing Script',cursive", fontSize: 'clamp(2.5rem,9vw,5rem)', color: '#fff', lineHeight: 1.1 }}>
        {inv.groom_name} &amp; {inv.bride_name}
      </h1>
      {inv.reception_date && (
        <p className="mt-4 text-sm tracking-[0.2em] uppercase text-white/60">{inv.reception_date}</p>
      )}

      <button
        onClick={handle}
        className="mt-12 px-8 py-3 rounded-full border text-sm tracking-widest uppercase text-white/80 transition-all hover:bg-white/10 hover:text-white"
        style={{ borderColor: 'rgba(255,255,255,0.3)' }}
      >
        Buka Undangan
      </button>
    </div>
  );
}

/* ── Main content ── */
function InvitationContent({ inv, color }: { inv: Invitation; color: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: 'opacity 0.9s ease, transform 0.9s ease' }}>

      {/* Hero */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{
          background: inv.cover_image_url
            ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${inv.cover_image_url}) center/cover`
            : `linear-gradient(160deg, ${color}ee 0%, ${color}88 100%)`,
        }}
      >
        <p className="text-xs font-semibold tracking-[0.25em] text-white/70 uppercase mb-4">Undangan Pernikahan</p>
        <p className="text-white/80 text-base mb-4 italic max-w-sm">
          {inv.opening_message || 'Bersama keluarga besar kami, dengan penuh rasa syukur kami mengundang kehadiran Anda'}
        </p>
        <h1 style={{ fontFamily: "'Dancing Script',cursive", fontSize: 'clamp(3rem,10vw,5.5rem)', color: '#fff', lineHeight: 1.1, textShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
          {inv.groom_name}
          <span className="block text-3xl font-normal my-1 text-white/70">&amp;</span>
          {inv.bride_name}
        </h1>
        {inv.reception_date && (
          <div className="flex items-center gap-4 text-white/80 text-sm font-medium mt-6">
            <div className="w-12 h-px bg-white/40" />
            {inv.reception_date}
            <div className="w-12 h-px bg-white/40" />
          </div>
        )}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'el-bounce 2s ease-in-out infinite' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 8l5 5 5-5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* Couple */}
      <section className="py-20 px-6 text-center max-w-2xl mx-auto">
        <div className="w-12 h-px mx-auto mb-8" style={{ backgroundColor: color }} />
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-8">
            {[
              { name: inv.groom_name, parents: inv.groom_parents, dir: 'left'  as const },
              { name: inv.bride_name, parents: inv.bride_parents, dir: 'right' as const },
            ].map((p, i) => (
              <Reveal key={i} direction={p.dir} delay={i * 120}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                    <span style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2rem' }}>{p.name?.[0]}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Dancing Script',cursive", fontSize: '1.8rem', color, marginBottom: 4 }}>{p.name}</h3>
                  {p.parents && <p className="text-sm text-slate-500 italic">Putra/Putri dari<br />{p.parents}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
        <div className="w-12 h-px mx-auto mt-10" style={{ backgroundColor: color }} />
      </section>

      {/* Events */}
      <section className="py-16 px-6" style={{ backgroundColor: `${color}0d` }}>
        <Reveal>
          <h2 className="text-center font-bold text-2xl mb-12" style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.5rem', color }}>Rangkaian Acara</h2>
        </Reveal>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {inv.akad_date && (
            <Reveal delay={100} direction="left">
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border" style={{ borderColor: `${color}22` }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <span style={{ color }}>♦</span>
                </div>
                <h3 className="font-bold mb-1" style={{ color }}>Akad Nikah</h3>
                <p className="text-sm font-semibold text-slate-700">{inv.akad_date}</p>
                {inv.akad_time && <p className="text-sm text-slate-500">{inv.akad_time}</p>}
                {inv.akad_venue && <p className="text-sm font-medium mt-2 text-slate-700">{inv.akad_venue}</p>}
                {inv.akad_address && <p className="text-xs text-slate-400 mt-1">{inv.akad_address}</p>}
              </div>
            </Reveal>
          )}
          {inv.reception_date && (
            <Reveal delay={200} direction="right">
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border" style={{ borderColor: `${color}22` }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <span style={{ color }}>♥</span>
                </div>
                <h3 className="font-bold mb-1" style={{ color }}>Resepsi</h3>
                <p className="text-sm font-semibold text-slate-700">{inv.reception_date}</p>
                {inv.reception_time && <p className="text-sm text-slate-500">{inv.reception_time}</p>}
                {inv.reception_venue && <p className="text-sm font-medium mt-2 text-slate-700">{inv.reception_venue}</p>}
                {inv.reception_address && <p className="text-xs text-slate-400 mt-1">{inv.reception_address}</p>}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <GiftSection inv={inv} color={color} />

      {/* Closing */}
      <section className="py-20 px-6 text-center max-w-xl mx-auto">
        <Reveal>
          <div className="w-12 h-px mx-auto mb-8" style={{ backgroundColor: color }} />
          <p className="text-slate-500 text-sm italic leading-relaxed">
            {inv.closing_message || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.'}
          </p>
          <p className="mt-8" style={{ fontFamily: "'Dancing Script',cursive", fontSize: '1.8rem', color }}>
            {inv.groom_name} &amp; {inv.bride_name}
          </p>
          <p className="text-sm text-slate-400 mt-1">Beserta keluarga besar</p>
          <div className="w-12 h-px mx-auto mt-8" style={{ backgroundColor: color }} />
        </Reveal>
      </section>

      <style>{`@keyframes el-bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}`}</style>
    </div>
  );
}

export function ElegantTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#1A3A5C';
  const [opened, setOpened] = useState(false);
  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "'Cormorant Garamond','Caladea',Georgia,serif", backgroundColor: '#FDFAF6' }}>
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}
      {!opened && <ElegantSplash inv={inv} color={P} onOpen={() => setOpened(true)} />}
      {opened  && <InvitationContent inv={inv} color={P} />}
    </div>
  );
}
