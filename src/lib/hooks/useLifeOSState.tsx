'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase as supabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createCalendarEvent, deleteCalendarEvent } from '../google-calendar';
import { todayISO, generateId, clamp } from '@/lib/utils';

const supabase = supabaseClient as any;


// Define interface for all Life OS state items
export interface Idea {
  id: string;
  title: string;
  area: string;
  priority: 'Low' | 'Medium' | 'High';
  notes: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Journal {
  id: string;
  date: string;
  mood: number;
  energy: number;
  gratitude_1: string;
  gratitude_2: string;
  gratitude_3: string;
  win: string;
  reflection: string;
  next: string; // matches vanilla state
  createdAt: string;
}

export interface Plan {
  id: string;
  date: string;
  title: string;
  kind: 'task' | 'event';
  startTime: string;
  endTime: string;
  priority: 'Low' | 'Medium' | 'High';
  area: string;
  notes: string;
  status: 'scheduled' | 'done';
  googleEventId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  area: string;
  status: 'active' | 'paused' | 'done';
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string; // empty string for Inbox
  title: string;
  due: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'todo' | 'doing' | 'done';
  completedAt: string;
  googleEventId?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  targetDate: string;
  progress: number;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  area: string;
  frequency: 'daily' | 'weekly';
  targetPerWeek: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  createdAt: string;
}

export interface LearningSession {
  id: string;
  date: string;
  topic: string;
  resource: string;
  link: string;
  status: 'to_learn' | 'learning' | 'completed';
  minutes: number;
  notes: string;
  createdAt: string;
}

export interface DictionaryEntry {
  id: string;
  indonesian: string;
  translation: string;
  language: string;
  createdAt: string;
}

export interface HealthProfile {
  height: number | '';
  age: number | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  mealGoalCalories: number | '';
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  notes: string;
  createdAt: string;
}

export interface Meal {
  id: string;
  date: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  food: string;
  protein: number;
  calories: number;
  createdAt: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string;
  type: string;
  program: string;
  category: 'strength' | 'simple';
  activity?: string;
  minutes: number;
  notes: string;
  exercises?: WorkoutExercise[];
  createdAt: string;
}

export interface WorkApplication {
  id: string;
  company: string;
  role: string;
  status: 'wishlist' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  appliedDate: string;
  source: string;
  link: string;
  nextAction: string;
  notes: string;
  createdAt: string;
}

export interface Review {
  id: string;
  date: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  score: number;
  wins: string;
  lessons: string;
  challenges: string;
  focus: string;
  evaluationNotes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  notes: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
}

export interface LifeOSState {
  ideas: Idea[];
  journals: Journal[];
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  learning: LearningSession[];
  meals: Meal[];
  workouts: Workout[];
  nextDayPlans: Plan[];
  workApplications: WorkApplication[];
  weightLogs: WeightLog[];
  healthProfile: HealthProfile;
  reviews: Review[];
  transactions: Transaction[];
  financialGoals: FinancialGoal[];
  dictionary: DictionaryEntry[];
  displayMode: 'auto' | 'desktop' | 'mobile';
  reviewPeriod: 'weekly' | 'monthly';
  selectedDate: string;
}

interface LifeOSContextProps {
  state: LifeOSState;
  loading: boolean;
  isDbConnected: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setDisplayMode: (mode: 'auto' | 'desktop' | 'mobile') => void;
  setReviewPeriod: (period: 'weekly' | 'monthly') => void;
  
  // Capture
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  archiveIdea: (id: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;

  // Journal
  saveJournal: (journal: Omit<Journal, 'id' | 'createdAt' | 'date'>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;

  // Planning
  addPlan: (plan: Omit<Plan, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  togglePlan: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  // Projects & Tasks
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'completedAt'>) => Promise<void>;
  updateTaskStatus: (id: string, status: 'todo' | 'doing' | 'done') => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoalProgress: (id: string, delta: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  toggleHabit: (id: string, date: string) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Learning
  addLearningSession: (session: Omit<LearningSession, 'id' | 'createdAt'>) => Promise<void>;
  deleteLearningSession: (id: string) => Promise<void>;
  addDictionaryEntry: (entry: Omit<DictionaryEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteDictionaryEntry: (id: string) => Promise<void>;

  // Health
  updateHealthProfile: (profile: HealthProfile) => Promise<void>;
  saveWeightLog: (weight: number, notes: string, date?: string) => Promise<void>;
  deleteWeightLog: (id: string) => Promise<void>;
  addMeal: (meal: Omit<Meal, 'id' | 'createdAt'>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;

  // Work Applications
  addWorkApplication: (app: Omit<WorkApplication, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkApplication: (app: WorkApplication) => Promise<void>;
  deleteWorkApplication: (id: string) => Promise<void>;

  // Reviews
  saveReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;

  // Finance
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addFinancialGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateFinancialGoal: (id: string, currentAmount: number) => Promise<void>;
  deleteFinancialGoal: (id: string) => Promise<void>;

}

const LifeOSContext = createContext<LifeOSContextProps | undefined>(undefined);

const initialDefaultState = (today: string): LifeOSState => ({
  ideas: [
    {
      id: generateId(),
      title: 'Rapikan sistem catatan mingguan',
      area: 'Second Brain',
      priority: 'Medium',
      notes: 'Buat struktur inbox, area, project, archive.',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ],
  journals: [
    {
      id: generateId(),
      date: today,
      mood: 4,
      energy: 4,
      gratitude_1: 'Masih punya ruang untuk mulai.',
      gratitude_2: 'Kesehatan fisik yang baik.',
      gratitude_3: 'Keluarga yang supportif.',
      win: 'Membuka sistem self management.',
      reflection: 'Mulai dari kecil, yang penting konsisten.',
      next: 'Tentukan 3 fokus utama hari ini.',
      createdAt: new Date().toISOString()
    }
  ],
  projects: [
    { id: generateId(), name: 'Bangun rutinitas pagi', area: 'Personal', status: 'active', createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Second brain pribadi', area: 'Knowledge', status: 'active', createdAt: new Date().toISOString() }
  ],
  tasks: [],
  goals: [],
  habits: [
    { id: generateId(), name: 'Jurnal 10 menit', area: 'Mind', frequency: 'daily', targetPerWeek: 7, createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Baca 20 menit', area: 'Learning', frequency: 'daily', targetPerWeek: 5, createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Workout ringan', area: 'Health', frequency: 'weekly', targetPerWeek: 3, createdAt: new Date().toISOString() }
  ],
  habitLogs: [],
  learning: [],
  meals: [],
  workouts: [],
  nextDayPlans: [],
  workApplications: [],
  weightLogs: [],
  healthProfile: {
    height: 170,
    age: 25,
    activityLevel: 'moderate',
    mealGoalCalories: 2000
  },
  reviews: [],
  transactions: [],
  financialGoals: [],
  dictionary: [],
  displayMode: 'auto',
  reviewPeriod: 'weekly',
  selectedDate: today
});

export function LifeOSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LifeOSState>(() => initialDefaultState(todayISO()));
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  // Auth helper methods
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
    }
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
  }, []);

  // ── Step 1: Resolve auth state FIRST, before loading any data ──
  useEffect(() => {
    const connected = isSupabaseConfigured();
    setIsDbConnected(connected);

    if (!connected) {
      setAuthResolved(true);
      return;
    }

    async function autoAuthenticate() {
      const defaultEmail = 'default-user@lifeos.local';
      const defaultPassword = 'DefaultPassword123!';

      try {
        // 1. Check if there is an existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          setUser(session.user);
          setAuthResolved(true);
          return;
        }

        // 2. Not logged in, try signing in with default user
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email: defaultEmail,
          password: defaultPassword
        });

        if (!signInError && signInData?.user) {
          setUser(signInData.user);
          setAuthResolved(true);
          return;
        }

        // 3. If sign in fails (likely account doesn't exist yet), try signing up the default user
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
          email: defaultEmail,
          password: defaultPassword
        });

        if (!signUpError && signUpData?.user) {
          setUser(signUpData.user);
          setAuthResolved(true);
        } else {
          console.error('[LifeOS] Silent auto authentication failed:', signUpError || signInError);
          setAuthResolved(true);
        }
      } catch (err) {
        console.error('[LifeOS] Exception in silent auto auth:', err);
        setAuthResolved(true);
      }
    }

    autoAuthenticate();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Step 2: Load data ONLY after auth is resolved ──
  useEffect(() => {
    if (!authResolved) return;

    async function loadData() {
      setLoading(true);

      // ── Logged in → Supabase is the ONLY source of truth ──
      if (isDbConnected && user) {
        try {
          // 1. Ensure user row exists in public.users table to satisfy foreign keys
          const { error: userUpsertError } = await supabase.from('users').upsert({
            id: user.id,
            email: user.email
          }, { onConflict: 'id' });

          if (userUpsertError) {
            console.error('[LifeOS] Failed to upsert user profile:', userUpsertError);
            alert(
              `Gagal menyelaraskan profil pengguna: ${userUpsertError.message}\n\n` +
              `Untuk memperbaikinya, jalankan perintah SQL ini di Dashboard Supabase → SQL Editor:\n` +
              `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`
            );
          }

          // 2. Fetch user-specific data in parallel
          const [
            { data: ideas },
            { data: journals },
            { data: nextDayPlans },
            { data: projects },
            { data: tasks },
            { data: goals },
            { data: habits },
            { data: habitLogs },
            { data: learning },
            { data: weightLogs },
            { data: meals },
            { data: workouts },
            { data: healthProfilesData },
            { data: workApplications },
            { data: reviews },
            { data: transactions },
            { data: financialGoalsData },
            { data: dictionaryData, error: dictionaryError },
          ] = await Promise.all([
            supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('journals').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('next_day_plans').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('habit_logs').select('*').eq('user_id', user.id),
            supabase.from('learning_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('meals').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('workouts').select('*, workout_exercises(*, workout_sets(*))').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('health_profiles').select('*').eq('user_id', user.id),
            supabase.from('work_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('reviews').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('financial_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('dictionary').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          ]);

          let dictEntries: any[] = [];
          if (dictionaryData) {
            dictEntries = dictionaryData;
          } else if (dictionaryError) {
            console.warn('[LifeOS] Dictionary table does not exist or fetch failed. Falling back to local storage:', dictionaryError);
            const localDict = localStorage.getItem('lifeos_dictionary');
            if (localDict) {
              try { dictEntries = JSON.parse(localDict); } catch {}
            }
          }

          const healthProfile = healthProfilesData && healthProfilesData.length > 0 ? healthProfilesData[0] : null;

          setState(prev => ({
            ...prev,
            ideas: (ideas as any[] || []).map(i => ({
              id: i.id,
              title: i.title || '',
              area: i.area || '',
              priority: (i.priority || 'Medium') as any,
              notes: i.notes || '',
              status: i.status || 'active',
              createdAt: i.created_at || i.createdAt
            })),
            journals: (journals as any[] || []).map(j => ({
              id: j.id,
              date: j.date,
              mood: j.mood,
              energy: j.energy,
              gratitude_1: j.gratitude_1,
              gratitude_2: j.gratitude_2,
              gratitude_3: j.gratitude_3,
              win: j.win,
              reflection: j.reflection,
              next: j.next_action || j.next || '',
              createdAt: j.created_at || j.createdAt
            })),
            nextDayPlans: (nextDayPlans as any[] || []).map(p => ({
              id: p.id,
              date: p.date,
              title: p.title,
              kind: p.kind,
              startTime: p.start_time || '',
              endTime: p.end_time || '',
              priority: p.priority,
              area: p.area,
              notes: p.notes,
              status: p.status,
              googleEventId: p.google_event_id || '',
              createdAt: p.created_at || p.createdAt
            })),
            projects: (projects as any[] || []).map(p => ({
              id: p.id,
              name: p.name,
              area: p.area,
              status: p.status,
              createdAt: p.created_at || p.createdAt
            })),
            tasks: (tasks as any[] || []).map(t => ({
              id: t.id,
              projectId: t.project_id || '',
              title: t.title,
              due: t.due || '',
              priority: t.priority,
              status: t.status,
              completedAt: t.completed_at || '',
              googleEventId: t.google_event_id || '',
              createdAt: t.created_at || t.createdAt
            })),
            goals: (goals as any[] || []).map(g => ({
              id: g.id,
              title: g.title,
              category: g.category,
              currentValue: g.current_value || 0,
              targetValue: g.target_value || 0,
              unit: g.unit,
              targetDate: g.target_date || '',
              progress: g.progress || 0,
              createdAt: g.created_at || g.createdAt
            })),
            habits: (habits as any[] || []).map(h => ({
              id: h.id,
              name: h.name,
              area: h.area,
              frequency: h.frequency,
              targetPerWeek: h.target_per_week || 7,
              createdAt: h.created_at || h.createdAt
            })),
            habitLogs: (habitLogs as any[] || []).map(log => ({
              id: log.id,
              habitId: log.habit_id,
              date: log.date,
              createdAt: log.created_at || log.createdAt
            })),
            learning: (learning as any[] || []).map(l => ({
              id: l.id,
              date: l.date,
              topic: l.topic,
              resource: l.resource || '',
              link: l.link || '',
              status: l.status,
              minutes: l.minutes || 0,
              notes: l.notes || '',
              createdAt: l.created_at || l.createdAt
            })),
            weightLogs: (weightLogs as any[] || []).map(w => ({
              id: w.id,
              date: w.date,
              weight: w.weight,
              notes: w.notes || '',
              createdAt: w.created_at || w.createdAt
            })),
            meals: (meals as any[] || []).map(m => ({
              id: m.id,
              date: m.date,
              type: m.type,
              food: m.food,
              protein: m.protein || 0,
              calories: m.calories || 0,
              createdAt: m.created_at || m.createdAt
            })),
            workouts: (workouts as any[] || []).map(w => ({
              id: w.id,
              date: w.date,
              type: w.type || '',
              program: w.program || '',
              category: w.category || 'strength',
              activity: w.activity || '',
              minutes: w.minutes || 0,
              notes: w.notes || '',
              createdAt: w.created_at || w.createdAt,
              exercises: (w.workout_exercises || []).map((e: any) => ({
                name: e.name,
                sets: (e.workout_sets || []).map((s: any) => ({
                  weight: s.weight || 0,
                  reps: s.reps || 0
                }))
              }))
            })),
            healthProfile: healthProfile ? {
              height: healthProfile.height || '',
              age: healthProfile.age || '',
              activityLevel: healthProfile.activity_level || 'moderate',
              mealGoalCalories: healthProfile.meal_goal_calories || ''
            } : prev.healthProfile,
            workApplications: (workApplications as any[] || []).map(wa => ({
              id: wa.id,
              company: wa.company,
              role: wa.role,
              status: wa.status,
              priority: wa.priority,
              deadline: wa.deadline || '',
              appliedDate: wa.applied_date || '',
              source: wa.source || '',
              link: wa.link || '',
              nextAction: wa.next_action || '',
              notes: wa.notes || '',
              createdAt: wa.created_at || wa.createdAt
            })),
            reviews: (reviews as any[] || []).map(r => ({
              id: r.id,
              date: r.date,
              period: r.period,
              score: r.score || 0,
              wins: r.wins || '',
              lessons: r.lessons || '',
              challenges: r.challenges || '',
              focus: r.focus || '',
              createdAt: r.created_at || r.createdAt
            })),
            transactions: (transactions as any[] || []).map(t => ({
              id: t.id,
              date: t.date,
              title: t.title,
              amount: Number(t.amount) || 0,
              type: t.type,
              category: t.category,
              notes: t.notes || '',
              createdAt: t.created_at || t.createdAt
            })),
            financialGoals: (financialGoalsData as any[] || []).map(fg => ({
              id: fg.id,
              title: fg.title,
              targetAmount: Number(fg.target_amount) || 0,
              currentAmount: Number(fg.current_amount) || 0,
              targetDate: fg.target_date || '',
              createdAt: fg.created_at || fg.createdAt
            })),
            dictionary: dictEntries.map(d => ({
              id: d.id,
              indonesian: d.indonesian || '',
              translation: d.translation || '',
              language: d.language || 'English',
              createdAt: d.created_at || d.createdAt || new Date().toISOString()
            })),
          }));
          setLoading(false);
          return;
        } catch (err: any) {
          console.error('[LifeOS] Failed to load from Supabase:', err);
          alert('Gagal mengambil data dari database server: ' + (err?.message || JSON.stringify(err)));
          setLoading(false);
        }
      }

      // ── Not logged in / Supabase not configured → empty default state ──
      setState(initialDefaultState(todayISO()));
      setLoading(false);
    }

    loadData();
  }, [authResolved, user, isDbConnected]);

  // Update state (Supabase writes happen in individual CRUD functions)
  const updateStateAndPersist = useCallback((updater: (prev: LifeOSState) => LifeOSState) => {
    setState(prev => updater(prev));
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  const setDisplayMode = useCallback((mode: 'auto' | 'desktop' | 'mobile') => {
    updateStateAndPersist(prev => ({ ...prev, displayMode: mode }));
  }, [updateStateAndPersist]);

  const setReviewPeriod = useCallback((period: 'weekly' | 'monthly') => {
    updateStateAndPersist(prev => ({ ...prev, reviewPeriod: period }));
  }, [updateStateAndPersist]);

  const checkError = useCallback((error: any, contextName: string) => {
    if (error) {
      console.error(`[LifeOS Error] ${contextName}:`, error);
      alert(`Error (${contextName}): ${error.message || JSON.stringify(error)}`);
    }
  }, []);

  // =========================================================================
  // CAPTURE / IDEAS MODULE
  // =========================================================================
  const addIdea = useCallback(async (newIdea: Omit<Idea, 'id' | 'createdAt' | 'status'>) => {
    const item: Idea = {
      ...newIdea,
      id: generateId(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('ideas').insert({
          id: item.id,
          user_id: user.id,
          title: item.title,
          area: item.area,
          priority: item.priority,
          notes: item.notes,
          status: item.status
        });
        checkError(error, 'addIdea');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      ideas: [item, ...prev.ideas]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const archiveIdea = useCallback(async (id: string) => {
    let newStatus: 'active' | 'archived' = 'archived';
    
    updateStateAndPersist(prev => {
      const ideas = prev.ideas.map(idea => {
        if (idea.id === id) {
          newStatus = idea.status === 'archived' ? 'active' : 'archived';
          return { ...idea, status: newStatus };
        }
        return idea;
      });
      return { ...prev, ideas };
    });

    if (isDbConnected) {
      const { error } = await supabase.from('ideas').update({ status: newStatus }).eq('id', id);
      checkError(error, 'archiveIdea');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteIdea = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      ideas: prev.ideas.filter(idea => idea.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('ideas').delete().eq('id', id);
      checkError(error, 'deleteIdea');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // JOURNAL MODULE
  // =========================================================================
  const saveJournal = useCallback(async (formValues: Omit<Journal, 'id' | 'createdAt' | 'date'>) => {
    const today = state.selectedDate;
    
    let journalItem: Journal;

    updateStateAndPersist(prev => {
      const existing = prev.journals.find(j => j.date === today);
      if (existing) {
        journalItem = {
          ...existing,
          ...formValues,
          date: today
        };
        return {
          ...prev,
          journals: prev.journals.map(j => j.date === today ? journalItem : j)
        };
      } else {
        journalItem = {
          ...formValues,
          id: generateId(),
          date: today,
          createdAt: new Date().toISOString()
        };
        return {
          ...prev,
          journals: [journalItem, ...prev.journals]
        };
      }
    });

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('journals').upsert({
          id: journalItem!.id,
          user_id: user.id,
          date: today,
          mood: journalItem!.mood,
          energy: journalItem!.energy,
          gratitude_1: journalItem!.gratitude_1,
          gratitude_2: journalItem!.gratitude_2,
          gratitude_3: journalItem!.gratitude_3,
          win: journalItem!.win,
          reflection: journalItem!.reflection,
          next_action: journalItem!.next,
        }, { onConflict: 'user_id,date' });
        checkError(error, 'saveJournal');
      }
    }
  }, [isDbConnected, state.selectedDate, updateStateAndPersist, checkError]);

  const deleteJournal = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      journals: prev.journals.filter(j => j.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('journals').delete().eq('id', id);
      checkError(error, 'deleteJournal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // PLANNING MODULE
  // =========================================================================
  const addPlan = useCallback(async (newPlan: Omit<Plan, 'id' | 'createdAt' | 'status'>) => {
    const item: Plan = {
      ...newPlan,
      id: generateId(),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    // Auto-push event to Google Calendar if connected
    if (item.kind === 'event' && typeof window !== 'undefined' && window.gapi?.client?.calendar) {
      try {
        const gEventId = await createCalendarEvent({
          title: item.title,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          notes: item.notes
        });
        if (gEventId) {
          item.googleEventId = gEventId;
        }
      } catch (err) {
        console.error('[Google Calendar] Auto-push failed:', err);
      }
    }

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('next_day_plans').insert({
          id: item.id,
          user_id: user.id,
          date: item.date,
          title: item.title,
          kind: item.kind,
          start_time: item.startTime,
          end_time: item.endTime,
          priority: item.priority,
          area: item.area,
          notes: item.notes,
          status: item.status,
          google_event_id: item.googleEventId || ''
        });
        checkError(error, 'addPlan');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      nextDayPlans: [item, ...prev.nextDayPlans]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const togglePlan = useCallback(async (id: string) => {
    let nextStatus: 'scheduled' | 'done' = 'done';
    updateStateAndPersist(prev => {
      const nextDayPlans = prev.nextDayPlans.map(plan => {
        if (plan.id === id) {
          nextStatus = plan.status === 'done' ? 'scheduled' : 'done';
          return { ...plan, status: nextStatus };
        }
        return plan;
      });
      return { ...prev, nextDayPlans };
    });

    if (isDbConnected) {
      const { error } = await supabase.from('next_day_plans').update({ status: nextStatus }).eq('id', id);
      checkError(error, 'togglePlan');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deletePlan = useCallback(async (id: string) => {
    // Find plan to check for Google Calendar Event ID
    let googleEventIdToDelete = '';
    updateStateAndPersist(prev => {
      const plan = prev.nextDayPlans.find(p => p.id === id);
      if (plan?.googleEventId) {
        googleEventIdToDelete = plan.googleEventId;
      }
      return {
        ...prev,
        nextDayPlans: prev.nextDayPlans.filter(p => p.id !== id)
      };
    });

    if (googleEventIdToDelete && typeof window !== 'undefined' && window.gapi?.client?.calendar) {
      try {
        await deleteCalendarEvent(googleEventIdToDelete);
      } catch (err) {
        console.error('[Google Calendar] Auto-delete failed:', err);
      }
    }

    if (isDbConnected) {
      const { error } = await supabase.from('next_day_plans').delete().eq('id', id);
      checkError(error, 'deletePlan');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // PROJECTS & TASKS MODULE
  // =========================================================================
  const addProject = useCallback(async (newProject: Omit<Project, 'id' | 'createdAt'>) => {
    const item: Project = {
      ...newProject,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('projects').insert({
          id: item.id,
          user_id: user.id,
          name: item.name,
          area: item.area,
          status: item.status
        });
        checkError(error, 'addProject');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      projects: [item, ...prev.projects]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteProject = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.map(t => t.projectId === id ? { ...t, projectId: '' } : t) // Send tasks to inbox
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      checkError(error, 'deleteProject');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addTask = useCallback(async (newTask: Omit<Task, 'id' | 'createdAt' | 'status' | 'completedAt'>) => {
    const item: Task = {
      ...newTask,
      id: generateId(),
      status: 'todo',
      completedAt: '',
      createdAt: new Date().toISOString()
    };

    // Auto-push deadline to Google Calendar if connected and due date exists
    if (item.due && typeof window !== 'undefined' && window.gapi?.client?.calendar) {
      try {
        const gEventId = await createCalendarEvent({
          title: `[Tugas] ${item.title}`,
          date: item.due,
          startTime: '09:00',
          endTime: '10:00',
          notes: `Prioritas: ${item.priority}\nStatus: ${item.status}\nDiintegrasikan dari Life OS Tasks.`
        });
        if (gEventId) {
          item.googleEventId = gEventId;
        }
      } catch (err) {
        console.error('[Google Calendar Task Sync] Auto-push failed:', err);
      }
    }

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('tasks').insert({
          id: item.id,
          user_id: user.id,
          project_id: item.projectId || null,
          title: item.title,
          due: item.due || null,
          priority: item.priority,
          status: item.status,
          google_event_id: item.googleEventId || ''
        });
        checkError(error, 'addTask');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      tasks: [item, ...prev.tasks]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateTaskStatus = useCallback(async (id: string, status: 'todo' | 'doing' | 'done') => {
    const completedAt = status === 'done' ? new Date().toISOString() : '';
    
    updateStateAndPersist(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status, completedAt } : t)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('tasks').update({
        status,
        completed_at: completedAt || null
      }).eq('id', id);
      checkError(error, 'updateTaskStatus');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteTask = useCallback(async (id: string) => {
    let googleEventIdToDelete = '';
    updateStateAndPersist(prev => {
      const task = prev.tasks.find(t => t.id === id);
      if (task?.googleEventId) {
        googleEventIdToDelete = task.googleEventId;
      }
      return {
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== id)
      };
    });

    if (googleEventIdToDelete && typeof window !== 'undefined' && window.gapi?.client?.calendar) {
      try {
        await deleteCalendarEvent(googleEventIdToDelete);
      } catch (err) {
        console.error('[Google Calendar Task Sync] Auto-delete failed:', err);
      }
    }

    if (isDbConnected) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      checkError(error, 'deleteTask');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // GOALS MODULE
  // =========================================================================
  const addGoal = useCallback(async (newGoal: Omit<Goal, 'id' | 'createdAt'>) => {
    const item: Goal = {
      ...newGoal,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('goals').insert({
          id: item.id,
          user_id: user.id,
          title: item.title,
          category: item.category,
          current_value: item.currentValue,
          target_value: item.targetValue,
          unit: item.unit,
          target_date: item.targetDate || null,
          progress: item.progress
        });
        checkError(error, 'addGoal');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      goals: [item, ...prev.goals]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateGoalProgress = useCallback(async (id: string, delta: number) => {
    let nextProgress = 0;
    updateStateAndPersist(prev => {
      const goals = prev.goals.map(g => {
        if (g.id === id) {
          nextProgress = clamp(g.progress + delta, 0, 100);
          return { ...g, progress: nextProgress };
        }
        return g;
      });
      return { ...prev, goals };
    });

    if (isDbConnected) {
      const { error } = await supabase.from('goals').update({ progress: nextProgress }).eq('id', id);
      checkError(error, 'updateGoalProgress');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteGoal = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      checkError(error, 'deleteGoal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // HABITS MODULE
  // =========================================================================
  const addHabit = useCallback(async (newHabit: Omit<Habit, 'id' | 'createdAt'>) => {
    const item: Habit = {
      ...newHabit,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('habits').insert({
          id: item.id,
          user_id: user.id,
          name: item.name,
          area: item.area,
          frequency: item.frequency,
          target_per_week: item.targetPerWeek
        });
        checkError(error, 'addHabit');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      habits: [item, ...prev.habits]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const toggleHabit = useCallback(async (habitId: string, date: string) => {
    let logItem: HabitLog | null = null;
    let isDelete = false;

    updateStateAndPersist(prev => {
      const idx = prev.habitLogs.findIndex(log => log.habitId === habitId && log.date === date);
      if (idx >= 0) {
        isDelete = true;
        logItem = prev.habitLogs[idx];
        return {
          ...prev,
          habitLogs: prev.habitLogs.filter((_, i) => i !== idx)
        };
      } else {
        logItem = {
          id: generateId(),
          habitId,
          date,
          createdAt: new Date().toISOString()
        };
        return {
          ...prev,
          habitLogs: [...prev.habitLogs, logItem]
        };
      }
    });

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (isDelete) {
          const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', date);
          checkError(error, 'deleteHabitLog');
        } else {
          const { error } = await supabase.from('habit_logs').upsert({
            id: logItem!.id,
            user_id: user.id,
            habit_id: habitId,
            date
          }, { onConflict: 'user_id,habit_id,date' });
          checkError(error, 'insertHabitLog');
        }
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteHabit = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      habitLogs: prev.habitLogs.filter(log => log.habitId !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      checkError(error, 'deleteHabit');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateHabit = useCallback(async (updatedHabit: Habit) => {
    updateStateAndPersist(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('habits').update({
        name: updatedHabit.name,
        area: updatedHabit.area,
        frequency: updatedHabit.frequency,
        target_per_week: updatedHabit.targetPerWeek
      }).eq('id', updatedHabit.id);
      checkError(error, 'updateHabit');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // LEARNING MODULE
  // =========================================================================
  const addLearningSession = useCallback(async (newSession: Omit<LearningSession, 'id' | 'createdAt'>) => {
    const item: LearningSession = {
      ...newSession,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('learning_sessions').insert({
          id: item.id,
          user_id: user.id,
          date: item.date,
          topic: item.topic,
          resource: item.resource,
          link: item.link,
          status: item.status,
          minutes: item.minutes,
          notes: item.notes
        });
        checkError(error, 'addLearningSession');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      learning: [item, ...prev.learning]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteLearningSession = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learning: prev.learning.filter(l => l.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('learning_sessions').delete().eq('id', id);
      checkError(error, 'deleteLearningSession');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addDictionaryEntry = useCallback(async (newEntry: Omit<DictionaryEntry, 'id' | 'createdAt'>) => {
    const item: DictionaryEntry = {
      ...newEntry,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    let savedToDb = false;
    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('dictionary').insert({
          id: item.id,
          user_id: user.id,
          indonesian: item.indonesian,
          translation: item.translation,
          language: item.language
        });
        if (!error) {
          savedToDb = true;
        } else {
          console.warn('[LifeOS] Failed to save dictionary to Supabase, saving locally:', error);
        }
      }
    }

    updateStateAndPersist(prev => {
      const updatedDict = [item, ...prev.dictionary];
      if (!savedToDb) {
        localStorage.setItem('lifeos_dictionary', JSON.stringify(updatedDict));
      }
      return {
        ...prev,
        dictionary: updatedDict
      };
    });
  }, [isDbConnected, updateStateAndPersist]);

  const deleteDictionaryEntry = useCallback(async (id: string) => {
    let deletedFromDb = false;
    if (isDbConnected) {
      const { error } = await supabase.from('dictionary').delete().eq('id', id);
      if (!error) {
        deletedFromDb = true;
      } else {
        console.warn('[LifeOS] Failed to delete dictionary from Supabase, deleting locally:', error);
      }
    }

    updateStateAndPersist(prev => {
      const updatedDict = prev.dictionary.filter(item => item.id !== id);
      if (!deletedFromDb) {
        localStorage.setItem('lifeos_dictionary', JSON.stringify(updatedDict));
      }
      return {
        ...prev,
        dictionary: updatedDict
      };
    });
  }, [isDbConnected, updateStateAndPersist]);

  // =========================================================================
  // HEALTH & FITNESS MODULE
  // =========================================================================
  const updateHealthProfile = useCallback(async (profile: HealthProfile) => {
    updateStateAndPersist(prev => ({
      ...prev,
      healthProfile: profile
    }));

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('health_profiles').upsert({
          user_id: user.id,
          height: profile.height || null,
          age: profile.age || null,
          activity_level: profile.activityLevel,
          meal_goal_calories: profile.mealGoalCalories || null
        }, { onConflict: 'user_id' });
        checkError(error, 'updateHealthProfile');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const saveWeightLog = useCallback(async (weight: number, notes: string, logDate?: string) => {
    const date = logDate || state.selectedDate;
    
    let weightItem: WeightLog;

    updateStateAndPersist(prev => {
      const existing = prev.weightLogs.find(w => w.date === date);
      if (existing) {
        weightItem = {
          ...existing,
          weight,
          notes
        };
        return {
          ...prev,
          weightLogs: prev.weightLogs.map(w => w.date === date ? weightItem : w)
        };
      } else {
        weightItem = {
          id: generateId(),
          date,
          weight,
          notes,
          createdAt: new Date().toISOString()
        };
        return {
          ...prev,
          weightLogs: [weightItem, ...prev.weightLogs]
        };
      }
    });

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('weight_logs').upsert({
          id: weightItem!.id,
          user_id: user.id,
          date,
          weight,
          notes
        }, { onConflict: 'user_id,date' });
        checkError(error, 'saveWeightLog');
      }
    }
  }, [isDbConnected, state.selectedDate, updateStateAndPersist, checkError]);

  const deleteWeightLog = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      weightLogs: prev.weightLogs.filter(w => w.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('weight_logs').delete().eq('id', id);
      checkError(error, 'deleteWeightLog');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addMeal = useCallback(async (newMeal: Omit<Meal, 'id' | 'createdAt'>) => {
    const item: Meal = {
      ...newMeal,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('meals').insert({
          id: item.id,
          user_id: user.id,
          date: item.date,
          type: item.type,
          food: item.food,
          protein: item.protein,
          calories: item.calories
        });
        checkError(error, 'addMeal');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      meals: [item, ...prev.meals]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteMeal = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('meals').delete().eq('id', id);
      checkError(error, 'deleteMeal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addWorkout = useCallback(async (newWorkout: Omit<Workout, 'id' | 'createdAt'>) => {
    const item: Workout = {
      ...newWorkout,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Insert workout parent
        const { error: wErr } = await supabase.from('workouts').insert({
          id: item.id,
          user_id: user.id,
          date: item.date,
          type: item.type,
          program: item.program,
          category: item.category,
          activity: item.activity || '',
          minutes: item.minutes,
          notes: item.notes
        });
        checkError(wErr, 'addWorkout');

        // Insert exercises and sets if strength workout
        if (!wErr && item.category === 'strength' && item.exercises) {
          for (let eIdx = 0; eIdx < item.exercises.length; eIdx++) {
            const ex = item.exercises[eIdx];
            const exId = generateId();
            
            const { error: exErr } = await supabase.from('workout_exercises').insert({
              id: exId,
              workout_id: item.id,
              name: ex.name,
              sort_order: eIdx
            });
            checkError(exErr, 'addWorkoutExercise');

            if (!exErr) {
              for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
                const set = ex.sets[sIdx];
                const { error: setErr } = await supabase.from('workout_sets').insert({
                  exercise_id: exId,
                  set_number: sIdx + 1,
                  weight: set.weight,
                  reps: set.reps
                });
                checkError(setErr, 'addWorkoutSet');
              }
            }
          }
        }
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      workouts: [item, ...prev.workouts]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteWorkout = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      workouts: prev.workouts.filter(w => w.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      checkError(error, 'deleteWorkout');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // WORK APPLICATIONS MODULE
  // =========================================================================
  const addWorkApplication = useCallback(async (newApp: Omit<WorkApplication, 'id' | 'createdAt'>) => {
    const item: WorkApplication = {
      ...newApp,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('work_applications').insert({
          id: item.id,
          user_id: user.id,
          company: item.company,
          role: item.role,
          status: item.status,
          priority: item.priority,
          deadline: item.deadline || null,
          applied_date: item.appliedDate || null,
          source: item.source,
          link: item.link,
          next_action: item.nextAction,
          notes: item.notes
        });
        checkError(error, 'addWorkApplication');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      workApplications: [item, ...prev.workApplications]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateWorkApplication = useCallback(async (app: WorkApplication) => {
    updateStateAndPersist(prev => ({
      ...prev,
      workApplications: prev.workApplications.map(w => w.id === app.id ? app : w)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('work_applications').update({
        company: app.company,
        role: app.role,
        status: app.status,
        priority: app.priority,
        deadline: app.deadline || null,
        applied_date: app.appliedDate || null,
        source: app.source,
        link: app.link,
        next_action: app.nextAction,
        notes: app.notes
      }).eq('id', app.id);
      checkError(error, 'updateWorkApplication');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteWorkApplication = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      workApplications: prev.workApplications.filter(w => w.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('work_applications').delete().eq('id', id);
      checkError(error, 'deleteWorkApplication');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // =========================================================================
  // REVIEWS MODULE
  // =========================================================================
  const saveReview = useCallback(async (newReview: Omit<Review, 'id' | 'createdAt'>) => {
    const item: Review = {
      ...newReview,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('reviews').insert({
          id: item.id,
          user_id: user.id,
          date: item.date,
          period: item.period,
          score: item.score,
          wins: item.wins,
          lessons: item.lessons,
          challenges: item.challenges,
          focus: item.focus,
          evaluation_notes: item.evaluationNotes || ''
        });
        checkError(error, 'saveReview');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      reviews: [item, ...prev.reviews]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteReview = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      reviews: prev.reviews.filter(r => r.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      checkError(error, 'deleteReview');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);



  // =========================================================================
  // FINANCE MODULE
  // =========================================================================
  const addTransaction = useCallback(async (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const item: Transaction = {
      ...newTx,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('transactions').insert({
          id: item.id,
          user_id: user.id,
          date: item.date,
          title: item.title,
          amount: item.amount,
          type: item.type,
          category: item.category,
          notes: item.notes
        });
        checkError(error, 'addTransaction');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      transactions: [item, ...prev.transactions]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteTransaction = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      checkError(error, 'deleteTransaction');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addFinancialGoal = useCallback(async (newGoal: Omit<FinancialGoal, 'id' | 'createdAt'>) => {
    const item: FinancialGoal = {
      ...newGoal,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('financial_goals').insert({
          id: item.id,
          user_id: user.id,
          title: item.title,
          target_amount: item.targetAmount,
          current_amount: item.currentAmount,
          target_date: item.targetDate || null
        });
        checkError(error, 'addFinancialGoal');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      financialGoals: [item, ...prev.financialGoals]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateFinancialGoal = useCallback(async (id: string, currentAmount: number) => {
    updateStateAndPersist(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.map(fg => fg.id === id ? { ...fg, currentAmount } : fg)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('financial_goals').update({
        current_amount: currentAmount
      }).eq('id', id);
      checkError(error, 'updateFinancialGoal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteFinancialGoal = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.filter(fg => fg.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('financial_goals').delete().eq('id', id);
      checkError(error, 'deleteFinancialGoal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  return (
    <LifeOSContext.Provider
      value={{
        state,
        loading,
        isDbConnected,
        user,
        signIn,
        signUp,
        signOut,
        setSelectedDate,
        setDisplayMode,
        setReviewPeriod,
        addIdea,
        archiveIdea,
        deleteIdea,
        saveJournal,
        deleteJournal,
        addPlan,
        togglePlan,
        deletePlan,
        addProject,
        deleteProject,
        addTask,
        updateTaskStatus,
        deleteTask,
        addGoal,
        updateGoalProgress,
        deleteGoal,
        addHabit,
        toggleHabit,
        updateHabit,
        deleteHabit,
        addLearningSession,
        deleteLearningSession,
        addDictionaryEntry,
        deleteDictionaryEntry,
        updateHealthProfile,
        saveWeightLog,
        deleteWeightLog,
        addMeal,
        deleteMeal,
        addWorkout,
        deleteWorkout,
        addWorkApplication,
        updateWorkApplication,
        deleteWorkApplication,
        saveReview,
        deleteReview,
        addTransaction,
        deleteTransaction,
        addFinancialGoal,
        updateFinancialGoal,
        deleteFinancialGoal,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
}
