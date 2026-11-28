/** Eight life areas for annual goals (Personal Life Journal, sheet 02). */
export const LIFE_GOAL_CATEGORIES = [
  { id: 'finance', label: 'Keuangan', labelEn: 'Finance', icon: 'wallet' },
  { id: 'health', label: 'Kesehatan & Fisik', labelEn: 'Health & Physical', icon: 'dumbbell' },
  { id: 'career', label: 'Karier & Profesional', labelEn: 'Career & Professional', icon: 'briefcase' },
  { id: 'business', label: 'Bisnis & Wirausaha', labelEn: 'Business & Entrepreneurship', icon: 'trendingUp' },
  { id: 'relationship', label: 'Keluarga & Relasi', labelEn: 'Family & Relationship', icon: 'heart' },
  { id: 'spiritual', label: 'Spiritual & Makna', labelEn: 'Spiritual & Meaning', icon: 'compass' },
  { id: 'learning', label: 'Belajar & Pengembangan Diri', labelEn: 'Learning & Personal Growth', icon: 'book' },
  { id: 'lifestyle', label: 'Gaya Hidup, Pengalaman & Kontribusi', labelEn: 'Lifestyle, Experience & Contribution', icon: 'globe' },
] as const;

export type LifeGoalCategory = (typeof LIFE_GOAL_CATEGORIES)[number]['id'];

export interface LifeGoal {
  id: string;
  category: LifeGoalCategory;
  title: string;
  notes: string;
  priorityYear: number | null;
  why: string;
  successMetric: string;
  status: 'idea' | 'active' | 'achieved' | 'dropped';
  createdAt: string;
}

export type TargetPeriod = 'quarter' | 'month' | 'week' | 'day';

export interface GoalTarget {
  id: string;
  lifeGoalId: string;
  periodType: TargetPeriod;
  periodStart: string;
  title: string;
  done: boolean;
  /** Task created from this target (migration 026). Done state stays in sync. */
  taskId?: string | null;
  createdAt: string;
}

export const MIN_GOALS_PER_CATEGORY = 30;

/** Starter ideas: one tap adds them to the library. Never inserted automatically. */
export const GOAL_SUGGESTIONS: Record<LifeGoalCategory, string[]> = {
  finance: [
    'Dana darurat 6 bulan pengeluaran', 'Menabung 20% dari setiap pemasukan', 'Lunas semua utang konsumtif',
    'Mencatat semua pengeluaran harian setahun penuh', 'Membuat anggaran bulanan dan disiplin menjalankannya', 'Investasi rutin bulanan di reksa dana',
    'Punya portofolio investasi pertama', 'Membuka rekening khusus tabungan tujuan', 'Menaikkan penghasilan 25%',
    'Punya satu sumber penghasilan tambahan', 'Dana pensiun mulai diisi rutin', 'Asuransi kesehatan pribadi aktif',
    'Menabung untuk DP rumah', 'Menabung untuk kendaraan tanpa kredit', 'Belanja impulsif di bawah 5% pemasukan',
    'Mengurangi langganan yang tidak dipakai', 'Belajar dasar pajak dan lapor SPT sendiri', 'Net worth naik 30%',
    'Dana pendidikan lanjutan siap', 'Membuat wasiat dan daftar aset', 'Sedekah rutin 2,5% dari penghasilan',
    'Menabung untuk perjalanan impian', 'Tidak memakai paylater sepanjang tahun', 'Membaca 3 buku keuangan pribadi',
    'Review keuangan bulanan tanpa absen', 'Emergency fund terpisah dari rekening harian', 'Diversifikasi ke emas',
    'Membuat rencana keuangan 5 tahun', 'Menyiapkan dana pernikahan / keluarga', 'Membeli aset produktif pertama',
  ],
  health: [
    'Gym 4x seminggu konsisten', 'Lean bulk naik 4 kg dengan lemak terkontrol', 'Tidur 7 jam setiap malam',
    'Minum 2,5 liter air per hari', 'Protein harian sesuai target', 'Lari 5 km tanpa berhenti',
    'Lari 10 km di bawah 60 menit', 'Bench press setara berat badan', 'Squat 1,5x berat badan',
    'Deadlift 2x berat badan', 'Push-up 50 kali berturut-turut', 'Pull-up 10 kali berturut-turut',
    'Cek kesehatan lengkap tahunan', 'Periksa gigi dua kali setahun', 'Mengurangi gula tambahan',
    'Tidak merokok / vape sama sekali', 'Jalan kaki 8.000 langkah per hari', 'Stretching / mobilitas 10 menit tiap hari',
    'Masak sendiri 5 hari seminggu', 'Lingkar pinggang turun 5 cm', 'Body fat di bawah 15%',
    'Puasa sunnah Senin-Kamis rutin', 'Screen time sebelum tidur di bawah 30 menit', 'Ikut satu event lari atau olahraga',
    'Belajar teknik angkat beban yang benar dengan coach', 'Meditasi / napas 5 menit harian', 'Tidak begadang lewat jam 12',
    'Sarapan bergizi setiap hari', 'Program latihan 12 minggu selesai tanpa bolong', 'Foto progres tubuh tiap bulan',
  ],
  career: [
    'Lulus magang dengan penilaian sangat baik', 'Mendapat pekerjaan pertama di bidang arsitektur / desain', 'Portofolio profesional 6 proyek',
    'Punya satu mentor karier', 'Sertifikasi profesional pertama', 'Menguasai satu software utama industri',
    'Menguasai BIM / Revit tingkat lanjut', 'Menguasai rendering profesional', 'Membuat CV dan LinkedIn yang kuat',
    'Melamar 30 posisi yang relevan', 'Lolos 5 wawancara kerja', 'Gaji pertama sesuai target',
    'Ikut 3 seminar / konferensi industri', 'Networking dengan 50 profesional', 'Menulis 12 artikel / studi kasus',
    'Presentasi proyek di depan klien', 'Memimpin satu proyek kecil', 'Kunjungan lapangan rutin dan terdokumentasi',
    'Bahasa Inggris profesional (IELTS 6.5+)', 'Ikut kompetisi desain', 'Menang / masuk shortlist kompetisi',
    'Membuat personal website portofolio', 'Promosi / naik jabatan', 'Mendapat rekomendasi dari atasan',
    'Menguasai manajemen proyek dasar', 'Mengerti RAB dan estimasi biaya', 'Belajar regulasi bangunan setempat',
    'Kolaborasi lintas disiplin dalam satu proyek', 'Membangun reputasi di satu niche', 'Rencana karier 5 tahun tertulis',
  ],
  business: [
    'Validasi satu ide bisnis dengan 20 calon pelanggan', 'Penjualan pertama', 'Omzet bulanan stabil',
    'Membuat landing page bisnis', 'Membangun brand dan logo', 'Punya 100 pelanggan',
    'Jasa desain freelance dengan 5 klien', 'Membuat paket layanan dan harga yang jelas', 'Membuat kontrak kerja standar',
    'Margin keuntungan minimal 30%', 'Memisahkan keuangan pribadi dan bisnis', 'Laporan keuangan bisnis bulanan',
    'Mengurus legalitas usaha (NIB)', 'Instagram bisnis 1.000 pengikut organik', 'Konten rutin 3x seminggu',
    'Membuat produk digital pertama', 'Merekrut freelancer / tim pertama', 'Sistem operasional terdokumentasi (SOP)',
    'Testimoni dari 10 klien', 'Kolaborasi dengan satu brand / mitra', 'Ikut satu pameran / bazar',
    'Membaca 5 buku bisnis', 'Ikut program inkubasi / komunitas founder', 'Riset pasar dan kompetitor tertulis',
    'Repeat order 30% pelanggan', 'Membuat proposal investasi sederhana', 'Otomatisasi pembayaran dan invoice',
    'Pendapatan bisnis menutup biaya hidup', 'Menguji satu kanal marketing berbayar', 'Rencana bisnis 3 tahun',
  ],
  relationship: [
    'Telepon / video call orang tua setiap minggu', 'Pulang kampung minimal 3 kali', 'Makan malam bersama keluarga rutin',
    'Quality time tanpa gawai dengan keluarga', 'Merayakan ulang tahun keluarga dengan berkesan', 'Membantu biaya / kebutuhan orang tua',
    'Memperbaiki hubungan yang renggang', 'Satu kegiatan bulanan dengan sahabat', 'Menjaga 5 pertemanan dekat',
    'Kenal lebih dekat dengan saudara', 'Mendengar aktif tanpa menghakimi', 'Belajar komunikasi asertif',
    'Hadir di acara penting orang terdekat', 'Mengirim pesan apresiasi ke 12 orang', 'Mentoring adik / junior',
    'Menyiapkan diri untuk pernikahan', 'Membangun rumah tangga yang sehat', 'Konseling / kelas pranikah',
    'Mengurangi konflik dengan batasan yang jelas', 'Liburan keluarga sekali setahun', 'Membuat album kenangan keluarga',
    'Silaturahmi ke kerabat saat hari raya', 'Mengenal tetangga sekitar', 'Bergabung dengan komunitas positif',
    'Membalas pesan penting dalam 24 jam', 'Menjadi pendengar untuk teman yang butuh', 'Mengatur waktu kerja agar ada waktu keluarga',
    'Belajar bahasa kasih orang terdekat', 'Meminta maaf dan memaafkan lebih cepat', 'Merencanakan masa depan bersama pasangan',
  ],
  spiritual: [
    'Salat lima waktu tepat waktu', 'Salat berjamaah di masjid lebih sering', 'Tilawah satu juz per minggu',
    'Khatam Al-Qur\'an dalam setahun', 'Menghafal satu juz baru', 'Belajar tajwid dengan guru',
    'Salat malam rutin', 'Dzikir pagi dan petang harian', 'Kajian ilmu agama mingguan',
    'Membaca satu buku sirah / tafsir per kuartal', 'Puasa Ramadan penuh dan berkualitas', 'Itikaf di 10 malam terakhir',
    'Sedekah subuh harian', 'Menunaikan zakat tepat waktu', 'Merencanakan umrah / haji',
    'Menjaga lisan dari ghibah', 'Muhasabah harian 5 menit', 'Menulis jurnal syukur setiap malam',
    'Mengurangi hiburan yang melalaikan', 'Membantu kegiatan masjid / sosial', 'Belajar fikih muamalah untuk bisnis',
    'Mengajarkan satu ilmu kepada orang lain', 'Menjaga pandangan dan adab bermedia sosial', 'Berbakti lebih kepada orang tua',
    'Menetapkan nilai hidup tertulis', 'Retreat / waktu sendiri untuk refleksi', 'Doa harian yang terjaga',
    'Membaca Al-Qur\'an dengan terjemah', 'Istikamah satu amal kecil harian', 'Menghadiri majelis ilmu bulanan',
  ],
  learning: [
    'Membaca 24 buku', 'Menyelesaikan satu kursus online bersertifikat', 'Belajar bahasa asing baru hingga percakapan dasar',
    'IELTS / TOEFL dengan skor target', 'Menulis 50 catatan bacaan', 'Belajar public speaking',
    'Belajar menulis cepat dan jelas', 'Menguasai satu tool produktivitas', 'Belajar dasar coding / otomasi',
    'Belajar fotografi arsitektur', 'Menggambar sketsa tangan rutin', 'Ikut workshop desain',
    'Membuat second brain / sistem catatan', 'Mengajar / berbagi ilmu di satu forum', 'Membaca satu jurnal ilmiah per bulan',
    'Belajar manajemen waktu dan fokus', 'Belajar desain berkelanjutan', 'Belajar psikologi dasar',
    'Membaca biografi 5 tokoh', 'Mengikuti satu bootcamp', 'Belajar negosiasi',
    'Belajar kepemimpinan', 'Membuat podcast / video edukasi', 'Membaca 20 menit setiap hari',
    'Kosakata bahasa Inggris 1.000 kata baru', 'Merangkum setiap buku yang dibaca', 'Menyelesaikan satu proyek belajar mandiri',
    'Belajar statistik / analisis data dasar', 'Belajar berpikir kritis', 'Review pembelajaran setiap akhir bulan',
  ],
  lifestyle: [
    'Mengunjungi 3 kota baru', 'Satu perjalanan ke luar negeri', 'Mendaki satu gunung',
    'Belajar berenang dengan teknik benar', 'Belajar memasak 20 menu sehat', 'Menata kamar / rumah minimalis',
    'Decluttering barang yang tidak dipakai', 'Digital detox satu hari tiap minggu', 'Rutinitas pagi yang konsisten',
    'Punya hobi kreatif baru', 'Mengoleksi pengalaman, bukan barang', 'Menonton / mengunjungi 10 karya arsitektur ikonik',
    'Menjadi relawan rutin', 'Donor darah tiga kali', 'Menanam pohon / berkebun',
    'Mengurangi sampah plastik pribadi', 'Mengikuti satu kegiatan sosial bulanan', 'Mengajar anak-anak di komunitas',
    'Membuat bucket list hidup', 'Camping bersama teman', 'Belajar alat musik',
    'Menulis jurnal perjalanan', 'Fotografi perjalanan menjadi album', 'Mengatur jadwal istirahat dan libur',
    'Tidak membuka media sosial sebelum jam 9 pagi', 'Membangun ruang kerja yang nyaman', 'Mendokumentasikan hidup tiap bulan',
    'Berkontribusi pada proyek sosial / desain publik', 'Menginspirasi orang lain lewat cerita', 'Merayakan pencapaian kecil setiap bulan',
  ],
};
