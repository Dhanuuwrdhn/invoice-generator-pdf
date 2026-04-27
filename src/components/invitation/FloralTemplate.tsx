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
            {[1,2,3].map(i => (
              <span key={i} className="w-1 rounded-full bg-white"
                style={{ height: `${i===2?100:60}%`, animation: `fb${i} 0.8s ease-in-out infinite alternate`, animationDelay: `${(i-1)*0.15}s` }} />
            ))}
          </span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18V5l12-2v13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" fill="white"/><circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
        )}
      </button>
      <style>{`@keyframes fb1{from{height:30%}to{height:90%}}@keyframes fb2{from{height:70%}to{height:30%}}@keyframes fb3{from{height:50%}to{height:100%}}`}</style>
    </>
  );
}

export function FloralTemplate({ inv }: { inv: Invitation }) {
  const P = inv.primary_color || '#9F1239';

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "'Caladea','Cambria',Georgia,serif", backgroundColor: '#FFFBF5' }}>
      {inv.music_url && <MusicPlayer url={inv.music_url} color={P} />}

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 overflow-hidden"
        style={{ background: inv.cover_image_url ? `linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.38)) , url(${inv.cover_image_url}) center/cover` : '#FFFBF5' }}>

        {/* Top floral border */}
        <div className="absolute top-0 left-0 w-full text-center text-4xl pointer-events-none select-none leading-none py-2" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.5)' : `${P}55` }}>
          ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿
        </div>

        <div className="mt-10">
          <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.7)' : `${P}99` }}>
            Undangan Pernikahan
          </p>

          <div className="text-5xl mb-4" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.4)' : `${P}33` }}>❧</div>

          <h1 className="font-bold leading-tight mb-2" style={{ fontSize:'clamp(2.2rem,7vw,4rem)', color: inv.cover_image_url ? '#fff' : P }}>
            {inv.groom_name}
          </h1>
          <p className="text-2xl italic mb-2" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.7)' : `${P}99` }}>& </p>
          <h1 className="font-bold leading-tight mb-6" style={{ fontSize:'clamp(2.2rem,7vw,4rem)', color: inv.cover_image_url ? '#fff' : P }}>
            {inv.bride_name}
          </h1>

          {inv.reception_date && (
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full text-sm"
              style={{ backgroundColor: inv.cover_image_url ? 'rgba(255,255,255,0.15)' : `${P}15`, color: inv.cover_image_url ? '#fff' : P, border:`1px solid ${inv.cover_image_url ? 'rgba(255,255,255,0.3)' : `${P}40`}` }}>
              ✦ {inv.reception_date} ✦
            </div>
          )}
        </div>

        {/* Bottom floral border */}
        <div className="absolute bottom-0 left-0 w-full text-center text-4xl pointer-events-none select-none leading-none py-2" style={{ color: inv.cover_image_url ? 'rgba(255,255,255,0.5)' : `${P}55` }}>
          ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿
        </div>
      </section>

      {/* ── Opening ── */}
      <section className="py-16 px-6 text-center max-w-xl mx-auto">
        <div className="text-3xl mb-6" style={{ color: `${P}66` }}>✾</div>
        <p className="text-slate-500 italic leading-relaxed text-sm">
          {inv.opening_message || 'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang kehadiran Bapak/Ibu/Saudara/i pada pernikahan putra-putri kami.'}
        </p>
        <div className="text-3xl mt-6" style={{ color: `${P}66` }}>✾</div>
      </section>

      {/* ── Couple ── */}
      <section className="py-10 px-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
          {[
            { name: inv.groom_name, parents: inv.groom_parents },
            { name: inv.bride_name, parents: inv.bride_parents },
          ].map((p, i) => (
            <div key={i} className="rounded-2xl p-8 border" style={{ backgroundColor: `${P}08`, borderColor: `${P}22` }}>
              <div className="text-4xl mb-3" style={{ color: `${P}66` }}>❀</div>
              <h3 className="font-bold text-xl mb-2" style={{ color: P }}>{p.name}</h3>
              {p.parents && <p className="text-sm text-slate-500 italic leading-relaxed">Putra/Putri dari<br />{p.parents}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="py-14 px-6 text-center" style={{ backgroundColor: `${P}0a` }}>
        <div className="text-3xl mb-4" style={{ color: `${P}55` }}>❦</div>
        <h2 className="font-bold text-2xl mb-10" style={{ color: P }}>Rangkaian Acara</h2>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {inv.akad_date && (
            <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: `${P}22` }}>
              <div className="text-3xl mb-3" style={{ color: `${P}88` }}>☽</div>
              <h3 className="font-bold mb-1" style={{ color: P }}>Akad Nikah</h3>
              <p className="text-sm font-semibold text-slate-700">{inv.akad_date}</p>
              {inv.akad_time && <p className="text-sm text-slate-500">{inv.akad_time}</p>}
              {inv.akad_venue && <p className="text-sm font-medium text-slate-700 mt-2">{inv.akad_venue}</p>}
              {inv.akad_address && <p className="text-xs text-slate-400 mt-1">{inv.akad_address}</p>}
            </div>
          )}
          {inv.reception_date && (
            <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: `${P}22` }}>
              <div className="text-3xl mb-3" style={{ color: `${P}88` }}>☀</div>
              <h3 className="font-bold mb-1" style={{ color: P }}>Resepsi</h3>
              <p className="text-sm font-semibold text-slate-700">{inv.reception_date}</p>
              {inv.reception_time && <p className="text-sm text-slate-500">{inv.reception_time}</p>}
              {inv.reception_venue && <p className="text-sm font-medium text-slate-700 mt-2">{inv.reception_venue}</p>}
              {inv.reception_address && <p className="text-xs text-slate-400 mt-1">{inv.reception_address}</p>}
            </div>
          )}
        </div>
        <div className="text-3xl mt-10" style={{ color: `${P}55` }}>❦</div>
      </section>

      {/* ── Closing ── */}
      <section className="py-16 px-6 text-center max-w-xl mx-auto">
        <div className="text-3xl mb-6" style={{ color: `${P}55` }}>✿ ❀ ✿</div>
        <p className="text-slate-500 italic text-sm leading-relaxed">
          {inv.closing_message || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.'}
        </p>
        <p className="mt-8 font-bold text-lg" style={{ color: P }}>{inv.groom_name} & {inv.bride_name}</p>
        <p className="text-sm text-slate-400 mt-1">Beserta keluarga besar</p>
        <div className="text-3xl mt-6" style={{ color: `${P}55` }}>✿ ❀ ✿</div>
      </section>
    </div>
  );
}
