# Life OS — Style Guide

Arah visual: **"Scarlet"**: dashboard fintech yang terang, tenang, dan presisi.
Referensi: *Scarlet — AI Agent Finance SaaS Dashboard* (Anna Bogach, Behance), dipakai sebagai inspirasi gaya, bukan disalin.

Dokumen ini adalah satu-satunya sumber aturan UI. Kalau sebuah halaman terlihat berbeda dari aturan di sini, halamannya yang salah, bukan aturannya. Kalau aturan perlu diubah, ubah dokumen ini dulu, lalu token di [`tailwind.config.ts`](../tailwind.config.ts) dan [`src/app/globals.css`](../src/app/globals.css).

---

## 1. Prinsip

1. **Satu bahasa visual, dua cara pakai.** Desktop adalah *dashboard*: padat, banyak kartu berdampingan, sidebar. Mobile adalah *aplikasi*: satu kolom, navigasi bawah, aksi di jangkauan jempol. Warna, font, dan bentuk sama; tata letak dan interaksinya berbeda.
2. **Angka adalah pahlawan.** Angka besar berbobot tipis (Outfit 300), unit kecil di sebelahnya (`12,720 USDC`, `2.140 kkal`). Label kecil di atasnya, keterangan abu-abu di bawahnya.
3. **Biru hanya untuk satu hal per layar.** Kartu hero biru gradien dipakai untuk satu metrik terpenting di halaman ringkasan modul. Sisanya putih.
4. **Aksi utama = pil hitam.** Satu tombol hitam per area. Tombol lain putih bergaris atau ghost.
5. **Lembut, bukan datar.** Kartu putih, sudut besar (20–24px), bayangan sangat halus, latar abu kebiruan dengan pendar biru samar.
6. **Tidak ada pengecualian per halaman.** Halaman tidak boleh menulis warna hex, gradien, bayangan, atau tombol sendiri. Pakai token dan komponen.

---

## 2. Token

Semua nilai di bawah sudah ada sebagai CSS variable dan class Tailwind. Jangan menulis nilai mentah.

### 2.1 Warna

| Peran | Token / class | Terang | Gelap | Pakai untuk |
|---|---|---|---|---|
| Latar halaman | `bg-background` | `#F3F5F8` + pendar biru | `#070B14` + pendar biru | `<body>` saja |
| Permukaan | `bg-card` | `#FFFFFF` | `#0E1422` | Kartu, sheet, popover |
| Permukaan 2 | `bg-muted` / `bg-secondary` | `#F1F3F6` | `#151C2C` | Isi di dalam kartu, track progress, input |
| Garis | `border-border` | `#E6E9EF` | `#1F2839` | Pemisah tabel, outline tombol |
| Teks utama | `text-foreground` | `#0E1116` | `#EEF2F8` | Judul, angka, isi |
| Teks sekunder | `text-muted-foreground` | `#667085` (4.8:1) | `#94A0B8` | Label, keterangan, placeholder |
| Aksi utama | `bg-primary` | `#0E1116` hitam | `#F5F7FA` putih | Tombol utama, item nav aktif, toggle aktif |
| Aksen | `text-ink` / `bg-ink` / `blue-*` | `#0A66E8` | `#5CA0FF` | Link, angka penting, chart, fokus |
| Hero | `.card-hero` | gradien `#2F83FF → #8CBEFF` | gradien `#0A66E8 → #0B2349` | **Satu** kartu metrik utama per halaman |
| Sukses | `success` / `green-*` | `#039855` | `#32D583` | Selesai, aktif, pemasukan |
| Peringatan | `warning` / `amber-*` | `#DC6803` | `#FDB022` | Tertunda, mendekati batas |
| Bahaya | `destructive` / `red-*` | `#D92D20` | `#F97066` | Gagal, pengeluaran, hapus |

**Keluarga warna lama tetap jalan.** `indigo`, `violet`, `purple`, `sky`, `cyan` dipetakan ke biru; `emerald`, `teal`, `lime` ke hijau; `rose`, `pink` ke merah; `orange`, `yellow` ke kuning; semua abu (`zinc`, `slate`, `gray`, `neutral`, `stone`) ke satu ramp abu kebiruan. Untuk kode baru, pakai token semantik di tabel atas.

**Dilarang:**
- `#hex` di className. Pengecualian: stop gradien SVG di grafik (`#2f83ff`).
- `bg-gradient-*` selain `.card-hero`. Pengecualian: scrim gelap di atas foto (`from-black/60`).
- `bg-white` / `bg-black` sebagai permukaan. Pakai `bg-card` / `bg-primary`.
- `text-white` di atas `bg-primary`, karena di mode gelap primary berwarna putih. Pakai `text-primary-foreground`. `text-white` hanya boleh di atas isian warna solid (`bg-success`, `bg-red-500`, kartu hero, foto).
- Teks berwarna `-200/-300/-400` tanpa pasangan `dark:`, karena kontrasnya di bawah 4.5:1 di latar putih. Pakai `text-{warna}-700 dark:text-{warna}-300`.
- Ungu/pink sebagai identitas fitur, dan `font-mono` untuk angka (pakai `tabular-nums`).

### 2.2 Tipografi

| Font | Variable | Untuk |
|---|---|---|
| **Outfit** | `font-display` | Judul halaman, judul kartu, semua angka metrik |
| **Inter** | `font-sans` (default) | Teks isi, label, input, tombol, tabel |

| Gaya | Class | Mobile | Desktop | Bobot |
|---|---|---|---|---|
| Judul halaman | `.page-title` | 28/34 | 34/40 | Outfit 400 |
| Angka hero | `.figure-hero` | 44/48 | 56/60 | Outfit 300 |
| Angka metrik | `.figure-lg` | 32/36 | 36/40 | Outfit 300 |
| Judul seksi/kartu | `.section-title` | 16/22 | 15/22 | Outfit 500 |
| Isi | `text-sm` / `text-base` | 15–16 | 14 | Inter 400 |
| Label | `.label` | 13 | 12 | Inter 500, abu |
| Keterangan | `text-xs text-muted-foreground` | 12 | 12 | Inter 400 |

- Ukuran minimum teks: **12px**. Tidak ada `text-[10px]` atau `text-[11px]` untuk teks yang perlu dibaca.
- Tidak ada huruf kapital semua + letter-spacing lebar untuk label.
- Bobot maksimal 600. Tidak ada `font-bold`/`font-black`.
- Angka selalu `tabular-nums` (sudah otomatis di `.figure-*`).
- Unit di samping angka: `<span class="unit">kkal</span>` (ukuran 40% angka, abu).

### 2.3 Radius

| Token | Nilai | Untuk |
|---|---|---|
| `rounded-full` | 9999px | Tombol, chip, badge, tab, nav item, avatar, input pencarian |
| `rounded-3xl` | 28px | Bottom sheet (sudut atas), kartu hero |
| `rounded-2xl` | 24px | Kartu besar desktop, modal |
| `rounded-xl` | 20px | Kartu standar (`Surface`) |
| `rounded-lg` | 14px | Input, select, textarea, sel kalender, item list di dalam kartu |
| `rounded-md` | 10px | Ikon tile kecil, thumbnail |

### 2.4 Bayangan & kedalaman

| Token | Untuk |
|---|---|
| `shadow-card` | Semua kartu (`.glass`, `Surface`). Sangat halus. |
| `shadow-float` | Elemen mengambang: nav bawah mobile, dropdown, popover, toast |
| `shadow-sheet` | Modal dan bottom sheet |

Kedalaman di mode gelap dibentuk oleh garis 1px (`border-border`), bukan bayangan.

### 2.5 Jarak (grid 4px)

| Konteks | Mobile | Desktop |
|---|---|---|
| Padding tepi halaman | 16px (`px-4`) | 32px (`px-8`) |
| Jarak antar kartu | 12px (`gap-3`) | 20px (`gap-5`) |
| Jarak antar seksi | 24px (`space-y-6`) | 28px (`space-y-7`) |
| Padding kartu | 16px (`p-4`) | 20–24px (`p-5`/`p-6`) |
| Lebar konten maksimum | penuh | 1280px (`max-w-7xl`) |

### 2.6 Gerak

- Durasi 150–200ms, satu kurva `--ease` (`cubic-bezier(0.22,1,0.36,1)`).
- Tidak ada animasi berulang (pulse, bounce, spin dekoratif), kecuali indikator loading.
- `prefers-reduced-motion` mematikan semua transisi (sudah global).
- Tombol menekan `scale(0.98)`; kartu tidak bergerak saat hover, cukup garis/bayangan sedikit lebih kuat.

---

## 3. Tata letak

### 3.1 Desktop (≥ 768px): dashboard

```
┌──────────────┬───────────────────────────────────────────────────────┐
│ ● Life OS    │  Beranda › Keuangan            [Sel 28 Nov] ● ◐ ID    │ ← Topbar transparan
│              │                                                       │
│ ▣ Beranda    │  Keuangan                             [Aksi] [● Utama]│ ← PageHeader
│ ▣ Rencana  3 │  Kendali arus kas harian.                             │
│ ▣ Proyek     │  ( Ringkasan | Buku besar | Kekayaan | Target )       │ ← Tabs (segmented)
│ ...          │  ┌─────── hero biru ───────┐ ┌──────┐ ┌──────┐        │
│              │  │ Saldo  12.720.000 Rp    │ │  02  │ │  03  │        │ ← Metrik
│              │  └─────────────────────────┘ └──────┘ └──────┘        │
│ ⚙ Pengaturan │  ┌──────────── grafik ──────────┐ ┌── panel aksi ──┐  │
│ (A) akun   › │  └──────────────────────────────┘ └────────────────┘  │
└──────────────┴───────────────────────────────────────────────────────┘
```

- **Sidebar** 248px, menempel, menyatu dengan latar (tanpa kartu). Item nav tinggi 40px, `rounded-full`. Aktif = pil hitam (`bg-primary text-primary-foreground`). Hitungan = badge pil biru muda. Seksi dipisah label kecil abu. Akun di bawah sebagai kartu pil putih.
- **Topbar** transparan, tanpa garis: breadcrumb kiri; tanggal, status sinkron, tema, bahasa di kanan sebagai chip pil putih.
- **Konten** maks 1280px. Grid 12 kolom: hero 6–8 kolom + 2 kartu metrik; panel aksi/approval di kolom kanan 4 kolom.

### 3.2 Mobile (< 768px): aplikasi

```
┌─────────────────────────────┐
│ ● Life OS       [📅] [ + ]  │ ← AppBar 56px (logo/judul, tanggal, tambah cepat)
│                             │
│ ‹  Keuangan                 │ ← Judul besar 28px (+ tombol kembali di subhalaman)
│    Kendali arus kas.        │
│ (Ringkasan)(Buku)(Kekayaan)→│ ← Chip tab, geser horizontal, sticky
│ ┌─────── hero biru ───────┐ │
│ │ 12.720.000 Rp           │ │
│ └─────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐   │ ← Metrik 2 kolom
│ └──────────┘ └──────────┘   │
│ ┌─────────────────────────┐ │ ← Satu kolom, kartu bertumpuk
│ └─────────────────────────┘ │
│                             │
│  ╭───────────────────────╮  │
│  │(● Beranda) ▣  ▣  ▣  ☰ │  │ ← Nav bawah mengambang, pil
│  ╰───────────────────────╯  │
└─────────────────────────────┘
```

Perbedaan wajib dengan desktop:

| Aspek | Desktop | Mobile |
|---|---|---|
| Navigasi utama | Sidebar | Nav bawah mengambang (4 modul + Menu) |
| Semua modul | Sidebar | Sheet "Menu" layar penuh, petak 3 kolom berlabel |
| Utilitas (tanggal, tema, bahasa) | Topbar | Tanggal di AppBar; tema & bahasa di sheet Menu |
| Judul | Di PageHeader dengan aksi di kanan | Judul besar; aksi turun ke bawah judul, lebar penuh |
| Tab modul | Segmented control | Chip geser horizontal, sticky di bawah AppBar |
| Grid kartu | 2–4 kolom | 1 kolom (metrik boleh 2 kolom) |
| Modal | Dialog di tengah | Bottom sheet dari bawah, ada pegangan |
| Tabel | Tabel penuh | Kartu list, atau tabel geser horizontal dengan kolom pertama tetap |
| Hover | Ada | Tidak ada; umpan balik lewat `:active` |
| Ukuran sentuh | 32–40px | **Minimum 44px**, tombol utama 48px |
| Teks input | 14px | **16px** (mencegah zoom iOS) |

### 3.3 Aksesibilitas mobile (wajib)

- Target sentuh ≥ 44×44px, jarak antar target ≥ 8px.
- Aksi utama ada di sepertiga bawah layar atau tepat di bawah judul. Form panjang: tombol simpan lebar penuh di akhir form.
- Konten tidak tertutup nav bawah: `<main>` punya padding bawah `calc(88px + safe-area)`.
- Hormati `env(safe-area-inset-*)` di AppBar, nav bawah, dan sheet.
- Setiap tombol ikon punya `aria-label`. Item nav aktif punya `aria-current="page"`.
- Sheet dan modal: fokus terkunci di dalam, tutup dengan Escape/geser/ketuk latar, fokus kembali ke pemicu.
- Kontras teks ≥ 4.5:1; teks di atas kartu hero selalu putih penuh.
- Tidak ada informasi yang hanya disampaikan lewat warna: status selalu titik + teks.
- Zoom browser tidak dikunci.

---

## 4. Komponen

Semua komponen ada di `src/components/ui` dan `src/components/layout`. Halaman **hanya** menyusun komponen ini.

### 4.1 PageHeader (`components/layout/PageHeader.tsx`)
Dipakai di **setiap** halaman, satu kali. Halaman lama memakai versi class yang hasilnya sama:

```tsx
<div className="page-header">                 {/* kolom di mobile, baris di desktop */}
  <div className="page-header-title">         {/* tombol kembali + judul */}
    <Link href="/induk" className="icon-btn" aria-label="Kembali">…</Link>
    <div><h1 className="page-title">…</h1><p className="page-subtitle">…</p></div>
  </div>
  <div>{/* aksi */}</div>
</div>
```

- Props: `title`, `subtitle?`, `back?` (href kembali, untuk subhalaman), `actions?` (tombol), `stamp?` (tanggal operasional, default tampil di halaman modul utama).
- Desktop: judul + subjudul kiri, aksi kanan.
- Mobile: tombol kembali 44px + judul besar; aksi turun ke baris sendiri, bisa digeser.

### 4.2 Tabs (`components/ui/SegmentedTabs.tsx`)
- Desktop: segmented control dalam pil putih; item aktif pil hitam; hitungan dalam badge.
- Mobile: chip geser horizontal, sticky.
- `role="tablist"`, `role="tab"`, `aria-selected`, panah kiri/kanan berpindah tab.
- Versi class: `<div role="tablist" className="seg">` berisi `<button role="tab" aria-selected={…} className="seg-item">`, hitungan di `<span className="seg-count">`.
- Tab hanya untuk berpindah tampilan. Pilihan berupa kartu dengan deskripsi (misalnya Mode Tampilan di Pengaturan) tetap kartu.

### 4.3 Kartu
| Varian | Class / komponen | Kapan |
|---|---|---|
| Standar | `Surface` / `.glass` | Semua kartu |
| Hero | `Surface variant="hero"` / `.card-hero` | Satu metrik terpenting per halaman ringkasan |
| Lembut | `Surface variant="soft"` / `.card-soft` | Metrik kedua yang perlu disorot (biru muda berpendar) |
| Gelap | `Surface variant="ink"` / `.card-ink` | Item terpilih/aktif di daftar (seperti "Waiting for you") |
| Isi dalam kartu | `.well` | Blok abu di dalam kartu (ringkasan angka, info) |

Anatomi kartu: header (ikon tile 32px abu + judul `.section-title` + aksi panah ↗ bulat di kanan) → isi → footer opsional (link "Lihat semua →").

### 4.4 MetricCard
Label (ikon kecil + teks) → angka `.figure-lg` + unit → keterangan/progress. Tombol panah bulat ↗ di pojok kanan atas kalau kartu bisa dibuka.

### 4.5 Tombol (`Button`)
| Varian | Tampilan | Kapan |
|---|---|---|
| `primary` | Pil hitam, teks putih | Aksi utama (maks 1 per area) |
| `secondary` / `outline` | Pil putih, garis | Aksi lain |
| `ghost` | Transparan | Aksi tersier, di dalam list |
| `destructive` | Pil merah | Hapus (selalu konfirmasi) |
| `icon` | Lingkaran 36px (desktop) / 44px (mobile) | Tombol ikon, wajib `aria-label` |

Ukuran: desktop 36px (`sm` 32px), mobile minimum 44px. Ikon 16px di kiri teks.

Tombol ikon kecil di dalam list (edit, hapus) memakai `.icon-btn`. Aksi yang muncul saat hover wajib tetap terlihat di mobile: `md:opacity-0 md:group-hover:opacity-100`, jangan `opacity-0` saja.

Tombol tidak boleh dibungkus `<Link>` (`<Link><button>` tidak valid dan membingungkan pembaca layar). Beri class tombol ke `<Link>` itu sendiri.

### 4.6 Badge / status
Pil kecil: titik 6px + teks 12px. `success` hijau muda, `warning` kuning muda, `destructive` merah muda, `info` biru muda, `neutral` abu. Badge hitungan di nav: pil biru muda, angka biru.

### 4.7 Input
- `glass-input`, `glass-select`, `Input`: tinggi 40px desktop / 48px mobile, `rounded-lg`, latar `bg-card`, garis 1px, fokus = garis biru + cincin 3px biru 15%.
- Label di atas (`.label`), keterangan/error di bawah (12px). Error: garis merah + teks merah + ikon.
- Pencarian: `rounded-full` dengan ikon kaca pembesar di kiri.
- Toggle: switch hitam (aktif) / abu (mati).

### 4.8 Tabel (`components/ui/table.tsx`)
- Header 12px abu, tanpa latar, garis bawah tipis. Baris 52px, pemisah garis tipis, hover `bg-muted/50`.
- Kolom angka rata kanan, `tabular-nums`. Status pakai Badge. Aksi baris = tombol ikon `⋯`.
- Mobile: bungkus dengan `.table-scroll`, atau ganti dengan list kartu.

### 4.9 Grafik
- Batang: biru muda `blue-200`, batang terpilih/hari ini `blue-500`, tooltip pil hitam.
- Garis: `blue-500` 2px, area gradien biru 12% → 0.
- Grid horizontal tipis putus-putus, tanpa garis vertikal. Label sumbu 12px abu.
- Pemasukan = hijau, pengeluaran = merah, hanya kalau maknanya memang itu.

### 4.10 Progress
- Bar: track `bg-muted` 6px, isi `bg-primary` (hitam) atau `bg-ink`. Di kartu hero: segmen putih tipis.
- Ring: track abu, isi biru.

### 4.11 Modal → Sheet (`Modal`, `dialog.tsx`)
- Desktop: dialog tengah, `rounded-2xl`, lebar 480–640px, latar gelap 40% + blur.
- Mobile: bottom sheet `rounded-t-3xl`, pegangan di atas, maks 90vh, isi bisa digulir, tombol aksi menempel di bawah.

### 4.12 Empty state
Ikon dalam lingkaran abu 48px, judul 15px, keterangan 13px abu, satu tombol `primary` atau `secondary`.

### 4.13 Navigasi
- Sidebar dan nav bawah dibangun dari `NAV_ITEMS` di `lib/constants.ts`. Modul baru cukup ditambah di sana.
- Nav bawah mobile: 4 modul paling sering (Beranda, Rencana, Proyek, Keuangan) + Menu.

### 4.14 Navigator periode (`components/ui/PeriodNavigator.tsx`)
- Pilihan Hari / Minggu / Bulan / Kuartal / Tahun (segmented), tombol ‹ ›, label periode, dan chip "Sekarang" saat tidak di periode berjalan.
- Batas kalender Masehi dari `lib/period.ts`: minggu Senin–Minggu, bulan sampai tanggal terakhir, kuartal Q1 Jan–Mar dst., tahun sampai 31 Desember. Jangan menghitung tanggal sendiri di halaman; pakai `getPeriod`, `shiftPeriod`, `inRange`, `childPeriods`.
- Dipakai di setiap laporan atau daftar yang bisa dilihat per periode.

### 4.15 Akses subhalaman (`components/ui/SubpageLinks.tsx`)
- Kartu besar berikon + judul + satu baris keterangan (angka hidup bila ada), tepat di bawah header halaman modul.
- Default: geser horizontal di mobile, satu baris kartu di desktop.
- `stacked`: daftar penuh satu kolom di mobile (menu hub), grid di desktop. `columns` mengatur jumlah kolom desktop.
- Di desktop hanya untuk subhalaman yang fiturnya **tidak** ada di tab halaman utama. Di mobile, menu `stacked` boleh memuat semua subhalaman karena tab disembunyikan.

### 4.16 Buku catatan (`components/records/RecordBook.tsx`)
- Satu komponen untuk semua lembar catatan terstruktur: Log Keputusan, Pelajaran & Debrief, Progres Tubuh, Peta Karier, Kunjungan Lapangan, Studi Kasus, Rapat & Feedback.
- Jenis catatan didefinisikan di `lib/recordKinds.ts` (judul, ikon, field, status, pengelompokan). Menambah lembar baru = menambah satu definisi + satu file route berisi `<RecordBook kind="…" />`, bukan membuat halaman baru dari nol.
- Susunan: PageHeader (back) → hero perubahan (hanya buku dengan angka) → cari + chip status → kartu (2 kolom desktop) → form di Modal/sheet.
- Field `lines` dengan `taskable` menampilkan tombol "Jadikan tugas hari ini". Foto dikecilkan ke JPEG ±720 px sebelum disimpan.
- Data disimpan di tabel `life_records` (migration 025), kolom bebas di `data` JSONB.
- Field tautan `project`, `rule`, `lifeGoal` menyimpan id item modul lain, tampil sebagai `select` di form dan chip yang bisa diklik di kartu. Pakai ini, jangan menyalin teks dari modul lain.
- `syncWeight` dan `learningMinutes` menulis ke log berat dan sesi belajar, supaya angka di modul asalnya ikut berubah.

### 4.17 Cek harian (`components/daily/DailyChecks.tsx`)
- Air minum (8 gelas) dan ibadah 5 waktu: target sentuh besar, sekali ketuk tersimpan. Tampil di Beranda; Kesehatan hanya air minum.
- `ReflectionExtras`: menguras energi, pemicu stres, yang membantu. Ada di form refleksi jurnal, tersimpan otomatis saat kolom ditinggalkan.

---

## 5. Pola halaman

| Jenis | Susunan |
|---|---|
| **Ringkasan modul** (`/finance`, `/health`, …) | PageHeader (stamp) → Tabs → baris metrik (1 hero + 2–3 metrik) → grafik + panel aksi → daftar terbaru |
| **Daftar** (`/journal/entries`, `/reviews/history`, …) | PageHeader (back) → toolbar (cari, filter chip) → list kartu / tabel → empty state |
| **Form** (`/journal/write`, `/planning/add`, …) | PageHeader (back) → satu kartu form, field satu kolom di mobile, dua kolom di desktop → tombol simpan `primary` (mobile lebar penuh) |
| **Detail** (`/learning/paths/[id]/…`) | PageHeader (back, judul item) → kartu meta → isi |
| **Publik** (`/f/[token]`) | Tanpa sidebar/nav; kartu tengah maks 640px, sama tokennya |
| **Buku catatan** (`/rules/decisions`, `/work/meetings`, …) | Lihat §4.16 |
| **Laporan / periode** (`/reports`, `/goals/annual`, `/reviews/period`, `/finance/budget`, `/habits/analytics`) | PageHeader → PeriodNavigator → hero metrik periode → rincian per sub-periode (batang yang bisa diketuk) → kartu modul |

**Aturan mobile: ringkas di hub, isi di subhalaman.** Di mobile, halaman utama modul hanya menampilkan status hari ini + satu tombol aksi utama. Form panjang (refleksi jurnal, review, form makanan lengkap) dibuka di subhalaman sendiri dengan tombol kembali, lalu kembali ke hub setelah disimpan. Contoh: `/journal` → `/journal/today`. Desktop boleh tetap menampilkan form di hub.

Susunan hub di mobile: PageHeader (satu tombol aksi utama) → ringkasan (metrik / cek harian) → menu `SubpageLinks stacked` → maksimal satu daftar pendek (5 item terbaru). Tab dan isi tab disembunyikan (`hidden md:block`). Sudah diterapkan di Jurnal, Keuangan, Kesehatan, Belajar, Review, Habit, dan Proyek. Di Karier, kanban diganti daftar di layar kecil.

---

## 6. Checklist halaman

Setiap halaman wajib: PageHeader, tanpa warna mentah, tombol dari `Button`, tab dari `SegmentedTabs`, lolos cek mobile 390px dan desktop 1440px, terang dan gelap.

| Modul | Route |
|---|---|
| Beranda | `/` |
| Tangkap | `/capture` |
| Rencana | `/planning`, `/planning/add`, `/planning/timeline`, `/planning/month` |
| Proyek | `/projects`, `/projects/manage`, `/projects/tasks`, `/projects/milestones` |
| Target | `/goals`, `/goals/annual`, `/goals/manage` (alihkan) |
| Habit | `/habits`, `/habits/analytics`, `/habits/calendar`, `/habits/manage` |
| Fokus | `/focus` |
| Kesehatan | `/health`, `/health/metrics`, `/health/nutrition`, `/health/workout`, `/health/body` |
| Jurnal | `/journal`, `/journal/today`, `/journal/entries`, `/journal/write` |
| Belajar | `/learning`, `/learning/dictionary`, `/learning/schedule`, `/learning/sessions`, `/learning/reading`, `/learning/paths/[id]`, `/learning/paths/[id]/modules/[moduleId]` |
| Prinsip | `/rules`, `/rules/decisions` |
| Cermin | `/mirror`, `/mirror/new`, `/mirror/goals`, `/mirror/feedback` |
| Keuangan | `/finance`, `/finance/ledger`, `/finance/record`, `/finance/wealth`, `/finance/goals`, `/finance/wishlist`, `/finance/budget` |
| Karier | `/work`, `/work/applications` (alihkan), `/work/roadmap`, `/work/visits`, `/work/portfolio`, `/work/meetings` |
| Review | `/reviews`, `/reviews/write`, `/reviews/history`, `/reviews/period`, `/reviews/lessons` |
| Laporan | `/reports` |
| Pengaturan | `/settings` |
| Publik | `/f/[token]`, halaman login |

---

## 7. Cara cek sebelum merge

```bash
# Tidak boleh ada hasil:
grep -rnE "bg-primary[^\"']*text-white|font-bold|text-\[(9|10|11)px\]" src --include=*.tsx
grep -rnP "(?<![:\w/-])text-(amber|rose|blue|teal|emerald|red|green|sky|indigo)-(300|400)(?![\w-])" src --include=*.tsx
grep -rnPzo "<Link[^>]*>\s*<(button|Button)" src --include=*.tsx
# Hanya boleh berisi pengecualian di §2.1 (grafik SVG, scrim foto):
grep -rnE "#[0-9a-fA-F]{6}|bg-gradient" src/app src/components --include=*.tsx
npx tsc --noEmit && npm run build
```

Lalu buka halaman yang diubah di lebar 390px dan 1440px, mode terang dan gelap.

**Pratinjau tanpa login:** `NODE_ENV=test npx next dev -p 3100` mengabaikan `.env.local`, jadi aplikasi jalan dalam mode lokal (data di browser, tanpa Supabase). Pakai hanya untuk cek tampilan.
