# MikroGig

MikroGig adalah platform kerja lokal Indonesia untuk klien dan freelancer.
Pencarian gig, penawaran, persetujuan, catatan pembayaran, percakapan, bukti
kerja, sengketa, dan penilaian tersedia dalam satu alur.

Situs: [mikrogig.notpa.id](https://mikrogig.notpa.id)

## Teknologi

- PHP 8.3+ dan Laravel 13
- Inertia.js 3, React 19, dan TypeScript
- Tailwind CSS 4 dan Vite
- MariaDB
- Laravel Echo dan Pusher Channels
- Pest

Proyek ini menggunakan `pnpm` untuk dependensi Node.js.

## Layanan pihak ketiga

- Tencent Cloud Object Storage untuk media publik dan privat
- Pusher Channels untuk pembaruan realtime, status online, dan indikator mengetik
- Resend untuk email transaksional
- Google OAuth melalui Laravel Socialite
- API kompatibel OpenAI untuk bantuan penulisan dan ringkasan sengketa
- OpenStreetMap Nominatim untuk reverse geocoding
- Cloudflare Tunnel sebagai jalur masuk production

Checkout pembayaran saat ini menggunakan alur pembayaran mock bawaan.

## Instalasi lokal

```bash
composer install
pnpm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
pnpm build
```

Atur database dan layanan pihak ketiga yang dibutuhkan melalui `.env`. Untuk
pengembangan lokal, jalankan web server, queue worker, scheduler, dan Vite:

```bash
php artisan serve
php artisan queue:work
php artisan schedule:work
pnpm dev
```

Pemrosesan gambar membutuhkan extension PHP GD atau Imagick.

## Data demo

Seeder reguler membuat akun deterministik dan riwayat yang sudah selesai. Untuk
turut membuat skenario sengketa aktif yang digunakan dalam demonstrasi:

```bash
php artisan db:seed --class=DemoSeeder
```

Media seeder harus sudah tersedia dalam bucket Tencent COS yang dikonfigurasi.

## Catatan production

Queue worker dan Laravel scheduler harus tetap aktif. Scheduler menangani
kedaluwarsa pembayaran, tenggat bukti tanggapan sengketa, dan penerimaan otomatis
permintaan penyelesaian.

Unggahan mendukung beberapa gambar dalam satu request. Konfigurasi dasar PHP dan
Nginx yang disarankan:

```ini
upload_max_filesize = 12M
post_max_size = 32M
```

## Pemeriksaan

```bash
php artisan test --compact
pnpm types:check
pnpm lint:check
pnpm format:check
```
