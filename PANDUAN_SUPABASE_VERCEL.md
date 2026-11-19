# Panduan Deploy ke Supabase + Vercel

Aplikasi ini sudah mendukung **mode ganda**:
- **Mode Lokal (AI Studio / Dev)**: menyimpan ke folder `data/` + WebSocket `/ws`.
- **Mode Produksi (Vercel + Supabase)**: otomatis aktif jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` diisi, menggunakan PostgreSQL Supabase + Vercel Serverless Functions + Supabase Realtime.

---

## Langkah 1: Siapkan Database di Supabase
1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor → New query**, salin seluruh isi file `supabase/schema.sql`, lalu klik **Run**.
3. Buka **Project Settings → API**, catat:
   - **Project URL** (`SUPABASE_URL` dan `VITE_SUPABASE_URL`)
   - **`anon` `public` key** (`VITE_SUPABASE_ANON_KEY`)
   - **`service_role` `secret` key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

## Langkah 2: Deploy ke Vercel
1. Push repository ini ke **GitHub** (atau GitLab/Bitbucket).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repository Anda.
3. Pastikan pengaturan build:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Tambahkan **Environment Variables** di pengaturan Vercel:
   - `SUPABASE_URL` = URL project Supabase Anda
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key Supabase Anda
   - `AUTH_SECRET` = string acak panjang (minimal 32 karakter) untuk keamanan token login
   - `VITE_SUPABASE_URL` = URL project Supabase Anda (untuk Realtime di browser)
   - `VITE_SUPABASE_ANON_KEY` = anon key Supabase Anda (untuk Realtime di browser)
5. Klik **Deploy**.

---

## Akun Bawaan Saat Pertama Kali Jalan
Saat aplikasi pertama kali diakses di Vercel, data awal dan akun bawaan akan otomatis dibuat ke tabel Supabase:
- **Superadmin**: `superadmin` / `superadmin123`
- **Pengurus**: `pengurus1` / `pengurus123`

> Segera masuk sebagai **Superadmin** untuk mengganti password bawaan, menambah akun pengurus, dan mengatur judul web serta identitas wilayah RT/RW.
