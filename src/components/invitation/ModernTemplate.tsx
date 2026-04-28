'use client';

import { useEffect, useState } from 'react';
import { Invitation } from '@/types/invitation';
import { MusicPlayer, Reveal, GiftSection, CouplePhotoSection, LoveStorySection } from './shared';

/* ── Modern splash — full dark, animated lines ── */
function ModernSplash({ inv, color, onOpen }: { inv: Invitation; color: string; onOpen: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  function handle() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onOpen, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8 overflow-hidden"
      style={{
        backgroundColor: '#0D1117',
        opacity:   leaving ? 0 : 1,
        transform: leaving ? 'translateY(-20px)' : 'translateY(0)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {/* Animated accent line left */}
      <div className="absolute left-0 top-0 w-1 h-full" style={{ backgroundColor: color, opacity: 0.6 }} />

      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 1s ease, transform 1s ease' }}>
        <p className="text-xs tracking-[0.4em] uppercase mb-6 font-semibold" style={{ color }}>
          Wedding Invitation
        </p>
        <h1 className="font-black leading-none mb-2" style={{ fontSize: 'clamp(2.8rem,10vw,6rem)', color: '#fff', letterSpacing: '-0.02em' }}>
          {inv.groom_name}
        </h1>
        <div className="flex items-center gap-4 my-3">
          <div className="h-px flex-1" style={{ backgroundColor: `${color}55` }} />
          <span className="text-white/40 font-bold">&</span>
          <div className="h-px flex-1" style={{ backgroundColor: `${color}55` }} />
        </div>
        <h1 className="font-black leading-none" style={{ fontSize: 'clamp(2.8rem,10vw,6rem)', color: '#fff', letterSpacing: '-0.02em' }}>
          {inv.bride_name}
        </h1>
        {inv.reception_date && (
          <p className="mt-6 text-sm tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {inv.reception_date}
          </p>
        )}

        <button
          onClick={handle}
          className="mt-12 px-8 py-3 rounded-sm text-sm tracking-[0.25em] uppercase font-semibold transition-all hover:opacity-80"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          Buka Undangan
        </button>
      </div>
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
        className="relative min-h-screen flex flex-col justify-end px-8 pb-16 overflow-hidden"
        style={{
          background: inv.cover_image_url
            ? `linear-gradient(to top, rgba(13,17,23,0.95) 40%, rgba(13,17,23,0.2)), url(${inv.cover_image_url}) center/cover`
            : `linear-gradient(160deg, #0D1117 60%, ${color}44 100%)`,
        }}
      >
        <div className="absolute left-0 top-0 w-1 h-full opacity-60" style={{ backgroundColor: color }} />
        <div className="absolute top-8 left-8 text-xs tracking-[0.4em] uppercase text-white/40 font-semibold">Wedding Invitation</div>
        <div className="relative z-10">
          <p className="text-xs tracking-[0.35em] uppercase mb-3 font-semibold" style={{ color }}>The Wedding of</p>
          <h1 className="font-black leading-none mb-1" style={{ fontSize: 'clamp(3rem,12vw,7rem)', color: '#fff', letterSpacing: '-0.02em' }}>
            {inv.groom_name}
          </h1>
          <div className="flex items-center gap-4 my-3">
            <div className="h-px flex-1" style={{ backgroundColor: `${color}55` }} />
            <span className="text-white/40 font-bold text-xl">&</span>
            <div className="h-px flex-1" style={{ backgroundColor: `${color}55` }} />
          </div>
          <h1 className="font-black leading-none" style={{ fontSize: 'clamp(3rem,12vw,7rem)', color: '#fff', letterSpacing: '-0.02em' }}>
            {inv.bride_name}
          </h1>
          {inv.reception_date && (
            <div className="flex items-center gap-3 mt-8">
              <div className="w-8 h-px" style={{ backgroundColor: color }} />
              <p className="text-sm font-semibold text-white/60 tracking-widest uppercase">{inv.reception_date}</p>
            </div>
          )}
        </div>
      </section>

      {/* Opening */}
      <section className="py-20 px-8 max-w-2xl mx-auto text-center">
        <Reveal>
          <div className="w-8 h-1 mx-auto mb-8 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-white/50 text-sm leading-relaxed italic">
            {inv.opening_message || 'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang kehadiran Bapak/Ibu/Saudara/i pada pernikahan putra-putri kami.'}
          </p>
        </Reveal>
      </section>

      {/* Couple */}
      <section className="px-8 pb-20 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: inv.groom_name, parents: inv.groom_parents, label: 'Mempelai Pria',   dir: 'left'  as const },
          { name: inv.bride_name, parents: inv.bride_parents, label: 'Mempelai Wanita', dir: 'right' as const },
        ].map((p, i) => (
          <Reveal key={i} direction={p.dir} delay={i * 100}>
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#161B22', borderColor: `${color}33` }}>
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>{p.label}</p>
              <h3 className="font-black text-2xl text-white mb-2" style={{ letterSpacing: '-0.01em' }}>{p.name}</h3>
              {p.parents && <p className="text-xs text-white/40 leading-relaxed">{p.parents}</p>}
            </div>
          </Reveal>
        ))}
      </section>

      <CouplePhotoSection inv={inv} color={color} theme="dark" />
      <LoveStorySection   inv={inv} color={color} theme="dark" />

      {/* Events */}
      <section className="py-20 px-8" style={{ backgroundColor: '#161B22' }}>
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.35em] uppercase mb-10" style={{ color }}>Rangkaian Acara</p>
          </Reveal>
          <div className="space-y-4">
            {inv.akad_date && (
              <Reveal delay={100} direction="left">
                <div className="flex gap-6 items-start rounded-xl p-6 border" style={{ backgroundColor: '#0D1117', borderColor: `${color}22` }}>
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: color }}>01</div>
                  <div>
                    <p className="font-bold text-white mb-1">Akad Nikah</p>
                    <p className="text-sm text-white/60">{inv.akad_date}{inv.akad_time && ` · ${inv.akad_time}`}</p>
                    {inv.akad_venue && <p className="text-sm text-white/40 mt-1">{inv.akad_venue}</p>}
                    {inv.akad_address && <p className="text-xs text-white/30 mt-0.5">{inv.akad_address}</p>}
                  </div>
                </div>
              </Reveal>
            )}
            {inv.reception_date && (
              <Reveal delay={200} direction="left">
                <div className="flex gap-6 items-start rounded-xl p-6 border" style={{ backgroundColor: '#0D1117', borderColor: `${color}22` }}>
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: color }}>02</div>
                  <div>
                    <p className="font-bold text-white mb-1">Resepsi</p>
                    <p className="text-sm text-white/60">{inv.reception_date}{inv.reception_time && ` · ${inv.reception_time}`}</p>
                    {inv.reception_venue && <p className="text-sm text-white/40 mt-1">{inv.reception_venue}</p>}
                    {inv.reception_address && <p className="text-xs text-white/30 mt-0.5">{inv.reception_address}</p>}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* Gift */}
      <div style={{ backgroundColor: '#161B22' }}>
        <GiftSection inv={inv} color={color} />
      </div>

      {/* Closing */}
      <section className="py-20 px-8 text-center max-w-xl mx-auto">
        <Reveal>
          <p className="text-white/40 text-sm italic leading-relaxed">
            {inv.closing_message || 'Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.'}
          </p>
          <p className="mt-10 font-black text-xl text-white" style={{ letterSpacing: '-0.02em' }}>
            {inv.groom_name} <span className="font-normal text-white/40">&</span> {inv.bride_name}
          </p>
          <div className="w-8 h-1 mx-auto mt-6 rounded-full" style={{ backgroundColor: color }} />
        </Reveal>
      </section>
    </div>
  );
}

export function ModernTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#1A3A5C';
  const [opened, setOpened] = useState(false);
  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "'Montserrat','Arial',sans-serif", backgroundColor: '#0D1117' }}>
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}
      {!opened && <ModernSplash inv={inv} color={P} onOpen={() => setOpened(true)} />}
      {opened  && <InvitationContent inv={inv} color={P} />}
    </div>
  );
}
