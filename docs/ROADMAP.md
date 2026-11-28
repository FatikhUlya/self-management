# Roadmap: Life OS × Personal Life Journal

Tujuan: semua lembar di *Personal Life Journal (A5, 28 lembar)* punya padanan digital yang lebih mudah dari kertas, di desktop dan mobile. Setiap fitur mengikuti [STYLE_GUIDE.md](STYLE_GUIDE.md).

## 1. Peta lembar kertas → aplikasi

Status: ✅ ada. Ke-28 lembar sudah punya padanan.

| No | Lembar | Di aplikasi | Status | Sisa celah |
|---|---|---|---|---|
| 01 | Personal Profile & Life Vision | Target › Kompas (visi, misi, nilai, definisi sukses, kontribusi) | ✅ | — |
| 02 | Annual Goals & Key Results | Target › Goals Tahunan (`/goals/annual`) | ✅ | — |
| 03 | Quarterly Reset | Review › Bulanan & Kuartalan (`/reviews/period`) | ✅ | — |
| 04 | Principles & Decision Log | Prinsip + Log Keputusan (`/rules/decisions`) | ✅ | — |
| 05 | Monthly Overview | Rencana › Planner Bulanan (`/planning/month`) | ✅ | — |
| 06 | Weekly Planner | Planner › tampilan Minggu + target mingguan | ✅ | — |
| 07 | Daily Plan & Time Blocking | Rencana + Timeline + cek ibadah 5 waktu di Beranda | ✅ | — |
| 08 | Brain Dump & Master Task List | Tangkap + Tugas | ✅ | — |
| 09 | Project Planner | Proyek + Milestone (`/projects/milestones`) | ✅ | — |
| 10 | Daily Reflection & Gratitude | Jurnal + "hal yang menguras energi" | ✅ | — |
| 11 | Weekly Review | Review (mingguan) | ✅ | — |
| 12 | Monthly Review | Review › Bulanan (Hentikan / Lanjutkan / Mulai) | ✅ | — |
| 13 | Monthly Habit Tracker | Habit › Kalender + Analitik per periode | ✅ | — |
| 14 | Mood & Energy Log | Jurnal (mood, energi, pemicu stres, yang membantu) | ✅ | — |
| 15 | Lessons Learned & Debrief | Review › Pelajaran & Debrief (`/reviews/lessons`) | ✅ | — |
| 16 | Workout Log | Kesehatan › Workout | ✅ | — |
| 17 | Body Progress Tracker | Kesehatan › Progres Tubuh (`/health/body`) | ✅ | — |
| 18 | Nutrition & Meal Log | Kesehatan › Nutrisi + air minum | ✅ | — |
| 19 | Fitness Monthly Review | Laporan (periode bulan) | ✅ | — |
| 20 | Career Roadmap | Karier › Peta Karier (`/work/roadmap`) | ✅ | — |
| 21 | Job Application Tracker | Karier | ✅ | — |
| 22 | Work & Site Visit Notes | Karier › Kunjungan Lapangan (`/work/visits`) | ✅ | — |
| 23 | Portfolio Case Study | Karier › Studi Kasus (`/work/portfolio`) | ✅ | — |
| 24 | Meeting & Feedback Notes | Karier › Rapat & Feedback (`/work/meetings`) + Cermin › Feedback 360 | ✅ | — |
| 25 | Monthly Budget & Expense Log | Keuangan › Anggaran Bulanan (`/finance/budget`) | ✅ | — |
| 26 | Wishlist & Purchase Decision | Keuangan › Wishlist | ✅ | — |
| 27 | Reading & Knowledge Notes | Belajar › Catatan Bacaan (`/learning/reading`) + Sesi (Cornell) | ✅ | — |
| 28 | Free Notes & Idea Capture | Tangkap | ✅ | — |

## 2. Fase

### Fase 1: fondasi jangka panjang ✅
Navigasi periode, Laporan, Goals Tahunan berjenjang, Planner Bulanan, Wishlist, link subhalaman desktop, Refleksi Jurnal sebagai subhalaman di mobile.

### Fase 2: mobile bersih + laporan di semua modul ✅
- Hub mobile Keuangan, Kesehatan, Belajar, Review: ringkasan + menu subhalaman; tab hanya di desktop.
- Navigator periode di Keuangan (minggu–tahun), Analitik Habit, Anggaran, Evaluasi.
- Evaluasi bulanan & kuartalan, Anggaran bulanan, air minum, ibadah 5 waktu, log keputusan, energi & stres di jurnal, Planner mingguan.

### Fase 3: karier & catatan ✅
Peta Karier, Kunjungan Lapangan, Studi Kasus, Rapat & Feedback, Pelajaran & Debrief, Progres Tubuh (lingkar + foto). Semua memakai `RecordBook` (STYLE_GUIDE §4.16).

### Fase 4: data saling tertaut ✅
Lembar 01, 09, 27 dan hub mobile Habit, Proyek, Karier selesai. Data yang dulu berdiri sendiri sekarang tersambung:

| Dari | Ke | Cara kerja |
|---|---|---|
| Target harian Goals Tahunan | Tugas | "Jadikan tugas" menyimpan `task_id`. Centang di salah satu sisi ikut mencentang sisi lain (`LinkSync` di layout). Tugas yang dihapus melepas tautannya. |
| Tindak lanjut di catatan (rapat, kunjungan, debrief, peta karier, milestone, bacaan) | Tugas | Tiap baris jadi tugas, masuk ke proyek yang dipilih di catatan. Catatan menampilkan centang per baris dan "x/y tugas selesai". |
| Progres Tubuh (berat) | Log berat | Disimpan per tanggal; terbaca di Metrik, TDEE, Beranda, Laporan. |
| Catatan Bacaan (menit) | Sesi belajar | Satu sesi per catatan; ikut statistik Belajar dan Laporan. |
| Wishlist "Sudah dibeli" | Transaksi | Opsional, dengan harga nyata, akun, dan tanggal; ikut Anggaran dan Laporan. |
| Log Keputusan | Prinsip | Field prinsip memilih dari daftar Prinsip. |
| Peta Karier | Goals Tahunan | Milestone memilih goal kategori Karier (prioritas ditandai ★). |
| Kunjungan, Studi Kasus, Rapat, Debrief, Milestone | Proyek | Field proyek; Milestone dikelompokkan per proyek. |
| Visi & Misi | Akun | Dulu hanya di browser, sekarang record `profile`; nilai lama tetap tampil sampai disimpan ulang. |
| Cek harian, evaluasi periode, buku catatan, anggaran | Laporan | Kartu air minum, ibadah, anggaran terpakai, jumlah catatan; evaluasi periode ikut hitungan Review. |

## 3. Catatan teknis
- Fitur baru menyimpan data lewat `useCollection` (`src/lib/hooks/useCollection.ts`): Supabase saat login, `localStorage` di mode lokal. Opsi `kind` menyaring satu jenis catatan di tabel bersama.
- Migration yang perlu dijalankan di SQL Editor, berurutan: `024_life_journal.sql` (goals tahunan, target, wishlist), `025_life_records.sql` (buku catatan, evaluasi periode, cek harian), `026_linked_records.sql` (tautan target → tugas, jenis catatan profil/milestone/bacaan).
- `addTask` mengembalikan id tugas baru supaya fitur lain bisa menautkannya.
- Foto progres disimpan sebagai JPEG kecil di kolom `data`. Di mode lokal kuota browser ±5 MB, jadi foto paling nyaman dipakai saat login Supabase.
