'use client';

import { useEffect, useRef, useState } from 'react';

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
