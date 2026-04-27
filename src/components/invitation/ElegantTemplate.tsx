'use client';

import { useEffect, useRef, useState } from 'react';
import { Invitation } from '@/types/invitation';

function MusicPlayer({ url, color }: { url: string; color: string }) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.5;
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => { setPlaying(true); setStarted(true); });
    }
  }

  return (
    <>
      <audio ref={audioRef} src={url} preload="none" />
      <button
        onClick={toggle}
        title={playing ? 'Pause music' : 'Play music'}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: color }}
      >
        {playing ? (
          /* bars animation */
          <span className="flex items-end gap-0.5 h-5">
            {[1,2,3].map(i => (
              <span
                key={i}
                className="w-1 rounded-full"
                style={{
                  backgroundColor: '#fff',
                  height: `${i === 2 ? 100 : 60}%`,
                  animation: `musicBar${i} 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${(i - 1) * 0.15}s`,
                }}
              />
            ))}
          </span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M9 18V5l12-2v13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="6" cy="18" r="3" fill="white"/>
            <circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
        )}
      </button>
      <style>{`
        @keyframes musicBar1 { from { height: 30% } to { height: 90% } }
        @keyframes musicBar2 { from { height: 70% } to { height: 30% } }
        @keyframes musicBar3 { from { height: 50% } to { height: 100% } }
      `}</style>
    </>
  );
}

export function ElegantTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#1A3A5C';

  return (
    <div
      className="min-h-screen w-full"
      style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif", backgroundColor: '#FDFAF6' }}
    >
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden"
        style={{
          background: inv.cover_image_url
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${inv.cover_image_url}) center/cover`
            : `linear-gradient(160deg, ${P}ee 0%, ${P}88 100%)`,
        }}
      >
        {/* Floral ornament top */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-4 pt-4 opacity-30 pointer-events-none select-none">
          <span className="text-6xl text-white" style={{ fontFamily: 'serif' }}>✿</span>
          <span className="text-6xl text-white" style={{ fontFamily: 'serif' }}>✿</span>
        </div>

        <p className="text-xs font-semibold tracking-[0.25em] text-white/70 uppercase mb-4">
          Undangan Pernikahan
        </p>

        <p className="text-white/80 text-base mb-2" style={{ fontStyle: 'italic' }}>
          {inv.opening_message || 'Bersama keluarga besar kami, dengan penuh rasa syukur kami mengundang kehadiran Anda'}
        </p>

        <div className="my-8">
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
          >
            {inv.groom_name}
            <span className="block text-3xl font-normal my-2 text-white/80">&</span>
            {inv.bride_name}
          </h1>
        </div>

        {inv.reception_date && (
          <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
            <div className="w-12 h-px bg-white/40" />
            {inv.reception_date}
            <div className="w-12 h-px bg-white/40" />
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 8l5 5 5-5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* ── Couple info ── */}
      <section className="py-20 px-6 text-center max-w-2xl mx-auto">
        <div className="w-12 h-px mx-auto mb-8" style={{ backgroundColor: P }} />
        <p className="text-sm text-slate-500 italic mb-10 leading-relaxed">
          {inv.opening_message || 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Dengan memohon ridha dan rahmat Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-8">
          {/* Groom */}
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${P}, ${P}88)` }}
            >
              {inv.groom_name?.[0]}
            </div>
            <h3 className="font-bold text-xl mb-1" style={{ color: P }}>{inv.groom_name}</h3>
            {inv.groom_parents && (
              <p className="text-sm text-slate-500 italic">Putra dari<br />{inv.groom_parents}</p>
            )}
          </div>
          {/* Bride */}
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${P}88, ${P})` }}
            >
              {inv.bride_name?.[0]}
            </div>
            <h3 className="font-bold text-xl mb-1" style={{ color: P }}>{inv.bride_name}</h3>
            {inv.bride_parents && (
              <p className="text-sm text-slate-500 italic">Putri dari<br />{inv.bride_parents}</p>
            )}
          </div>
        </div>
        <div className="w-12 h-px mx-auto mt-10" style={{ backgroundColor: P }} />
      </section>

      {/* ── Events ── */}
      <section className="py-16 px-6" style={{ backgroundColor: `${P}0d` }}>
        <h2 className="text-center font-bold text-2xl mb-12" style={{ color: P }}>Rangkaian Acara</h2>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Akad */}
          {inv.akad_date && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border" style={{ borderColor: `${P}22` }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${P}15` }}>
                <span style={{ color: P }}>♦</span>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: P }}>Akad Nikah</h3>
              <p className="text-sm text-slate-600 font-semibold">{inv.akad_date}</p>
              {inv.akad_time && <p className="text-sm text-slate-500">{inv.akad_time}</p>}
              {inv.akad_venue && <p className="text-sm font-medium mt-2 text-slate-700">{inv.akad_venue}</p>}
              {inv.akad_address && <p className="text-xs text-slate-400 mt-1">{inv.akad_address}</p>}
            </div>
          )}

          {/* Resepsi */}
          {inv.reception_date && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border" style={{ borderColor: `${P}22` }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${P}15` }}>
                <span style={{ color: P }}>♥</span>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: P }}>Resepsi</h3>
              <p className="text-sm text-slate-600 font-semibold">{inv.reception_date}</p>
              {inv.reception_time && <p className="text-sm text-slate-500">{inv.reception_time}</p>}
              {inv.reception_venue && <p className="text-sm font-medium mt-2 text-slate-700">{inv.reception_venue}</p>}
              {inv.reception_address && <p className="text-xs text-slate-400 mt-1">{inv.reception_address}</p>}
            </div>
          )}
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="py-20 px-6 text-center max-w-xl mx-auto">
        <div className="w-12 h-px mx-auto mb-8" style={{ backgroundColor: P }} />
        <p className="text-slate-500 text-sm italic leading-relaxed">
          {inv.closing_message || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.'}
        </p>
        <p className="mt-8 font-bold text-lg" style={{ color: P }}>
          {inv.groom_name} & {inv.bride_name}
        </p>
        <p className="text-sm text-slate-400 mt-1">Beserta keluarga besar</p>
        <div className="w-12 h-px mx-auto mt-8" style={{ backgroundColor: P }} />
      </section>

    </div>
  );
}
