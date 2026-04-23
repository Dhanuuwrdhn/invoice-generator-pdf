'use client';

import { useState, useCallback } from 'react';
import { InvoiceData, InvoiceItem } from '@/types/invoice';
import { calcSubtotal, calcTax, calcTotal, formatCurrency } from '@/lib/format';

const INVOICE_TYPES = ['DOWN PAYMENT', 'FULL PAYMENT', 'PROGRESS PAYMENT', 'FINAL PAYMENT'];

function newItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    subDescription: '',
    spkRef: '',
    qty: 1,
    unit: 'Paket',
    price: 0,
  };
}

const EMPTY_DATA: InvoiceData = {
  senderName: '',
  senderTitle: '',
  senderLocation: '',
  senderPhone: '',
  senderEmail: '',
  clientCompany: '',
  clientPIC: '',
  clientRole: '',
  clientAddress: '',
  clientEmail: '',
  invoiceNumber: '',
  invoiceType: 'DOWN PAYMENT',
  poRef: '',
  invoiceDate: '',
  dueDate: '',
  items: [newItem()],
  discount: 0,
  taxRate: 0,
  bankName: '',
  accountNumber: '',
  accountHolder: '',
};

const TEMPLATE_DATA: InvoiceData = {
  senderName: 'Jose Veinsenli',
  senderTitle: 'IT Consultant & Developer',
  senderLocation: 'Jakarta, Indonesia',
  senderPhone: '0812-9020-1003',
  senderEmail: 'Joseveinsen17@gmail.com',
  clientCompany: 'Manajemen Sunny StartUp',
  clientPIC: 'Ilmi Pakarti',
  clientRole: 'CEO Sunny StartUp',
  clientAddress: '[Alamat Lengkap Sunny StartUp]',
  clientEmail: 'finance@sunnystartup.com',
  invoiceNumber: 'INV-DP/001/IV/2026',
  invoiceType: 'DOWN PAYMENT',
  poRef: 'QUO/001/IV/2026',
  invoiceDate: '05 April 2026',
  dueDate: '19 April 2026',
  items: [
    {
      id: crypto.randomUUID(),
      description: 'Down Payment (DP) — Project Initiation',
      subDescription: 'Pengembangan Aplikasi Mobile & Website Sunny StartUp',
      spkRef: 'Ref. SPK No. SPK/001/IV/2026 · Termin I dari V',
      qty: 1,
      unit: 'Paket',
      price: 5000000,
    },
  ],
  discount: 0,
  taxRate: 0,
  bankName: '[Nama Bank Anda]',
  accountNumber: '[Nomor Rekening Anda]',
  accountHolder: 'Jose Veinsenli',
};

export function InvoiceForm() {
  const [data, setData] = useState<InvoiceData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const addItem = useCallback(() => {
    setData((prev) => ({ ...prev, items: [...prev.items, newItem()] }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  const subtotal = calcSubtotal(data.items);
  const taxAmt = calcTax(subtotal, data.discount, data.taxRate);
  const total = calcTotal(subtotal, data.discount, taxAmt);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Gagal generate PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${data.invoiceNumber.replace(/\//g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Title */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif", color: '#1A3A5C' }}>
            Invoice Generator
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Isi form di bawah, lalu klik Generate PDF</p>
        </div>

        {/* Template button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setData({ ...TEMPLATE_DATA, items: TEMPLATE_DATA.items.map(i => ({ ...i, id: crypto.randomUUID() })) })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all hover:shadow-md"
            style={{ borderColor: '#1A3A5C', color: '#1A3A5C', fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}
          >
            <span>📄</span>
            Gunakan Data Template
          </button>
        </div>

        {/* 1. Informasi Pengirim */}
        <Section title="Informasi Pengirim">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap">
              <Input value={data.senderName} onChange={(v) => set('senderName', v)} placeholder="Nama Anda" />
            </Field>
            <Field label="Jabatan / Title">
              <Input value={data.senderTitle} onChange={(v) => set('senderTitle', v)} placeholder="IT Consultant & Developer" />
            </Field>
            <Field label="Kota / Lokasi">
              <Input value={data.senderLocation} onChange={(v) => set('senderLocation', v)} placeholder="Jakarta, Indonesia" />
            </Field>
            <Field label="Nomor Telepon">
              <Input value={data.senderPhone} onChange={(v) => set('senderPhone', v)} placeholder="0812-xxxx-xxxx" />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <Input value={data.senderEmail} onChange={(v) => set('senderEmail', v)} placeholder="email@domain.com" type="email" />
            </Field>
          </div>
        </Section>

        {/* 2. Informasi Klien */}
        <Section title="Informasi Klien">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Perusahaan">
              <Input value={data.clientCompany} onChange={(v) => set('clientCompany', v)} placeholder="PT. Nama Perusahaan" />
            </Field>
            <Field label="Email Klien">
              <Input value={data.clientEmail} onChange={(v) => set('clientEmail', v)} placeholder="finance@perusahaan.com" type="email" />
            </Field>
            <Field label="Nama PIC">
              <Input value={data.clientPIC} onChange={(v) => set('clientPIC', v)} placeholder="Nama Person in Charge" />
            </Field>
            <Field label="Jabatan PIC">
              <Input value={data.clientRole} onChange={(v) => set('clientRole', v)} placeholder="CEO / Manager / dll" />
            </Field>
            <Field label="Alamat Lengkap" className="sm:col-span-2">
              <textarea
                value={data.clientAddress}
                onChange={(e) => set('clientAddress', e.target.value)}
                placeholder="Jl. Nama Jalan No. XX, Kelurahan, Kecamatan, Kota, Kode Pos"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}
              />
            </Field>
          </div>
        </Section>

        {/* 3. Detail Invoice */}
        <Section title="Detail Invoice">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="No. Invoice">
              <Input value={data.invoiceNumber} onChange={(v) => set('invoiceNumber', v)} placeholder="INV-DP/001/IV/2026" />
            </Field>
            <Field label="Tipe Invoice">
              <select
                value={data.invoiceType}
                onChange={(e) => set('invoiceType', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}
              >
                {INVOICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Ref. PO / WO">
              <Input value={data.poRef} onChange={(v) => set('poRef', v)} placeholder="QUO/001/IV/2026" />
            </Field>
            <Field label="Tanggal Invoice">
              <Input value={data.invoiceDate} onChange={(v) => set('invoiceDate', v)} placeholder="05 April 2026" />
            </Field>
            <Field label="Jatuh Tempo">
              <Input value={data.dueDate} onChange={(v) => set('dueDate', v)} placeholder="19 April 2026" />
            </Field>
          </div>
        </Section>

        {/* 4. Item Layanan */}
        <Section title="Item Layanan">
          <div className="space-y-4">
            {data.items.map((item, i) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Item {i + 1}</span>
                  {data.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      × Hapus
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Deskripsi Utama" className="sm:col-span-2">
                    <Input
                      value={item.description}
                      onChange={(v) => updateItem(item.id, 'description', v)}
                      placeholder="Nama layanan / produk"
                    />
                  </Field>
                  <Field label="Sub-deskripsi">
                    <Input
                      value={item.subDescription}
                      onChange={(v) => updateItem(item.id, 'subDescription', v)}
                      placeholder="Detail tambahan (opsional)"
                    />
                  </Field>
                  <Field label="Ref. SPK / Termin">
                    <Input
                      value={item.spkRef}
                      onChange={(v) => updateItem(item.id, 'spkRef', v)}
                      placeholder="Ref. SPK No. ... (opsional)"
                    />
                  </Field>
                  <Field label="Qty">
                    <Input
                      value={String(item.qty)}
                      onChange={(v) => updateItem(item.id, 'qty', parseFloat(v) || 0)}
                      placeholder="1"
                      type="number"
                      min="0"
                    />
                  </Field>
                  <Field label="Satuan">
                    <Input
                      value={item.unit}
                      onChange={(v) => updateItem(item.id, 'unit', v)}
                      placeholder="Paket / Bulan / Jam"
                    />
                  </Field>
                  <Field label="Harga Satuan (Rp)">
                    <Input
                      value={String(item.price)}
                      onChange={(v) => updateItem(item.id, 'price', parseFloat(v) || 0)}
                      placeholder="5000000"
                      type="number"
                      min="0"
                    />
                  </Field>
                  <Field label="Jumlah">
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
                      Rp {formatCurrency(item.qty * item.price)}
                    </div>
                  </Field>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="w-full border-2 border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              + Tambah Item
            </button>
          </div>
        </Section>

        {/* 5. Informasi Pembayaran */}
        <Section title="Informasi Pembayaran">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Bank">
              <Input value={data.bankName} onChange={(v) => set('bankName', v)} placeholder="BCA / Mandiri / BNI / dll" />
            </Field>
            <Field label="No. Rekening">
              <Input value={data.accountNumber} onChange={(v) => set('accountNumber', v)} placeholder="1234567890" />
            </Field>
            <Field label="Atas Nama">
              <Input value={data.accountHolder} onChange={(v) => set('accountHolder', v)} placeholder="Nama pemilik rekening" />
            </Field>
          </div>
        </Section>

        {/* 6. Ringkasan */}
        <Section title="Ringkasan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label="Diskon (Rp)">
              <Input
                value={String(data.discount)}
                onChange={(v) => set('discount', parseFloat(v) || 0)}
                placeholder="0"
                type="number"
                min="0"
              />
            </Field>
            <Field label="Pajak (%)">
              <Input
                value={String(data.taxRate)}
                onChange={(v) => set('taxRate', parseFloat(v) || 0)}
                placeholder="0"
                type="number"
                min="0"
                max="100"
                step="0.1"
              />
            </Field>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <SummaryRow label="Subtotal" value={`Rp ${formatCurrency(subtotal)}`} />
            <SummaryRow label="Diskon" value={`- Rp ${formatCurrency(data.discount)}`} />
            <SummaryRow label={`Pajak (${data.taxRate}%)`} value={`Rp ${formatCurrency(taxAmt)}`} />
            <div className="flex justify-between items-center px-4 py-3 bg-[#1A3A5C]">
              <span className="font-bold text-white text-sm">Total Tagihan</span>
              <span className="font-bold text-white text-base">Rp {formatCurrency(total)}</span>
            </div>
          </div>
        </Section>

        {/* Generate Button */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#1A3A5C', fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}
        >
          {loading ? 'Membuat PDF...' : '⬇ Generate & Download PDF'}
        </button>

      </div>
    </div>
  );
}

// ── Reusable sub-components ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100" style={{ backgroundColor: '#F7F9FC' }}>
        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#1A3A5C', fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}>
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = 'text', min, max, step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{ fontFamily: "'Caladea', 'Cambria', Georgia, serif" }}
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
