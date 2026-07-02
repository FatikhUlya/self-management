"use strict";

const STORAGE_KEY = "self-management-webapp-v1";
const habitAreas = [
  "Agama",
  "Health & Fitness",
  "Career / Arsitektur",
  "Finance",
  "Personal Development",
  "Social / Family",
  "Hobbies / Creativity",
  "Lifestyle",
];

const activityLevels = [
  { id: "sedentary", label: "Sedentary", factor: 1.2 },
  { id: "light", label: "Light", factor: 1.375 },
  { id: "moderate", label: "Moderate", factor: 1.55 },
  { id: "active", label: "Active", factor: 1.725 },
  { id: "very_active", label: "Very Active", factor: 1.9 },
];

const workoutPrograms = {
  "Push A": [
    "Bench Press (Smith Machine)",
    "Incline Chest Press (Machine)",
    "Shoulder Press (Machine Plates)",
    "Cable Fly Crossovers",
    "Lateral Raise (Dumbbell)",
    "Triceps Pushdown",
  ],
  "Pull A": [
    "Lat Pulldown",
    "Chest Supported Incline Row (Dumbbell)",
    "Single Arm Cable Row",
    "Straight Arm Lat Pulldown (Cable)",
    "Rear Delt Reverse Fly (Machine)",
    "Bicep Curl (Dumbbell)",
    "Hammer Curl (Dumbbell)",
  ],
  "Leg A": [
    "Squat (Smith Machine)",
    "Bulgarian Split Squat",
    "Leg Extension",
    "Lying Leg Curl",
    "Seated Calf Raise",
    "Cable Crunch",
  ],
  "Push B": [
    "Shoulder Press (Machine Plates)",
    "Incline Chest Press (Machine)",
    "Bench Press (Dumbbell)",
    "Lateral Raise (Cable)",
    "Butterfly (Pec Deck)",
    "Overhead Triceps Extension (Cable)",
    "Triceps Pushdown",
  ],
  "Pull B": [
    "Seated Cable Row",
    "Lat Pulldown",
    "Barbel Row",
    "Face pull",
    "Rear delt reverse Fly",
    "Preacher Curl (Dumbbell)",
    "Bicep Curl (Cable)",
  ],
  "Leg B": [
    "Romanian Deadlift",
    "Leg Press",
    "Hip Trust",
    "Lying leg curl",
    "Walking lunge",
    "seated calf raise",
    "hanging knee raise",
  ],
};

const workoutProgramNames = [...Object.keys(workoutPrograms), "Lari", "Renang", "Cardio", "Other"];
const strengthPrograms = Object.keys(workoutPrograms);
const allWorkoutExercises = [...new Set(Object.values(workoutPrograms).flat())];

const workStatuses = [
  { id: "wishlist", label: "Belum Apply", tone: "amber", progress: 10 },
  { id: "applied", label: "Applied", tone: "teal", progress: 30 },
  { id: "screening", label: "Screening", tone: "indigo", progress: 50 },
  { id: "interview", label: "Interview", tone: "green", progress: 72 },
  { id: "offer", label: "Offer", tone: "green", progress: 100 },
  { id: "rejected", label: "Rejected", tone: "rose", progress: 100 },
];
const workStatusIds = workStatuses.map((status) => status.id);

const views = [
  { id: "dashboard", label: "Dashboard", title: "Pusat Kendali Hari Ini", icon: "layout", count: () => dueTasks().length },
  { id: "capture", label: "Capture", title: "Capture Idea", icon: "plus", count: () => state.ideas.filter((idea) => idea.status !== "archived").length },
  { id: "journal", label: "Journal", title: "Daily Journal", icon: "journal", count: () => journalForDate(state.selectedDate) ? 1 : 0 },
  { id: "planning", label: "Planning", title: "Planning Next Day", icon: "calendar", count: () => plansForDate(planningDate()).length },
  { id: "projects", label: "Projects", title: "Project & Task Management", icon: "folder", count: () => state.tasks.filter((task) => task.status !== "done").length },
  { id: "goals", label: "Goals", title: "Goals", icon: "target", count: () => state.goals.filter((goal) => Number(goal.progress) < 100).length },
  { id: "habits", label: "Habits", title: "Habit Tracker", icon: "check", count: () => habitsDoneToday() + "/" + Math.max(state.habits.length, 1) },
  { id: "learning", label: "Learning", title: "Learning Tracker", icon: "book", count: () => learningMinutes(7) + "m" },
  { id: "health", label: "Health", title: "Meal & Workout Tracker", icon: "activity", count: () => workoutMinutes(7) + "m" },
  { id: "work", label: "Work", title: "Work Tracker", icon: "briefcase", count: () => state.workApplications.length ? `${workAppliedCount()}/${state.workApplications.length}` : "0" },
  { id: "reviews", label: "Reviews", title: "Weekly & Monthly Review", icon: "review", count: () => state.reviews.length },
  { id: "settings", label: "Settings", title: "Pengaturan", icon: "settings", count: () => displayModeLabel(state.displayMode) },
];

let state = loadState();

const app = document.querySelector("#app");
const navList = document.querySelector("#navList");
const selectedDateInput = document.querySelector("#selectedDate");
const todayLabel = document.querySelector("#todayLabel");
const viewTitle = document.querySelector("#viewTitle");
const viewEyebrow = document.querySelector("#viewEyebrow");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeState(JSON.parse(saved));
    } catch (error) {
      console.warn("Gagal membaca data tersimpan.", error);
    }
  }

  const today = todayISO();
  const tomorrow = addDays(today, 1);
  return normalizeState({
    activeView: "dashboard",
    selectedDate: today,
    ideas: [
      createRecord({ title: "Rapikan sistem catatan mingguan", area: "Second Brain", priority: "Medium", notes: "Buat struktur inbox, area, project, archive.", status: "active" }),
    ],
    journals: [
      createRecord({ date: today, mood: 4, energy: 4, gratitude: "Masih punya ruang untuk mulai.", win: "Membuka sistem self management.", reflection: "Mulai dari kecil, yang penting konsisten.", next: "Tentukan 3 fokus utama hari ini." }),
    ],
    projects: [
      createRecord({ name: "Bangun rutinitas pagi", area: "Personal", status: "active" }),
      createRecord({ name: "Second brain pribadi", area: "Knowledge", status: "active" }),
    ],
    tasks: [
      createRecord({ title: "Tulis jurnal malam", projectId: "", due: today, priority: "High", status: "todo", completedAt: "" }),
      createRecord({ title: "Review inbox ide", projectId: "", due: today, priority: "Medium", status: "doing", completedAt: "" }),
      createRecord({ title: "Rancang template catatan belajar", projectId: "", due: tomorrow, priority: "Medium", status: "todo", completedAt: "" }),
    ],
    goals: [
      createRecord({ title: "Lebih terstruktur dalam 30 hari", category: "System", targetDate: addDays(today, 30), progress: 12 }),
      createRecord({ title: "Olahraga 12 kali bulan ini", category: "Health", targetDate: addDays(today, 24), progress: 25 }),
    ],
    habits: [
      createRecord({ name: "Jurnal 10 menit", area: "Mind", frequency: "daily", targetPerWeek: 7 }),
      createRecord({ name: "Baca 20 menit", area: "Learning", frequency: "daily", targetPerWeek: 5 }),
      createRecord({ name: "Workout ringan", area: "Health", frequency: "weekly", targetPerWeek: 3 }),
    ],
    habitLogs: [],
    learning: [
      createRecord({ date: today, topic: "Personal knowledge management", resource: "Artikel", minutes: 25, notes: "Tangkap ide dulu, rapikan saat review." }),
    ],
    meals: [
      createRecord({ date: today, type: "Breakfast", food: "Telur, nasi, sayur", protein: 24, calories: 520 }),
    ],
    workouts: [
      createRecord({ date: today, type: "Mobility", minutes: 15, intensity: "Light", notes: "Pemanasan dan stretching." }),
    ],
    nextDayPlans: [],
    workApplications: [],
    weightLogs: [],
    healthProfile: {
      height: 170,
      age: 25,
      activityLevel: "moderate",
      mealGoalCalories: "",
    },
    reviews: [],
  });
}

function normalizeState(input) {
  return {
    activeView: input.activeView || "dashboard",
    selectedDate: input.selectedDate || todayISO(),
    ideas: input.ideas || [],
    journals: input.journals || [],
    projects: input.projects || [],
    tasks: input.tasks || [],
    goals: input.goals || [],
    habits: input.habits || [],
    habitLogs: input.habitLogs || [],
    learning: input.learning || [],
    meals: input.meals || [],
    workouts: input.workouts || [],
    nextDayPlans: (input.nextDayPlans || []).map((plan) => {
      const startTime = plan.startTime || "08:00";
      return {
        ...plan,
        date: plan.date || addDays(input.selectedDate || todayISO(), 1),
        kind: ["task", "event"].includes(plan.kind) ? plan.kind : "task",
        startTime,
        endTime: normalizePlanEnd(startTime, plan.endTime),
        priority: plan.priority || "Medium",
        status: plan.status === "done" ? "done" : "scheduled",
      };
    }),
    workApplications: (input.workApplications || []).map((application) => ({
      ...application,
      status: workStatusIds.includes(application.status) ? application.status : "wishlist",
    })),
    weightLogs: input.weightLogs || [],
    healthProfile: {
      height: input.healthProfile?.height || "",
      age: input.healthProfile?.age || "",
      activityLevel: input.healthProfile?.activityLevel || "moderate",
      mealGoalCalories: input.healthProfile?.mealGoalCalories || "",
    },
    reviews: input.reviews || [],
    reviewPeriod: input.reviewPeriod || "weekly",
    displayMode: ["auto", "desktop", "mobile"].includes(input.displayMode) ? input.displayMode : "auto",
    habitModalDate: "",
    habitFormOpen: false,
    workEditId: "",
    selectedWorkoutProgram: workoutProgramNames.includes(input.selectedWorkoutProgram) ? input.selectedWorkoutProgram : "Push A",
    workoutDraftSets: input.workoutDraftSets || {},
    selectedWorkoutHistoryExercise: input.selectedWorkoutHistoryExercise || allWorkoutExercises[0],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createRecord(data) {
  const id = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : String(Date.now() + Math.random());
  return {
    id,
    createdAt: new Date().toISOString(),
    ...data,
  };
}

function todayISO() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function toISODate(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function formatDate(dateString, options = {}) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: options.short ? undefined : "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function monthLabel(dateString) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function dayName(dateString) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(`${dateString}T00:00:00`));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function displayModeLabel(mode) {
  const labels = {
    auto: "Auto",
    desktop: "Desktop",
    mobile: "Mobile",
  };
  return labels[mode] || labels.auto;
}

function applyDisplayMode() {
  document.body.classList.toggle("is-mobile-mode", state.displayMode === "mobile");
  document.body.classList.toggle("is-desktop-mode", state.displayMode === "desktop");
}

function icon(name) {
  const paths = {
    layout: '<path d="M4 5a1 1 0 0 1 1-1h5v7H4z" /><path d="M14 4h5a1 1 0 0 1 1 1v4h-6z" /><path d="M4 15h6v5H5a1 1 0 0 1-1-1z" /><path d="M14 13h6v6a1 1 0 0 1-1 1h-5z" />',
    plus: '<path d="M12 5v14" /><path d="M5 12h14" />',
    journal: '<path d="M6 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z" /><path d="M8 4v16" /><path d="M11 8h5" /><path d="M11 12h5" />',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    target: '<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 12h.01" />',
    check: '<path d="M20 6 9 17l-5-5" />',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />',
    activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2" />',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 11h18" /><path d="M8 15h.01" /><path d="M12 15h.01" /><path d="M16 15h.01" />',
    briefcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" /><path d="M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" /><path d="M2 12h20" /><path d="M9 12v2h6v-2" />',
    review: '<path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />',
    trash: '<path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 11v5" /><path d="M14 11v5" />',
    edit: '<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />',
    arrowRight: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
    minus: '<path d="M5 12h14" />',
    x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 0 1-3.38-1.42v-.09A1.7 1.7 0 0 0 9 17.6a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 13a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 0 1 1.42-3.38h.09A1.7 1.7 0 0 0 6.4 7a1.7 1.7 0 0 0-.34-1.88L6 5.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 11 2.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 0 1 3.38 1.42v.09A1.7 1.7 0 0 0 17.6 6.4a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.4 11a1.7 1.7 0 0 0 .6 1l.08.08A2 2 0 0 1 20.66 15h-.09a1.7 1.7 0 0 0-1.17 0z" />',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.layout}</svg>`;
}

function render() {
  applyDisplayMode();
  selectedDateInput.value = state.selectedDate;
  todayLabel.textContent = formatDate(todayISO());

  const active = views.find((view) => view.id === state.activeView) || views[0];
  viewTitle.textContent = active.title;
  viewEyebrow.textContent = active.label;

  renderNav();

  const renderers = {
    dashboard: renderDashboard,
    capture: renderCapture,
    journal: renderJournal,
    planning: renderPlanning,
    projects: renderProjects,
    goals: renderGoals,
    habits: renderHabits,
    learning: renderLearning,
    health: renderHealth,
    work: renderWork,
    reviews: renderReviews,
    settings: renderSettings,
  };

  app.innerHTML = renderers[active.id]() + renderHabitModal() + renderHabitFormModal() + renderWorkEditModal();
}

function renderNav() {
  navList.innerHTML = views
    .map((view) => {
      const isActive = view.id === state.activeView ? "is-active" : "";
      return `
        <button class="nav-button ${isActive}" type="button" data-view="${view.id}">
          <span class="nav-icon">${icon(view.icon)}</span>
          <span class="nav-label">${view.label}</span>
          <span class="nav-count">${escapeHtml(view.count())}</span>
        </button>
      `;
    })
    .join("");
}

function renderDashboard() {
  const selectedJournal = journalForDate(state.selectedDate);
  const todaysTasks = dueTasks();
  const doneToday = state.tasks.filter((task) => task.completedAt?.slice(0, 10) === state.selectedDate).length;
  const goalAverage = Math.round(avg(state.goals.map((goal) => Number(goal.progress) || 0)));
  const habitPercent = percent(habitsDoneToday(), state.habits.length);
  const journalStreakCount = journalStreak();
  const weeklyLearning = learningMinutes(7);
  const weeklyWorkout = workoutMinutes(7);
  const tomorrow = planningDate();
  const tomorrowPlans = plansForDate(tomorrow);

  return `
    <section class="grid four">
      ${metric("layout", "Tugas hari ini", todaysTasks.length, `${doneToday} selesai hari ini`)}
      ${metric("check", "Habit selesai", `${habitPercent}%`, `${habitsDoneToday()} dari ${state.habits.length}`)}
      ${metric("target", "Rata-rata goal", `${goalAverage}%`, `${state.goals.length} goal aktif`)}
      ${metric("journal", "Journal streak", `${journalStreakCount}`, "hari beruntun")}
    </section>

    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Today Command Center</h3>
            <p>${formatDate(state.selectedDate)}</p>
          </div>
          <button class="btn secondary small" type="button" data-view="projects">${icon("arrowRight")}Tasks</button>
        </div>
        <div class="surface-body stack">
          <div>
            <h4 class="section-title">Prioritas</h4>
            <div class="item-list">
              ${todaysTasks.length ? todaysTasks.slice(0, 5).map(taskItem).join("") : emptyState()}
            </div>
          </div>
          <div>
            <h4 class="section-title">Habit</h4>
            <div class="stack">
              ${state.habits.length ? state.habits.map(habitCheck).join("") : emptyState()}
            </div>
          </div>
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Capture Cepat</h3>
            <p>Inbox untuk ide dan lintasan pikiran.</p>
          </div>
        </div>
        <div class="surface-body">
          ${ideaForm("quick")}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Planning Besok</h3>
          <p>${formatDate(tomorrow)} / ${tomorrowPlans.length} agenda tersusun</p>
        </div>
        <button class="btn secondary small" type="button" data-view="planning">${icon("calendar")}Buka Planning</button>
      </div>
      <div class="surface-body item-list">
        ${tomorrowPlans.length ? tomorrowPlans.slice(0, 4).map(nextDayPlanItem).join("") : emptyState()}
      </div>
    </section>

    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Progress Snapshot</h3>
            <p>Ringkasan sampai ${formatDate(state.selectedDate, { short: true })}</p>
          </div>
        </div>
        <div class="surface-body">
          <div class="ring-wrap">
            ${ring("Tasks", percent(doneTasks(), state.tasks.length), "--teal")}
            ${ring("Habits", habitPercent, "--green")}
            ${ring("Goals", goalAverage, "--indigo")}
            ${ring("Energy", selectedJournal ? Number(selectedJournal.energy) * 20 : 0, "--amber")}
          </div>
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>7 Hari Terakhir</h3>
            <p>${weeklyLearning} menit belajar, ${weeklyWorkout} menit workout.</p>
          </div>
        </div>
        <div class="surface-body">
          ${miniChart(lastSevenDays().map((day) => ({
            label: dayName(day),
            value: activityScore(day),
          })))}
        </div>
      </div>
    </section>

    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Journal Hari Ini</h3>
            <p>Mood ${selectedJournal?.mood || "-"} / Energy ${selectedJournal?.energy || "-"}</p>
          </div>
          <button class="btn secondary small" type="button" data-view="journal">${icon("edit")}Buka</button>
        </div>
        <div class="surface-body">
          ${selectedJournal ? journalSummary(selectedJournal) : emptyState()}
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Health Hari Ini</h3>
            <p>${state.meals.filter((meal) => meal.date === state.selectedDate).length} meal, ${dailyWorkoutMinutes(state.selectedDate)} menit workout.</p>
          </div>
          <button class="btn secondary small" type="button" data-view="health">${icon("arrowRight")}Health</button>
        </div>
        <div class="surface-body">
          ${healthTodaySummary()}
        </div>
      </div>
    </section>
  `;
}

function renderCapture() {
  const activeIdeas = state.ideas.filter((idea) => idea.status !== "archived");
  const archivedIdeas = state.ideas.filter((idea) => idea.status === "archived");
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Inbox Ide</h3>
            <p>${activeIdeas.length} ide aktif</p>
          </div>
        </div>
        <div class="surface-body">
          ${ideaForm("full")}
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Daftar Ide</h3>
            <p>Capture, pilih prioritas, arsipkan saat sudah diproses.</p>
          </div>
        </div>
        <div class="surface-body item-list">
          ${activeIdeas.length ? activeIdeas.map(ideaItem).join("") : emptyState()}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Archive</h3>
          <p>${archivedIdeas.length} ide selesai diproses</p>
        </div>
      </div>
      <div class="surface-body item-list">
        ${archivedIdeas.length ? archivedIdeas.slice(0, 10).map(ideaItem).join("") : emptyState()}
      </div>
    </section>
  `;
}

function renderJournal() {
  const selectedJournal = journalForDate(state.selectedDate);
  const recent = [...state.journals].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>${selectedJournal ? "Update Journal" : "Journal Baru"}</h3>
            <p>${formatDate(state.selectedDate)}</p>
          </div>
        </div>
        <div class="surface-body">
          ${journalForm(selectedJournal)}
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Timeline</h3>
            <p>${journalStreak()} hari streak</p>
          </div>
        </div>
        <div class="surface-body timeline">
          ${recent.length ? recent.map(journalTimelineItem).join("") : emptyState()}
        </div>
      </div>
    </section>
  `;
}

function renderPlanning() {
  const planDate = planningDate();
  const plans = plansForDate(planDate);
  const done = plans.filter((plan) => plan.status === "done").length;
  const eventCount = plans.filter((plan) => plan.kind === "event").length;
  const taskCount = plans.filter((plan) => plan.kind === "task").length;
  const plannedMinutes = plans.reduce((sum, plan) => sum + planDurationMinutes(plan), 0);

  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Planning Besok</h3>
            <p>${formatDate(planDate)} / atur 24 jam sebelum hari dimulai.</p>
          </div>
        </div>
        <div class="surface-body">
          ${nextDayPlanForm(planDate)}
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Ringkasan Besok</h3>
            <p>${done} dari ${plans.length} item selesai.</p>
          </div>
        </div>
        <div class="surface-body">
          <div class="planning-summary">
            <div class="planning-stat">
              <span>${plans.length}</span>
              <p>Total agenda</p>
            </div>
            <div class="planning-stat">
              <span>${taskCount}</span>
              <p>Task</p>
            </div>
            <div class="planning-stat">
              <span>${eventCount}</span>
              <p>Event</p>
            </div>
            <div class="planning-stat">
              <span>${formatDuration(plannedMinutes)}</span>
              <p>Terjadwal</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Timeline 24 Jam</h3>
          <p>Susunan event dan task untuk ${formatDate(planDate)}.</p>
        </div>
      </div>
      <div class="surface-body">
        ${nextDayTimeline(planDate)}
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Daftar Planning Besok</h3>
          <p>Urut berdasarkan jam mulai.</p>
        </div>
      </div>
      <div class="surface-body item-list">
        ${plans.length ? plans.map(nextDayPlanItem).join("") : emptyState()}
      </div>
    </section>
  `;
}

function renderProjects() {
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Tambah Project</h3>
            <p>${state.projects.filter((project) => project.status === "active").length} project aktif</p>
          </div>
        </div>
        <div class="surface-body">
          ${projectForm()}
        </div>
      </div>
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Tambah Task</h3>
            <p>${state.tasks.filter((task) => task.status !== "done").length} task terbuka</p>
          </div>
        </div>
        <div class="surface-body">
          ${taskForm()}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Task Board</h3>
          <p>Todo, doing, done.</p>
        </div>
      </div>
      <div class="surface-body">
        <div class="board">
          ${["todo", "doing", "done"].map(taskLane).join("")}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Projects</h3>
          <p>Progress dihitung dari task di dalam project.</p>
        </div>
      </div>
      <div class="surface-body item-list">
        ${state.projects.length ? state.projects.map(projectItem).join("") : emptyState()}
      </div>
    </section>
  `;
}

function renderGoals() {
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Goal Baru</h3>
            <p>Target, kategori, deadline, dan progres.</p>
          </div>
        </div>
        <div class="surface-body">
          ${goalForm()}
        </div>
      </div>
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Goal Statistics</h3>
            <p>${state.goals.filter((goal) => Number(goal.progress) >= 100).length} goal selesai</p>
          </div>
        </div>
        <div class="surface-body">
          <div class="ring-wrap">
            ${ring("Average", Math.round(avg(state.goals.map((goal) => goal.progress))), "--teal")}
            ${ring("Done", percent(state.goals.filter((goal) => Number(goal.progress) >= 100).length, state.goals.length), "--green")}
            ${ring("Soon", percent(state.goals.filter(goalDueSoon).length, state.goals.length), "--amber")}
            ${ring("Open", percent(state.goals.filter((goal) => Number(goal.progress) < 100).length, state.goals.length), "--indigo")}
          </div>
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Goal List</h3>
          <p>Gunakan tombol plus dan minus untuk update progres cepat.</p>
        </div>
      </div>
      <div class="surface-body item-list">
        ${state.goals.length ? state.goals.map(goalItem).join("") : emptyState()}
      </div>
    </section>
  `;
}

function renderHabits() {
  return `
    <section class="surface">
      <div class="surface-header has-controls">
        <div>
          <h3>Kalender Habit Bulanan</h3>
          <p>${state.habits.length} habit aktif / klik tanggal untuk checklist harian.</p>
        </div>
        ${habitCalendarControls()}
      </div>
      <div class="surface-body">
        ${habitCalendar()}
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Habit Progress Bulanan</h3>
          <p>Persentase habit selesai per hari dalam ${monthLabel(state.selectedDate)}.</p>
        </div>
      </div>
      <div class="surface-body">
        ${habitMonthLineChart()}
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Detail Habit Bulanan</h3>
          <p>Rekap per habit untuk ${monthLabel(state.selectedDate)}.</p>
        </div>
      </div>
      <div class="surface-body">
        ${habitMonthlyDetail()}
      </div>
    </section>
  `;
}

function renderLearning() {
  const recent = [...state.learning].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Learning Session</h3>
            <p>${learningMinutes(7)} menit dalam 7 hari</p>
          </div>
        </div>
        <div class="surface-body">
          ${learningForm()}
        </div>
      </div>
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Learning Chart</h3>
            <p>Menit belajar per hari</p>
          </div>
        </div>
        <div class="surface-body">
          ${miniChart(lastSevenDays().map((day) => ({
            label: dayName(day),
            value: state.learning.filter((item) => item.date === day).reduce((sum, item) => sum + Number(item.minutes || 0), 0),
          })))}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Learning Log</h3>
          <p>${state.learning.length} sesi tersimpan</p>
        </div>
      </div>
      <div class="surface-body item-list">
        ${recent.length ? recent.map(learningItem).join("") : emptyState()}
      </div>
    </section>
  `;
}

function renderHealth() {
  const dailyMeals = state.meals.filter((meal) => meal.date === state.selectedDate);
  const dailyWorkouts = state.workouts.filter((workout) => workout.date === state.selectedDate);
  const tdee = calculateTdee();
  const mealGoal = Number(state.healthProfile.mealGoalCalories || 0) || tdee;
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Profil TDEE</h3>
            <p>${tdee ? `${tdee} kcal estimasi harian` : "Lengkapi profil dan BB untuk menghitung TDEE."}</p>
          </div>
        </div>
        <div class="surface-body">
          ${healthProfileForm()}
        </div>
      </div>
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Log Berat Badan</h3>
            <p>${latestWeightLog() ? `${latestWeightLog().weight} kg terakhir` : "Belum ada BB tersimpan."}</p>
          </div>
        </div>
        <div class="surface-body">
          ${weightForm()}
        </div>
      </div>
    </section>

    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Meal Log</h3>
            <p>${dailyMeals.length} meal / ${dailyCalories(state.selectedDate)} dari ${mealGoal || 0} kcal</p>
          </div>
        </div>
        <div class="surface-body">
          ${mealGoalSummary()}
          ${mealForm()}
        </div>
      </div>
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Workout Log</h3>
            <p>${dailyWorkoutMinutes(state.selectedDate)} menit pada ${formatDate(state.selectedDate, { short: true })}</p>
          </div>
        </div>
        <div class="surface-body">
          ${workoutForm()}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header has-controls">
        <div>
          <h3>Progress BB Bulanan</h3>
          <p>Tracking berat badan berdasarkan bulan Januari-Desember.</p>
        </div>
        ${healthCalendarControls()}
      </div>
      <div class="surface-body">
        ${weightMonthPanel()}
      </div>
    </section>

    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Meals Hari Ini</h3>
            <p>${dailyProtein(state.selectedDate)}g protein, ${dailyCalories(state.selectedDate)} kcal.</p>
          </div>
        </div>
        <div class="surface-body item-list">
          ${dailyMeals.length ? dailyMeals.map(mealItem).join("") : emptyState()}
        </div>
      </div>
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Workout Hari Ini</h3>
            <p>${dailyWorkouts.length} log tersimpan</p>
          </div>
        </div>
        <div class="surface-body item-list">
          ${dailyWorkouts.length ? dailyWorkouts.map(workoutItem).join("") : emptyState()}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>History Progress Latihan</h3>
          <p>Pilih exercise untuk melihat riwayat beban dan repetisi.</p>
        </div>
      </div>
      <div class="surface-body">
        ${workoutProgressHistory()}
      </div>
    </section>
  `;
}

function renderWork() {
  const total = state.workApplications.length;
  const notApplied = state.workApplications.filter((application) => application.status === "wishlist").length;
  const applied = workAppliedCount();
  const activePipeline = state.workApplications.filter((application) => ["applied", "screening", "interview"].includes(application.status)).length;
  const actionItems = workActionItems();

  return `
    <section class="surface">
      <div class="surface-header has-controls">
        <div>
          <h3>Kalender Deadline Lamaran</h3>
          <p>Lihat tanggal deadline apply dan klik tanggal untuk detailnya.</p>
        </div>
        ${workCalendarControls()}
      </div>
      <div class="surface-body">
        <div class="work-calendar-layout">
          ${workDeadlineCalendar()}
          ${workSelectedDateDeadlines()}
        </div>
      </div>
    </section>

    <section class="grid four">
      ${metric("briefcase", "Total target", total, "lamaran tersimpan")}
      ${metric("plus", "Belum apply", notApplied, "perlu disiapkan")}
      ${metric("check", "Sudah apply", applied, "terkirim")}
      ${metric("target", "Pipeline aktif", activePipeline, "perlu follow-up")}
    </section>

    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Lamaran Baru</h3>
            <p>Catat target kerja, status, deadline, dan next action.</p>
          </div>
        </div>
        <div class="surface-body">
          ${workApplicationForm()}
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Follow-up Terdekat</h3>
            <p>${actionItems.length} item perlu dipantau.</p>
          </div>
        </div>
        <div class="surface-body item-list">
          ${actionItems.length ? actionItems.slice(0, 6).map(workApplicationItem).join("") : emptyState()}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Pipeline Lamaran</h3>
          <p>Update progress dengan dropdown status pada setiap kartu.</p>
        </div>
      </div>
      <div class="surface-body">
        <div class="board work-board">
          ${workStatuses.map((status) => workLane(status.id)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderReviews() {
  const period = state.reviewPeriod || "weekly";
  const stats = reviewStats(period);
  const recent = [...state.reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  return `
    <section class="grid two">
      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Review Baru</h3>
            <p>Weekly atau monthly.</p>
          </div>
          <div class="segmented" role="tablist" aria-label="Periode review">
            <button type="button" class="${period === "weekly" ? "is-active" : ""}" data-review-period="weekly">Weekly</button>
            <button type="button" class="${period === "monthly" ? "is-active" : ""}" data-review-period="monthly">Monthly</button>
          </div>
        </div>
        <div class="surface-body">
          ${reviewForm(period)}
        </div>
      </div>

      <div class="surface">
        <div class="surface-header">
          <div>
            <h3>Review Metrics</h3>
            <p>${period === "weekly" ? "7" : "30"} hari terakhir</p>
          </div>
        </div>
        <div class="surface-body stack">
          ${reviewMetricLine("Task selesai", stats.tasksDone, stats.tasksTotal)}
          ${reviewMetricLine("Habit selesai", stats.habitsDone, stats.habitsTotal)}
          ${reviewMetricLine("Journal terisi", stats.journals, stats.days)}
          ${reviewMetricLine("Goal progress", stats.goalAverage, 100)}
          <div class="inline">
            <span class="pill teal">${stats.learning} menit belajar</span>
            <span class="pill green">${stats.workouts} menit workout</span>
            <span class="pill amber">${stats.reviews} review</span>
          </div>
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Review History</h3>
          <p>${state.reviews.length} review tersimpan</p>
        </div>
      </div>
      <div class="surface-body timeline">
        ${recent.length ? recent.map(reviewItem).join("") : emptyState()}
      </div>
    </section>
  `;
}

function renderSettings() {
  const modes = [
    {
      id: "auto",
      title: "Auto",
      detail: "Mengikuti ukuran layar perangkat yang sedang dipakai.",
      icon: "layout",
    },
    {
      id: "desktop",
      title: "Desktop",
      detail: "Sidebar tetap di kiri dan area kerja dibuat lega.",
      icon: "folder",
    },
    {
      id: "mobile",
      title: "Mobile",
      detail: "Navigasi compact dan semua modul dibuat satu kolom.",
      icon: "journal",
    },
  ];

  return `
    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Mode Tampilan</h3>
          <p>Pilih cara aplikasi ditampilkan di perangkat ini.</p>
        </div>
      </div>
      <div class="surface-body">
        <div class="mode-grid">
          ${modes.map((mode) => `
            <button class="mode-card ${state.displayMode === mode.id ? "is-active" : ""}" type="button" data-display-mode="${mode.id}" aria-pressed="${state.displayMode === mode.id}">
              <span class="mode-card-icon">${icon(mode.icon)}</span>
              <span>
                <strong>${mode.title}</strong>
                <small>${mode.detail}</small>
              </span>
            </button>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <div>
          <h3>Status Tampilan</h3>
          <p>Mode aktif: ${displayModeLabel(state.displayMode)}</p>
        </div>
      </div>
      <div class="surface-body stack">
        <div class="inline">
          <span class="pill teal">${displayModeLabel(state.displayMode)}</span>
          <span class="pill">${window.innerWidth}px viewport</span>
        </div>
        <p class="muted">Mode Mobile memaksa layout satu kolom walau layar besar. Mode Desktop memaksa layout sidebar kiri walau layar kecil. Mode Auto mengikuti breakpoint bawaan aplikasi.</p>
      </div>
    </section>
  `;
}

function metric(iconName, label, value, detail) {
  return `
    <div class="surface metric">
      <span class="metric-icon">${icon(iconName)}</span>
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <p class="meta">${escapeHtml(detail)}</p>
      </div>
    </div>
  `;
}

function ring(label, value, colorVar) {
  const safeValue = clamp(value, 0, 100);
  return `
    <div>
      <div class="ring" style="--value:${safeValue}%; --ring-color:var(${colorVar});">
        <span>${safeValue}%</span>
      </div>
      <div class="ring-label">${escapeHtml(label)}</div>
    </div>
  `;
}

function miniChart(points) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return `
    <div class="mini-chart">
      ${points.map((point) => `
        <div class="bar-slot" title="${escapeHtml(point.value)}">
          <div class="bar" style="--height:${Math.max(6, percent(point.value, max))}%"></div>
          <span>${escapeHtml(point.label)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function ideaForm(scope) {
  return `
    <form class="form-grid" data-form="idea">
      <div class="field">
        <label for="ideaTitle-${scope}">Ide</label>
        <input id="ideaTitle-${scope}" name="title" required placeholder="Tulis ide..." />
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="ideaArea-${scope}">Area</label>
          <input id="ideaArea-${scope}" name="area" placeholder="Personal, career, health" />
        </div>
        <div class="field">
          <label for="ideaPriority-${scope}">Prioritas</label>
          <select id="ideaPriority-${scope}" name="priority">
            <option>Low</option>
            <option selected>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="ideaNotes-${scope}">Catatan</label>
        <textarea id="ideaNotes-${scope}" name="notes" placeholder="Konteks singkat, langkah berikutnya, atau link."></textarea>
      </div>
      <button class="btn" type="submit">${icon("plus")}Capture</button>
    </form>
  `;
}

function journalForm(journal) {
  return `
    <form class="form-grid" data-form="journal">
      <div class="form-grid two">
        <div class="field">
          <label for="journalMood">Mood</label>
          <select id="journalMood" name="mood">
            ${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${Number(journal?.mood) === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="journalEnergy">Energy</label>
          <select id="journalEnergy" name="energy">
            ${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${Number(journal?.energy) === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </div>
      </div>
      ${textareaField("gratitude", "Gratitude", journal?.gratitude)}
      ${textareaField("win", "Win", journal?.win)}
      ${textareaField("reflection", "Reflection", journal?.reflection)}
      ${textareaField("next", "Next Action", journal?.next)}
      <button class="btn" type="submit">${icon("check")}Simpan Journal</button>
    </form>
  `;
}

function projectForm() {
  return `
    <form class="form-grid" data-form="project">
      <div class="field">
        <label for="projectName">Nama project</label>
        <input id="projectName" name="name" required placeholder="Nama project" />
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="projectArea">Area</label>
          <input id="projectArea" name="area" placeholder="Career, health, finance" />
        </div>
        <div class="field">
          <label for="projectStatus">Status</label>
          <select id="projectStatus" name="status">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <button class="btn" type="submit">${icon("plus")}Tambah Project</button>
    </form>
  `;
}

function nextDayPlanForm(planDate) {
  const startTime = defaultPlanStartTime(planDate);
  const endTime = normalizePlanEnd(startTime, "");

  return `
    <form class="form-grid" data-form="nextDayPlan">
      <input type="hidden" name="date" value="${planDate}" />
      <div class="field">
        <label for="planTitle">Event / Task</label>
        <input id="planTitle" name="title" required placeholder="Contoh: deep work portfolio, meeting, workout" />
      </div>
      <div class="form-grid three">
        <div class="field">
          <label for="planKind">Tipe</label>
          <select id="planKind" name="kind">
            <option value="task">Task</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div class="field">
          <label for="planStart">Mulai</label>
          <input id="planStart" name="startTime" type="time" value="${startTime}" required />
        </div>
        <div class="field">
          <label for="planEnd">Selesai</label>
          <input id="planEnd" name="endTime" type="time" value="${endTime}" required />
        </div>
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="planPriority">Prioritas</label>
          <select id="planPriority" name="priority">
            <option>Low</option>
            <option selected>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div class="field">
          <label for="planArea">Area</label>
          <input id="planArea" name="area" placeholder="Career, health, family, belajar" />
        </div>
      </div>
      ${textareaField("notes", "Catatan", "")}
      <button class="btn" type="submit">${icon("plus")}Tambah ke Planning Besok</button>
    </form>
  `;
}

function taskForm() {
  return `
    <form class="form-grid" data-form="task">
      <div class="field">
        <label for="taskTitle">Task</label>
        <input id="taskTitle" name="title" required placeholder="Apa yang perlu dikerjakan?" />
      </div>
      <div class="form-grid three">
        <div class="field">
          <label for="taskProject">Project</label>
          <select id="taskProject" name="projectId">
            <option value="">Inbox</option>
            ${state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="taskDue">Due</label>
          <input id="taskDue" name="due" type="date" value="${state.selectedDate}" />
        </div>
        <div class="field">
          <label for="taskPriority">Prioritas</label>
          <select id="taskPriority" name="priority">
            <option>Low</option>
            <option selected>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>
      <button class="btn" type="submit">${icon("plus")}Tambah Task</button>
    </form>
  `;
}

function goalForm() {
  return `
    <form class="form-grid" data-form="goal">
      <div class="field">
        <label for="goalTitle">Goal</label>
        <input id="goalTitle" name="title" required placeholder="Outcome yang ingin dicapai" />
      </div>
      <div class="form-grid three">
        <div class="field">
          <label for="goalCategory">Kategori</label>
          <input id="goalCategory" name="category" placeholder="Health, career, finance" />
        </div>
        <div class="field">
          <label for="goalTarget">Target date</label>
          <input id="goalTarget" name="targetDate" type="date" value="${addDays(state.selectedDate, 30)}" />
        </div>
        <div class="field">
          <label for="goalProgress">Progress</label>
          <input id="goalProgress" name="progress" type="number" min="0" max="100" value="0" />
        </div>
      </div>
      <button class="btn" type="submit">${icon("plus")}Tambah Goal</button>
    </form>
  `;
}

function habitForm() {
  return `
    <form class="form-grid" data-form="habit">
      <div class="field">
        <label for="habitName">Habit</label>
        <input id="habitName" name="name" required placeholder="Contoh: baca 20 menit" />
      </div>
      <div class="form-grid three">
        <div class="field">
          <label for="habitArea">Area</label>
          <select id="habitArea" name="area">
            ${habitAreas.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="habitFrequency">Frekuensi</label>
          <select id="habitFrequency" name="frequency">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div class="field">
          <label for="habitTarget">Target/minggu</label>
          <input id="habitTarget" name="targetPerWeek" type="number" min="1" max="7" value="5" />
        </div>
      </div>
      <button class="btn" type="submit">${icon("plus")}Tambah Habit</button>
    </form>
  `;
}

function learningForm() {
  return `
    <form class="form-grid" data-form="learning">
      <div class="form-grid two">
        <div class="field">
          <label for="learningTopic">Topik</label>
          <input id="learningTopic" name="topic" required placeholder="Apa yang dipelajari?" />
        </div>
        <div class="field">
          <label for="learningResource">Resource</label>
          <input id="learningResource" name="resource" placeholder="Buku, video, course" />
        </div>
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="learningDate">Tanggal</label>
          <input id="learningDate" name="date" type="date" value="${state.selectedDate}" />
        </div>
        <div class="field">
          <label for="learningMinutes">Menit</label>
          <input id="learningMinutes" name="minutes" type="number" min="1" value="30" />
        </div>
      </div>
      ${textareaField("notes", "Notes", "")}
      <button class="btn" type="submit">${icon("plus")}Tambah Session</button>
    </form>
  `;
}

function workApplicationForm() {
  return `
    <form class="form-grid" data-form="workApplication">
      <div class="form-grid two">
        <div class="field">
          <label for="workCompany">Perusahaan</label>
          <input id="workCompany" name="company" required placeholder="Nama perusahaan" />
        </div>
        <div class="field">
          <label for="workRole">Posisi</label>
          <input id="workRole" name="role" required placeholder="Contoh: Junior Architect" />
        </div>
      </div>
      <div class="form-grid three">
        <div class="field">
          <label for="workStatus">Status</label>
          <select id="workStatus" name="status">
            ${workStatuses.map((status) => `<option value="${status.id}">${escapeHtml(status.label)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="workPriority">Prioritas</label>
          <select id="workPriority" name="priority">
            <option>Low</option>
            <option selected>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div class="field">
          <label for="workDeadline">Deadline apply</label>
          <input id="workDeadline" name="deadline" type="date" />
        </div>
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="workAppliedDate">Tanggal apply</label>
          <input id="workAppliedDate" name="appliedDate" type="date" />
        </div>
        <div class="field">
          <label for="workSource">Sumber</label>
          <input id="workSource" name="source" placeholder="LinkedIn, Glints, website, referral" />
        </div>
      </div>
      <div class="field">
        <label for="workLink">Link lowongan</label>
        <input id="workLink" name="link" placeholder="https://..." />
      </div>
      <div class="field">
        <label for="workNextAction">Next action</label>
        <input id="workNextAction" name="nextAction" placeholder="Kirim CV, follow-up HR, siapkan portfolio..." />
      </div>
      ${textareaField("notes", "Catatan", "")}
      <button class="btn" type="submit">${icon("plus")}Tambah Lamaran</button>
    </form>
  `;
}

function workApplicationEditForm(application) {
  return `
    <form class="form-grid" data-form="workApplicationEdit" data-work-edit-form="${application.id}">
      <div class="form-grid two">
        <div class="field">
          <label for="workEditCompany">Perusahaan</label>
          <input id="workEditCompany" name="company" required value="${escapeHtml(application.company || "")}" />
        </div>
        <div class="field">
          <label for="workEditRole">Posisi</label>
          <input id="workEditRole" name="role" required value="${escapeHtml(application.role || "")}" />
        </div>
      </div>
      <div class="form-grid three">
        <div class="field">
          <label for="workEditStatus">Status</label>
          <select id="workEditStatus" name="status">
            ${workStatuses.map((status) => `<option value="${status.id}" ${application.status === status.id ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="workEditPriority">Prioritas</label>
          <select id="workEditPriority" name="priority">
            ${["Low", "Medium", "High"].map((priority) => `<option ${application.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="workEditDeadline">Deadline apply</label>
          <input id="workEditDeadline" name="deadline" type="date" value="${escapeHtml(application.deadline || "")}" />
        </div>
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="workEditAppliedDate">Tanggal apply</label>
          <input id="workEditAppliedDate" name="appliedDate" type="date" value="${escapeHtml(application.appliedDate || "")}" />
        </div>
        <div class="field">
          <label for="workEditSource">Sumber</label>
          <input id="workEditSource" name="source" value="${escapeHtml(application.source || "")}" />
        </div>
      </div>
      <div class="field">
        <label for="workEditLink">Link lowongan</label>
        <input id="workEditLink" name="link" value="${escapeHtml(application.link || "")}" />
      </div>
      <div class="field">
        <label for="workEditNextAction">Next action</label>
        <input id="workEditNextAction" name="nextAction" value="${escapeHtml(application.nextAction || "")}" />
      </div>
      <div class="field">
        <label for="workEditNotes">Catatan</label>
        <textarea id="workEditNotes" name="notes">${escapeHtml(application.notes || "")}</textarea>
      </div>
      <button class="btn" type="submit">${icon("check")}Simpan Perubahan</button>
    </form>
  `;
}

function renderWorkEditModal() {
  if (!state.workEditId) return "";
  const application = state.workApplications.find((item) => item.id === state.workEditId);
  if (!application) return "";

  return `
    <div class="modal-backdrop" role="presentation" data-close-work-edit>
      <section class="modal-panel modal-panel-form" role="dialog" aria-modal="true" aria-label="Edit lamaran ${escapeHtml(application.company || "")}">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Edit Lamaran</p>
            <h3>${escapeHtml(application.company || "Lamaran")}</h3>
            <p class="meta">${escapeHtml(application.role || "Posisi belum diisi")}</p>
          </div>
          <button class="icon-button" type="button" data-close-work-edit title="Tutup" aria-label="Tutup">${icon("x")}</button>
        </div>
        <div class="modal-body">
          ${workApplicationEditForm(application)}
        </div>
      </section>
    </div>
  `;
}

function workCalendarControls() {
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  const selectedMonth = selected.getMonth();
  const selectedYear = selected.getFullYear();
  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(selectedYear, index, 1)),
  }));

  return `
    <div class="calendar-controls" aria-label="Pilih bulan dan tahun deadline lamaran">
      <div class="field">
        <label for="workCalendarMonth">Bulan</label>
        <select id="workCalendarMonth" data-work-month>
          ${months.map((month) => `<option value="${month.value}" ${month.value === selectedMonth ? "selected" : ""}>${escapeHtml(month.label)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="workCalendarYear">Tahun</label>
        <select id="workCalendarYear" data-work-year>
          ${workYearOptions(selectedYear).map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`).join("")}
        </select>
      </div>
      <button class="btn secondary small" type="button" data-work-today>${icon("target")}Hari ini</button>
    </div>
  `;
}

function workDeadlineCalendar() {
  const days = monthCalendarDays(state.selectedDate);
  return `
    <div class="habit-calendar work-calendar" aria-label="Kalender deadline lamaran ${escapeHtml(monthLabel(state.selectedDate))}">
      ${["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
      ${days.map((day) => {
        if (!day) return '<div class="calendar-day is-empty" aria-hidden="true"></div>';
        const deadlines = workDeadlinesForDate(day);
        const selected = day === state.selectedDate ? "is-selected" : "";
        const tone = deadlines.length ? "tone-75 has-deadline" : "tone-0";
        const label = deadlines.length ? `${deadlines.length} deadline` : "Tidak ada deadline";
        return `
          <button class="calendar-day work-deadline-day ${tone} ${selected}" type="button" data-work-date="${day}" aria-label="${formatDate(day)} ${label}">
            <span>${Number(day.slice(-2))}</span>
            <strong>${deadlines.length || "-"}</strong>
            <small>${deadlines[0] ? escapeHtml(deadlines[0].company || deadlines[0].role || "Lamaran") : "Deadline"}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function workSelectedDateDeadlines() {
  const deadlines = workDeadlinesForDate(state.selectedDate);
  return `
    <aside class="work-deadline-panel">
      <div>
        <p class="eyebrow">Tanggal Terpilih</p>
        <h4>${formatDate(state.selectedDate)}</h4>
        <p class="meta">${deadlines.length} deadline lamaran</p>
      </div>
      <div class="item-list">
        ${deadlines.length ? deadlines.map(workDeadlineItem).join("") : emptyState()}
      </div>
    </aside>
  `;
}

function workDeadlineItem(application) {
  const status = workStatus(application.status);
  return `
    <article class="item work-deadline-item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(application.company || "Perusahaan")}</strong>
          <p class="meta">${escapeHtml(application.role || "Posisi")} / ${escapeHtml(application.nextAction || "Belum ada next action")}</p>
        </div>
        <span class="pill ${status.tone}">${escapeHtml(status.label)}</span>
      </div>
      <div class="item-actions">
        <button class="icon-button" type="button" data-open-work-edit="${application.id}" title="Edit lamaran" aria-label="Edit lamaran">${icon("edit")}</button>
      </div>
    </article>
  `;
}

function healthProfileForm() {
  const profile = state.healthProfile;
  const tdee = calculateTdee();
  return `
    <form class="form-grid" data-form="healthProfile">
      <div class="form-grid two">
        <div class="field">
          <label for="healthHeight">Tinggi badan cm</label>
          <input id="healthHeight" name="height" type="number" min="1" value="${escapeHtml(profile.height || "")}" placeholder="170" />
        </div>
        <div class="field">
          <label for="healthAge">Umur</label>
          <input id="healthAge" name="age" type="number" min="1" value="${escapeHtml(profile.age || "")}" placeholder="25" />
        </div>
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="healthActivity">Tingkat aktivitas</label>
          <select id="healthActivity" name="activityLevel">
            ${activityLevels.map((level) => `<option value="${level.id}" ${profile.activityLevel === level.id ? "selected" : ""}>${level.label} (${level.factor})</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="healthMealGoal">Goal kalori meal</label>
          <input id="healthMealGoal" name="mealGoalCalories" type="number" min="0" value="${escapeHtml(profile.mealGoalCalories || tdee || "")}" placeholder="Auto dari TDEE" />
        </div>
      </div>
      <div class="inline">
        <span class="pill teal">TDEE ${tdee || 0} kcal</span>
        <span class="pill amber">BB ${latestWeightLog()?.weight || "-"} kg</span>
      </div>
      <button class="btn" type="submit">${icon("check")}Simpan Profil</button>
    </form>
  `;
}

function weightForm() {
  const existing = weightLogForDate(state.selectedDate);
  return `
    <form class="form-grid" data-form="weight">
      <div class="form-grid two">
        <div class="field">
          <label for="weightDate">Tanggal</label>
          <input id="weightDate" name="date" type="date" value="${state.selectedDate}" />
        </div>
        <div class="field">
          <label for="weightValue">BB kg</label>
          <input id="weightValue" name="weight" type="number" min="1" step="0.1" required value="${escapeHtml(existing?.weight || "")}" placeholder="Contoh: 72.5" />
        </div>
      </div>
      ${textareaField("notes", "Catatan", existing?.notes || "")}
      <button class="btn" type="submit">${icon("plus")}Simpan BB</button>
    </form>
  `;
}

function mealGoalSummary() {
  const goal = Number(state.healthProfile.mealGoalCalories || 0) || calculateTdee();
  const calories = dailyCalories(state.selectedDate);
  const value = goal ? percent(calories, goal) : 0;
  return `
    <div class="progress-line meal-goal-summary">
      <div class="item-main">
        <strong>Progress kalori harian</strong>
        <span class="pill ${value <= 100 ? "teal" : "rose"}">${calories}/${goal || 0} kcal</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="--value:${Math.min(value, 100)}%"></div></div>
      <p class="meta">Sisa ${Math.max((goal || 0) - calories, 0)} kcal dari goal meal tracker.</p>
    </div>
  `;
}

function healthCalendarControls() {
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  const selectedMonth = selected.getMonth();
  const selectedYear = selected.getFullYear();
  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(selectedYear, index, 1)),
  }));

  return `
    <div class="calendar-controls" aria-label="Pilih bulan dan tahun health">
      <div class="field">
        <label for="healthCalendarMonth">Bulan</label>
        <select id="healthCalendarMonth" data-health-month>
          ${months.map((month) => `<option value="${month.value}" ${month.value === selectedMonth ? "selected" : ""}>${escapeHtml(month.label)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="healthCalendarYear">Tahun</label>
        <select id="healthCalendarYear" data-health-year>
          ${healthYearOptions(selectedYear).map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`).join("")}
        </select>
      </div>
      <button class="btn secondary small" type="button" data-health-today>${icon("target")}Hari ini</button>
    </div>
  `;
}

function weightMonthPanel() {
  const days = monthDays(state.selectedDate);
  const logs = days.map((day) => weightLogForDate(day)).filter(Boolean);
  const latest = latestWeightLog();
  const first = logs[0];
  const last = logs[logs.length - 1];
  const delta = first && last ? Number(last.weight) - Number(first.weight) : 0;

  return `
    <div class="inline">
      <span class="pill teal">BB terkini ${latest ? `${latest.weight} kg` : "-"}</span>
      <span class="pill ${delta > 0 ? "amber" : "green"}">Delta ${logs.length >= 2 ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg` : "-"}</span>
      <span class="pill indigo">TDEE ${calculateTdee() || 0} kcal</span>
      <span class="pill">${logs.length} log bulan ini</span>
    </div>
    <div class="weight-chart-block">
      ${weightLineChart(days)}
    </div>
    <div class="item-list">
      ${logs.length ? logs.map(weightItem).join("") : emptyState()}
    </div>
  `;
}

function mealForm() {
  return `
    <form class="form-grid" data-form="meal">
      <div class="form-grid two">
        <div class="field">
          <label for="mealType">Meal</label>
          <select id="mealType" name="type">
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snack</option>
          </select>
        </div>
        <div class="field">
          <label for="mealDate">Tanggal</label>
          <input id="mealDate" name="date" type="date" value="${state.selectedDate}" />
        </div>
      </div>
      <div class="field">
        <label for="mealFood">Makanan</label>
        <input id="mealFood" name="food" required placeholder="Menu utama" />
      </div>
      <div class="form-grid two">
        <div class="field">
          <label for="mealProtein">Protein gram</label>
          <input id="mealProtein" name="protein" type="number" min="0" value="0" />
        </div>
        <div class="field">
          <label for="mealCalories">Calories</label>
          <input id="mealCalories" name="calories" type="number" min="0" value="0" />
        </div>
      </div>
      <button class="btn" type="submit">${icon("plus")}Tambah Meal</button>
    </form>
  `;
}

function workoutForm() {
  const program = state.selectedWorkoutProgram || "Push A";
  const isStrength = strengthPrograms.includes(program);
  return `
    <form class="form-grid" data-form="workout">
      <div class="form-grid two">
        <div class="field">
          <label for="workoutProgram">Program</label>
          <select id="workoutProgram" name="program" data-workout-program>
            ${workoutProgramNames.map((name) => `<option value="${escapeHtml(name)}" ${program === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="workoutDate">Tanggal</label>
          <input id="workoutDate" name="date" type="date" value="${state.selectedDate}" />
        </div>
      </div>
      ${isStrength ? strengthWorkoutFields(program) : simpleWorkoutFields(program)}
      <button class="btn" type="submit">${icon("plus")}Tambah Workout</button>
    </form>
  `;
}

function strengthWorkoutFields(program) {
  return `
    <div class="workout-program-stack">
      ${workoutPrograms[program].map((exercise, exerciseIndex) => exerciseSetCard(program, exercise, exerciseIndex)).join("")}
    </div>
    ${textareaField("notes", "Catatan workout", "")}
  `;
}

function exerciseSetCard(program, exercise, exerciseIndex) {
  const setCount = workoutSetCount(exercise);
  return `
    <article class="exercise-card">
      <div class="exercise-header">
        <div>
          <strong>${escapeHtml(exercise)}</strong>
          <p class="meta">${program}</p>
        </div>
        <div class="item-actions">
          <button class="icon-button" type="button" data-workout-set-action="remove" data-exercise-name="${escapeHtml(exercise)}" title="Kurangi set" aria-label="Kurangi set">${icon("minus")}</button>
          <button class="icon-button" type="button" data-workout-set-action="add" data-exercise-name="${escapeHtml(exercise)}" title="Tambah set" aria-label="Tambah set">${icon("plus")}</button>
        </div>
      </div>
      <div class="set-grid">
        ${Array.from({ length: setCount }, (_, setIndex) => {
          const previous = previousWorkoutSet(program, exercise, setIndex, state.selectedDate);
          return `
            <div class="set-row">
              <span class="set-number">Set ${setIndex + 1}</span>
              <label>
                <span>Beban kg</span>
                <input name="weight_${exerciseIndex}_${setIndex}" type="number" min="0" step="0.5" placeholder="0" />
              </label>
              <label>
                <span>Reps</span>
                <input name="reps_${exerciseIndex}_${setIndex}" type="number" min="0" step="1" placeholder="0" />
              </label>
              <small>${previous ? `Sebelumnya: ${previous.weight}kg x ${previous.reps}` : "Sebelumnya: -"}</small>
            </div>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function simpleWorkoutFields(program) {
  return `
    <div class="form-grid two">
      <div class="field">
        <label for="simpleWorkoutActivity">Latihan</label>
        <input id="simpleWorkoutActivity" name="activity" required placeholder="${program === "Other" ? "Nama latihan" : program}" />
      </div>
      <div class="field">
        <label for="simpleWorkoutMinutes">Menit</label>
        <input id="simpleWorkoutMinutes" name="minutes" type="number" min="1" value="30" />
      </div>
    </div>
    ${textareaField("notes", "Keterangan", "")}
  `;
}

function reviewForm(period) {
  return `
    <form class="form-grid" data-form="review">
      <input type="hidden" name="period" value="${period}" />
      <div class="form-grid two">
        <div class="field">
          <label for="reviewDate">Tanggal</label>
          <input id="reviewDate" name="date" type="date" value="${state.selectedDate}" />
        </div>
        <div class="field">
          <label for="reviewScore">Score</label>
          <input id="reviewScore" name="score" type="number" min="1" max="10" value="7" />
        </div>
      </div>
      ${textareaField("wins", "Wins", "")}
      ${textareaField("lessons", "Lessons", "")}
      ${textareaField("challenges", "Challenges", "")}
      ${textareaField("focus", "Next Focus", "")}
      <button class="btn" type="submit">${icon("check")}Simpan Review</button>
    </form>
  `;
}

function textareaField(name, label, value = "") {
  const id = `${name}-${Math.random().toString(36).slice(2, 7)}`;
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <textarea id="${id}" name="${name}">${escapeHtml(value)}</textarea>
    </div>
  `;
}

function ideaItem(idea) {
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(idea.title)}</strong>
          <p class="meta">${escapeHtml(idea.notes || "Tanpa catatan")}</p>
        </div>
        <div class="item-actions">
          <span class="pill ${priorityTone(idea.priority)}">${escapeHtml(idea.priority || "Medium")}</span>
          <button class="icon-button" type="button" data-idea-archive="${idea.id}" title="${idea.status === "archived" ? "Aktifkan ide" : "Arsipkan ide"}" aria-label="${idea.status === "archived" ? "Aktifkan ide" : "Arsipkan ide"}">${icon("check")}</button>
          <button class="icon-button" type="button" data-delete-type="ideas" data-delete-id="${idea.id}" title="Hapus ide" aria-label="Hapus ide">${icon("trash")}</button>
        </div>
      </div>
      <div class="inline">
        <span class="pill">${escapeHtml(idea.area || "Inbox")}</span>
        <span class="pill">${formatDate(idea.createdAt?.slice(0, 10) || todayISO(), { short: true })}</span>
      </div>
    </article>
  `;
}

function nextDayTimeline(date) {
  return `
    <div class="planning-timeline" aria-label="Timeline planning ${escapeHtml(formatDate(date))}">
      ${Array.from({ length: 24 }, (_, hour) => {
        const hourPlans = plansForHour(date, hour);
        return `
          <div class="planning-hour">
            <div class="planning-time">${String(hour).padStart(2, "0")}:00</div>
            <div class="planning-slot">
              ${hourPlans.length ? hourPlans.map(planCard).join("") : '<span class="planning-hour-empty">Kosong</span>'}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function planCard(plan) {
  const done = plan.status === "done";
  return `
    <article class="plan-card is-${escapeHtml(plan.kind)} ${done ? "is-done" : ""}">
      <div class="plan-card-header">
        <div>
          <strong>${escapeHtml(plan.title)}</strong>
          <p class="meta">${escapeHtml(plan.area || "General")} / ${planTimeRange(plan)}</p>
        </div>
        <div class="item-actions">
          <span class="pill ${plan.kind === "event" ? "teal" : "indigo"}">${plan.kind === "event" ? "Event" : "Task"}</span>
          <span class="pill ${priorityTone(plan.priority)}">${escapeHtml(plan.priority || "Medium")}</span>
        </div>
      </div>
      ${plan.notes ? `<p class="meta">${escapeHtml(plan.notes)}</p>` : ""}
    </article>
  `;
}

function nextDayPlanItem(plan) {
  const done = plan.status === "done";
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(plan.title)}</strong>
          <p class="meta">${planTimeRange(plan)} / ${escapeHtml(plan.area || "General")} / ${escapeHtml(plan.kind === "event" ? "Event" : "Task")}</p>
        </div>
        <div class="item-actions">
          <span class="pill ${done ? "green" : priorityTone(plan.priority)}">${done ? "Done" : escapeHtml(plan.priority || "Medium")}</span>
          <button class="icon-button" type="button" data-toggle-plan="${plan.id}" title="${done ? "Batalkan selesai" : "Tandai selesai"}" aria-label="${done ? "Batalkan selesai" : "Tandai selesai"}">${icon("check")}</button>
          <button class="icon-button" type="button" data-delete-type="nextDayPlans" data-delete-id="${plan.id}" title="Hapus planning" aria-label="Hapus planning">${icon("trash")}</button>
        </div>
      </div>
      ${plan.notes ? `<p class="meta">${escapeHtml(plan.notes)}</p>` : ""}
    </article>
  `;
}

function taskItem(task) {
  const project = state.projects.find((item) => item.id === task.projectId);
  const overdue = task.due && task.due < state.selectedDate && task.status !== "done";
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <p class="meta">${escapeHtml(project?.name || "Inbox")} ${task.due ? " / " + formatDate(task.due, { short: true }) : ""}</p>
        </div>
        <div class="item-actions">
          <span class="pill ${overdue ? "rose" : priorityTone(task.priority)}">${overdue ? "Overdue" : escapeHtml(task.priority || "Medium")}</span>
          ${taskStatusButtons(task)}
        </div>
      </div>
    </article>
  `;
}

function taskLane(status) {
  const labels = { todo: "Todo", doing: "Doing", done: "Done" };
  const tasks = state.tasks.filter((task) => task.status === status).sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  return `
    <div class="lane">
      <h4>${labels[status]} (${tasks.length})</h4>
      <div class="lane-body">
        ${tasks.length ? tasks.map(taskBoardItem).join("") : emptyState()}
      </div>
    </div>
  `;
}

function taskBoardItem(task) {
  const project = state.projects.find((item) => item.id === task.projectId);
  return `
    <article class="task-row">
      <strong>${escapeHtml(task.title)}</strong>
      <div class="inline">
        <span class="pill">${escapeHtml(project?.name || "Inbox")}</span>
        <span class="pill ${priorityTone(task.priority)}">${escapeHtml(task.priority || "Medium")}</span>
        <span class="pill">${task.due ? formatDate(task.due, { short: true }) : "No due"}</span>
      </div>
      <div class="item-actions">
        ${taskStatusButtons(task)}
        <button class="icon-button" type="button" data-delete-type="tasks" data-delete-id="${task.id}" title="Hapus task" aria-label="Hapus task">${icon("trash")}</button>
      </div>
    </article>
  `;
}

function taskStatusButtons(task) {
  const statuses = [
    ["todo", "Todo"],
    ["doing", "Doing"],
    ["done", "Done"],
  ];
  return `
    <div class="segmented" aria-label="Status task">
      ${statuses.map(([status, label]) => `<button type="button" class="${task.status === status ? "is-active" : ""}" data-task-status="${status}" data-task-id="${task.id}">${label}</button>`).join("")}
    </div>
  `;
}

function workLane(statusId) {
  const status = workStatus(statusId);
  const applications = state.workApplications
    .filter((application) => application.status === statusId)
    .sort(workApplicationSorter);

  return `
    <div class="lane work-lane">
      <h4>${escapeHtml(status.label)} (${applications.length})</h4>
      <div class="lane-body">
        ${applications.length ? applications.map(workApplicationItem).join("") : emptyState()}
      </div>
    </div>
  `;
}

function workApplicationItem(application) {
  const status = workStatus(application.status);
  const progress = workProgress(application.status);
  const link = safeUrl(application.link);
  const deadlineTone = workDeadlineTone(application);
  return `
    <article class="task-row work-card">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(application.role || "Posisi belum diisi")}</strong>
          <p class="meta">${escapeHtml(application.company || "Perusahaan")} ${application.source ? " / " + escapeHtml(application.source) : ""}</p>
        </div>
        <span class="pill ${status.tone}">${escapeHtml(status.label)}</span>
      </div>
      <div class="inline">
        <span class="pill ${priorityTone(application.priority)}">${escapeHtml(application.priority || "Medium")}</span>
        ${application.deadline ? `<span class="pill ${deadlineTone}">Deadline ${formatDate(application.deadline, { short: true })}</span>` : '<span class="pill">No deadline</span>'}
        ${application.appliedDate ? `<span class="pill teal">Apply ${formatDate(application.appliedDate, { short: true })}</span>` : '<span class="pill amber">Belum apply</span>'}
      </div>
      <div class="progress-line">
        <div class="progress-track"><div class="progress-fill" style="--value:${progress}%"></div></div>
        <p class="meta">Progress ${progress}% / ${escapeHtml(application.nextAction || "Belum ada next action")}</p>
      </div>
      ${application.notes ? `<p class="meta">${escapeHtml(application.notes)}</p>` : ""}
      <div class="work-card-footer">
        <label class="work-card-status">
          <span>Status</span>
          <select class="status-select" data-work-status-select data-work-id="${application.id}">
            ${workStatuses.map((item) => `<option value="${item.id}" ${application.status === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>
        <div class="item-actions">
          <button class="icon-button" type="button" data-open-work-edit="${application.id}" title="Edit lamaran" aria-label="Edit lamaran">${icon("edit")}</button>
          ${link ? `<a class="btn secondary small" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">${icon("arrowRight")}Link</a>` : ""}
          <button class="icon-button" type="button" data-delete-type="workApplications" data-delete-id="${application.id}" title="Hapus lamaran" aria-label="Hapus lamaran">${icon("trash")}</button>
        </div>
      </div>
    </article>
  `;
}

function projectItem(project) {
  const tasks = state.tasks.filter((task) => task.projectId === project.id);
  const done = tasks.filter((task) => task.status === "done").length;
  const value = percent(done, tasks.length);
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(project.name)}</strong>
          <p class="meta">${escapeHtml(project.area || "Area")} / ${tasks.length} task</p>
        </div>
        <div class="item-actions">
          <span class="pill ${project.status === "done" ? "green" : "teal"}">${escapeHtml(project.status)}</span>
          <button class="icon-button" type="button" data-delete-type="projects" data-delete-id="${project.id}" title="Hapus project" aria-label="Hapus project">${icon("trash")}</button>
        </div>
      </div>
      <div class="progress-line">
        <div class="progress-track"><div class="progress-fill" style="--value:${value}%"></div></div>
        <p class="meta">${value}% selesai</p>
      </div>
    </article>
  `;
}

function goalItem(goal) {
  const progress = clamp(goal.progress, 0, 100);
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(goal.title)}</strong>
          <p class="meta">${escapeHtml(goal.category || "General")} / target ${formatDate(goal.targetDate, { short: true })}</p>
        </div>
        <div class="item-actions">
          <button class="icon-button" type="button" data-goal-delta="-5" data-goal-id="${goal.id}" title="Kurangi progres" aria-label="Kurangi progres">${icon("minus")}</button>
          <button class="icon-button" type="button" data-goal-delta="5" data-goal-id="${goal.id}" title="Tambah progres" aria-label="Tambah progres">${icon("plus")}</button>
          <button class="icon-button" type="button" data-delete-type="goals" data-delete-id="${goal.id}" title="Hapus goal" aria-label="Hapus goal">${icon("trash")}</button>
        </div>
      </div>
      <div class="progress-line">
        <div class="progress-track"><div class="progress-fill" style="--value:${progress}%"></div></div>
        <p class="meta">${progress}% selesai</p>
      </div>
    </article>
  `;
}

function habitCheck(habit, date = state.selectedDate) {
  const done = isHabitDone(habit.id, date);
  return `
    <div class="habit-check">
      <div>
        <strong>${escapeHtml(habit.name)}</strong>
        <p class="meta">${escapeHtml(habit.area || "General")} / streak ${habitStreak(habit.id, date)} hari</p>
      </div>
      <div class="item-actions">
        <button class="check-button ${done ? "is-done" : ""}" type="button" data-toggle-habit="${habit.id}" data-habit-log-date="${date}" title="${done ? "Batalkan" : "Tandai selesai"}" aria-label="${done ? "Batalkan habit" : "Tandai habit selesai"}">
          ${icon("check")}
        </button>
        <button class="icon-button" type="button" data-delete-type="habits" data-delete-id="${habit.id}" title="Hapus habit" aria-label="Hapus habit">${icon("trash")}</button>
      </div>
    </div>
  `;
}

function habitProgressItem(habit) {
  const days = lastSevenDays();
  const done = days.filter((day) => isHabitDone(habit.id, day)).length;
  const value = percent(done, Number(habit.targetPerWeek) || 7);
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(habit.name)}</strong>
          <p class="meta">${done}/${habit.targetPerWeek || 7} target minggu ini / streak ${habitStreak(habit.id)}</p>
        </div>
        <div class="item-actions">
          <span class="pill ${value >= 100 ? "green" : "amber"}">${Math.min(value, 100)}%</span>
          <button class="icon-button" type="button" data-delete-type="habits" data-delete-id="${habit.id}" title="Hapus habit" aria-label="Hapus habit">${icon("trash")}</button>
        </div>
      </div>
      <div class="progress-line">
        <div class="progress-track"><div class="progress-fill" style="--value:${Math.min(value, 100)}%"></div></div>
      </div>
    </article>
  `;
}

function habitCalendar() {
  const days = monthCalendarDays(state.selectedDate);
  return `
    <div class="habit-calendar" aria-label="Kalender habit ${escapeHtml(monthLabel(state.selectedDate))}">
      ${["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
      ${days.map((day) => {
        if (!day) return '<div class="calendar-day is-empty" aria-hidden="true"></div>';
        const dayPercent = habitCompletionPercent(day);
        const selected = day === state.selectedDate ? "is-selected" : "";
        return `
          <button class="calendar-day ${completionTone(dayPercent)} ${selected}" type="button" data-habit-date="${day}" aria-label="${formatDate(day)} habit ${dayPercent}%">
            <span>${Number(day.slice(-2))}</span>
            <strong>${dayPercent}%</strong>
          </button>
        `;
      }).join("")}
    </div>
    <div class="calendar-legend" aria-label="Legenda persentase habit">
      <span><i class="tone-0"></i>0%</span>
      <span><i class="tone-25"></i>1-25%</span>
      <span><i class="tone-50"></i>26-50%</span>
      <span><i class="tone-75"></i>51-75%</span>
      <span><i class="tone-100"></i>76-100%</span>
    </div>
  `;
}

function habitCalendarControls() {
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  const selectedMonth = selected.getMonth();
  const selectedYear = selected.getFullYear();
  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(selectedYear, index, 1)),
  }));

  return `
    <div class="calendar-controls habit-calendar-controls" aria-label="Pilih bulan dan tahun habit">
      <div class="field">
        <label for="habitCalendarMonth">Bulan</label>
        <select id="habitCalendarMonth" data-habit-month>
          ${months.map((month) => `<option value="${month.value}" ${month.value === selectedMonth ? "selected" : ""}>${escapeHtml(month.label)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="habitCalendarYear">Tahun</label>
        <select id="habitCalendarYear" data-habit-year>
          ${habitYearOptions(selectedYear).map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`).join("")}
        </select>
      </div>
      <div class="calendar-actions">
        <button class="btn secondary small" type="button" data-habit-today>${icon("target")}Hari ini</button>
        <button class="icon-button calendar-add-button" type="button" data-open-habit-form title="Tambah habit baru" aria-label="Tambah habit baru">${icon("arrowRight")}</button>
      </div>
    </div>
  `;
}

function habitMonthLineChart() {
  const days = monthDays(state.selectedDate);
  if (!days.length) return emptyState();

  const values = days.map((day) => habitCompletionPercent(day));
  const width = 640;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 34, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xFor = (index) => padding.left + (days.length === 1 ? 0 : (index / (days.length - 1)) * innerWidth);
  const yFor = (value) => padding.top + innerHeight - (clamp(value, 0, 100) / 100) * innerHeight;
  const points = values.map((value, index) => `${xFor(index).toFixed(2)},${yFor(value).toFixed(2)}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + innerHeight} ${points} ${padding.left + innerWidth},${padding.top + innerHeight}`;
  const labelIndexes = monthLabelIndexes(days.length);

  return `
    <div class="line-chart-wrap">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik garis habit bulanan">
        <line class="chart-grid" x1="${padding.left}" y1="${yFor(100)}" x2="${padding.left + innerWidth}" y2="${yFor(100)}"></line>
        <line class="chart-grid" x1="${padding.left}" y1="${yFor(50)}" x2="${padding.left + innerWidth}" y2="${yFor(50)}"></line>
        <line class="chart-axis" x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight}"></line>
        <line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + innerHeight}"></line>
        <polygon class="chart-area" points="${areaPoints}"></polygon>
        <polyline class="chart-line" points="${points}"></polyline>
        ${values.map((value, index) => `<circle class="chart-point ${completionTone(value)}" cx="${xFor(index).toFixed(2)}" cy="${yFor(value).toFixed(2)}" r="${days[index] === state.selectedDate ? 5 : 3.4}"><title>${formatDate(days[index])}: ${value}%</title></circle>`).join("")}
        <text class="chart-label" x="8" y="${yFor(100) + 4}">100%</text>
        <text class="chart-label" x="14" y="${yFor(50) + 4}">50%</text>
        <text class="chart-label" x="20" y="${yFor(0) + 4}">0%</text>
        ${labelIndexes.map((index) => `<text class="chart-label" x="${xFor(index).toFixed(2)}" y="${height - 10}" text-anchor="middle">${Number(days[index].slice(-2))}</text>`).join("")}
      </svg>
    </div>
    <div class="inline chart-summary">
      <span class="pill teal">Rata-rata ${Math.round(avg(values))}%</span>
      <span class="pill green">${values.filter((value) => value === 100).length} hari penuh</span>
      <span class="pill amber">${values.filter((value) => value > 0 && value < 100).length} hari parsial</span>
    </div>
  `;
}

function habitMonthlyDetail() {
  const days = monthDays(state.selectedDate);
  if (!state.habits.length) return emptyState();

  return `
    <div class="monthly-detail-list">
      ${state.habits.map((habit) => {
        const done = days.filter((day) => isHabitDone(habit.id, day)).length;
        const value = percent(done, days.length);
        return `
          <article class="monthly-detail-item">
            <div class="item-main">
              <div>
                <strong>${escapeHtml(habit.name)}</strong>
                <p class="meta">${escapeHtml(habit.area || "General")} / ${done} dari ${days.length} hari</p>
              </div>
              <span class="pill ${value >= 80 ? "green" : value >= 50 ? "teal" : value > 0 ? "amber" : "rose"}">${value}%</span>
            </div>
            <div class="progress-line">
              <div class="progress-track"><div class="progress-fill" style="--value:${value}%"></div></div>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderHabitModal() {
  if (!state.habitModalDate) return "";
  const modalDate = state.habitModalDate;
  const done = state.habits.filter((habit) => isHabitDone(habit.id, modalDate)).length;
  const value = habitCompletionPercent(modalDate);

  return `
    <div class="modal-backdrop" role="presentation" data-close-habit-modal>
      <section class="modal-panel" role="dialog" aria-modal="true" aria-label="Checklist habit ${formatDate(modalDate)}">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Checklist Habit</p>
            <h3>${formatDate(modalDate)}</h3>
            <p class="meta">${done} dari ${state.habits.length} selesai / ${value}%</p>
          </div>
          <button class="icon-button" type="button" data-close-habit-modal title="Tutup" aria-label="Tutup">${icon("x")}</button>
        </div>
        <div class="modal-body stack">
          ${state.habits.length ? state.habits.map((habit) => habitCheck(habit, modalDate)).join("") : emptyState()}
        </div>
      </section>
    </div>
  `;
}

function renderHabitFormModal() {
  if (!state.habitFormOpen) return "";

  return `
    <div class="modal-backdrop" role="presentation" data-close-habit-form>
      <section class="modal-panel modal-panel-form" role="dialog" aria-modal="true" aria-label="Habit baru">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Habit Baru</p>
            <h3>Tambah Habit</h3>
            <p class="meta">Masukkan habit, area, dan target mingguan.</p>
          </div>
          <button class="icon-button" type="button" data-close-habit-form title="Tutup" aria-label="Tutup">${icon("x")}</button>
        </div>
        <div class="modal-body">
          ${habitForm()}
        </div>
      </section>
    </div>
  `;
}

function journalSummary(journal) {
  return `
    <div class="stack">
      <div>
        <span class="pill teal">Gratitude</span>
        <p>${escapeHtml(journal.gratitude || "-")}</p>
      </div>
      <div>
        <span class="pill green">Win</span>
        <p>${escapeHtml(journal.win || "-")}</p>
      </div>
      <div>
        <span class="pill amber">Next</span>
        <p>${escapeHtml(journal.next || "-")}</p>
      </div>
    </div>
  `;
}

function journalTimelineItem(journal) {
  return `
    <article class="timeline-item">
      <div class="timeline-date">${formatDate(journal.date, { short: true })}</div>
      <div>
        <div class="inline">
          <span class="pill teal">Mood ${escapeHtml(journal.mood)}</span>
          <span class="pill amber">Energy ${escapeHtml(journal.energy)}</span>
        </div>
        <p><strong>${escapeHtml(journal.win || "Journal")}</strong></p>
        <p class="meta">${escapeHtml(journal.reflection || "")}</p>
      </div>
    </article>
  `;
}

function learningItem(item) {
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(item.topic)}</strong>
          <p class="meta">${escapeHtml(item.notes || "Tanpa notes")}</p>
        </div>
        <div class="item-actions">
          <span class="pill indigo">${Number(item.minutes || 0)}m</span>
          <button class="icon-button" type="button" data-delete-type="learning" data-delete-id="${item.id}" title="Hapus session" aria-label="Hapus session">${icon("trash")}</button>
        </div>
      </div>
      <div class="inline">
        <span class="pill">${formatDate(item.date, { short: true })}</span>
        <span class="pill">${escapeHtml(item.resource || "Resource")}</span>
      </div>
    </article>
  `;
}

function mealItem(meal) {
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(meal.type)}: ${escapeHtml(meal.food)}</strong>
          <p class="meta">${Number(meal.protein || 0)}g protein / ${Number(meal.calories || 0)} kcal</p>
        </div>
        <button class="icon-button" type="button" data-delete-type="meals" data-delete-id="${meal.id}" title="Hapus meal" aria-label="Hapus meal">${icon("trash")}</button>
      </div>
    </article>
  `;
}

function workoutItem(workout) {
  if (workout.category === "strength") {
    const exerciseCount = workout.exercises?.length || 0;
    const setCount = workout.exercises?.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0) || 0;
    return `
      <article class="item">
        <div class="item-main">
          <div>
            <strong>${escapeHtml(workout.program || workout.type)}</strong>
            <p class="meta">${exerciseCount} exercise / ${setCount} set / ${formatDate(workout.date, { short: true })}</p>
          </div>
          <button class="icon-button" type="button" data-delete-type="workouts" data-delete-id="${workout.id}" title="Hapus workout" aria-label="Hapus workout">${icon("trash")}</button>
        </div>
        <div class="inline">
          ${(workout.exercises || []).slice(0, 4).map((exercise) => `<span class="pill">${escapeHtml(exercise.name)} ${exercise.sets?.length || 0} set</span>`).join("")}
        </div>
        <p class="meta">${escapeHtml(workout.notes || "")}</p>
      </article>
    `;
  }

  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${escapeHtml(workout.program || workout.type)}</strong>
          <p class="meta">${escapeHtml(workout.activity || workout.type)} / ${Number(workout.minutes || 0)} menit</p>
        </div>
        <button class="icon-button" type="button" data-delete-type="workouts" data-delete-id="${workout.id}" title="Hapus workout" aria-label="Hapus workout">${icon("trash")}</button>
      </div>
      <p class="meta">${escapeHtml(workout.notes || "")}</p>
    </article>
  `;
}

function reviewItem(review) {
  return `
    <article class="timeline-item">
      <div class="timeline-date">${formatDate(review.date, { short: true })}</div>
      <div>
        <div class="inline">
          <span class="pill teal">${escapeHtml(review.period)}</span>
          <span class="pill amber">Score ${escapeHtml(review.score)}/10</span>
        </div>
        <p><strong>${escapeHtml(review.wins || "Review")}</strong></p>
        <p class="meta">${escapeHtml(review.focus || "")}</p>
      </div>
    </article>
  `;
}

function reviewMetricLine(label, value, total) {
  const score = total === 100 ? value : percent(value, total);
  return `
    <div class="progress-line">
      <div class="item-main">
        <strong>${escapeHtml(label)}</strong>
        <span class="pill">${escapeHtml(value)}${total === 100 ? "%" : "/" + total}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="--value:${clamp(score, 0, 100)}%"></div></div>
    </div>
  `;
}

function healthTodaySummary() {
  const meals = state.meals.filter((meal) => meal.date === state.selectedDate);
  const workouts = state.workouts.filter((workout) => workout.date === state.selectedDate);
  return `
    <div class="stack">
      <div class="inline">
        <span class="pill teal">${dailyProtein(state.selectedDate)}g protein</span>
        <span class="pill amber">${dailyCalories(state.selectedDate)} kcal</span>
        <span class="pill green">${dailyWorkoutMinutes(state.selectedDate)} menit workout</span>
      </div>
      <div class="item-list">
        ${meals.slice(0, 3).map(mealItem).join("") || emptyState()}
      </div>
      <div class="item-list">
        ${workouts.slice(0, 2).map(workoutItem).join("")}
      </div>
    </div>
  `;
}

function emptyState() {
  return document.querySelector("#emptyStateTemplate").innerHTML;
}

function priorityTone(priority) {
  if (priority === "High") return "rose";
  if (priority === "Medium") return "amber";
  return "teal";
}

function planningDate() {
  return addDays(state.selectedDate, 1);
}

function plansForDate(date) {
  return state.nextDayPlans
    .filter((plan) => plan.date === date)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime) || a.title.localeCompare(b.title));
}

function plansForHour(date, hour) {
  const start = hour * 60;
  const end = start + 60;
  return plansForDate(date).filter((plan) => {
    const minutes = timeToMinutes(plan.startTime);
    return minutes >= start && minutes < end;
  });
}

function defaultPlanStartTime(date) {
  const plans = plansForDate(date);
  if (!plans.length) return "08:00";
  const latestEnd = Math.max(...plans.map((plan) => timeToMinutes(plan.endTime)));
  return minutesToTime(Math.min(Math.max(latestEnd, 8 * 60), 23 * 60));
}

function normalizePlanEnd(startTime, endTime) {
  const start = timeToMinutes(startTime || "08:00");
  const end = endTime ? timeToMinutes(endTime) : start + 60;
  return minutesToTime(Math.min(end > start ? end : start + 60, 23 * 60 + 59));
}

function timeToMinutes(time) {
  const [hour = "0", minute = "0"] = String(time || "00:00").split(":");
  return clamp(Number(hour) * 60 + Number(minute), 0, 23 * 60 + 59);
}

function minutesToTime(minutes) {
  const safe = clamp(minutes, 0, 23 * 60 + 59);
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function planDurationMinutes(plan) {
  return Math.max(timeToMinutes(plan.endTime) - timeToMinutes(plan.startTime), 0);
}

function planTimeRange(plan) {
  return `${plan.startTime} - ${plan.endTime}`;
}

function formatDuration(minutes) {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}j ${rest}m` : `${hours}j`;
}

function journalForDate(date) {
  return state.journals.find((journal) => journal.date === date);
}

function dueTasks() {
  return state.tasks
    .filter((task) => task.status !== "done" && (!task.due || task.due <= state.selectedDate))
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || (a.due || "").localeCompare(b.due || ""));
}

function priorityWeight(priority) {
  return { Low: 1, Medium: 2, High: 3 }[priority] || 2;
}

function workStatus(statusId) {
  return workStatuses.find((status) => status.id === statusId) || workStatuses[0];
}

function workProgress(statusId) {
  return workStatus(statusId).progress;
}

function workAppliedCount() {
  return state.workApplications.filter((application) => application.status !== "wishlist").length;
}

function workDeadlinesForDate(date) {
  return state.workApplications
    .filter((application) => application.deadline === date)
    .sort(workApplicationSorter);
}

function workActionItems() {
  const soon = addDays(state.selectedDate, 7);
  return state.workApplications
    .filter((application) => !["offer", "rejected"].includes(application.status))
    .filter((application) => application.nextAction || (application.deadline && application.deadline <= soon))
    .sort(workApplicationSorter);
}

function workApplicationSorter(a, b) {
  const aDate = a.deadline || a.appliedDate || "9999-12-31";
  const bDate = b.deadline || b.appliedDate || "9999-12-31";
  return aDate.localeCompare(bDate) || priorityWeight(b.priority) - priorityWeight(a.priority);
}

function workDeadlineTone(application) {
  if (!application.deadline) return "";
  if (application.status === "wishlist" && application.deadline < state.selectedDate) return "rose";
  if (application.deadline <= addDays(state.selectedDate, 7)) return "amber";
  return "";
}

function workYearOptions(selectedYear) {
  const currentYear = new Date(`${todayISO()}T00:00:00`).getFullYear();
  const deadlineYears = state.workApplications
    .map((application) => Number(application.deadline?.slice(0, 4)))
    .filter((year) => Number.isFinite(year));
  const minYear = Math.min(currentYear - 1, selectedYear, ...deadlineYears);
  const maxYear = Math.max(currentYear + 3, selectedYear, ...deadlineYears);
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
}

function safeUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function doneTasks() {
  return state.tasks.filter((task) => task.status === "done").length;
}

function isHabitDone(habitId, date) {
  return state.habitLogs.some((log) => log.habitId === habitId && log.date === date);
}

function habitsDoneToday() {
  return state.habits.filter((habit) => isHabitDone(habit.id, state.selectedDate)).length;
}

function habitCompletionPercent(date) {
  if (!state.habits.length) return 0;
  const done = state.habits.filter((habit) => isHabitDone(habit.id, date)).length;
  return percent(done, state.habits.length);
}

function completionTone(value) {
  if (value <= 0) return "tone-0";
  if (value <= 25) return "tone-25";
  if (value <= 50) return "tone-50";
  if (value <= 75) return "tone-75";
  return "tone-100";
}

function habitStreak(habitId, fromDate = state.selectedDate) {
  let streak = 0;
  let cursor = fromDate;
  while (isHabitDone(habitId, cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function journalStreak() {
  let streak = 0;
  let cursor = state.selectedDate;
  while (journalForDate(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => addDays(state.selectedDate, index - 6));
}

function monthDays(dateString) {
  const start = new Date(`${dateString.slice(0, 7)}-01T00:00:00`);
  const month = start.getMonth();
  const cursor = new Date(start);
  const days = [];

  while (cursor.getMonth() === month) {
    days.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function monthCalendarDays(dateString) {
  const days = monthDays(dateString);
  if (!days.length) return [];

  const firstDay = new Date(`${days[0]}T00:00:00`).getDay();
  const leadingEmptyDays = (firstDay + 6) % 7;
  return [...Array(leadingEmptyDays).fill(null), ...days];
}

function monthLabelIndexes(dayCount) {
  const last = Math.max(dayCount - 1, 0);
  return [...new Set([0, Math.round(last / 3), Math.round((last * 2) / 3), last])];
}

function habitYearOptions(selectedYear) {
  const currentYear = new Date(`${todayISO()}T00:00:00`).getFullYear();
  const loggedYears = state.habitLogs
    .map((log) => Number(log.date?.slice(0, 4)))
    .filter((year) => Number.isFinite(year));
  const minYear = Math.min(currentYear - 2, selectedYear, ...loggedYears);
  const maxYear = Math.max(currentYear + 3, selectedYear, ...loggedYears);
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
}

function dateInMonthYear(dateString, year, monthIndex) {
  const currentDay = Number(dateString.slice(8, 10)) || 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(currentDay, lastDay);
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inLastDays(date, days) {
  const start = addDays(state.selectedDate, -(days - 1));
  return date >= start && date <= state.selectedDate;
}

function learningMinutes(days) {
  return state.learning
    .filter((item) => inLastDays(item.date, days))
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
}

function workoutMinutes(days) {
  return state.workouts
    .filter((item) => inLastDays(item.date, days))
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
}

function dailyWorkoutMinutes(date) {
  return state.workouts
    .filter((item) => item.date === date)
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
}

function dailyProtein(date) {
  return state.meals
    .filter((item) => item.date === date)
    .reduce((sum, item) => sum + Number(item.protein || 0), 0);
}

function dailyCalories(date) {
  return state.meals
    .filter((item) => item.date === date)
    .reduce((sum, item) => sum + Number(item.calories || 0), 0);
}

function weightLogForDate(date) {
  return state.weightLogs.find((log) => log.date === date);
}

function latestWeightLog(beforeOrEqualDate = state.selectedDate) {
  return [...state.weightLogs]
    .filter((log) => !beforeOrEqualDate || log.date <= beforeOrEqualDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function calculateTdee() {
  const weight = Number(latestWeightLog()?.weight || 0);
  const height = Number(state.healthProfile.height || 0);
  const age = Number(state.healthProfile.age || 0);
  const activity = activityLevels.find((level) => level.id === state.healthProfile.activityLevel) || activityLevels[2];
  if (!weight || !height || !age) return 0;

  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  return Math.round(bmr * activity.factor);
}

function healthYearOptions(selectedYear) {
  const currentYear = new Date(`${todayISO()}T00:00:00`).getFullYear();
  const loggedYears = state.weightLogs
    .map((log) => Number(log.date?.slice(0, 4)))
    .filter((year) => Number.isFinite(year));
  const minYear = Math.min(currentYear - 2, selectedYear, ...loggedYears);
  const maxYear = Math.max(currentYear + 3, selectedYear, ...loggedYears);
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
}

function weightLineChart(days) {
  const logs = days.map((day) => weightLogForDate(day));
  const values = logs.map((log) => log ? Number(log.weight) : null);
  const available = values.filter((value) => Number.isFinite(value));
  if (!available.length) return emptyState();

  const width = 640;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 34, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const min = Math.min(...available) - 1;
  const max = Math.max(...available) + 1;
  const xFor = (index) => padding.left + (days.length === 1 ? 0 : (index / (days.length - 1)) * innerWidth);
  const yFor = (value) => padding.top + innerHeight - ((value - min) / Math.max(max - min, 1)) * innerHeight;
  const points = values
    .map((value, index) => Number.isFinite(value) ? `${xFor(index).toFixed(2)},${yFor(value).toFixed(2)}` : null)
    .filter(Boolean)
    .join(" ");
  const labelIndexes = monthLabelIndexes(days.length);

  return `
    <div class="line-chart-wrap">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik berat badan bulanan">
        <line class="chart-grid" x1="${padding.left}" y1="${padding.top}" x2="${padding.left + innerWidth}" y2="${padding.top}"></line>
        <line class="chart-grid" x1="${padding.left}" y1="${padding.top + innerHeight / 2}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight / 2}"></line>
        <line class="chart-axis" x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight}"></line>
        <line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + innerHeight}"></line>
        <polyline class="chart-line" points="${points}"></polyline>
        ${values.map((value, index) => Number.isFinite(value) ? `<circle class="chart-point tone-75" cx="${xFor(index).toFixed(2)}" cy="${yFor(value).toFixed(2)}" r="${days[index] === state.selectedDate ? 5 : 3.4}"><title>${formatDate(days[index])}: ${value} kg</title></circle>` : "").join("")}
        <text class="chart-label" x="8" y="${padding.top + 4}">${max.toFixed(1)}</text>
        <text class="chart-label" x="8" y="${padding.top + innerHeight + 4}">${min.toFixed(1)}</text>
        ${labelIndexes.map((index) => `<text class="chart-label" x="${xFor(index).toFixed(2)}" y="${height - 10}" text-anchor="middle">${Number(days[index].slice(-2))}</text>`).join("")}
      </svg>
    </div>
  `;
}

function weightItem(log) {
  return `
    <article class="item">
      <div class="item-main">
        <div>
          <strong>${formatDate(log.date, { short: true })}: ${escapeHtml(log.weight)} kg</strong>
          <p class="meta">${escapeHtml(log.notes || "Tanpa catatan")}</p>
        </div>
        <button class="icon-button" type="button" data-delete-type="weightLogs" data-delete-id="${log.id}" title="Hapus BB" aria-label="Hapus BB">${icon("trash")}</button>
      </div>
    </article>
  `;
}

function workoutSetCount(exercise) {
  return clamp(state.workoutDraftSets?.[exercise] || 3, 1, 8);
}

function previousWorkoutSet(program, exercise, setIndex, beforeDate) {
  const logs = [...state.workouts]
    .filter((workout) => workout.category === "strength" && workout.program === program && workout.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const workout of logs) {
    const found = workout.exercises?.find((item) => item.name === exercise);
    const set = found?.sets?.[setIndex];
    if (set) return set;
  }
  return null;
}

function exerciseHistory(exerciseName) {
  return [...state.workouts]
    .filter((workout) => workout.category === "strength")
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((workout) => {
      const exercise = workout.exercises?.find((item) => item.name === exerciseName);
      if (!exercise) return [];
      return exercise.sets.map((set, index) => ({
        date: workout.date,
        program: workout.program || workout.type,
        setIndex: index + 1,
        weight: set.weight,
        reps: set.reps,
      }));
    });
}

function workoutProgressHistory() {
  const selected = allWorkoutExercises.includes(state.selectedWorkoutHistoryExercise)
    ? state.selectedWorkoutHistoryExercise
    : allWorkoutExercises[0];
  const rows = exerciseHistory(selected);

  return `
    <div class="form-grid">
      <div class="field">
        <label for="workoutHistoryExercise">Exercise</label>
        <select id="workoutHistoryExercise" data-workout-history-exercise>
          ${allWorkoutExercises.map((exercise) => `<option value="${escapeHtml(exercise)}" ${selected === exercise ? "selected" : ""}>${escapeHtml(exercise)}</option>`).join("")}
        </select>
      </div>
      <div class="history-table-wrap">
        ${rows.length ? `
          <table class="history-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Program</th>
                <th>Set</th>
                <th>Beban x Reps</th>
              </tr>
            </thead>
            <tbody>
              ${rows.slice(0, 30).map((row) => `
                <tr>
                  <td>${formatDate(row.date, { short: true })}</td>
                  <td>${escapeHtml(row.program)}</td>
                  <td>${row.setIndex}</td>
                  <td>${row.weight}kg x ${row.reps}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : emptyState()}
      </div>
    </div>
  `;
}

function avg(values) {
  const numbers = values.map(Number).filter((number) => Number.isFinite(number));
  if (!numbers.length) return 0;
  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

function activityScore(date) {
  const completedTasks = state.tasks.filter((task) => task.completedAt?.slice(0, 10) === date).length * 20;
  const habitScore = state.habitLogs.filter((log) => log.date === date).length * 15;
  const learningScore = state.learning.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const workoutScore = state.workouts.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  return completedTasks + habitScore + learningScore + workoutScore;
}

function goalDueSoon(goal) {
  if (!goal.targetDate || Number(goal.progress) >= 100) return false;
  return goal.targetDate <= addDays(state.selectedDate, 14);
}

function reviewStats(period) {
  const days = period === "monthly" ? 30 : 7;
  const filteredTasks = state.tasks.filter((task) => !task.due || inLastDays(task.due, days));
  const taskDone = filteredTasks.filter((task) => task.status === "done").length;
  const habitLogs = state.habitLogs.filter((log) => inLastDays(log.date, days));
  const journals = state.journals.filter((journal) => inLastDays(journal.date, days)).length;
  return {
    days,
    tasksDone: taskDone,
    tasksTotal: filteredTasks.length || 1,
    habitsDone: habitLogs.length,
    habitsTotal: Math.max(state.habits.length * days, 1),
    journals,
    goalAverage: Math.round(avg(state.goals.map((goal) => goal.progress))),
    learning: learningMinutes(days),
    workouts: workoutMinutes(days),
    reviews: state.reviews.filter((review) => review.period === period && inLastDays(review.date, days)).length,
  };
}

function handleFormSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(form).entries());
  const type = form.dataset.form;

  if (type === "idea") {
    state.ideas.unshift(createRecord({ ...formData, status: "active" }));
  }

  if (type === "journal") {
    const existing = journalForDate(state.selectedDate);
    if (existing) {
      Object.assign(existing, formData, { date: state.selectedDate, updatedAt: new Date().toISOString() });
    } else {
      state.journals.unshift(createRecord({ ...formData, date: state.selectedDate }));
    }
  }

  if (type === "project") {
    state.projects.unshift(createRecord(formData));
  }

  if (type === "task") {
    state.tasks.unshift(createRecord({ ...formData, status: "todo", completedAt: "" }));
  }

  if (type === "nextDayPlan") {
    const startTime = formData.startTime || "08:00";
    state.nextDayPlans.unshift(createRecord({
      title: formData.title || "Untitled",
      kind: ["task", "event"].includes(formData.kind) ? formData.kind : "task",
      date: formData.date || planningDate(),
      startTime,
      endTime: normalizePlanEnd(startTime, formData.endTime),
      priority: formData.priority || "Medium",
      area: formData.area || "",
      notes: formData.notes || "",
      status: "scheduled",
    }));
  }

  if (type === "goal") {
    state.goals.unshift(createRecord({ ...formData, progress: clamp(formData.progress, 0, 100) }));
  }

  if (type === "habit") {
    state.habits.unshift(createRecord({ ...formData, targetPerWeek: clamp(formData.targetPerWeek, 1, 7) }));
    state.habitFormOpen = false;
  }

  if (type === "learning") {
    state.learning.unshift(createRecord({ ...formData, minutes: Math.max(1, Number(formData.minutes || 1)) }));
  }

  if (type === "workApplication") {
    const status = workStatusIds.includes(formData.status) ? formData.status : "wishlist";
    state.workApplications.unshift(createRecord({
      ...formData,
      status,
      appliedDate: status === "wishlist" ? formData.appliedDate || "" : formData.appliedDate || state.selectedDate,
      priority: formData.priority || "Medium",
    }));
  }

  if (type === "workApplicationEdit") {
    const application = state.workApplications.find((item) => item.id === form.dataset.workEditForm);
    if (application) {
      const status = workStatusIds.includes(formData.status) ? formData.status : "wishlist";
      Object.assign(application, {
        company: formData.company || "",
        role: formData.role || "",
        status,
        priority: formData.priority || "Medium",
        deadline: formData.deadline || "",
        appliedDate: status === "wishlist" ? formData.appliedDate || "" : formData.appliedDate || state.selectedDate,
        source: formData.source || "",
        link: formData.link || "",
        nextAction: formData.nextAction || "",
        notes: formData.notes || "",
        updatedAt: new Date().toISOString(),
      });
      state.workEditId = "";
    }
  }

  if (type === "healthProfile") {
    state.healthProfile = {
      height: Math.max(0, Number(formData.height || 0)) || "",
      age: Math.max(0, Number(formData.age || 0)) || "",
      activityLevel: formData.activityLevel || "moderate",
      mealGoalCalories: Math.max(0, Number(formData.mealGoalCalories || 0)) || "",
    };
  }

  if (type === "weight") {
    const existing = weightLogForDate(formData.date);
    const payload = {
      date: formData.date || state.selectedDate,
      weight: Number(formData.weight || 0).toFixed(1),
      notes: formData.notes || "",
    };
    if (existing) {
      Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
    } else {
      state.weightLogs.unshift(createRecord(payload));
    }
  }

  if (type === "meal") {
    state.meals.unshift(createRecord({
      ...formData,
      protein: Math.max(0, Number(formData.protein || 0)),
      calories: Math.max(0, Number(formData.calories || 0)),
    }));
  }

  if (type === "workout") {
    const program = formData.program || state.selectedWorkoutProgram || "Push A";
    if (strengthPrograms.includes(program)) {
      const exercises = workoutPrograms[program].map((exercise, exerciseIndex) => {
        const setCount = workoutSetCount(exercise);
        const sets = Array.from({ length: setCount }, (_, setIndex) => ({
          weight: Math.max(0, Number(formData[`weight_${exerciseIndex}_${setIndex}`] || 0)),
          reps: Math.max(0, Number(formData[`reps_${exerciseIndex}_${setIndex}`] || 0)),
        })).filter((set) => set.weight > 0 || set.reps > 0);
        return { name: exercise, sets };
      }).filter((exercise) => exercise.sets.length);

      state.workouts.unshift(createRecord({
        date: formData.date || state.selectedDate,
        type: program,
        program,
        category: "strength",
        exercises,
        notes: formData.notes || "",
        minutes: 0,
      }));
    } else {
      state.workouts.unshift(createRecord({
        date: formData.date || state.selectedDate,
        type: program,
        program,
        category: "simple",
        activity: formData.activity || program,
        minutes: Math.max(1, Number(formData.minutes || 1)),
        notes: formData.notes || "",
      }));
    }
  }

  if (type === "review") {
    state.reviews.unshift(createRecord({ ...formData, score: clamp(formData.score, 1, 10) }));
  }

  form.reset();
  saveState();
  render();
}

function handleClick(event) {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.activeView = viewButton.dataset.view;
    saveState();
    render();
    return;
  }

  const displayModeButton = event.target.closest("[data-display-mode]");
  if (displayModeButton) {
    state.displayMode = displayModeButton.dataset.displayMode;
    saveState();
    render();
    return;
  }

  const closeHabitModal = event.target.closest("[data-close-habit-modal]");
  if (closeHabitModal && (event.target === closeHabitModal || closeHabitModal.classList.contains("icon-button"))) {
    state.habitModalDate = "";
    saveState();
    render();
    return;
  }

  const openHabitForm = event.target.closest("[data-open-habit-form]");
  if (openHabitForm) {
    state.habitFormOpen = true;
    state.activeView = "habits";
    saveState();
    render();
    return;
  }

  const closeHabitForm = event.target.closest("[data-close-habit-form]");
  if (closeHabitForm && (event.target === closeHabitForm || closeHabitForm.classList.contains("icon-button"))) {
    state.habitFormOpen = false;
    saveState();
    render();
    return;
  }

  const openWorkEdit = event.target.closest("[data-open-work-edit]");
  if (openWorkEdit) {
    state.workEditId = openWorkEdit.dataset.openWorkEdit;
    state.activeView = "work";
    saveState();
    render();
    return;
  }

  const closeWorkEdit = event.target.closest("[data-close-work-edit]");
  if (closeWorkEdit && (event.target === closeWorkEdit || closeWorkEdit.classList.contains("icon-button"))) {
    state.workEditId = "";
    saveState();
    render();
    return;
  }

  const workDateButton = event.target.closest("[data-work-date]");
  if (workDateButton) {
    state.selectedDate = workDateButton.dataset.workDate;
    state.activeView = "work";
    saveState();
    render();
    return;
  }

  const workTodayButton = event.target.closest("[data-work-today]");
  if (workTodayButton) {
    state.selectedDate = todayISO();
    state.activeView = "work";
    saveState();
    render();
    return;
  }

  const habitDateButton = event.target.closest("[data-habit-date]");
  if (habitDateButton) {
    state.selectedDate = habitDateButton.dataset.habitDate;
    state.habitModalDate = habitDateButton.dataset.habitDate;
    state.activeView = "habits";
    saveState();
    render();
    return;
  }

  const habitTodayButton = event.target.closest("[data-habit-today]");
  if (habitTodayButton) {
    state.selectedDate = todayISO();
    state.activeView = "habits";
    saveState();
    render();
    return;
  }

  const healthTodayButton = event.target.closest("[data-health-today]");
  if (healthTodayButton) {
    state.selectedDate = todayISO();
    state.activeView = "health";
    saveState();
    render();
    return;
  }

  const workoutSetButton = event.target.closest("[data-workout-set-action]");
  if (workoutSetButton) {
    const exercise = workoutSetButton.dataset.exerciseName;
    const action = workoutSetButton.dataset.workoutSetAction;
    const current = workoutSetCount(exercise);
    state.workoutDraftSets[exercise] = action === "add" ? Math.min(current + 1, 8) : Math.max(current - 1, 1);
    saveState();
    render();
    return;
  }

  const toggleHabit = event.target.closest("[data-toggle-habit]");
  if (toggleHabit) {
    const habitId = toggleHabit.dataset.toggleHabit;
    const habitDate = toggleHabit.dataset.habitLogDate || state.selectedDate;
    const index = state.habitLogs.findIndex((log) => log.habitId === habitId && log.date === habitDate);
    if (index >= 0) {
      state.habitLogs.splice(index, 1);
    } else {
      state.habitLogs.push(createRecord({ habitId, date: habitDate }));
    }
    saveState();
    render();
    return;
  }

  const togglePlan = event.target.closest("[data-toggle-plan]");
  if (togglePlan) {
    const plan = state.nextDayPlans.find((item) => item.id === togglePlan.dataset.togglePlan);
    if (plan) {
      plan.status = plan.status === "done" ? "scheduled" : "done";
      plan.completedAt = plan.status === "done" ? new Date().toISOString() : "";
      saveState();
      render();
    }
    return;
  }

  const taskStatus = event.target.closest("[data-task-status]");
  if (taskStatus) {
    const task = state.tasks.find((item) => item.id === taskStatus.dataset.taskId);
    if (task) {
      task.status = taskStatus.dataset.taskStatus;
      task.completedAt = task.status === "done" ? new Date().toISOString() : "";
      saveState();
      render();
    }
    return;
  }

  const goalButton = event.target.closest("[data-goal-delta]");
  if (goalButton) {
    const goal = state.goals.find((item) => item.id === goalButton.dataset.goalId);
    if (goal) {
      goal.progress = clamp(Number(goal.progress || 0) + Number(goalButton.dataset.goalDelta), 0, 100);
      saveState();
      render();
    }
    return;
  }

  const archiveButton = event.target.closest("[data-idea-archive]");
  if (archiveButton) {
    const idea = state.ideas.find((item) => item.id === archiveButton.dataset.ideaArchive);
    if (idea) {
      idea.status = idea.status === "archived" ? "active" : "archived";
      saveState();
      render();
    }
    return;
  }

  const reviewPeriod = event.target.closest("[data-review-period]");
  if (reviewPeriod) {
    state.reviewPeriod = reviewPeriod.dataset.reviewPeriod;
    saveState();
    render();
    return;
  }

  const deleteButton = event.target.closest("[data-delete-type]");
  if (deleteButton) {
    const collection = deleteButton.dataset.deleteType;
    const id = deleteButton.dataset.deleteId;
    if (Array.isArray(state[collection])) {
      state[collection] = state[collection].filter((item) => item.id !== id);
      if (collection === "habits") {
        state.habitLogs = state.habitLogs.filter((log) => log.habitId !== id);
      }
      if (collection === "projects") {
        state.tasks.forEach((task) => {
          if (task.projectId === id) task.projectId = "";
        });
      }
      if (collection === "workApplications" && state.workEditId === id) {
        state.workEditId = "";
      }
      saveState();
      render();
    }
  }
}

function handleChange(event) {
  const workStatusSelect = event.target.closest("[data-work-status-select]");
  if (workStatusSelect) {
    const application = state.workApplications.find((item) => item.id === workStatusSelect.dataset.workId);
    if (application && workStatusIds.includes(workStatusSelect.value)) {
      application.status = workStatusSelect.value;
      if (application.status !== "wishlist" && !application.appliedDate) {
        application.appliedDate = state.selectedDate;
      }
      application.updatedAt = new Date().toISOString();
      saveState();
      render();
    }
    return;
  }

  const workMonthSelect = event.target.closest("[data-work-month]");
  const workYearSelect = event.target.closest("[data-work-year]");
  if (workMonthSelect || workYearSelect) {
    const monthSelect = document.querySelector("[data-work-month]");
    const yearSelect = document.querySelector("[data-work-year]");
    const selected = new Date(`${state.selectedDate}T00:00:00`);
    const monthIndex = Number(monthSelect?.value ?? selected.getMonth());
    const year = Number(yearSelect?.value ?? selected.getFullYear());

    state.selectedDate = dateInMonthYear(state.selectedDate, year, monthIndex);
    state.activeView = "work";
    saveState();
    render();
    return;
  }

  const workoutProgramSelect = event.target.closest("[data-workout-program]");
  if (workoutProgramSelect) {
    state.selectedWorkoutProgram = workoutProgramSelect.value;
    saveState();
    render();
    return;
  }

  const workoutHistorySelect = event.target.closest("[data-workout-history-exercise]");
  if (workoutHistorySelect) {
    state.selectedWorkoutHistoryExercise = workoutHistorySelect.value;
    saveState();
    render();
    return;
  }

  const healthMonthSelect = event.target.closest("[data-health-month]");
  const healthYearSelect = event.target.closest("[data-health-year]");
  if (healthMonthSelect || healthYearSelect) {
    const monthSelect = document.querySelector("[data-health-month]");
    const yearSelect = document.querySelector("[data-health-year]");
    const selected = new Date(`${state.selectedDate}T00:00:00`);
    const monthIndex = Number(monthSelect?.value ?? selected.getMonth());
    const year = Number(yearSelect?.value ?? selected.getFullYear());

    state.selectedDate = dateInMonthYear(state.selectedDate, year, monthIndex);
    state.activeView = "health";
    saveState();
    render();
    return;
  }

  const habitMonthSelect = event.target.closest("[data-habit-month]");
  const habitYearSelect = event.target.closest("[data-habit-year]");
  if (!habitMonthSelect && !habitYearSelect) return;

  const monthSelect = document.querySelector("[data-habit-month]");
  const yearSelect = document.querySelector("[data-habit-year]");
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  const monthIndex = Number(monthSelect?.value ?? selected.getMonth());
  const year = Number(yearSelect?.value ?? selected.getFullYear());

  state.selectedDate = dateInMonthYear(state.selectedDate, year, monthIndex);
  state.activeView = "habits";
  saveState();
  render();
}

selectedDateInput.addEventListener("change", (event) => {
  state.selectedDate = event.target.value || todayISO();
  saveState();
  render();
});

document.addEventListener("submit", handleFormSubmit);
document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);

render();
