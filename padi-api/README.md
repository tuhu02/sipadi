# SiPadi API

Backend API untuk sistem pencatatan padi. API ini dipakai oleh PWA React terpisah untuk:

- input data provitas dan luas areal oleh PPL;
- sinkronisasi data yang dibuat saat offline;
- verifikasi data oleh admin;
- rekapitulasi data terverifikasi per kecamatan;
- pengelolaan master data.

API hanya menyediakan respons JSON. Frontend tidak termasuk dalam repository ini.

## Teknologi

- PHP 8.3+
- Laravel 13
- Laravel Sanctum untuk personal access token
- SQL Server (`sqlsrv`) sebagai database produksi
- SQLite dapat digunakan untuk pengujian
- UUID untuk seluruh primary key

## Role dan akses

| Role | Akses |
| --- | --- |
| `ppl` | Login, melihat referensi sesuai penugasan, mengirim sinkronisasi data miliknya |
| `admin` | Semua akses admin: verifikasi, rekap, dan CRUD master data |

PPL hanya dapat mengirim data untuk desa atau lahan yang berada di kecamatan dengan penugasan aktif. Penugasan aktif berarti `tanggal_mulai <= hari ini` dan `tanggal_selesai` kosong atau `tanggal_selesai >= hari ini`.

## Instalasi

### 1. Install dependency

```bash
composer install
```

Jika membuat instalasi baru:

```bash
copy .env.example .env
php artisan key:generate
```

### 2. Konfigurasi SQL Server

Atur `.env` sesuai database:

```dotenv
APP_NAME=SiPadi
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlsrv
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=db_sipadi
DB_USERNAME=sa
DB_PASSWORD=your-password
```

Pastikan ekstensi PHP berikut tersedia:

- `pdo_sqlsrv`
- `sqlsrv`

### 3. Jalankan migration dan seeder

```bash
php artisan migrate --seed
```

Jangan menjalankan `migrate:fresh` pada database bersama atau production karena perintah tersebut menghapus seluruh tabel.

### 4. Jalankan server

```bash
php artisan serve
```

Base URL default:

```text
http://localhost:8000/api
```

## Notifikasi real-time lokal

Notifikasi desa/lahan baru tersimpan di inbox PPL yang memiliki penugasan aktif pada kecamatan terkait. PWA menerima pembaruan melalui private channel Laravel Reverb; setelah menerima event, referensi lokal diperbarui otomatis.

Konfigurasi Reverb lokal tersedia di `.env.example`. Pastikan `BROADCAST_CONNECTION=reverb`, lalu jalankan proses-proses berikut pada terminal terpisah:

```bash
php artisan serve
php artisan reverb:start
php artisan queue:work
```

PWA perlu mengatur `NEXT_PUBLIC_REVERB_APP_KEY` sama dengan `REVERB_APP_KEY`, host `127.0.0.1`, port `8080`, dan scheme `http`. Jika aplikasi API memakai port/host lain, sesuaikan `NEXT_PUBLIC_API_URL` pada PWA.

## Akun seeder lokal

Seeder membuat akun berikut:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@sipadi.test` | `password` |
| PPL | `ppl@sipadi.test` | `password` |

Password tersebut hanya untuk development lokal. Ganti atau hapus akun seeder sebelum deployment.

Seeder juga membuat:

- 2 kecamatan;
- 2 desa pada setiap kecamatan;
- 3 lahan pada setiap desa;
- 1 musim tanam;
- penugasan PPL pada kecamatan pertama.

## Konvensi request

Untuk endpoint JSON gunakan header berikut:

```http
Accept: application/json
Content-Type: application/json
```

Untuk endpoint terproteksi tambahkan:

```http
Authorization: Bearer {token}
```

Validasi request gagal menggunakan format error JSON standar Laravel, dengan HTTP status `422`.

Contoh:

```json
{
  "message": "The email field is required.",
  "errors": {
    "email": [
      "The email field is required."
    ]
  }
}
```

## Autentikasi

### Login

```http
POST /api/login
```

Request:

```json
{
  "email": "ppl@sipadi.test",
  "password": "password"
}
```

Response `200`:

```json
{
  "token": "1|example-token",
  "user": {
    "id": "uuid",
    "nama": "Penyuluh",
    "email": "ppl@sipadi.test",
    "role": "ppl"
  }
}
```

Jika kredensial salah, response `422`:

```json
{
  "message": "Email atau password salah"
}
```

### User aktif

```http
GET /api/me
```

### Logout

```http
POST /api/logout
```

Logout menghapus token aktif yang sedang digunakan.

## Referensi untuk PWA

```http
GET /api/referensi
```

Response:

```json
{
  "kecamatan": [],
  "desa": [],
  "lahan": [],
  "musim_tanam": [],
  "provitas": [],
  "luas_areal": [],
  "server_time": "2026-10-14T10:00:00.000000Z"
}
```

Untuk PPL:

- `kecamatan` hanya berisi kecamatan penugasan aktif;
- `desa` hanya berasal dari kecamatan penugasan aktif;
- `lahan` hanya berasal dari desa yang boleh diakses;
- `musim_tanam` berisi semua musim tanam;
- `provitas` dan `luas_areal` berisi data milik PPL yang belum dihapus.

Untuk admin, semua data referensi dikembalikan.

PWA harus menyimpan `server_time` sebagai nilai `last_sync` untuk request sinkronisasi berikutnya. Jangan menggunakan jam perangkat sebagai pengganti `server_time`.

## Sinkronisasi offline

```http
POST /api/sync
```

Endpoint ini hanya dapat digunakan oleh role `ppl`.

### Request

```json
{
  "provitas": [
    {
      "id": "uuid-dari-client",
      "lahan_id": "uuid-lahan",
      "musim_tanam_id": "uuid-musim-tanam",
      "tanggal_panen": "2026-05-01",
      "luas_petak_m2": 100,
      "berat_gabah_kg": 50,
      "kadar_air": 20,
      "catatan": "Panen petak utara",
      "status": "submitted",
      "updated_at": "2026-05-01T10:00:00Z",
      "deleted": false
    }
  ],
  "luas_areal": [
    {
      "id": "uuid-dari-client",
      "desa_id": "uuid-desa",
      "tahun": 2026,
      "bulan": 5,
      "luas_tanam_ha": 10.5,
      "luas_panen_ha": 8.25,
      "luas_puso_ha": 0.25,
      "catatan": null,
      "status": "draft",
      "updated_at": "2026-05-01T10:00:00Z",
      "deleted": false
    }
  ],
  "last_sync": null
}
```

`last_sync` harus berupa ISO 8601 atau `null`.

### Aturan server

1. `ppl_id` selalu diambil dari user yang login.
2. `ppl_id` dari client diabaikan.
3. PPL tidak boleh mengirim data di luar kecamatan penugasannya.
4. `provitas_kuha` selalu dihitung ulang:

   ```text
   berat_gabah_kg / luas_petak_m2 * 100
   ```

5. `luas_petak_m2` harus lebih besar dari nol.
6. Nilai provitas di atas batas kewajaran ditolak.
7. Client hanya boleh mengirim `draft` atau `submitted`.
8. Status `verified`, `verified_by`, `verified_at`, dan `catatan_verifikasi` hanya dapat diubah admin.
9. Record `verified` tidak dapat diubah oleh PPL.
10. Jika record server lebih baru dari record client, versi server dikembalikan.
11. Pengiriman ulang dengan `id` yang sama bersifat idempotent.
12. Pelanggaran unique constraint dikembalikan sebagai alasan `duplikat`.
13. `synced_at` diisi oleh server saat record diterima.
14. `deleted=true` digunakan sebagai tombstone agar client dapat menghapus data lokal setelah sinkronisasi.

### Response

```json
{
  "hasil": {
    "provitas": [
      {
        "id": "uuid",
        "status": "diterima",
        "alasan": null
      }
    ],
    "luas_areal": [
      {
        "id": "uuid",
        "status": "ditolak",
        "alasan": "Desa berada di luar kecamatan penugasan."
      }
    ]
  },
  "perubahan": {
    "provitas": [],
    "luas_areal": []
  },
  "server_time": "2026-10-14T10:00:00.000000Z"
}
```

`perubahan` berisi record milik PPL tersebut dengan `synced_at` lebih baru dari `last_sync`. Jika `last_sync=null`, perubahan dikembalikan dari seluruh data milik PPL. Data yang telah diverifikasi admin juga dikirim melalui bagian ini.

## Verifikasi admin

### Daftar provitas submitted

```http
GET /api/verifikasi/provitas
```

Filter query yang tersedia:

```text
kecamatan_id
musim_tanam_id
ppl_id
```

### Daftar luas areal submitted

```http
GET /api/verifikasi/luas-areal
```

Filter query yang tersedia:

```text
kecamatan_id
tahun
ppl_id
```

### Menyetujui data

```http
POST /api/verifikasi/provitas/{id}/setujui
POST /api/verifikasi/luas-areal/{id}/setujui
```

### Menolak data

```http
POST /api/verifikasi/provitas/{id}/tolak
POST /api/verifikasi/luas-areal/{id}/tolak
```

Penolakan wajib menyertakan catatan:

```json
{
  "catatan_verifikasi": "Berat gabah perlu dikonfirmasi."
}
```

Saat admin menyetujui atau menolak data, server mengisi `verified_by`, `verified_at`, dan `synced_at`. PPL menerima status terbaru pada sync berikutnya.

## Rekap kecamatan

```http
GET /api/rekap/kecamatan
```

Query parameter:

```text
musim_tanam_id=uuid-musim-tanam
tahun=2026
```

Rekap hanya menghitung data dengan:

- `status = verified`;
- `deleted = false`.

Field response:

| Field | Keterangan |
| --- | --- |
| `jumlah_sampel` | Jumlah record provitas terverifikasi |
| `provitas_rata` | Rata-rata `provitas_kuha` |
| `provitas_tertimbang` | `SUM(berat_gabah_kg) / SUM(luas_petak_m2) * 100` |
| `luas_tanam_ha` | Total luas tanam terverifikasi |
| `luas_panen_ha` | Total luas panen terverifikasi |
| `produksi_ton` | `luas_panen_ha * provitas_rata / 10` |

## CRUD master data admin

Semua endpoint berikut membutuhkan token admin:

```text
GET|POST        /api/users
GET|PUT|PATCH|DELETE /api/users/{id}

GET|POST        /api/kecamatan
GET|PUT|PATCH|DELETE /api/kecamatan/{id}

GET|POST        /api/desa
GET|PUT|PATCH|DELETE /api/desa/{id}

GET|POST        /api/lahan
GET|PUT|PATCH|DELETE /api/lahan/{id}

GET|POST        /api/musim-tanam
GET|PUT|PATCH|DELETE /api/musim-tanam/{id}

GET|POST        /api/penugasan
GET|PUT|PATCH|DELETE /api/penugasan/{id}
```

Endpoint index menggunakan pagination. Parameter `per_page` dapat digunakan untuk mengatur jumlah data per halaman.

Validasi penting:

- email, kode kecamatan, kode desa, dan kode sampel harus unik;
- user penugasan harus memiliki role `ppl`;
- `tanggal_selesai` tidak boleh lebih awal dari `tanggal_mulai`;
- penugasan aktif pada user dan kecamatan yang sama tidak boleh tumpang tindih.

## Contoh curl

### Login

Linux/macOS/Git Bash:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"ppl@sipadi.test","password":"password"}'
```

Windows PowerShell:

```powershell
curl.exe -X POST http://localhost:8000/api/login `
  -H "Accept: application/json" `
  -H "Content-Type: application/json" `
  -d '{"email":"ppl@sipadi.test","password":"password"}'
```

### Referensi

```bash
curl http://localhost:8000/api/referensi \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN"
```

### Sync provitas

```bash
curl -X POST http://localhost:8000/api/sync \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "provitas": [{
      "id": "11111111-1111-4111-8111-111111111111",
      "lahan_id": "UUID-LAHAN",
      "musim_tanam_id": "UUID-MUSIM",
      "tanggal_panen": "2026-05-01",
      "luas_petak_m2": 100,
      "berat_gabah_kg": 50,
      "kadar_air": 20,
      "catatan": null,
      "status": "submitted",
      "updated_at": "2026-05-01T10:00:00Z",
      "deleted": false
    }],
    "luas_areal": [],
    "last_sync": null
  }'
```

## Testing

Jalankan seluruh test:

```bash
php artisan test
```

Jalankan test API saja:

```bash
php artisan test --filter=ApiTest
```

Test mencakup:

- login benar dan salah;
- pembatasan referensi berdasarkan wilayah PPL;
- penolakan sync di luar wilayah;
- idempotensi UUID client;
- perhitungan ulang provitas di server;
- perlindungan record terverifikasi;
- pembatasan akses route admin.

## CORS

Origin PWA development yang diizinkan:

```text
http://localhost:5173
```

Konfigurasi berada di `config/cors.php`. Jika frontend development memakai origin lain, ubah `allowed_origins` sebelum menjalankan aplikasi.

## Struktur data sinkronisasi

### Provitas

- ID dibuat client dengan `crypto.randomUUID()`.
- Unique: `lahan_id + musim_tanam_id + tanggal_panen`.
- Timestamp `updated_at` berasal dari client.
- `synced_at` berasal dari server.

### Luas areal

- ID dibuat client dengan `crypto.randomUUID()`.
- Unique: `desa_id + tahun + bulan`.
- Timestamp `updated_at` berasal dari client.
- `synced_at` berasal dari server.

Client wajib mempertahankan UUID record yang sama ketika melakukan retry. Jangan membuat UUID baru untuk data yang gagal dikirim karena server menggunakan UUID tersebut untuk idempotensi.
