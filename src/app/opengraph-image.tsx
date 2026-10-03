import { ImageResponse } from 'next/og';

export const alt = 'InvoicePDF — Invoice PDF profesional dalam hitungan detik';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#E7EBE2', padding: '64px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: '#19261F' }}>
            INVOICE<span style={{ color: '#0B5C42' }}>·</span>PDF
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 68, fontWeight: 700, lineHeight: 1.08, color: '#19261F' }}>
            <span>Invoice profesional,</span>
            <span style={{ color: '#0B5C42' }}>siap kirim dalam detik.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#5C6A5E' }}>
            Terbilang otomatis · Termin & PPN · 10 invoice gratis
          </div>
        </div>
        {/* Mini invoice sheet */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 300, marginLeft: 48, background: '#FFFFFF', borderRadius: 16, padding: 28, border: '2px solid #C9D1C2' }}>
          <div style={{ display: 'flex', height: 14, width: 120, background: '#0B5C42', borderRadius: 4, marginBottom: 24 }} />
          {[200, 240, 170, 220, 150].map((w, i) => (
            <div key={i} style={{ display: 'flex', height: 10, width: w, background: '#D7DDCF', borderRadius: 4, marginBottom: 16 }} />
          ))}
          <div style={{ display: 'flex', marginTop: 'auto', height: 44, background: '#0B5C42', borderRadius: 8, color: '#F6F7F1', fontSize: 22, fontWeight: 700, alignItems: 'center', justifyContent: 'center' }}>
            Rp 12.500.000
          </div>
        </div>
      </div>
    ),
    size,
  );
}
