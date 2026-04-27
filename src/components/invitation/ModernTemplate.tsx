'use client';

import { useRef, useState, useEffect } from 'react';
import { Invitation } from '@/types/invitation';

function MusicPlayer({ url, color }: { url: string; color: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (audioRef.current) { audioRef.current.loop = true; audioRef.current.volume = 0.5; } }, []);
  function toggle() {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play().then(() => setPlaying(true)); }
  }
  return (
    <>
      <audio ref={audioRef} src={url} preload="none" />
      <button onClick={toggle} title={playing ? 'Pause' : 'Play'}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: color }}>
        {playing ? (
          <span className="flex items-end gap-0.5 h-5">
            {[1,2,3].map(i=>(
              <span key={i} className="w-1 rounded-full bg-white"
                style={{ height:`${i===2?100:60}%`, animation:`mb${i} 0.8s ease-in-out infinite alternate`, animationDelay:`${(i-1)*0.15}s` }}/>
            ))}
          </span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18V5l12-2v13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" fill="white"/><circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
        )}
      </button>
      <style>{`@keyframes mb1{from{height:30%}to{height:90%}}@keyframes mb2{from{height:70%}to{height:30%}}@keyframes mb3{from{height:50%}to{height:100%}}`}</style>
    </>
  );
}

export function ModernTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#1A3A5C';

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "'Montserrat','Arial',sans-serif", backgroundColor: '#0D1117' }}>
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col justify-end px-8 pb-16 overflow-hidden"
        style={{ background: inv.cover_image_url ? `linear-gradient(to top, rgba(13,17,23,0.95) 40%, rgba(13,17,23,0.2) 100%), url(${inv.cover_image_url}) center/cover` : `linear-gradient(160deg, #0D1117 60%, ${P}44 100%)` }}>

        {/* Accent line top-left */}
        <div className="absolute top-0 left-0 w-1 h-full opacity-60" style={{ backgroundColor: P }} />
        <div className="absolute top-8 left-8 text-xs tracking-[0.4em] uppercase text-white/40 font-semibold">
          Wedding Invitation
        </div>

        <div className="relative z-10">
          <p className="text-xs tracking-[0.35em] uppercase mb-4 font-semibold" style={{ color: P }}>
            The Wedding of
          </p>
          <h1 className="font-black leading-none mb-1" style={{ fontSize: 'clamp(3rem,12vw,7rem)', color: '#fff', letterSpacing: '-0.02em' }}>
            {inv.groom_name}
          </h1>
          <div className="flex items-center gap-4 my-3">
            <div className="h-px flex-1" style={{ backgroundColor: `${P}66` }} />
            <span className="text-white/40 font-bold text-xl">&</span>
            <div className="h-px flex-1" style={{ backgroundColor: `${P}66` }} />
          </div>
          <h1 className="font-black leading-none" style={{ fontSize: 'clamp(3rem,12vw,7rem)', color: '#fff', letterSpacing: '-0.02em' }}>
            {inv.bride_name}
          </h1>

          {inv.reception_date && (
            <div className="flex items-center gap-3 mt-8">
              <div className="w-8 h-px" style={{ backgroundColor: P }} />
              <p className="text-sm font-semibold text-white/60 tracking-widest uppercase">{inv.reception_date}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Opening ── */}
      <section className="py-20 px-8 max-w-2xl mx-auto text-center">
        <div className="w-8 h-1 mx-auto mb-8 rounded-full" style={{ backgroundColor: P }} />
        <p className="text-white/50 text-sm leading-relaxed italic">
          {inv.opening_message || 'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang kehadiran Bapak/Ibu/Saudara/i pada pernikahan putra-putri kami.'}
        </p>
      </section>

      {/* ── Couple ── */}
      <section className="px-8 pb-20 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: inv.groom_name, parents: inv.groom_parents, label: 'Mempelai Pria' },
          { name: inv.bride_name, parents: inv.bride_parents, label: 'Mempelai Wanita' },
        ].map((p, i) => (
          <div key={i} className="rounded-2xl p-6 border" style={{ backgroundColor: '#161B22', borderColor: `${P}33` }}>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: P }}>{p.label}</p>
            <h3 className="font-black text-2xl text-white mb-2" style={{ letterSpacing: '-0.01em' }}>{p.name}</h3>
            {p.parents && <p className="text-xs text-white/40 leading-relaxed">{p.parents}</p>}
          </div>
        ))}
      </section>

      {/* ── Events ── */}
      <section className="py-20 px-8" style={{ backgroundColor: '#161B22' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-[0.35em] uppercase mb-10" style={{ color: P }}>Rangkaian Acara</p>
          <div className="space-y-4">
            {inv.akad_date && (
              <div className="flex gap-6 items-start rounded-xl p-6 border" style={{ backgroundColor: '#0D1117', borderColor: `${P}22` }}>
                <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: P }}>01</div>
                <div>
                  <p className="font-bold text-white mb-1">Akad Nikah</p>
                  <p className="text-sm text-white/60">{inv.akad_date}{inv.akad_time && ` · ${inv.akad_time}`}</p>
                  {inv.akad_venue && <p className="text-sm text-white/40 mt-1">{inv.akad_venue}</p>}
                  {inv.akad_address && <p className="text-xs text-white/30 mt-0.5">{inv.akad_address}</p>}
                </div>
              </div>
            )}
            {inv.reception_date && (
              <div className="flex gap-6 items-start rounded-xl p-6 border" style={{ backgroundColor: '#0D1117', borderColor: `${P}22` }}>
                <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: P }}>02</div>
                <div>
                  <p className="font-bold text-white mb-1">Resepsi</p>
                  <p className="text-sm text-white/60">{inv.reception_date}{inv.reception_time && ` · ${inv.reception_time}`}</p>
                  {inv.reception_venue && <p className="text-sm text-white/40 mt-1">{inv.reception_venue}</p>}
                  {inv.reception_address && <p className="text-xs text-white/30 mt-0.5">{inv.reception_address}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="py-20 px-8 text-center max-w-xl mx-auto">
        <p className="text-white/40 text-sm italic leading-relaxed">
          {inv.closing_message || 'Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.'}
        </p>
        <p className="mt-10 font-black text-xl text-white" style={{ letterSpacing: '-0.02em' }}>
          {inv.groom_name} <span className="font-normal text-white/40">&</span> {inv.bride_name}
        </p>
        <div className="w-8 h-1 mx-auto mt-6 rounded-full" style={{ backgroundColor: P }} />
      </section>
    </div>
  );
}
