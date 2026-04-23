# Invoice Generator PDF

Web app untuk membuat invoice profesional dalam format PDF, dibangun dengan Next.js dan di-deploy ke Vercel.

## Fitur

- Form lengkap untuk semua data invoice (pengirim, klien, item, pembayaran)
- Item layanan dinamis — tambah/hapus baris
- Auto-hitung subtotal, diskon, pajak, dan total
- Terbilang otomatis (angka → teks Bahasa Indonesia)
- Generate & download PDF langsung dari browser
- Desain PDF profesional: header navy, tabel item, box terbilang, blok tanda tangan
- Font Caladea (kompatibel Cambria) untuk website dan PDF
- Siap deploy ke Vercel

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **PDF:** @react-pdf/renderer v4
- **Font:** Caladea (pengganti open-source Cambria)
- **Language:** TypeScript

## Struktur Project

```
src/
├── types/invoice.ts              # TypeScript interfaces
├── lib/
│   ├── format.ts                 # Format currency Rupiah
│   └── terbilang.ts              # Angka → teks Indonesia
├── components/
│   ├── InvoiceForm.tsx           # Form UI (client component)
│   └── pdf/InvoicePDF.tsx        # PDF document component
└── app/
    ├── page.tsx                  # Halaman utama
    └── api/generate-pdf/
        └── route.ts              # POST endpoint → PDF binary
```

## Getting Started

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Deploy ke Vercel

1. Push ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repo `invoice-generator-pdf`
4. Framework otomatis terdeteksi sebagai Next.js
5. Klik **Deploy**

Tidak ada environment variable yang dibutuhkan.
