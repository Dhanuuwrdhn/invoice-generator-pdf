# Invoice Generator — Akun, Token, dan Deploy

Tanggal: 2026-10-02
Status: disetujui di brainstorming, menunggu review spec

## Tujuan

Generator invoice PDF (`invoice.bornworks.biz.id`) yang hanya bisa dipakai setelah login. Setiap user punya style, data default, template, dan riwayat invoice sendiri di database. Pemakaian dibatasi dengan token: user baru mendapat 10 token setelah verifikasi email, dan admin bisa menambah token secara manual.

Berhasil kalau:

- Siapa pun bisa register, verifikasi email, lalu langsung punya 10 token.
- Style dan default yang diatur sekali terpakai di perangkat mana pun setelah login.
- Riwayat invoice bisa dibuka, diedit, dan diunduh ulang.
- Saldo token tidak pernah minus dan selalu sama dengan jumlah ledger.
- User tidak bisa melihat data user lain.

## Di luar cakupan

- Pembelian token (payment gateway). Top-up hanya manual oleh admin.
- Login OAuth (Google, dll).
- Pilihan layout PDF baru. Style terbatas pada font, warna, dan logo.
- Reset token otomatis per periode.

## Kondisi awal

- Next.js 16.2.4, React 19, Tailwind v4, `@react-pdf/renderer`.
- `/generator` berisi `InvoiceForm`; `POST /api/generate-pdf` merender PDF tanpa auth.
- Style: font (Caladea, Lato, Montserrat) dan `primaryColor` (7 preset).
- Template tersimpan di `localStorage` (`invoice_saved_templates`).
- Sisa fitur undangan: `public/music/Beautiful In White.mp3`.

## Aturan token

| Aksi | Token |
|---|---|
| Verifikasi email berhasil | +10 (sekali per akun) |
| Generate pertama invoice baru | −1 |
| Edit ke-*n* invoice yang sama, `n % 6 != 0` | 0 |
| Edit ke-*n*, `n % 6 == 0` (ke-6, 12, 18, …) | −1 |
| Download ulang tanpa perubahan | 0, tanpa batas |
| Admin top-up | +N |

- "Edit" = menyimpan perubahan pada invoice yang sudah ada. Menyimpan tanpa perubahan data tidak dihitung.
- Saldo 0 saat aksi berbayar → ditolak dengan pesan "token habis"; data tidak berubah. Invoice lama tetap bisa dibuka dan diunduh.
- Admin tidak punya token tak terbatas; admin top-up dirinya sendiri bila perlu.

## Arsitektur dan deploy

```
Internet ──443──> Caddy (compose landing, ~/bornworks)
                    ├─ bornworks.biz.id          → landing app:3000
                    └─ invoice.bornworks.biz.id  → invoice app:3000  (network docker eksternal "web")

~/invoice (compose invoice)
  ├─ app       Next.js standalone, image ghcr.io/dhanuuwrdhn/invoice-generator-pdf
  ├─ postgres  postgres:17-alpine, volume pg_data, tanpa port ke host
  └─ volume    uploads (logo user)
```

- Network eksternal `web` dibuat sekali (`docker network create web`). Caddy (repo landing) dan `app` invoice bergabung ke network itu. Postgres hanya ada di network default compose invoice.
- `Caddyfile` di repo landing mendapat blok `invoice.bornworks.biz.id { reverse_proxy invoice-app:3000 }` (nama container/alias ditetapkan di compose invoice).
- DNS `invoice.bornworks.biz.id` sudah mengarah ke `43.134.133.227`.
- Migrasi Drizzle (file SQL di repo) dijalankan otomatis saat container `app` start, sebelum `node server.js`.
- CI/CD di repo invoice meniru landing: lint → test (dengan service Postgres) → build image ke GHCR → deploy SSH → health check. Deploy key dan secret `VPS_*` sendiri.
- `~/invoice/.env` (chmod 600): `DATABASE_URL`, `POSTGRES_PASSWORD`, `SMTP_*` (disalin dari `~/bornworks/.env`, Resend), `MAIL_FROM=Bornworks Invoice <noreply@bornworks.biz.id>`, `APP_URL=https://invoice.bornworks.biz.id`, `ADMIN_EMAILS`.
- Backup: cron harian `pg_dump` ke `~/invoice/backups`, simpan 7 terakhir.
- Akun admin dibuat sekali lewat `docker compose exec app node scripts/create-user.mjs <email>`; password dibaca dari stdin, langsung di-hash, akun ditandai terverifikasi. Password tidak pernah disimpan di repo, env, atau log.

## Model data (PostgreSQL, Drizzle)

| Tabel | Kolom | Catatan |
|---|---|---|
| `users` | `id` uuid, `email` unik (lowercase), `password_hash`, `email_verified_at` null, `token_balance` int default 0 `CHECK (token_balance >= 0)`, `created_at` | |
| `sessions` | `id` (SHA-256 hex dari token cookie), `user_id`, `expires_at` | Cookie berisi token acak 32 byte; DB hanya hash. Umur 30 hari |
| `email_tokens` | `token_hash` PK, `user_id`, `purpose` (`verify`/`reset`), `expires_at`, `used_at` | Berlaku 1 jam, sekali pakai |
| `user_settings` | `user_id` PK, `font_family`, `primary_color`, `logo_path`, `sender_name`, `sender_title`, `sender_location`, `sender_phone`, `sender_email`, `bank_name`, `account_number`, `account_holder`, `updated_at` | Default isi form |
| `templates` | `id`, `user_id`, `name`, `data` jsonb (`InvoiceData`), `created_at` | Pengganti `localStorage` |
| `invoices` | `id`, `user_id`, `invoice_number`, `data` jsonb (`InvoiceData` + `logoPath` snapshot), `edit_count` int default 0, `created_at`, `updated_at` | Snapshot lengkap; invoice lama tidak ikut berubah saat settings berubah |
| `token_ledger` | `id`, `user_id`, `delta` int, `reason` (`signup_bonus`/`invoice_create`/`invoice_edit`/`admin_topup`), `invoice_id` null, `actor_user_id` null, `created_at` | Audit; invarian `users.token_balance = SUM(delta)` |
| `rate_limits` | `key` PK, `count`, `window_start` | Fixed window, tanpa Redis |

Semua foreign key ke `users` memakai `ON DELETE CASCADE`. Index pada `invoices(user_id, created_at desc)` dan `templates(user_id)`.

### Pemotongan token

Dalam satu transaksi:

```sql
UPDATE users SET token_balance = token_balance - 1
WHERE id = $1 AND token_balance > 0;
-- 0 baris → rollback, error "token habis"
INSERT INTO token_ledger ...;
INSERT/UPDATE invoices ...;
```

Edit: `UPDATE invoices SET edit_count = edit_count + 1 ... RETURNING edit_count` dengan `SELECT ... FOR UPDATE` pada baris invoice, lalu potong token bila `edit_count % 6 = 0`, semua di transaksi yang sama.

## Halaman

| Route | Akses | Isi |
|---|---|---|
| `/` | publik | Landing yang ada; CTA ke login/register |
| `/register`, `/login` | publik | Email + password (min. 8 karakter) |
| `/verify?token=` | publik | Verifikasi → +10 token → `/invoices` |
| `/forgot`, `/reset?token=` | publik | Lupa password via email |
| `/invoices` | login + verified | Riwayat, saldo token di header, tombol "Invoice baru" |
| `/invoices/new`, `/invoices/[id]` | login + verified | `InvoiceForm`, info "edit ke-n, gratis sampai ke-…" |
| `/invoices/[id]/pdf` | pemilik | Render ulang PDF dari data tersimpan, gratis |
| `/settings` | login + verified | Font, warna, logo, default pengirim/bank, ganti password |
| `/admin` | email ∈ `ADMIN_EMAILS` | Daftar user + saldo, top-up token |

- `proxy.ts` (pengganti `middleware` di Next 16) mengalihkan tamu ke `/login`. Pengecekan sesi dan kepemilikan tetap dilakukan lagi di server action/route; `proxy.ts` hanya lapis pertama.
- Login tapi belum verifikasi → layar "cek email kamu" + tombol kirim ulang.
- `/generator` lama dialihkan ke `/invoices/new`.

## Alur

1. **Register:** validasi → hash password → buat user (saldo 0) → buat `email_tokens(verify)` → kirim email. Gagal kirim email tidak membatalkan akun; user bisa kirim ulang.
2. **Verifikasi:** token valid dan belum dipakai → transaksi: set `email_verified_at`, `used_at`, saldo +10, ledger `signup_bonus` → buat sesi.
3. **Login:** cek rate limit → cocokkan password (`timingSafeEqual`) → buat sesi → cookie `httpOnly; Secure; SameSite=Lax; Path=/`.
4. **Invoice baru:** form diisi dari `user_settings` atau template → server action: validasi → transaksi (−1 token, insert invoice, ledger) → render PDF → kirim file. Render gagal → rollback, token utuh.
5. **Edit:** server action: data sama persis → tidak dihitung → render saja. Data berubah → transaksi (`edit_count+1`, potong bila kelipatan 6, update invoice) → render PDF.
6. **Settings:** simpan default; logo baru menggantikan file lama.
7. **Lupa password:** selalu jawab "kalau email terdaftar, link sudah dikirim" → reset berhasil menghapus semua sesi user.
8. **Admin top-up:** pilih user + jumlah (1–1000) → transaksi (saldo +N, ledger `admin_topup` dengan `actor_user_id`).

## Perubahan kode lama

- `InvoiceForm`: hapus `localStorage`; terima `initialData`, `templates`, dan mode (`new`/`edit`); submit lewat server action.
- `InvoicePDF`: prop `logoSrc` opsional di header.
- `POST /api/generate-pdf` dihapus.
- Hapus `public/music/Beautiful In White.mp3`.
- `next.config.ts`: `output: "standalone"`.

## Keamanan

- Password: `scrypt` (N=2^15, r=8, p=1, salt 16 byte, key 64 byte) dari `node:crypto`; format tersimpan `scrypt$N$r$p$salt$hash`.
- Pesan login gagal selalu sama; register dengan email terdaftar menjawab sama seperti sukses, dan mengirim email "akun sudah ada" ke pemilik email.
- Rate limit: login 5/15 menit per IP+email, register 3/jam per IP, kirim ulang verifikasi 1/menit per user, lupa password 3/jam per IP. IP dari header `X-Forwarded-For` yang diisi Caddy.
- Semua query data user difilter `user_id` dari sesi.
- Logo: PNG/JPEG dicek dari magic bytes, maks 500 KB, disimpan `uploads/<user_id>/logo.<ext>`, disajikan lewat route yang mengecek pemilik.
- Server action memakai cek `Origin` bawaan Next.js; cookie `SameSite=Lax`.

## Error handling

- Error terduga (validasi, token habis, link kedaluwarsa, rate limit) → pesan di form.
- Error tak terduga → `console.error` dengan konteks (tanpa password/token) → pesan umum ke user.
- SMTP gagal → dicatat; UI menawarkan kirim ulang.

## Testing

- Vitest + Postgres sungguhan (service container di CI, Docker lokal).
- Unit: aturan token (create −1; edit 1–5 gratis; 6, 12, 18 −1; saldo 0 ditolak; simpan tanpa perubahan tidak dihitung); hash/verify password; token email kedaluwarsa dan sekali pakai; rate limit window.
- Konkurensi: dua edit berbayar paralel dengan saldo 1 → tepat satu sukses, saldo 0, ledger konsisten.
- Isolasi: user A meminta invoice/PDF/logo user B → 404.
- E2E Playwright (sebelum deploy pertama): register → verifikasi (link diambil dari tabel `email_tokens` di test) → invoice baru → edit 6 kali → saldo 8.
