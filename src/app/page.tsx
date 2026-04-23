import Link from 'next/link';

const FEATURES = [
  {
    icon: '📝',
    title: 'Form Lengkap',
    desc: 'Isi semua detail invoice: pengirim, klien, item layanan, dan informasi pembayaran.',
  },
  {
    icon: '⚡',
    title: 'Generate Instan',
    desc: 'PDF profesional siap didownload dalam hitungan detik langsung dari browser.',
  },
  {
    icon: '🎨',
    title: 'Desain Profesional',
    desc: 'Layout bersih dengan header navy, tabel item, terbilang, dan blok tanda tangan.',
  },
  {
    icon: '📄',
    title: 'Data Template',
    desc: 'Gunakan data template bawaan sebagai contoh, lalu sesuaikan dengan kebutuhan Anda.',
  },
  {
    icon: '🔢',
    title: 'Terbilang Otomatis',
    desc: 'Total tagihan otomatis dikonversi ke teks Bahasa Indonesia.',
  },
  {
    icon: '💰',
    title: 'Kalkulasi Otomatis',
    desc: 'Subtotal, diskon, pajak, dan total dihitung secara otomatis saat mengisi form.',
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}
    >
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <span className="font-bold text-lg" style={{ color: '#1A3A5C' }}>
          InvoicePDF
        </span>
        <Link
          href="/generator"
          className="text-sm font-semibold px-4 py-2 rounded-full transition-all hover:opacity-80"
          style={{ backgroundColor: '#1A3A5C', color: '#fff' }}
        >
          Buat Invoice
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-white">
        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
          style={{ backgroundColor: '#E8F4E8', color: '#2E7D32' }}
        >
          Gratis · Tanpa Login
        </span>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl"
          style={{ color: '#1A3A5C' }}
        >
          Buat Invoice PDF{' '}
          <span style={{ color: '#2E7D32' }}>Profesional</span>{' '}
          dalam Hitungan Detik
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mb-10 leading-relaxed">
          Isi form, klik tombol, dan invoice PDF siap didownload — lengkap dengan
          terbilang, tabel item, dan blok tanda tangan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/generator"
            className="px-8 py-4 rounded-full text-white font-bold text-base transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: '#1A3A5C' }}
          >
            Mulai Buat Invoice →
          </Link>
          <a
            href="#fitur"
            className="px-8 py-4 rounded-full font-semibold text-sm border-2 transition-all hover:bg-slate-50"
            style={{ borderColor: '#1A3A5C', color: '#1A3A5C' }}
          >
            Lihat Fitur
          </a>
        </div>

        {/* Preview badge */}
        <div className="mt-16 flex items-center gap-3 text-slate-400 text-sm">
          <span className="h-px w-12 bg-slate-200" />
          Format A4 · Font Caladea · Layout Profesional
          <span className="h-px w-12 bg-slate-200" />
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-20 px-6" style={{ backgroundColor: '#F7F9FC' }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
            style={{ color: '#1A3A5C' }}
          >
            Semua yang Kamu Butuhkan
          </h2>
          <p className="text-center text-slate-500 mb-12 text-sm">
            Dirancang untuk freelancer dan konsultan independen
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-6 border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#1A3A5C' }}>
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: '#1A3A5C' }}>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Siap membuat invoice pertamamu?
        </h2>
        <p className="text-slate-300 mb-8 text-sm">
          Tidak perlu daftar. Tidak perlu bayar. Langsung pakai.
        </p>
        <Link
          href="/generator"
          className="inline-block px-10 py-4 rounded-full font-bold text-base transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffffff', color: '#1A3A5C' }}
        >
          Buat Invoice Sekarang →
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        InvoicePDF · Dibuat dengan Next.js & @react-pdf/renderer
      </footer>
    </div>
  );
}
