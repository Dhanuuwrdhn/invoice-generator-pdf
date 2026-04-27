import Link from 'next/link';
import { ArrowRight, FileText, Zap, Layout, Hash, Calculator, ClipboardList } from 'lucide-react';

const FEATURES = [
  { icon: ClipboardList, title: 'Complete Form',       desc: 'Fill in every detail — sender, client, line items, and payment info.' },
  { icon: Zap,           title: 'Instant Generation',  desc: 'Professional PDF ready to download in seconds, straight from the browser.' },
  { icon: Layout,        title: 'Clean Design',        desc: 'Navy header, item table, terbilang box, and signature block included.' },
  { icon: FileText,      title: 'Multiple Templates',  desc: 'Load a built-in template or save your own for repeated use.' },
  { icon: Hash,          title: 'Auto Terbilang',      desc: 'Total amount is automatically converted to Indonesian words.' },
  { icon: Calculator,    title: 'Live Calculation',    desc: 'Subtotal, discount, tax and grand total update as you type.' },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif", backgroundColor: '#0D1B2A' }}
    >

      {/* ── Background mesh ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2A6496 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #1A6B3C 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5B2D8E 0%, transparent 70%)' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 w-full px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', backgroundColor: 'rgba(13,27,42,0.6)' }}>
        <span className="font-bold text-lg text-white tracking-tight">InvoicePDF</span>
        <Link
          href="/generator"
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1A6B3C, #2A6496)', color: '#fff' }}
        >
          Create Invoice <ArrowRight size={14} />
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-28">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{ backgroundColor: 'rgba(26,107,60,0.15)', borderColor: 'rgba(26,107,60,0.3)', color: '#4ADE80' }}>
          Free · No Sign-up · Instant Download
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-6">
          Create{' '}
          <span style={{
            background: 'linear-gradient(135deg, #60A5FA, #34D399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Professional
          </span>
          {' '}PDF Invoices in Seconds
        </h1>

        <p className="text-base sm:text-lg max-w-xl mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Fill the form, pick your font, and download a polished invoice PDF —
          complete with auto terbilang, itemised table, and signature block.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/generator"
            className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-white transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #1A3A5C, #2A6496)', boxShadow: '0 0 30px rgba(42,100,150,0.4)' }}
          >
            Start Building <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 rounded-full font-semibold text-sm border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            See Features
          </a>
        </div>

        {/* Floating glass preview card */}
        <div className="mt-20 w-full max-w-2xl rounded-2xl p-6 text-left"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
            <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>invoice-generator-pdf.vercel.app/generator</span>
          </div>
          <div className="space-y-3">
            {/* Mock invoice header */}
            <div className="flex justify-between items-start pb-3"
              style={{ borderBottom: '2px solid rgba(42,100,150,0.5)' }}>
              <div>
                <div className="w-32 h-3 rounded mb-1.5" style={{ backgroundColor: 'rgba(42,100,150,0.6)' }} />
                <div className="w-24 h-2 rounded mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="w-20 h-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="text-right">
                <div className="w-20 h-5 rounded mb-1.5" style={{ backgroundColor: 'rgba(42,100,150,0.6)' }} />
                <div className="w-28 h-2 rounded mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="w-20 h-5 rounded ml-auto flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(26,107,60,0.3)', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <div className="w-12 h-1.5 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.6)' }} />
                </div>
              </div>
            </div>
            {/* Mock table */}
            <div className="rounded overflow-hidden">
              <div className="flex gap-2 px-3 py-2 rounded" style={{ backgroundColor: 'rgba(42,100,150,0.4)' }}>
                {[5, 40, 10, 15, 15, 15].map((w, i) => (
                  <div key={i} className="h-2 rounded" style={{ width: `${w}%`, backgroundColor: 'rgba(255,255,255,0.4)' }} />
                ))}
              </div>
              {[1, 2].map(r => (
                <div key={r} className="flex gap-2 px-3 py-2.5" style={{ backgroundColor: r % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {[5, 40, 10, 15, 15, 15].map((w, i) => (
                    <div key={i} className="h-2 rounded" style={{ width: `${w}%`, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
              ))}
            </div>
            {/* Mock total */}
            <div className="flex justify-end">
              <div className="w-48 rounded overflow-hidden">
                <div className="flex justify-between px-3 py-1.5">
                  <div className="w-12 h-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <div className="w-16 h-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex justify-between px-3 py-2 rounded" style={{ backgroundColor: 'rgba(42,100,150,0.5)' }}>
                  <div className="w-14 h-2.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
                  <div className="w-20 h-2.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-white">
            Everything You Need
          </h2>
          <p className="text-center mb-14 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Built for freelancers and independent consultants
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl p-5 transition-all hover:-translate-y-1"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(42,100,150,0.25)', border: '1px solid rgba(42,100,150,0.3)' }}>
                    <Icon size={17} style={{ color: '#60A5FA' }} />
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto rounded-3xl p-12"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to create your first invoice?
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            No registration. No payment. Just open, fill, and download.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1A3A5C, #2A6496)', boxShadow: '0 0 30px rgba(42,100,150,0.35)' }}
          >
            Create Invoice Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-6 text-center text-xs border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
        InvoicePDF · 2026
      </footer>

    </div>
  );
}
