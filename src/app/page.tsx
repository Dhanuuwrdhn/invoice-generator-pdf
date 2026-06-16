import Link from 'next/link';
import { ArrowRight, FileText, Zap, Layout, Hash, Calculator, ClipboardList } from 'lucide-react';

const FEATURES = [
  { icon: ClipboardList, title: 'Complete Form',      desc: 'Fill in every detail — sender, client, line items, and payment info.' },
  { icon: Zap,           title: 'Instant Generation', desc: 'A polished PDF ready to download in seconds, straight from the browser.' },
  { icon: Layout,        title: 'Clean Design',       desc: 'Headed table, terbilang box, and signature block — print-ready.' },
  { icon: FileText,      title: 'Reusable Templates', desc: 'Load a built-in template or save your own for repeated use.' },
  { icon: Hash,          title: 'Auto Terbilang',     desc: 'The total amount is automatically spelled out in Indonesian.' },
  { icon: Calculator,    title: 'Live Calculation',   desc: 'Subtotal, discount, tax, and grand total update as you type.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F0EEE6] text-[#1F1E1D]">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-20 w-full px-6 py-4 flex items-center justify-between border-b border-[#E5E3DA] bg-[#F0EEE6]/80 backdrop-blur-md">
        <span className="font-serif text-xl font-semibold tracking-tight">
          Invoice<span className="text-[#C96442]">PDF</span>
        </span>
        <Link
          href="/generator"
          className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#C96442] text-white transition-colors hover:bg-[#B5573A]"
        >
          Create Invoice <ArrowRight size={15} />
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 border border-[#E5E3DA] bg-white text-[#73726C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C96442]" />
          Free · No sign-up · Instant download
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.08] max-w-3xl mb-6">
          Professional PDF invoices,{' '}
          <span className="text-[#C96442]">in seconds.</span>
        </h1>

        <p className="text-base sm:text-lg max-w-xl mb-10 leading-relaxed text-[#73726C]">
          Fill the form, pick your font and colour, and download a clean invoice —
          complete with auto terbilang, an itemised table, and a signature block.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/generator"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base text-white bg-[#C96442] transition-colors hover:bg-[#B5573A]"
          >
            Open the generator <ArrowRight size={17} />
          </Link>
          <a
            href="#features"
            className="px-7 py-3.5 rounded-xl font-medium text-sm border border-[#D8D6CC] text-[#3D3D3A] transition-colors hover:bg-white"
          >
            See features
          </a>
        </div>

        {/* ── Invoice preview card ── */}
        <div className="mt-20 w-full max-w-2xl rounded-2xl p-7 text-left bg-white border border-[#E5E3DA] shadow-[0_12px_40px_-12px_rgba(31,30,29,0.12)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-3 h-3 rounded-full bg-[#E5E3DA]" />
            <div className="w-3 h-3 rounded-full bg-[#E5E3DA]" />
            <div className="w-3 h-3 rounded-full bg-[#E5E3DA]" />
            <span className="ml-2 text-xs text-[#A3A299]">invoicepdf.app/generator</span>
          </div>
          <div className="space-y-4">
            {/* header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#EDEBE3]">
              <div className="space-y-1.5">
                <div className="w-32 h-3.5 rounded bg-[#C96442]/70" />
                <div className="w-24 h-2 rounded bg-[#E5E3DA]" />
                <div className="w-20 h-2 rounded bg-[#E5E3DA]" />
              </div>
              <div className="text-right space-y-1.5 flex flex-col items-end">
                <div className="w-20 h-5 rounded bg-[#1F1E1D]/80" />
                <div className="w-28 h-2 rounded bg-[#E5E3DA]" />
                <div className="w-20 h-5 rounded bg-[#C96442]/15 border border-[#C96442]/30" />
              </div>
            </div>
            {/* table */}
            <div className="rounded-lg overflow-hidden border border-[#EDEBE3]">
              <div className="flex gap-2 px-3 py-2.5 bg-[#FAF9F5] border-b border-[#EDEBE3]">
                {[5, 40, 10, 15, 15, 15].map((w, i) => (
                  <div key={i} className="h-2 rounded bg-[#C9C7BD]" style={{ width: `${w}%` }} />
                ))}
              </div>
              {[1, 2].map(r => (
                <div key={r} className="flex gap-2 px-3 py-3">
                  {[5, 40, 10, 15, 15, 15].map((w, i) => (
                    <div key={i} className="h-2 rounded bg-[#EDEBE3]" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </div>
            {/* total */}
            <div className="flex justify-end">
              <div className="w-48 rounded-lg overflow-hidden border border-[#EDEBE3]">
                <div className="flex justify-between px-3 py-2">
                  <div className="w-12 h-2 rounded bg-[#EDEBE3]" />
                  <div className="w-16 h-2 rounded bg-[#EDEBE3]" />
                </div>
                <div className="flex justify-between px-3 py-2.5 bg-[#1F1E1D]">
                  <div className="w-14 h-2.5 rounded bg-white/50" />
                  <div className="w-20 h-2.5 rounded bg-white/70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-center mb-3">
            Everything you need
          </h2>
          <p className="text-center mb-14 text-[#73726C]">
            Built for freelancers and independent consultants.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl p-6 bg-white border border-[#E5E3DA] transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(31,30,29,0.15)]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[#F3E6DF]">
                    <Icon size={18} className="text-[#C96442]" />
                  </div>
                  <h3 className="font-semibold text-[15px] mb-1.5">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[#73726C]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto rounded-3xl p-12 text-center bg-[#1F1E1D]">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F0EEE6] mb-4">
            Ready to make your first invoice?
          </h2>
          <p className="mb-8 text-[#B8B6AD]">
            No registration. No payment. Just open, fill, and download.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-base text-white bg-[#C96442] transition-colors hover:bg-[#B5573A]"
          >
            Create invoice now <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-7 text-center text-xs border-t border-[#E5E3DA] text-[#A3A299]">
        InvoicePDF · 2026
      </footer>

    </div>
  );
}
