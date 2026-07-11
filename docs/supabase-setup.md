# Supabase Setup Guide — Life OS

## Quick Start

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → Sign up / Sign in
2. Klik **New Project**
3. Pilih Organization (buat baru jika belum ada)
4. Isi detail:
   - **Name**: `life-os`
   - **Database Password**: buat password yang kuat (simpan!)
   - **Region**: Pilih **Southeast Asia (Singapore)** untuk latency terbaik dari Indonesia
5. Klik **Create new project**
6. Tunggu ~2 menit sampai project selesai provisioning

### 2. Dapatkan API Keys

1. Di dashboard project, buka **Settings** → **API**
2. Copy dua value ini:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (panjang)

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project Life OS:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> ⚠️ File `.env.local` sudah termasuk di `.gitignore` — aman, tidak akan ter-push ke repository.

### 4. Jalankan Migration SQL

1. Di dashboard Supabase, buka **SQL Editor**
2. Klik **New query**
3. Copy-paste seluruh isi file `supabase/migrations/001_initial_schema.sql`
4. Klik **Run** (⌘/Ctrl + Enter)
5. Harus muncul "Success. No rows returned" — artinya semua 18 tabel berhasil dibuat

### 5. Verifikasi Tabel

1. Buka **Table Editor** di sidebar Supabase
2. Pastikan kamu melihat tabel-tabel ini:
   - `users`, `ideas`, `journals`, `next_day_plans`
   - `projects`, `tasks`, `goals`
   - `habits`, `habit_logs`
   - `learning_sessions`
   - `health_profiles`, `weight_logs`, `meals`
   - `workouts`, `workout_exercises`, `workout_sets`
   - `work_applications`, `reviews`

### 6. Test Koneksi

```bash
npm run dev
```

Buka halaman Settings di Life OS — status koneksi Supabase harus menunjukkan **"Terhubung"**.

---

## Row Level Security (RLS)

Schema sudah mengaktifkan RLS di semua tabel. Setiap user hanya bisa mengakses data miliknya sendiri.

Untuk development/testing tanpa auth, kamu bisa sementara disable RLS:

```sql
-- HANYA untuk development! Jangan di production!
ALTER TABLE ideas DISABLE ROW LEVEL SECURITY;
-- ... ulangi untuk tabel lain
```

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "relation does not exist" | Migration SQL belum dijalankan. Jalankan di SQL Editor. |
| "new row violates RLS" | Pastikan `user_id` terisi dengan `auth.uid()` atau disable RLS untuk testing. |
| Data tidak muncul | Periksa `.env.local` — URL dan key harus benar. Restart `npm run dev`. |
| "Failed to fetch" | Periksa apakah Supabase project sudah selesai provisioning. |
