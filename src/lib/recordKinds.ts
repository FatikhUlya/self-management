/**
 * Notebook definitions for the paper journal sheets that are mostly
 * structured writing. One generic <RecordBook> renders any of them; data is
 * stored in `life_records` (supabase/migrations/025_life_records.sql).
 */

export type L = { id: string; en: string };
export type FieldType = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'url' | 'photo' | 'lines'
  /** Links to other modules: stores the linked item's id. */
  | 'project' | 'rule' | 'lifeGoal';

export interface RecordField {
  key: string;
  label: L;
  type: FieldType;
  placeholder?: L;
  options?: { id: string; label: L }[];
  unit?: string;
  /** `lines` fields: each line can be turned into a task. */
  taskable?: boolean;
  /** Shown on the list card. */
  preview?: boolean;
  /** Two-column on wide forms. */
  half?: boolean;
  /** lifeGoal fields: only goals of this annual category. */
  goalCategory?: string;
}

export interface RecordKindDef {
  kind: string;
  sheet: string;
  icon: string;
  back: string;
  title: L;
  subtitle: L;
  addLabel: L;
  /** null = no free title (the date names the entry). */
  titleField: { label: L; placeholder?: L } | null;
  dateLabel: L;
  fields: RecordField[];
  statusField?: string;
  groupBy?: string;
  /** Numeric fields are compared with the previous entry. */
  trend?: boolean;
  /** Body book: the weight field also writes the weight log (Metrics, TDEE, Reports). */
  syncWeight?: string;
  /** Reading book: this minutes field is logged as a learning session. */
  learningMinutes?: string;
  empty: L;
}

export interface LifeRecord {
  id: string;
  kind: string;
  date: string | null;
  title: string;
  data: Record<string, any>;
  createdAt?: string;
}

const t = (id: string, en: string): L => ({ id, en });

export const RECORD_KINDS: Record<string, RecordKindDef> = {
  decision: {
    kind: 'decision', sheet: '04', icon: 'compass', back: '/rules',
    title: t('Log Keputusan', 'Decision Log'),
    subtitle: t('Catat alasan di balik keputusan penting, lalu tinjau hasilnya nanti.', 'Record why you decided, then check the outcome later.'),
    addLabel: t('Catat keputusan', 'Log decision'),
    titleField: { label: t('Keputusan', 'Decision'), placeholder: t('Mis. Ambil tawaran kerja di Surabaya', 'e.g. Accept the job offer') },
    dateLabel: t('Tanggal keputusan', 'Decided on'),
    statusField: 'status',
    fields: [
      { key: 'status', type: 'select', label: t('Status', 'Status'), options: [
        { id: 'open', label: t('Menunggu hasil', 'Waiting for outcome') },
        { id: 'reviewed', label: t('Sudah ditinjau', 'Reviewed') },
      ] },
      { key: 'context', type: 'textarea', preview: true, label: t('Konteks / masalah', 'Context'), placeholder: t('Apa yang sedang dihadapi?', 'What were you facing?') },
      { key: 'options', type: 'textarea', label: t('Alternatif yang dipertimbangkan', 'Options considered') },
      { key: 'reason', type: 'textarea', preview: true, label: t('Alasan memilih', 'Why this option') },
      { key: 'principle', type: 'rule', label: t('Prinsip yang dipakai', 'Principle applied') },
      { key: 'expected', type: 'textarea', label: t('Hasil yang diharapkan', 'Expected outcome') },
      { key: 'reviewDate', type: 'date', half: true, label: t('Tinjau ulang pada', 'Review on') },
      { key: 'outcome', type: 'textarea', label: t('Hasil nyata (isi saat meninjau)', 'Actual outcome') },
    ],
    empty: t('Keputusan besar lebih mudah dievaluasi kalau alasannya tercatat.', 'Decisions are easier to judge when the reasoning is written down.'),
  },

  lesson: {
    kind: 'lesson', sheet: '15', icon: 'lightbulb', back: '/reviews',
    title: t('Pelajaran & Debrief', 'Lessons Learned'),
    subtitle: t('Bedah satu peristiwa: apa yang terjadi, kenapa, dan apa yang diubah.', 'Debrief an event: what happened, why, and what changes.'),
    addLabel: t('Tulis debrief', 'New debrief'),
    titleField: { label: t('Peristiwa / proyek', 'Event / project'), placeholder: t('Mis. Presentasi ke klien gagal deal', 'e.g. Client pitch') },
    dateLabel: t('Tanggal', 'Date'),
    fields: [
      { key: 'project', type: 'project', label: t('Proyek terkait', 'Related project') },
      { key: 'happened', type: 'textarea', preview: true, label: t('Apa yang terjadi', 'What happened') },
      { key: 'wentWell', type: 'textarea', label: t('Yang berjalan baik', 'What went well') },
      { key: 'wentWrong', type: 'textarea', label: t('Yang kurang', 'What went wrong') },
      { key: 'rootCause', type: 'textarea', label: t('Akar penyebab', 'Root cause') },
      { key: 'lesson', type: 'textarea', preview: true, label: t('Pelajaran', 'Lesson') },
      { key: 'actions', type: 'lines', taskable: true, label: t('Tindakan ke depan (satu per baris)', 'Next actions (one per line)') },
    ],
    empty: t('Setiap kegagalan atau keberhasilan besar layak satu halaman debrief.', 'Every big win or miss deserves a debrief.'),
  },

  body: {
    kind: 'body', sheet: '17', icon: 'ruler', back: '/health',
    title: t('Progres Tubuh', 'Body Progress'),
    subtitle: t('Lingkar tubuh, persen lemak, dan foto progres. Ukur di jam dan kondisi yang sama.', 'Measurements, body fat and progress photos.'),
    addLabel: t('Catat pengukuran', 'Add measurement'),
    titleField: null,
    dateLabel: t('Tanggal ukur', 'Measured on'),
    trend: true,
    syncWeight: 'weight',
    fields: [
      { key: 'weight', type: 'number', unit: 'kg', half: true, label: t('Berat', 'Weight') },
      { key: 'bodyFat', type: 'number', unit: '%', half: true, label: t('Lemak tubuh', 'Body fat') },
      { key: 'waist', type: 'number', unit: 'cm', half: true, label: t('Pinggang', 'Waist') },
      { key: 'chest', type: 'number', unit: 'cm', half: true, label: t('Dada', 'Chest') },
      { key: 'hip', type: 'number', unit: 'cm', half: true, label: t('Pinggul', 'Hip') },
      { key: 'arm', type: 'number', unit: 'cm', half: true, label: t('Lengan', 'Arm') },
      { key: 'thigh', type: 'number', unit: 'cm', half: true, label: t('Paha', 'Thigh') },
      { key: 'photo', type: 'photo', label: t('Foto progres', 'Progress photo') },
      { key: 'notes', type: 'textarea', label: t('Catatan', 'Notes') },
    ],
    empty: t('Ukur sebulan sekali untuk melihat perubahan yang tidak terlihat di timbangan.', 'Measure monthly to see what the scale misses.'),
  },

  career: {
    kind: 'career', sheet: '20', icon: 'trendingUp', back: '/work',
    title: t('Peta Karier', 'Career Roadmap'),
    subtitle: t('Milestone karier 1, 3, dan 5 tahun beserta skill dan langkahnya.', 'Career milestones for 1, 3 and 5 years.'),
    addLabel: t('Tambah milestone', 'Add milestone'),
    titleField: { label: t('Milestone / posisi', 'Milestone / role'), placeholder: t('Mis. Senior Site Engineer', 'e.g. Senior engineer') },
    dateLabel: t('Target tercapai', 'Target date'),
    statusField: 'status',
    groupBy: 'horizon',
    fields: [
      { key: 'horizon', type: 'select', half: true, label: t('Horizon', 'Horizon'), options: [
        { id: '1y', label: t('1 tahun', '1 year') },
        { id: '3y', label: t('3 tahun', '3 years') },
        { id: '5y', label: t('5 tahun', '5 years') },
      ] },
      { key: 'status', type: 'select', half: true, label: t('Status', 'Status'), options: [
        { id: 'plan', label: t('Rencana', 'Planned') },
        { id: 'doing', label: t('Berjalan', 'In progress') },
        { id: 'done', label: t('Tercapai', 'Achieved') },
      ] },
      { key: 'goal', type: 'lifeGoal', goalCategory: 'career', label: t('Goal tahunan terkait', 'Linked annual goal') },
      { key: 'skills', type: 'textarea', preview: true, label: t('Skill & sertifikasi yang dibutuhkan', 'Skills & certifications') },
      { key: 'network', type: 'text', label: t('Orang / jaringan yang perlu dikenal', 'People to know') },
      { key: 'steps', type: 'lines', taskable: true, label: t('Langkah berikutnya (satu per baris)', 'Next steps (one per line)') },
    ],
    empty: t('Mulai dari posisi yang ingin dicapai dalam 1 tahun.', 'Start with where you want to be in a year.'),
  },

  site_visit: {
    kind: 'site_visit', sheet: '22', icon: 'mapPin', back: '/work',
    title: t('Catatan Kerja & Kunjungan', 'Work & Site Visit Notes'),
    subtitle: t('Temuan lapangan, masalah, dan tindak lanjut per kunjungan.', 'Findings, issues and follow-ups per visit.'),
    addLabel: t('Catat kunjungan', 'Log visit'),
    titleField: { label: t('Lokasi / proyek', 'Site / project') },
    dateLabel: t('Tanggal kunjungan', 'Visit date'),
    fields: [
      { key: 'project', type: 'project', label: t('Proyek', 'Project') },
      { key: 'client', type: 'text', half: true, label: t('Klien / PIC', 'Client / contact') },
      { key: 'purpose', type: 'text', half: true, label: t('Tujuan', 'Purpose') },
      { key: 'findings', type: 'textarea', preview: true, label: t('Temuan', 'Findings') },
      { key: 'issues', type: 'textarea', label: t('Masalah & risiko', 'Issues & risks') },
      { key: 'actions', type: 'lines', taskable: true, label: t('Tindak lanjut (satu per baris)', 'Follow-ups (one per line)') },
      { key: 'photo', type: 'photo', label: t('Foto lapangan', 'Site photo') },
    ],
    empty: t('Catat langsung setelah kunjungan selagi detailnya masih segar.', 'Write it right after the visit.'),
  },

  case_study: {
    kind: 'case_study', sheet: '23', icon: 'fileText', back: '/work',
    title: t('Studi Kasus Portofolio', 'Portfolio Case Studies'),
    subtitle: t('Masalah, proses, solusi, dan hasil terukur. Siap dipakai untuk CV dan wawancara.', 'Problem, process, solution and measurable result.'),
    addLabel: t('Tulis studi kasus', 'New case study'),
    titleField: { label: t('Nama proyek', 'Project') },
    dateLabel: t('Selesai pada', 'Finished on'),
    fields: [
      { key: 'project', type: 'project', label: t('Proyek di aplikasi', 'Project in the app') },
      { key: 'role', type: 'text', half: true, label: t('Peran saya', 'My role') },
      { key: 'skills', type: 'text', half: true, label: t('Skill / tools', 'Skills / tools') },
      { key: 'problem', type: 'textarea', preview: true, label: t('Masalah', 'Problem') },
      { key: 'process', type: 'textarea', label: t('Proses / pendekatan', 'Process') },
      { key: 'solution', type: 'textarea', label: t('Solusi', 'Solution') },
      { key: 'result', type: 'textarea', preview: true, label: t('Hasil & angka', 'Result & numbers') },
      { key: 'link', type: 'url', label: t('Tautan', 'Link') },
      { key: 'photo', type: 'photo', label: t('Gambar sampul', 'Cover image') },
    ],
    empty: t('Satu studi kasus yang rapi lebih kuat dari sepuluh baris CV.', 'One clear case study beats ten CV lines.'),
  },

  meeting: {
    kind: 'meeting', sheet: '24', icon: 'users', back: '/work',
    title: t('Catatan Rapat & Feedback', 'Meeting & Feedback Notes'),
    subtitle: t('Agenda, keputusan, feedback, dan tindak lanjut yang bisa langsung jadi tugas.', 'Agenda, decisions, feedback and follow-ups.'),
    addLabel: t('Catat rapat', 'Log meeting'),
    titleField: { label: t('Agenda / topik', 'Agenda') },
    dateLabel: t('Tanggal', 'Date'),
    fields: [
      { key: 'type', type: 'select', half: true, label: t('Jenis', 'Type'), options: [
        { id: 'meeting', label: t('Rapat', 'Meeting') },
        { id: 'one_on_one', label: t('1-on-1', '1-on-1') },
        { id: 'client', label: t('Klien', 'Client') },
        { id: 'feedback', label: t('Sesi feedback', 'Feedback') },
      ] },
      { key: 'attendees', type: 'text', half: true, label: t('Peserta', 'Attendees') },
      { key: 'project', type: 'project', label: t('Proyek', 'Project') },
      { key: 'notes', type: 'textarea', preview: true, label: t('Catatan', 'Notes') },
      { key: 'decisions', type: 'textarea', label: t('Keputusan', 'Decisions') },
      { key: 'feedback', type: 'textarea', label: t('Feedback yang saya terima', 'Feedback received') },
      { key: 'actions', type: 'lines', taskable: true, label: t('Tindak lanjut (satu per baris)', 'Action items (one per line)') },
    ],
    empty: t('Tindak lanjut rapat bisa langsung dijadikan tugas.', 'Action items can become tasks in one tap.'),
  },

  milestone: {
    kind: 'milestone', sheet: '09', icon: 'folder', back: '/projects',
    title: t('Milestone Proyek', 'Project Milestones'),
    subtitle: t('Tahapan besar per proyek. Langkahnya jadi tugas di proyek yang sama.', 'Big stages per project; steps become tasks in that project.'),
    addLabel: t('Tambah milestone', 'Add milestone'),
    titleField: { label: t('Milestone', 'Milestone'), placeholder: t('Mis. Gambar kerja tahap 1 selesai', 'e.g. Phase 1 drawings done') },
    dateLabel: t('Tenggat', 'Due'),
    statusField: 'status',
    groupBy: 'project',
    fields: [
      { key: 'project', type: 'project', label: t('Proyek', 'Project') },
      { key: 'status', type: 'select', label: t('Status', 'Status'), options: [
        { id: 'plan', label: t('Rencana', 'Planned') },
        { id: 'doing', label: t('Berjalan', 'In progress') },
        { id: 'done', label: t('Selesai', 'Done') },
      ] },
      { key: 'deliverable', type: 'textarea', preview: true, label: t('Hasil yang diserahkan', 'Deliverable') },
      { key: 'steps', type: 'lines', taskable: true, label: t('Langkah (satu per baris)', 'Steps (one per line)') },
    ],
    empty: t('Pecah proyek besar menjadi 3–5 milestone.', 'Split a big project into 3–5 milestones.'),
  },

  reading: {
    kind: 'reading', sheet: '27', icon: 'bookOpen', back: '/learning',
    title: t('Catatan Bacaan & Pengetahuan', 'Reading & Knowledge Notes'),
    subtitle: t('Ide utama, kutipan, dan yang akan diterapkan. Menit baca ikut tercatat sebagai sesi belajar.', 'Key ideas, quotes and what to apply. Minutes count as a learning session.'),
    addLabel: t('Catat bacaan', 'Add note'),
    titleField: { label: t('Judul', 'Title') },
    dateLabel: t('Tanggal baca', 'Read on'),
    statusField: 'sourceType',
    learningMinutes: 'minutes',
    fields: [
      { key: 'sourceType', type: 'select', label: t('Jenis sumber', 'Source type'), options: [
        { id: 'book', label: t('Buku', 'Book') },
        { id: 'article', label: t('Artikel', 'Article') },
        { id: 'video', label: t('Video', 'Video') },
        { id: 'podcast', label: t('Podcast', 'Podcast') },
        { id: 'course', label: t('Kursus', 'Course') },
      ] },
      { key: 'author', type: 'text', half: true, label: t('Penulis / sumber', 'Author / source') },
      { key: 'minutes', type: 'number', half: true, unit: 'menit', label: t('Waktu baca', 'Time spent') },
      { key: 'keyIdeas', type: 'textarea', preview: true, label: t('Ide utama', 'Key ideas') },
      { key: 'quotes', type: 'textarea', preview: true, label: t('Kutipan', 'Quotes') },
      { key: 'apply', type: 'lines', taskable: true, label: t('Yang akan saya terapkan (satu per baris)', 'What I will apply (one per line)') },
      { key: 'link', type: 'url', label: t('Tautan', 'Link') },
    ],
    empty: t('Satu halaman catatan per buku, artikel, atau video.', 'One page per book, article or video.'),
  },
};

export const optionLabel = (f: RecordField, v: string, lang: 'id' | 'en') =>
  f.options?.find((o) => o.id === v)?.label[lang] ?? v;

export const lines = (v: unknown) =>
  String(v || '').split('\n').map((s) => s.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
