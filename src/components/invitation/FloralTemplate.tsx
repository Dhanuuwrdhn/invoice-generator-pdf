'use client';

import { useEffect, useRef, useState } from 'react';
import { Invitation } from '@/types/invitation';
import { MusicPlayer, Reveal, GiftSection } from './shared';

/* ── Divider ───────────────────────────────────────────────────── */
function Divider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div className="w-12 h-px" style={{ backgroundColor: `${color}44` }} />
      <span style={{ color: `${color}88` }}>✦</span>
      <div className="w-12 h-px" style={{ backgroundColor: `${color}44` }} />
    </div>
  );
}

/* ── CSS Envelope splash ────────────────────────────────────────── */
function EnvelopeSplash({
  inv, color, onOpen,
}: {
  inv: Invitation; color: string; onOpen: () => void;
}) {
  const [flapping, setFlapping] = useState(false);
  const [leaving,  setLeaving]  = useState(false);
  const initials = `${inv.groom_name?.[0] ?? ''}${inv.bride_name?.[0] ?? ''}`;

  function handleClick() {
    if (flapping) return;
    setFlapping(true);
    setTimeout(() => setLeaving(true), 700);
    setTimeout(() => onOpen(), 1300);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        background: '#FDFAF6',
        opacity:    leaving ? 0 : 1,
        transform:  leaving ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {/* Decorative flowers top */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4 pt-3 pointer-events-none select-none">
        <span style={{ fontSize: 48, color: `${color}33`, lineHeight: 1 }}>✿</span>
        <span style={{ fontSize: 48, color: `${color}22`, lineHeight: 1 }}>❀</span>
        <span style={{ fontSize: 48, color: `${color}33`, lineHeight: 1 }}>✿</span>
      </div>

      {/* Text above envelope */}
      <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${color}88` }}>The Wedding Of</p>
      <h1 style={{ fontFamily: "'Dancing Script',cursive", fontSize: 'clamp(2.2rem,8vw,3.5rem)', color, lineHeight: 1.1, textAlign: 'center' }}>
        {inv.groom_name} &amp; {inv.bride_name}
      </h1>
      {inv.reception_date && (
        <p className="mt-2 text-sm tracking-[0.2em]" style={{ color: `${color}77` }}>{inv.reception_date}</p>
      )}

      {/* ── Envelope ── */}
      <div
        className="relative mt-8 cursor-pointer select-none"
        style={{ width: 260, height: 180, perspective: 700 }}
        onClick={handleClick}
      >
        {/* Envelope body */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-lg"
          style={{ backgroundColor: `${color}22`, border: `1.5px solid ${color}33` }}
        >
          {/* Back flap V lines */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, transparent 49.5%, ${color}18 49.5%, ${color}18 50.5%, transparent 50.5%),
                         linear-gradient(225deg, transparent 49.5%, ${color}18 49.5%, ${color}18 50.5%, transparent 50.5%)`,
          }} />
        </div>

        {/* Front flap — rotates open */}
        <div
          className="absolute inset-x-0 top-0 origin-top"
          style={{
            height: '54%',
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            transform: flapping ? 'rotateX(-175deg)' : 'rotateX(0deg)',
            transition: 'transform 0.65s cubic-bezier(.4,0,.2,1)',
          }}
        >
          {/* Flap front face */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              backgroundColor: `${color}2e`,
              border: `1px solid ${color}33`,
              backfaceVisibility: 'hidden',
            }}
          />
          {/* Flap back face */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              backgroundColor: `${color}18`,
              transform: 'rotateX(180deg)',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>

        {/* Wax seal */}
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full shadow-md"
          style={{
            width: 52, height: 52,
            transform: 'translate(-50%, -20%)',
            background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`,
            zIndex: 10,
            transition: 'transform 0.65s ease, opacity 0.4s ease',
            opacity: flapping ? 0 : 1,
            ...(flapping ? { transform: 'translate(-50%, -20%) scale(0.5)' } : {}),
          }}
        >
          <span style={{ fontFamily: "'Dancing Script',cursive", color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
            {initials}
          </span>
        </div>
      </div>

      {/* Open button */}
      <button
        onClick={handleClick}
        className="mt-6 text-sm tracking-[0.2em] uppercase transition-all hover:tracking-[0.3em]"
        style={{ color: `${color}99`, fontFamily: "'Cormorant Garamond',Georgia,serif" }}
      >
        {flapping ? 'Opening…' : 'Open Invitation…'}
      </button>

      {/* Decorative flowers bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 pb-3 pointer-events-none select-none">
        <span style={{ fontSize: 40, color: `${color}22`, lineHeight: 1 }}>❀</span>
        <span style={{ fontSize: 40, color: `${color}33`, lineHeight: 1 }}>✿</span>
        <span style={{ fontSize: 40, color: `${color}22`, lineHeight: 1 }}>❀</span>
      </div>
    </div>
  );
}

/* ── Main invitation content ────────────────────────────────────── */
function InvitationContent({ inv, color }: { inv: Invitation; color: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.9s ease, transform 0.9s ease',
    }}>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{
          background: inv.cover_image_url
            ? `linear-gradient(rgba(0,0,0,0.36),rgba(0,0,0,0.48)), url(${inv.cover_image_url}) center/cover`
            : `linear-gradient(165deg, #FFF0F4 0%, #FDEEF4 55%, #FFF8F0 100%)`,
        }}
      >
        {!inv.cover_image_url && (
          <>
            <div className="absolute top-2 left-2 text-7xl pointer-events-none select-none" style={{ color: `${color}1a`, lineHeight:1 }}>❀</div>
            <div className="absolute top-2 right-2 text-7xl pointer-events-none select-none" style={{ color: `${color}1a`, lineHeight:1 }}>✿</div>
            <div className="absolute bottom-2 left-2 text-7xl pointer-events-none select-none" style={{ color: `${color}1a`, lineHeight:1 }}>✿</div>
            <div className="absolute bottom-2 right-2 text-7xl pointer-events-none select-none" style={{ color: `${color}1a`, lineHeight:1 }}>❀</div>
          </>
        )}
        <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.7)' : `${color}99` }}>The Wedding Of</p>
        <h1 style={{
          fontFamily: "'Dancing Script',cursive",
          fontSize: 'clamp(3.5rem,12vw,6.5rem)',
          color: inv.cover_image_url ? '#fff' : color,
          lineHeight: 1.1,
          textShadow: inv.cover_image_url ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
        }}>
          {inv.groom_name} &amp; {inv.bride_name}
        </h1>
        {inv.reception_date && (
          <p className="mt-4 text-sm tracking-[0.25em] uppercase" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.7)' : `${color}99` }}>
            {inv.reception_date}
          </p>
        )}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'floral-bounce 2s ease-in-out infinite' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7l5 6 5-6" stroke={inv.cover_image_url ? 'rgba(255,255,255,0.5)' : `${color}66`} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* ── Opening quote ── */}
      <section className="py-20 px-6 text-center max-w-lg mx-auto">
        <Reveal>
          <Divider color={color} />
          <p className="text-slate-500 leading-relaxed mt-6 text-base italic">
            {inv.opening_message || 'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud mengundang kehadiran Bapak/Ibu/Saudara/i pada pernikahan putra-putri kami.'}
          </p>
          <Divider color={color} />
        </Reveal>
      </section>

      {/* ── Couple ── */}
      <section className="py-10 px-6" style={{ backgroundColor: `${color}07` }}>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { name: inv.groom_name, parents: inv.groom_parents, label: 'Mempelai Pria',   dir: 'left'  as const },
            { name: inv.bride_name, parents: inv.bride_parents, label: 'Mempelai Wanita', dir: 'right' as const },
          ].map(p => (
            <Reveal key={p.label} direction={p.dir}>
              <div className="text-center rounded-3xl p-8 bg-white shadow-sm border" style={{ borderColor: `${color}18` }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}>
                  <span style={{ fontFamily: "'Dancing Script',cursive", color, fontSize: '1.8rem' }}>{p.name?.[0]}</span>
                </div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${color}88` }}>{p.label}</p>
                <h3 style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2rem', color }}>{p.name}</h3>
                {p.parents && <p className="text-sm text-slate-400 mt-2 italic leading-relaxed">Putra/Putri dari<br /><span className="text-slate-600 not-italic font-medium">{p.parents}</span></p>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="py-20 px-6">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${color}88` }}>Rangkaian</p>
            <h2 style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.8rem', color }}>Acara</h2>
            <Divider color={color} />
          </div>
        </Reveal>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {inv.akad_date && (
            <Reveal delay={100} direction="left">
              <div className="rounded-3xl overflow-hidden shadow-sm border bg-white" style={{ borderColor: `${color}18` }}>
                <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                <div className="p-7 text-center">
                  <p className="text-3xl mb-3" style={{ color: `${color}66` }}>☽</p>
                  <h3 className="font-semibold mb-3" style={{ color }}>Akad Nikah</h3>
                  <p className="font-semibold text-slate-700">{inv.akad_date}</p>
                  {inv.akad_time && <p className="text-sm text-slate-500 mt-1">{inv.akad_time}</p>}
                  {inv.akad_venue && <div className="mt-4 pt-4 border-t" style={{ borderColor: `${color}18` }}>
                    <p className="font-medium text-slate-700">{inv.akad_venue}</p>
                    {inv.akad_address && <p className="text-xs text-slate-400 mt-1">{inv.akad_address}</p>}
                  </div>}
                </div>
              </div>
            </Reveal>
          )}
          {inv.reception_date && (
            <Reveal delay={200} direction="right">
              <div className="rounded-3xl overflow-hidden shadow-sm border bg-white" style={{ borderColor: `${color}18` }}>
                <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                <div className="p-7 text-center">
                  <p className="text-3xl mb-3" style={{ color: `${color}66` }}>♡</p>
                  <h3 className="font-semibold mb-3" style={{ color }}>Resepsi</h3>
                  <p className="font-semibold text-slate-700">{inv.reception_date}</p>
                  {inv.reception_time && <p className="text-sm text-slate-500 mt-1">{inv.reception_time}</p>}
                  {inv.reception_venue && <div className="mt-4 pt-4 border-t" style={{ borderColor: `${color}18` }}>
                    <p className="font-medium text-slate-700">{inv.reception_venue}</p>
                    {inv.reception_address && <p className="text-xs text-slate-400 mt-1">{inv.reception_address}</p>}
                  </div>}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <GiftSection inv={inv} color={color} />

      {/* ── Closing ── */}
      <section className="py-20 px-6 text-center max-w-lg mx-auto">
        <Reveal>
          <Divider color={color} />
          <p className="text-slate-500 text-base italic leading-relaxed mt-6">
            {inv.closing_message || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.'}
          </p>
          <div className="mt-10">
            <p style={{ fontFamily: "'Dancing Script',cursive", fontSize: '2.2rem', color }}>
              {inv.groom_name} &amp; {inv.bride_name}
            </p>
            <p className="text-xs tracking-widest uppercase text-slate-400 mt-2">Beserta Keluarga Besar</p>
          </div>
          <Divider color={color} />
        </Reveal>
      </section>

      <style>{`
        @keyframes floral-bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────────── */
export function FloralTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#9F1239';
  const [opened, setOpened] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ fontFamily: "'Cormorant Garamond','Caladea',Georgia,serif", backgroundColor: '#FFFBF5' }}>
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}
      {!opened && <EnvelopeSplash inv={inv} color={P} onOpen={() => setOpened(true)} />}
      {opened  && <InvitationContent inv={inv} color={P} />}
    </div>
  );
}
