// ─── Life OS Constants ───

export const STORAGE_KEY = 'self-management-webapp-v1';

// ─── Unified Life Area Taxonomy (used across ALL modules) ───
export const LIFE_AREAS = [
  'Agama',
  'Karir',
  'Keuangan',
  'Kesehatan',
  'Pembelajaran',
  'Personal',
  'Sosial & Keluarga',
  'Hobbies & Kreativitas',
] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export const HABIT_AREAS = LIFE_AREAS;

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', factor: 1.2 },
  { id: 'light', label: 'Light', factor: 1.375 },
  { id: 'moderate', label: 'Moderate', factor: 1.55 },
  { id: 'active', label: 'Active', factor: 1.725 },
  { id: 'very_active', label: 'Very Active', factor: 1.9 },
] as const;

export type ActivityLevelId = (typeof ACTIVITY_LEVELS)[number]['id'];

export const WORKOUT_PROGRAMS: Record<string, string[]> = {
  'Push A': [
    'Bench Press (Smith Machine)',
    'Incline Chest Press (Machine)',
    'Shoulder Press (Machine Plates)',
    'Cable Fly Crossovers',
    'Lateral Raise (Dumbbell)',
    'Triceps Pushdown',
  ],
  'Pull A': [
    'Lat Pulldown',
    'Chest Supported Incline Row (Dumbbell)',
    'Single Arm Cable Row',
    'Straight Arm Lat Pulldown (Cable)',
    'Rear Delt Reverse Fly (Machine)',
    'Bicep Curl (Dumbbell)',
    'Hammer Curl (Dumbbell)',
  ],
  'Leg A': [
    'Squat (Smith Machine)',
    'Bulgarian Split Squat',
    'Leg Extension',
    'Lying Leg Curl',
    'Seated Calf Raise',
    'Cable Crunch',
  ],
  'Push B': [
    'Shoulder Press (Machine Plates)',
    'Incline Chest Press (Machine)',
    'Bench Press (Dumbbell)',
    'Lateral Raise (Cable)',
    'Butterfly (Pec Deck)',
    'Overhead Triceps Extension (Cable)',
    'Triceps Pushdown',
  ],
  'Pull B': [
    'Seated Cable Row',
    'Lat Pulldown',
    'Barbel Row',
    'Face pull',
    'Rear delt reverse Fly',
    'Preacher Curl (Dumbbell)',
    'Bicep Curl (Cable)',
  ],
  'Leg B': [
    'Romanian Deadlift',
    'Leg Press',
    'Hip Trust',
    'Lying leg curl',
    'Walking lunge',
    'Seated calf raise',
    'Hanging knee raise',
  ],
};

export const WORKOUT_PROGRAM_NAMES = [
  ...Object.keys(WORKOUT_PROGRAMS),
  'Lari',
  'Renang',
  'Cardio',
  'Other',
];

export const STRENGTH_PROGRAMS = Object.keys(WORKOUT_PROGRAMS);

export const ALL_WORKOUT_EXERCISES = Array.from(
  new Set(Object.values(WORKOUT_PROGRAMS).flat())
);

export const WORK_STATUSES = [
  { id: 'wishlist', label: 'Belum Apply', labelEn: 'Wishlist', tone: 'amber' as const, progress: 10 },
  { id: 'applied', label: 'Applied', labelEn: 'Applied', tone: 'teal' as const, progress: 30 },
  { id: 'screening', label: 'Screening', labelEn: 'Screening', tone: 'indigo' as const, progress: 50 },
  { id: 'interview', label: 'Interview', labelEn: 'Interview', tone: 'green' as const, progress: 72 },
  { id: 'offer', label: 'Offer', labelEn: 'Offer', tone: 'green' as const, progress: 100 },
  { id: 'rejected', label: 'Rejected', labelEn: 'Rejected', tone: 'rose' as const, progress: 100 },
] as const;

export type WorkStatusId = (typeof WORK_STATUSES)[number]['id'];

export const WORK_STATUS_IDS = WORK_STATUSES.map((s) => s.id);

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'P1', 'P2', 'P3'] as const;
export type Priority = (typeof PRIORITY_OPTIONS)[number];

export const TASK_STATUSES = ['todo', 'doing', 'done', 'inbox', 'planned', 'today', 'in_progress', 'blocked', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PROJECT_STATUSES = ['active', 'paused', 'done'] as const;

export const LEARNING_STATUSES = ['to_learn', 'learning', 'completed'] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export const REVIEW_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type ReviewPeriod = (typeof REVIEW_PERIODS)[number];

export const MOOD_EMOJIS = ['😞', '😐', '🙂', '😊', '😍'] as const;

export const NAV_ITEMS = [
  { id: 'dashboard', path: '/', icon: 'layout', labelKey: 'nav_dashboard' as const },
  { id: 'capture', path: '/capture', icon: 'plus', labelKey: 'nav_capture' as const },
  { id: 'planning', path: '/planning', icon: 'calendar', labelKey: 'nav_planning' as const },
  { id: 'projects', path: '/projects', icon: 'folder', labelKey: 'nav_projects' as const },
  { id: 'habits', path: '/habits', icon: 'check', labelKey: 'nav_habits' as const },
  { id: 'goals', path: '/goals', icon: 'target', labelKey: 'nav_goals' as const },
  { id: 'journal', path: '/journal', icon: 'journal', labelKey: 'nav_journal' as const },
  { id: 'finance', path: '/finance', icon: 'wallet', labelKey: 'nav_finance' as const },
  { id: 'health', path: '/health', icon: 'activity', labelKey: 'nav_health' as const },
  { id: 'learning', path: '/learning', icon: 'book', labelKey: 'nav_learning' as const },
  { id: 'work', path: '/work', icon: 'briefcase', labelKey: 'nav_work' as const },
  { id: 'mirror', path: '/mirror', icon: 'lightbulb', labelKey: 'nav_mirror' as const },
  { id: 'rules', path: '/rules', icon: 'shield', labelKey: 'nav_rules' as const },
  { id: 'settings', path: '/settings', icon: 'settings', labelKey: 'nav_settings' as const },
] as const;

export const SELF_AWARENESS_DOMAINS = [
  { key: 'komunikasi', label: 'Komunikasi', labelEn: 'Communication', icon: 'journal' },
  { key: 'networking', label: 'Networking & Relasi', labelEn: 'Networking & Relationships', icon: 'globe' },
  { key: 'kepemimpinan', label: 'Kepemimpinan', labelEn: 'Leadership', icon: 'shield' },
  { key: 'manajemen_waktu', label: 'Manajemen Waktu', labelEn: 'Time Management', icon: 'calendar' },
  { key: 'personal_branding', label: 'Personal Branding', labelEn: 'Personal Branding', icon: 'star' },
  { key: 'keterampilan_teknis', label: 'Keterampilan Teknis', labelEn: 'Technical Skills', icon: 'zap' },
  { key: 'kesehatan_mental', label: 'Kesehatan Emosional', labelEn: 'Emotional Health', icon: 'activity' },
] as const;

export const GROWTH_GOAL_STATUSES = [
  { id: 'not_started', label: 'Belum Mulai', labelEn: 'Not Started', tone: 'gray' as const, progress: 0 },
  { id: 'in_progress', label: 'Berjalan', labelEn: 'In Progress', tone: 'teal' as const, progress: 50 },
  { id: 'achieved', label: 'Tercapai', labelEn: 'Achieved', tone: 'green' as const, progress: 100 },
  { id: 'stopped', label: 'Dihentikan', labelEn: 'Stopped', tone: 'amber' as const, progress: 100 },
] as const;

export const FEEDBACK_MIN_RESPONSES = 3;

// ─── Case Compatibility Aliases ───
export const workoutPrograms = WORKOUT_PROGRAMS;
export const workoutProgramNames = WORKOUT_PROGRAM_NAMES;
export const strengthPrograms = STRENGTH_PROGRAMS;
export const allWorkoutExercises = ALL_WORKOUT_EXERCISES;

