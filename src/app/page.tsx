import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { numberToWords } from '@/lib/terbilang';
import { formatCurrency } from '@/lib/format';

// Hero stub figure — spelled by the same function the app uses.
const DEMO_TOTAL = 24_500_000;
const DEMO_WORDS = numberToWords(DEMO_TOTAL);

const SPECS = [
  { tag: 'TERBILANG',  title: 'Spelled automatically', desc: 'Every total is written out in Indonesian, exactly as a formal invoice requires.' },
  { tag: 'TERMIN',     title: 'Down payment to final', desc: 'Down payment, progress, and termin I–V — the payment types you actually issue.' },
  { tag: 'PPN',        title: 'Tax & discount, live',  desc: 'Subtotal, discount, and tax recompute the moment you change a figure.' },
  { tag: 'TEMPLATE',   title: 'Save and reuse',        desc: 'Keep a client or a service preset and load it next time in one click.' },
  { tag: 'CETAK',      title: 'Print-ready PDF',       desc: 'Headed table, terbilang box, and signature block, sized for A4.' },
  { tag: 'GRATIS',     title: 'No account, no cost',   desc: 'Open it, fill it, download it. Nothing is stored on a server.' },
];

const STEPS = [
  { n: '01', label: 'Fill the form',   desc: 'Sender, client, line items, payment.' },
  { n: '02', label: 'Pick font & colour', desc: 'Three faces, a palette of accents.' },
  { n: '03', label: 'Download the PDF', desc: 'Straight to your device, instantly.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#E7EBE2] text-[#19261F]">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 w-full px-5 sm:px-8 py-4 flex items-center justify-between border-b border-[#C9D1C2] bg-[#E7EBE2]/85 backdrop-blur-md">
        <span className="font-mono text-sm font-bold tracking-tight">
          INVOICE<span className="text-[#0B5C42]">·</span>PDF
        </span>
        <Link
          href="/generator"
          className="font-mono text-[13px] font-bold tracking-tight px-4 py-2 rounded-md bg-[#0B5C42] text-[#F6F7F1] transition-colors hover:bg-[#094B36]"
        >
          NEW INVOICE →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="px-5 sm:px-8 pt-16 pb-20 max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-14 items-center">
        {/* copy */}
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#0B5C42] mb-5">
            UNTUK FREELANCER & KONSULTAN
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-[3.4rem] font-medium leading-[1.04] tracking-tight mb-6">
            Bill the client.<br />
            Spell the rupiah.<br />
            <span className="text-[#0B5C42]">Send the PDF.</span>
          </h1>
          <p className="text-[#5C6A5E] text-base sm:text-lg leading-relaxed max-w-md mb-9">
            A proper Indonesian invoice — terbilang, termin, PPN, and a signature
            block — built and downloaded in the time it takes to write the amount.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/generator"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-mono text-sm font-bold tracking-tight bg-[#0B5C42] text-[#F6F7F1] transition-colors hover:bg-[#094B36]"
            >
              MAKE AN INVOICE <ArrowRight size={16} />
            </Link>
            <a
              href="#specs"
              className="flex items-center justify-center px-6 py-3.5 rounded-md font-mono text-sm font-bold tracking-tight border border-[#BCC6B6] text-[#33433A] transition-colors hover:bg-[#F6F7F1]"
            >
              WHAT IT DOES
            </a>
          </div>
        </div>

        {/* ── Signature: tear-off receipt stub ── */}
        <div className="relative">
          <div className="bg-[#F6F7F1] rounded-t-lg border border-[#C9D1C2] shadow-[0_18px_50px_-20px_rgba(25,38,31,0.35)] overflow-hidden">
            {/* stub header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-[#C9D1C2]">
              <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#5C6A5E]">INVOICE · INV-DP/001/IV/2026</span>
              <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#0B5C42] border border-[#0B5C42] rounded px-1.5 py-0.5">DP</span>
            </div>

            {/* line items */}
            <div className="px-6 py-5 space-y-3">
              {[
                ['Down Payment — IT Consulting', '10.000.000'],
                ['Design System & Library',       '8.000.000'],
                ['Backend & API — Termin I',      '6.500.000'],
              ].map(([label, amt]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-[#33433A] truncate">{label}</span>
                  <span className="font-mono tnum text-sm text-[#19261F] whitespace-nowrap">
                    <span className="text-[#8A9587]">Rp</span> {amt}
                  </span>
                </div>
              ))}
            </div>

            {/* total */}
            <div className="px-6 pt-4 border-t-2 border-[#19261F]">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#5C6A5E]">TOTAL</span>
                <span className="font-mono tnum text-3xl sm:text-4xl font-bold text-[#19261F] leading-none">
                  <span className="text-[#A6392B] text-xl align-top mr-1">Rp</span>{formatCurrency(DEMO_TOTAL)}
                </span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed text-[#5C6A5E] mt-3 pb-5">
                <span className="text-[#8A9587]">terbilang //</span> {DEMO_WORDS}
              </p>
            </div>
          </div>

          {/* perforation + torn edge */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F6F7F1] border-x border-[#C9D1C2]">
              <span className="flex-1 border-t border-dashed border-[#AAB6A2]" />
              <span className="font-mono text-[9px] tracking-[0.3em] text-[#8A9587]">TEAR HERE</span>
              <span className="flex-1 border-t border-dashed border-[#AAB6A2]" />
            </div>
            <div
              className="h-3 bg-[#F6F7F1]"
              style={{
                clipPath:
                  'polygon(0 0, 4% 100%, 8% 0, 12% 100%, 16% 0, 20% 100%, 24% 0, 28% 100%, 32% 0, 36% 100%, 40% 0, 44% 100%, 48% 0, 52% 100%, 56% 0, 60% 100%, 64% 0, 68% 100%, 72% 0, 76% 100%, 80% 0, 84% 100%, 88% 0, 92% 100%, 96% 0, 100% 100%, 0 100%)',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="px-5 sm:px-8 py-4 max-w-6xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 border-t border-b border-[#C9D1C2] divide-y sm:divide-y-0 sm:divide-x divide-[#C9D1C2]">
          {STEPS.map(s => (
            <div key={s.n} className="px-5 py-6 flex gap-4">
              <span className="font-mono text-sm font-bold text-[#0B5C42]">{s.n}</span>
              <div>
                <p className="font-medium text-[15px] mb-1">{s.label}</p>
                <p className="text-sm text-[#5C6A5E] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Specs ── */}
      <section id="specs" className="px-5 sm:px-8 py-20 max-w-6xl mx-auto w-full">
        <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#0B5C42] mb-3">SPESIFIKASI</p>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-12 max-w-xl leading-tight">
          Everything a real invoice needs, nothing it doesn&apos;t.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#C9D1C2] border border-[#C9D1C2] rounded-lg overflow-hidden">
          {SPECS.map(s => (
            <div key={s.tag} className="bg-[#F6F7F1] p-6 flex flex-col">
              <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-[#0B5C42] mb-4">{s.tag}</span>
              <h3 className="font-medium text-[15px] mb-1.5">{s.title}</h3>
              <p className="text-sm text-[#5C6A5E] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 sm:px-8 pb-20 max-w-6xl mx-auto w-full">
        <div className="rounded-xl bg-[#19261F] px-8 sm:px-14 py-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#E7EBE2] mb-4">
            Your next invoice is a minute away.
          </h2>
          <p className="text-[#9DAD9F] mb-9 max-w-md mx-auto">
            No registration, no payment, nothing stored. Open, fill, download.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md font-mono text-sm font-bold tracking-tight bg-[#0B5C42] text-[#F6F7F1] transition-colors hover:bg-[#0d6e4f]"
          >
            START NOW <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-5 sm:px-8 py-7 border-t border-[#C9D1C2] flex items-center justify-between font-mono text-[11px] tracking-[0.1em] text-[#8A9587]">
        <span>INVOICE·PDF</span>
        <span>© 2026</span>
      </footer>

    </div>
  );
}
