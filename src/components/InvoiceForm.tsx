'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Plus, X, Save, ChevronDown, Trash2 } from 'lucide-react';
import { InvoiceData, InvoiceItem, FontChoice } from '@/types/invoice';
import { calcSubtotal, calcTax, calcTotal, formatCurrency } from '@/lib/format';

// ── Constants ──────────────────────────────────────────────────────────────────

const INVOICE_TYPES = [
  { group: 'Payment Type', options: ['DOWN PAYMENT', 'PROGRESS PAYMENT', 'FULL PAYMENT', 'FINAL PAYMENT'] },
  { group: 'Term Payment', options: ['TERMIN I', 'TERMIN II', 'TERMIN III', 'TERMIN IV', 'TERMIN V'] },
];

const FONTS: { value: FontChoice; label: string; desc: string }[] = [
  { value: 'Caladea',    label: 'Caladea',    desc: 'Serif' },
  { value: 'Lato',       label: 'Lato',       desc: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', desc: 'Geometric' },
];

const FONT_CSS: Record<FontChoice, string> = {
  Caladea:    "'Caladea', 'Cambria', Georgia, serif",
  Lato:       "'Lato', Arial, sans-serif",
  Montserrat: "'Montserrat', Arial, sans-serif",
};

// ── Built-in templates ─────────────────────────────────────────────────────────

// Template A — IT Consultant, DOWN PAYMENT (Termin I dari III)
const TPL_A: InvoiceData = {
  fontFamily: 'Caladea',
  senderName: 'Ahmad Rizki Pratama',
  senderTitle: 'IT Consultant & Developer',
  senderLocation: 'Jakarta, Indonesia',
  senderPhone: '0812-3456-7890',
  senderEmail: 'ahmad.rizki@itconsult.id',
  clientCompany: 'PT. Horizon Digital Indonesia',
  clientPIC: 'Siti Nurhaliza',
  clientRole: 'CEO',
  clientAddress: 'Jl. TB Simatupang No. 18, Jakarta Selatan 12430',
  clientEmail: 'finance@horizondigital.id',
  invoiceNumber: 'INV-DP/001/IV/2026',
  invoiceType: 'DOWN PAYMENT',
  poRef: 'QUO/HDI/001/IV/2026',
  invoiceDate: '01 April 2026',
  dueDate: '15 April 2026',
  items: [{
    id: crypto.randomUUID(),
    description: 'Down Payment — IT Consulting Project',
    subDescription: 'Pengembangan Sistem Manajemen Internal PT. Horizon Digital',
    spkRef: 'Ref. SPK No. HDI/SPK/2026/001 · Termin I dari III',
    qty: 1, unit: 'Paket', price: 10_000_000,
  }],
  discount: 0, taxRate: 0,
  bankName: 'BCA',
  accountNumber: '8877665544',
  accountHolder: 'Ahmad Rizki Pratama',
};

// Template B — UI/UX Designer, TERMIN II dari IV
const TPL_B: InvoiceData = {
  fontFamily: 'Lato',
  senderName: 'Rina Kusuma Dewi',
  senderTitle: 'Freelance UI/UX Designer',
  senderLocation: 'Bandung, Indonesia',
  senderPhone: '0821-9988-7766',
  senderEmail: 'rina.kusuma@designstudio.id',
  clientCompany: 'PT. Kreasi Digital Nusantara',
  clientPIC: 'Budi Santoso',
  clientRole: 'Creative Director',
  clientAddress: 'Jl. Jend. Sudirman Kav. 45, Jakarta Pusat 10270',
  clientEmail: 'creative@kdn.co.id',
  invoiceNumber: 'INV-T2/002/IV/2026',
  invoiceType: 'TERMIN II',
  poRef: 'PO/KDN/2026/045',
  invoiceDate: '10 April 2026',
  dueDate: '24 April 2026',
  items: [
    {
      id: crypto.randomUUID(),
      description: 'UI/UX Design — Termin II (Wireframe & Prototype)',
      subDescription: 'Desain antarmuka aplikasi mobile e-commerce KDN',
      spkRef: 'Ref. SPK No. KDN/BRF/2026/03 · Termin II dari IV',
      qty: 1, unit: 'Paket', price: 8_000_000,
    },
    {
      id: crypto.randomUUID(),
      description: 'Design System & Component Library',
      subDescription: 'Dokumentasi komponen & panduan gaya visual',
      spkRef: '',
      qty: 1, unit: 'Paket', price: 2_000_000,
    },
  ],
  discount: 0, taxRate: 0,
  bankName: 'Mandiri',
  accountNumber: '1122334455',
  accountHolder: 'Rina Kusuma Dewi',
};

// Template C — Software Agency, TERMIN III dari V
const TPL_C: InvoiceData = {
  fontFamily: 'Montserrat',
  senderName: 'PT. CodeCraft Solutions',
  senderTitle: 'Software Development Agency',
  senderLocation: 'Surabaya, Indonesia',
  senderPhone: '031-5678-9012',
  senderEmail: 'billing@codecraft.id',
  clientCompany: 'PT. Maju Bersama Tbk.',
  clientPIC: 'Dewi Rahayu',
  clientRole: 'Head of Technology',
  clientAddress: 'Gedung Graha Maju Lt. 12, Jl. Pemuda No. 10, Surabaya 60271',
  clientEmail: 'dewi.rahayu@majubersama.co.id',
  invoiceNumber: 'INV-T3/003/IV/2026',
  invoiceType: 'TERMIN III',
  poRef: 'PO/MB/2026/IT-007',
  invoiceDate: '15 April 2026',
  dueDate: '29 April 2026',
  items: [{
    id: crypto.randomUUID(),
    description: 'Software Development — Termin III (Backend & API)',
    subDescription: 'Pengembangan backend API dan integrasi database sistem ERP',
    spkRef: 'Ref. SPK No. CC/SPK/2026/007 · Termin III dari V',
    qty: 1, unit: 'Phase', price: 25_000_000,
  }],
  discount: 0, taxRate: 11,
  bankName: 'BNI',
  accountNumber: '9876543210',
  accountHolder: 'PT. CodeCraft Solutions',
};

const BUILTIN_TEMPLATES = [
  { id: 'tpl-a', name: 'Template A — IT Consultant (Termin I)',    data: TPL_A },
  { id: 'tpl-b', name: 'Template B — UI/UX Designer (Termin II)',  data: TPL_B },
  { id: 'tpl-c', name: 'Template C — Software Agency (Termin III)', data: TPL_C },
];

interface SavedTemplate { id: string; name: string; data: InvoiceData }

const LS_KEY = 'invoice_saved_templates';

// ── Empty data ─────────────────────────────────────────────────────────────────

function emptyData(): InvoiceData {
  return {
    fontFamily: 'Caladea',
    senderName: '', senderTitle: '', senderLocation: '', senderPhone: '', senderEmail: '',
    clientCompany: '', clientPIC: '', clientRole: '', clientAddress: '', clientEmail: '',
    invoiceNumber: '', invoiceType: 'DOWN PAYMENT', poRef: '',
    invoiceDate: '', dueDate: '',
    items: [newItem()],
    discount: 0, taxRate: 0,
    bankName: '', accountNumber: '', accountHolder: '',
  };
}

function newItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: '', subDescription: '', spkRef: '', qty: 1, unit: 'Package', price: 0 };
}

function cloneTemplate(tpl: InvoiceData): InvoiceData {
  return { ...tpl, items: tpl.items.map(i => ({ ...i, id: crypto.randomUUID() }) ) };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InvoiceForm() {
  const [data, setData]                   = useState<InvoiceData>(emptyData);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [saveMode, setSaveMode]           = useState(false);
  const [saveName, setSaveName]           = useState('');
  const [templateOpen, setTemplateOpen]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSavedTemplates(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const set = useCallback(<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [field]: value } : i) }));
  }, []);

  function loadTemplate(tplData: InvoiceData) {
    setData(cloneTemplate(tplData));
    setTemplateOpen(false);
  }

  function handleSave() {
    if (!saveName.trim()) return;
    const tpl: SavedTemplate = { id: crypto.randomUUID(), name: saveName.trim(), data: { ...data } };
    const updated = [...savedTemplates, tpl];
    setSavedTemplates(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSaveMode(false);
    setSaveName('');
  }

  function deleteTemplate(id: string) {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }

  const subtotal = calcSubtotal(data.items);
  const taxAmt   = calcTax(subtotal, data.discount, data.taxRate);
  const total    = calcTotal(subtotal, data.discount, taxAmt);

  const fontCss = FONT_CSS[data.fontFamily || 'Caladea'];

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text() || 'Failed to generate PDF');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Invoice_${data.invoiceNumber.replace(/\//g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: fontCss }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors shrink-0">
            <ArrowLeft size={15} />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <span className="font-bold text-base" style={{ color: '#1A3A5C' }}>Invoice Generator</span>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
            style={{ backgroundColor: '#1A3A5C' }}
          >
            <Download size={14} />
            {loading ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* ── Toolbar card: Font + Template ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">

          {/* Font picker */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">PDF Font</p>
            <div className="flex gap-2 flex-wrap">
              {FONTS.map(f => {
                const active = (data.fontFamily || 'Caladea') === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => set('fontFamily', f.value)}
                    className={`flex flex-col items-start px-4 py-2.5 rounded-lg border-2 transition-all ${
                      active ? 'border-[#1A3A5C] bg-[#F0F4F8]' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    style={{ fontFamily: FONT_CSS[f.value] }}
                  >
                    <span className={`text-sm font-bold ${active ? 'text-[#1A3A5C]' : 'text-slate-700'}`}>{f.label}</span>
                    <span className="text-xs text-slate-400">{f.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template picker */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Templates</p>
            <div className="flex gap-2 flex-wrap items-start">

              {/* Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setTemplateOpen(o => !o)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all"
                >
                  Load Template
                  <ChevronDown size={14} className={`transition-transform ${templateOpen ? 'rotate-180' : ''}`} />
                </button>
                {templateOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      Built-in
                    </div>
                    {BUILTIN_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t.data)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {t.name}
                      </button>
                    ))}
                    {savedTemplates.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-b border-slate-100 mt-1">
                          Saved
                        </div>
                        {savedTemplates.map(t => (
                          <div key={t.id} className="flex items-center group">
                            <button
                              onClick={() => loadTemplate(t.data)}
                              className="flex-1 text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              {t.name}
                            </button>
                            <button
                              onClick={() => deleteTemplate(t.id)}
                              className="px-3 py-2.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Save template */}
              {!saveMode ? (
                <button
                  onClick={() => setSaveMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:border-slate-400 transition-all"
                >
                  <Save size={14} />
                  Save Current
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setSaveMode(false); setSaveName(''); } }}
                    placeholder="Template name…"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
                  />
                  <button onClick={handleSave} className="px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#1A3A5C' }}>Save</button>
                  <button onClick={() => { setSaveMode(false); setSaveName(''); }} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">Cancel</button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {templateOpen && <div className="fixed inset-0 z-10" onClick={() => setTemplateOpen(false)} />}

        {/* ── 1. Sender Information ── */}
        <Section title="Sender Information">
          <Grid>
            <Field label="Full Name">
              <Input value={data.senderName} onChange={v => set('senderName', v)} placeholder="Your name" fontCss={fontCss} />
            </Field>
            <Field label="Title / Position">
              <Input value={data.senderTitle} onChange={v => set('senderTitle', v)} placeholder="IT Consultant & Developer" fontCss={fontCss} />
            </Field>
            <Field label="City / Location">
              <Input value={data.senderLocation} onChange={v => set('senderLocation', v)} placeholder="Jakarta, Indonesia" fontCss={fontCss} />
            </Field>
            <Field label="Phone Number">
              <Input value={data.senderPhone} onChange={v => set('senderPhone', v)} placeholder="0812-xxxx-xxxx" fontCss={fontCss} />
            </Field>
            <Field label="Email Address" full>
              <Input value={data.senderEmail} onChange={v => set('senderEmail', v)} placeholder="you@email.com" type="email" fontCss={fontCss} />
            </Field>
          </Grid>
        </Section>

        {/* ── 2. Client Information ── */}
        <Section title="Client Information">
          <Grid>
            <Field label="Company Name">
              <Input value={data.clientCompany} onChange={v => set('clientCompany', v)} placeholder="PT. Company Name" fontCss={fontCss} />
            </Field>
            <Field label="Client Email">
              <Input value={data.clientEmail} onChange={v => set('clientEmail', v)} placeholder="finance@company.com" type="email" fontCss={fontCss} />
            </Field>
            <Field label="PIC Name">
              <Input value={data.clientPIC} onChange={v => set('clientPIC', v)} placeholder="Person in Charge" fontCss={fontCss} />
            </Field>
            <Field label="PIC Role">
              <Input value={data.clientRole} onChange={v => set('clientRole', v)} placeholder="CEO / Manager" fontCss={fontCss} />
            </Field>
            <Field label="Full Address" full>
              <textarea
                value={data.clientAddress}
                onChange={e => set('clientAddress', e.target.value)}
                placeholder="Street, district, city, postal code"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                style={{ fontFamily: fontCss }}
              />
            </Field>
          </Grid>
        </Section>

        {/* ── 3. Invoice Details ── */}
        <Section title="Invoice Details">
          <Grid>
            <Field label="Invoice Number">
              <Input value={data.invoiceNumber} onChange={v => set('invoiceNumber', v)} placeholder="INV-DP/001/IV/2026" fontCss={fontCss} />
            </Field>
            <Field label="Invoice Type">
              <select
                value={data.invoiceType}
                onChange={e => set('invoiceType', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                style={{ fontFamily: fontCss }}
              >
                {INVOICE_TYPES.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="PO / WO Reference">
              <Input value={data.poRef} onChange={v => set('poRef', v)} placeholder="QUO/001/IV/2026" fontCss={fontCss} />
            </Field>
            <Field label="Invoice Date">
              <Input value={data.invoiceDate} onChange={v => set('invoiceDate', v)} placeholder="05 April 2026" fontCss={fontCss} />
            </Field>
            <Field label="Due Date">
              <Input value={data.dueDate} onChange={v => set('dueDate', v)} placeholder="19 April 2026" fontCss={fontCss} />
            </Field>
          </Grid>
        </Section>

        {/* ── 4. Service Items ── */}
        <Section title="Service Items">
          <div className="space-y-3">
            {data.items.map((item, i) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Item {i + 1}</span>
                  {data.items.length > 1 && (
                    <button onClick={() => setData(p => ({ ...p, items: p.items.filter(x => x.id !== item.id) }))}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Description" full>
                    <Input value={item.description} onChange={v => updateItem(item.id, 'description', v)} placeholder="Service / product name" fontCss={fontCss} />
                  </Field>
                  <Field label="Sub-description">
                    <Input value={item.subDescription} onChange={v => updateItem(item.id, 'subDescription', v)} placeholder="Additional detail (optional)" fontCss={fontCss} />
                  </Field>
                  <Field label="SPK / Term Ref">
                    <Input value={item.spkRef} onChange={v => updateItem(item.id, 'spkRef', v)} placeholder="Ref. SPK No. … (optional)" fontCss={fontCss} />
                  </Field>
                  <Field label="Qty">
                    <Input value={String(item.qty)} onChange={v => updateItem(item.id, 'qty', parseFloat(v) || 0)} type="number" min="0" placeholder="1" fontCss={fontCss} />
                  </Field>
                  <Field label="Unit">
                    <Input value={item.unit} onChange={v => updateItem(item.id, 'unit', v)} placeholder="Package / Month / Hour" fontCss={fontCss} />
                  </Field>
                  <Field label="Unit Price (Rp)">
                    <Input value={String(item.price)} onChange={v => updateItem(item.id, 'price', parseFloat(v) || 0)} type="number" min="0" placeholder="5000000" fontCss={fontCss} />
                  </Field>
                  <Field label="Subtotal">
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                      Rp {formatCurrency(item.qty * item.price)}
                    </div>
                  </Field>
                </div>
              </div>
            ))}
            <button
              onClick={() => setData(p => ({ ...p, items: [...p.items, newItem()] }))}
              className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-400 hover:border-[#1A3A5C] hover:text-[#1A3A5C] transition-colors font-medium"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        </Section>

        {/* ── 5. Payment Information ── */}
        <Section title="Payment Information">
          <Grid>
            <Field label="Bank Name">
              <Input value={data.bankName} onChange={v => set('bankName', v)} placeholder="BCA / Mandiri / BNI" fontCss={fontCss} />
            </Field>
            <Field label="Account Number">
              <Input value={data.accountNumber} onChange={v => set('accountNumber', v)} placeholder="1234567890" fontCss={fontCss} />
            </Field>
            <Field label="Account Holder">
              <Input value={data.accountHolder} onChange={v => set('accountHolder', v)} placeholder="Account owner name" fontCss={fontCss} />
            </Field>
          </Grid>
        </Section>

        {/* ── 6. Summary ── */}
        <Section title="Summary">
          <Grid>
            <Field label="Discount (Rp)">
              <Input value={String(data.discount)} onChange={v => set('discount', parseFloat(v) || 0)} type="number" min="0" placeholder="0" fontCss={fontCss} />
            </Field>
            <Field label="Tax Rate (%)">
              <Input value={String(data.taxRate)} onChange={v => set('taxRate', parseFloat(v) || 0)} type="number" min="0" max="100" step="0.1" placeholder="0" fontCss={fontCss} />
            </Field>
          </Grid>
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
            <SummaryRow label="Subtotal"              value={`Rp ${formatCurrency(subtotal)}`} />
            <SummaryRow label="Discount"              value={`– Rp ${formatCurrency(data.discount)}`} />
            <SummaryRow label={`Tax (${data.taxRate}%)`} value={`Rp ${formatCurrency(taxAmt)}`} />
            <div className="flex justify-between items-center px-5 py-3.5" style={{ backgroundColor: '#1A3A5C' }}>
              <span className="font-bold text-white text-sm" style={{ fontFamily: fontCss }}>Total Invoice</span>
              <span className="font-bold text-white text-lg" style={{ fontFamily: fontCss }}>Rp {formatCurrency(total)}</span>
            </div>
          </div>
        </Section>

        {/* ── Error + Generate button ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1A3A5C', fontFamily: fontCss }}
        >
          <Download size={18} />
          {loading ? 'Generating PDF…' : 'Generate & Download PDF'}
        </button>

        <p className="text-center text-xs text-slate-400 pb-4">
          PDF will be downloaded automatically to your device
        </p>
      </div>
    </div>
  );
}

// ── Reusable primitives ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1A3A5C' }}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', min, max, step, fontCss }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; min?: string; max?: string; step?: string; fontCss: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} min={min} max={max} step={step}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow"
      style={{ fontFamily: fontCss }}
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-2.5 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
