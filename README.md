# Web RT: Portal Warga & SIM Pengurus

Aplikasi Next.js 14 (App Router) + Postgres (Drizzle ORM) + Vercel Blob, siap dipasang di Vercel.

## Isi aplikasi

**Publik (warga, tanpa login)**
- Beranda dengan hero slide, berita & kegiatan warga, halaman Pengurus RT, tautan Instagram & YouTube
- Laporan keuangan per bulan untuk tiap bidang (bawaan: Kas RT, Dasawisma 1-4, Tahlil, SDM, PKK, Masjid; admin bisa menambah): pemasukan, pengeluaran, saldo akhir, dan keterangan. Bidang yang belum ada transaksi bulan itu tampil "belum melapor"
- Form usulan, kode lacak, dan halaman progres tahapan (Diterima → Dibahas → Disetujui → Dikerjakan → Selesai)

**SIM pengurus (wajib login, di `/pengurus`)**
- Dasbor ringkasan
- Kelola berita, input keuangan per lini, proses usulan (ubah tahapan + catatan)
- Susunan pengurus RT (tampil di halaman publik `/struktur` dan beranda)
- Data penduduk: nama, No. KK, NIK, status (tetap / kontrak / kos)
- Arsip digital: surat masuk, surat keluar, notulen, berita acara, perjanjian, proposal, dokumen lain (unggah PDF/foto/Word/Excel, cari & filter)
- Akun & peran (khusus **superadmin**): buat akun, ubah username, kata sandi, nama, jabatan, peran, aktif/nonaktif

## Hak akses per peran

| Modul | Superadmin | Ketua | Sekretaris | Bendahara | Anggota/Seksi |
|---|---|---|---|---|---|
| Berita | ubah | ubah | ubah | lihat | ubah |
| Keuangan | ubah | ubah | lihat | ubah | lihat |
| Usulan | ubah | ubah | ubah | lihat | lihat |
| Data penduduk | ubah | ubah | ubah | tidak ada akses | tidak ada akses |
| Arsip | ubah | ubah | ubah | lihat | lihat |
| Susunan pengurus | ubah | ubah | ubah | lihat | lihat |
| Bidang keuangan & keterangan laporan | ubah | ubah | lihat | ubah | lihat |
| Akun & peran | ubah | tidak ada akses | tidak ada akses | tidak ada akses | tidak ada akses |

Aturan ini ada di `src/lib/refs.ts` (`READ_ACCESS` dan `WRITE_ACCESS`) dan bisa diubah sesuai kebutuhan.

## Keamanan yang sudah diterapkan

- Semua `/pengurus/*` dikunci middleware, dan **setiap halaman serta aksi server memeriksa ulang** sesi dan peran ke database (akun yang dinonaktifkan langsung kehilangan akses).
- Sandi di-hash bcrypt; sesi berupa cookie `httpOnly`, `secure`, `sameSite=lax`, berlaku 8 jam.
- Pembatasan percobaan login (5 kali, kunci 10 menit).
- **NIK dan No. KK dienkripsi AES-256-GCM** di database dan hanya tampil tersamar di daftar.
- Unduhan arsip hanya lewat rute terautentikasi.
- Halaman publik tidak menampilkan nama atau kontak pengusul.

## Memasang di Vercel

### 1. Siapkan database Postgres
Di dasbor Vercel buka **Storage** lalu buat database Postgres (Neon) dan hubungkan ke proyek. Cara ini mengisi `DATABASE_URL` otomatis (atau salin connection string-nya sendiri).

### 2. Siapkan Vercel Blob (untuk arsip)
Di **Storage** buat **Blob store** dan hubungkan ke proyek. `BLOB_READ_WRITE_TOKEN` terisi otomatis.

### 3. Isi Environment Variables
Di **Project Settings → Environment Variables**:

| Nama | Cara membuat |
|---|---|
| `DATABASE_URL` | dari database di langkah 1 |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `DATA_KEY` | `openssl rand -hex 32` (64 karakter hex) |
| `BLOB_READ_WRITE_TOKEN` | dari langkah 2 |

> **Simpan cadangan `DATA_KEY` di tempat aman.** Jika hilang, NIK dan No. KK yang sudah tersimpan tidak bisa dibuka lagi.

### 4. Buat tabel dan akun superadmin (dijalankan sekali dari komputer Anda)
```bash
npm install
cp .env.example .env.local     # isi DATABASE_URL dan SEED_ADMIN_PASSWORD (username default: admin) (min. 10 karakter)
npx dotenv -e .env.local -- npm run db:push
npx dotenv -e .env.local -- npm run db:seed
```
(Alternatif tanpa `dotenv-cli`: ekspor variabelnya di terminal, mis. `export DATABASE_URL=...`, lalu jalankan `npm run db:push` dan `npm run db:seed`. File SQL awal juga tersedia di `drizzle/0000_init.sql` jika ingin dijalankan manual di editor SQL.)

### 5. Deploy
Unggah proyek ke GitHub lalu impor ke Vercel (atau jalankan `vercel` dari folder ini). Setelah live, buka `/pengurus/login`, masuk sebagai superadmin, lalu buat akun ketua, sekretaris, bendahara, dan pengurus lain di menu **Akun & Peran**. Isi tampilan pengurus di situs warga lewat menu **Susunan Pengurus**.

## Pengembangan lokal
```bash
npm install
cp .env.example .env.local   # isi semua variabel
npm run db:push && npm run db:seed
npm run dev
```

## Catatan & batasan
- Ukuran file arsip maksimal **4 MB** (batas unggah Vercel Functions). Untuk scan yang lebih besar, kompres dulu.
- File arsip disimpan di Vercel Blob dengan alamat acak yang tidak dapat ditebak dan hanya dibagikan lewat rute terautentikasi, tetapi Blob bersifat publik secara teknis bagi siapa pun yang tahu alamat persisnya. Jangan unggah dokumen yang membutuhkan kerahasiaan tingkat tinggi tanpa menambah lapisan proteksi.
- Pembatas login dan pembatas usulan bersifat per instance server. Untuk perlindungan yang lebih kuat, aktifkan Vercel Firewall / rate limiting.
- Data penduduk berisi data pribadi (NIK, KK). Batasi akun yang diberi peran Ketua/Sekretaris, dan pastikan pengurus memahami tanggung jawab menjaga data warga.
- Fitur belum ada: ekspor laporan ke PDF/Excel, pencarian berdasarkan NIK/KK (karena terenkripsi), dan unggah foto pada berita. Semua bisa ditambahkan berikutnya.

## Tautan media sosial
Isi `NEXT_PUBLIC_INSTAGRAM_URL` dan `NEXT_PUBLIC_YOUTUBE_URL` (mis. `https://instagram.com/akun_rt`) di Environment Variables. Ikonnya muncul di footer; jika dikosongkan, ikon tidak ditampilkan. Setelah mengubah variabel ini, deploy ulang.

## Mengubah isi hero slide
Teks, tombol, dan warna slide ada di array `SLIDES` pada `src/app/(public)/page.tsx`. Slide memakai gradien CSS (tanpa gambar) agar ringan; untuk memakai foto, letakkan file di `public/hero/` lalu isi `image: "/hero/nama-file.jpg"` pada slide tersebut.

## Memperbarui database yang sudah berjalan
Perubahan ini menambah tabel `officers`. Jalankan `npm run db:push` (atau jalankan `drizzle/0001_officers.sql`). Akun lama berperan ketua tetap berfungsi; untuk membuat superadmin, jalankan `npm run db:seed` dengan `SEED_ADMIN_USERNAME` dan `SEED_ADMIN_PASSWORD` baru.

## Bidang keuangan & keterangan laporan
- Menu **Keuangan → Kelola bidang** (superadmin, ketua, bendahara): tambah bidang baru (mis. Posyandu), ubah nama/urutan, atau nonaktifkan. Bidang nonaktif hilang dari situs warga dan pilihan transaksi, tetapi riwayatnya tetap tersimpan.
- Di halaman **Keuangan**, pilih bidang dan bulan, lalu isi **Keterangan laporan untuk warga**. Teks itu tampil di bawah angka bidang tersebut pada halaman Laporan Keuangan.
- Sebuah bidang dianggap "sudah melapor" jika ada minimal satu transaksi bertanggal di bulan itu.
- Setelah memperbarui, jalankan `npm run db:push` (atau `drizzle/0002_bidang_notes.sql`). Bidang bawaan terisi otomatis saat halaman pertama kali dibuka.
