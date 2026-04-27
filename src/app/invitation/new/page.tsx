'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, Copy, Check } from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Navy',     value: '#1A3A5C' },
  { label: 'Rose',     value: '#9F1239' },
  { label: 'Forest',   value: '#14532D' },
  { label: 'Burgundy', value: '#7C2D12' },
  { label: 'Indigo',   value: '#3730A3' },
  { label: 'Slate',    value: '#334155' },
];

const BUILTIN_MUSIC = [
  { label: 'Beautiful In White', value: '/music/Beautiful In White.mp3' },
];

interface FormData {
  bride_name: string;
  groom_name: string;
  bride_parents: string;
  groom_parents: string;
  akad_date: string;
  akad_time: string;
  akad_venue: string;
  akad_address: string;
  reception_date: string;
  reception_time: string;
  reception_venue: string;
  reception_address: string;
  opening_message: string;
  closing_message: string;
  cover_image_url: string;
  music_url: string;
  primary_color: string;
}

function empty(): FormData {
  return {
    bride_name: '', groom_name: '', bride_parents: '', groom_parents: '',
    akad_date: '', akad_time: '', akad_venue: '', akad_address: '',
    reception_date: '', reception_time: '', reception_venue: '', reception_address: '',
    opening_message: '', closing_message: '', cover_image_url: '',
    music_url: '/music/Beautiful In White.mp3',
    primary_color: '#9F1239',
  };
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
    />
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function NewInvitationPage() {
  const router = useRouter();
  const [form, setForm]     = useState<FormData>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const P = form.primary_color;

  async function handleSubmit() {
    if (!form.bride_name || !form.groom_name) {
      setError('Nama mempelai wajib diisi.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/invitation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membuat undangan');
      setCreatedSlug(json.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!createdSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/invitation/${createdSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdSlug) {
    const link = `/invitation/${createdSlug}`;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl" style={{ backgroundColor: `${P}15` }}>
            ♥
          </div>
          <h1 className="font-bold text-2xl mb-2" style={{ color: P }}>Undangan Dibuat!</h1>
          <p className="text-sm text-slate-500 mb-6">Bagikan link berikut kepada para tamu:</p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
            <span className="text-sm text-slate-700 flex-1 truncate">{window.location.origin}{link}</span>
            <button onClick={copyLink} className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors">
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            </button>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Link
              href={link}
              target="_blank"
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: P }}
            >
              Lihat Undangan
            </Link>
            <button
              onClick={() => { setCreatedSlug(null); setForm(empty()); }}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Buat Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors shrink-0">
            <ArrowLeft size={15} />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <span className="font-bold text-base" style={{ color: P }}>Buat Undangan</span>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
            style={{ backgroundColor: P }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {loading ? 'Membuat…' : 'Buat Undangan'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Color picker */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Tema Warna</p>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map(c => {
              const active = form.primary_color === c.value;
              return (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => set('primary_color', c.value)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    backgroundColor: c.value,
                    outline: active ? `3px solid ${c.value}` : '2px solid transparent',
                    outlineOffset: active ? '2px' : '0',
                  }}
                />
              );
            })}
            <label className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-slate-400 transition-colors" style={{ position: 'relative' }}>
              <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
              <span className="text-slate-400 text-xs font-bold pointer-events-none">+</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">{form.primary_color}</span>
          </div>
        </div>

        {/* Couple */}
        <Section title="Mempelai" color={P}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Mempelai Pria *">
              <Input value={form.groom_name} onChange={v => set('groom_name', v)} placeholder="Nama panggilan pria" />
            </Field>
            <Field label="Nama Mempelai Wanita *">
              <Input value={form.bride_name} onChange={v => set('bride_name', v)} placeholder="Nama panggilan wanita" />
            </Field>
            <Field label="Nama Orang Tua Pria">
              <Input value={form.groom_parents} onChange={v => set('groom_parents', v)} placeholder="Bpk. Ahmad & Ibu Sari" />
            </Field>
            <Field label="Nama Orang Tua Wanita">
              <Input value={form.bride_parents} onChange={v => set('bride_parents', v)} placeholder="Bpk. Budi & Ibu Dewi" />
            </Field>
          </div>
        </Section>

        {/* Akad */}
        <Section title="Akad Nikah" color={P}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal">
              <Input value={form.akad_date} onChange={v => set('akad_date', v)} placeholder="Sabtu, 10 Mei 2026" />
            </Field>
            <Field label="Waktu">
              <Input value={form.akad_time} onChange={v => set('akad_time', v)} placeholder="08.00 – 10.00 WIB" />
            </Field>
            <Field label="Nama Venue">
              <Input value={form.akad_venue} onChange={v => set('akad_venue', v)} placeholder="Masjid Al-Ikhlas" />
            </Field>
            <Field label="Alamat" full={false}>
              <Input value={form.akad_address} onChange={v => set('akad_address', v)} placeholder="Jl. Contoh No. 1, Jakarta" />
            </Field>
          </div>
        </Section>

        {/* Resepsi */}
        <Section title="Resepsi" color={P}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal">
              <Input value={form.reception_date} onChange={v => set('reception_date', v)} placeholder="Sabtu, 10 Mei 2026" />
            </Field>
            <Field label="Waktu">
              <Input value={form.reception_time} onChange={v => set('reception_time', v)} placeholder="11.00 – 14.00 WIB" />
            </Field>
            <Field label="Nama Venue">
              <Input value={form.reception_venue} onChange={v => set('reception_venue', v)} placeholder="Gedung Serbaguna" />
            </Field>
            <Field label="Alamat">
              <Input value={form.reception_address} onChange={v => set('reception_address', v)} placeholder="Jl. Contoh No. 2, Jakarta" />
            </Field>
          </div>
        </Section>

        {/* Content */}
        <Section title="Pesan" color={P}>
          <div className="space-y-4">
            <Field label="Pesan Pembuka" full>
              <textarea
                value={form.opening_message}
                onChange={e => set('opening_message', e.target.value)}
                rows={3}
                placeholder="Dengan memohon ridha dan rahmat Allah SWT…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </Field>
            <Field label="Pesan Penutup" full>
              <textarea
                value={form.closing_message}
                onChange={e => set('closing_message', e.target.value)}
                rows={3}
                placeholder="Merupakan suatu kehormatan apabila Anda berkenan hadir…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </Field>
            <Field label="URL Foto Cover (opsional)" full>
              <Input value={form.cover_image_url} onChange={v => set('cover_image_url', v)} placeholder="https://... (URL foto)" />
            </Field>
          </div>
        </Section>

        {/* Music */}
        <Section title="Musik Latar" color={P}>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Musik akan diputar otomatis saat tamu membuka undangan.</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => set('music_url', '')}
                className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                style={{
                  borderColor: form.music_url === '' ? P : '#e2e8f0',
                  color: form.music_url === '' ? P : '#64748b',
                  backgroundColor: form.music_url === '' ? `${P}10` : '#fff',
                }}
              >
                Tanpa Musik
              </button>
              {BUILTIN_MUSIC.map(m => (
                <button
                  key={m.value}
                  onClick={() => set('music_url', m.value)}
                  className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: form.music_url === m.value ? P : '#e2e8f0',
                    color: form.music_url === m.value ? P : '#64748b',
                    backgroundColor: form.music_url === m.value ? `${P}10` : '#fff',
                  }}
                >
                  ♪ {m.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: P }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading ? 'Membuat Undangan…' : 'Buat & Dapatkan Link Undangan'}
        </button>

        <p className="text-center text-xs text-slate-400 pb-4">
          Link undangan bisa langsung dibagikan ke tamu setelah dibuat
        </p>
      </div>
    </div>
  );
}
