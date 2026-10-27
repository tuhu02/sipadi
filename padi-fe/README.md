# SiPadi Frontend

Frontend PWA SiPadi dibangun dengan Next.js App Router, React, TypeScript, dan Tailwind CSS 4. Backend API berada di project `padi-api`.

## Tahap implementasi saat ini

**Tahap 1 — autentikasi dasar (selesai)**

- Form login yang terhubung ke `POST /api/login`.
- Restore sesi tab melalui `GET /api/me`.
- Logout melalui `POST /api/logout`.
- Token bearer disimpan di `sessionStorage` dan dihapus setelah logout atau token dinyatakan tidak valid.
- Pesan validasi API dan kesalahan koneksi ditampilkan pada layar.

**Tahap 2 — dashboard PPL (selesai)**

- Mengambil referensi melalui `GET /api/referensi`.
- Menampilkan ringkasan desa, lahan, catatan provitas, dan laporan luas areal.
- Navigasi ke ringkasan, wilayah/lahan, provitas, dan luas areal.
- Menampilkan status online/offline browser dan waktu referensi server.
- Referensi dimuat saat dashboard dibuka dan diperbarui otomatis setelah notifikasi data master baru.
- Admin memiliki antrean untuk menyetujui atau menolak pengajuan provitas dan luas areal; penolakan wajib disertai alasan.

**Tahap 3 — pencatatan provitas dan sinkronisasi (dasar selesai)**

- Pilihan kecamatan tugas → desa → lahan; daftar lokasi dibatasi backend berdasarkan penugasan aktif.
- Input tanggal panen, luas petak, berat gabah, kadar air, dan catatan.
- Estimasi provitas ditampilkan sebagai `berat_gabah_kg / luas_petak_m2 * 100`; nilai akhir tetap dihitung ulang API.
- Draft dan pengajuan disimpan pada IndexedDB per akun, termasuk saat offline.
- Antrean provitas yang belum pernah dikirim otomatis disinkronkan saat aplikasi online dan koneksi kembali tersedia.
- Laporan luas areal dapat dibuat atau diperbarui per desa, bulan, dan tahun; draft maupun pengajuan tersimpan offline dan dikirim otomatis saat online.
- Referensi wilayah dan musim tanam disimpan lokal untuk membuka form saat offline.

Laporan luas areal yang diajukan menunggu verifikasi admin. Laporan yang sudah diverifikasi tidak dapat diubah oleh PPL.

## Menjalankan lokal

```bash
npm install
```

Salin `.env.example` menjadi `.env.local` dan sesuaikan URL API:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_REVERB_APP_KEY=copy-from-api-env
NEXT_PUBLIC_REVERB_HOST=127.0.0.1
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

Ganti `copy-from-api-env` dengan nilai `REVERB_APP_KEY` dari `.env` backend. Jalankan API, Reverb, dan queue worker sesuai dokumentasi backend, lalu jalankan PWA:

```bash
npm run dev
```

Buka `http://localhost:5173`. Port ini sama dengan origin PWA development yang diizinkan oleh konfigurasi CORS backend.

## Perintah kualitas

```bash
npm run lint
npm run build
```

## Akun lokal

Jika database API sudah di-seed, gunakan:

```text
PPL:   ppl@sipadi.test / password
Admin: admin@sipadi.test / password
```

Ganti password seeder untuk penggunaan selain development.
