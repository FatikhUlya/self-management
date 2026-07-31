'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
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
  goalId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string; // empty string for Inbox
  goalId?: string;
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
  notesCues?: string;
  notesNotes?: string;
  notesSummary?: string;
  createdAt: string;
}

export interface LearningSchedule {
  id: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
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
  setType?: 'N' | 'W' | 'D' | 'F';
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
  account: string;
  notes: string;
  isRecurring?: boolean;
  recurringInterval?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  linkedAccountName?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyInstallment: number;
  dueDate: string;
  nextDueDate: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  category: string;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  createdAt: string;
}

export interface SelfRule {
  id: string;
  rule_text: string;
  section?: string;
  orderIndex?: number;
  createdAt: string;
}

// ─── Self Awareness Mirror ───

export interface SelfAssessmentSnapshot {
  id: string;
  periodType: 'weekly' | 'monthly' | 'custom';
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  overallReflection: string;
  isDraft: boolean;
  createdAt: string;
}

export interface SelfAssessmentDomain {
  id: string;
  snapshotId: string;
  domainKey: string;
  domainLabel: string;
  rating: number;
  strengthObservation: string;
  strengthReasoning: string;
  growthObservation: string;
  growthReasoning: string;
  sortOrder: number;
}

export interface FeedbackRequest {
  id: string;
  title: string;
  token: string;
  privacyMode: 'anonymous' | 'optional' | 'required';
  status: 'open' | 'closed';
  deadline: string | null;
  domains: string[];
  createdAt: string;
}

export interface FeedbackResponse {
  id: string;
  requestId: string;
  respondentName: string | null;
  status: string;
  createdAt: string;
}

export interface FeedbackResponseDomain {
  id: string;
  responseId: string;
  domainKey: string;
  rating: number;
  strengthObservation: string;
  growthObservation: string;
}

export interface GrowthGoal {
  id: string;
  domainKey: string | null;
  source: 'self' | 'feedback' | 'mixed';
  currentState: string;
  targetState: string;
  smartSpecific: string;
  smartMeasurable: string;
  smartAchievable: string;
  smartRelevant: string;
  smartTimebound: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'stopped';
  progress: number;
  targetDate: string | null;
  nextCheckinDate: string | null;
  createdAt: string;
}

export interface GrowthGoalMilestone {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export interface LifeOSState {
  selfRules: SelfRule[];
  ideas: Idea[];
  journals: Journal[];
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  learning: LearningSession[];
  learningSchedule: LearningSchedule | null;
  meals: Meal[];
  workouts: Workout[];
  nextDayPlans: Plan[];
  workApplications: WorkApplication[];
  weightLogs: WeightLog[];
  healthProfile: HealthProfile;
  reviews: Review[];
  transactions: Transaction[];
  financialGoals: FinancialGoal[];
  budgets: Budget[];
  debts: Debt[];
  assets: Asset[];
  financialAccounts: FinancialAccount[];
  dictionary: DictionaryEntry[];
  selfAssessmentSnapshots: SelfAssessmentSnapshot[];
  selfAssessmentDomains: SelfAssessmentDomain[];
  feedbackRequests: FeedbackRequest[];
  feedbackResponses: FeedbackResponse[];
  feedbackResponseDomains: FeedbackResponseDomain[];
  growthGoals: GrowthGoal[];
  growthGoalMilestones: GrowthGoalMilestone[];
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
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'completedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  updateTaskStatus: (id: string, status: 'todo' | 'doing' | 'done') => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateProjectGoal: (id: string, goalId: string | null) => Promise<void>;
  updateTaskGoal: (id: string, goalId: string | null) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>;
  updateGoalProgress: (id: string, delta: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  toggleHabit: (id: string, date: string) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Learning
  updateLearningSchedule: (schedule: Omit<LearningSchedule, 'id'>) => Promise<void>;
  addLearningSession: (session: Omit<LearningSession, 'id' | 'createdAt'>) => Promise<void>;
  deleteLearningSession: (id: string) => Promise<void>;
  updateLearningSessionNotes: (id: string, cues: string, notes: string, summary: string) => Promise<void>;
  addDictionaryEntry: (entry: Omit<DictionaryEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteDictionaryEntry: (id: string) => Promise<void>;

  // Learning Paths
  addLearningSubject: (title: string, description?: string) => Promise<void>;
  updateLearningSubject: (id: string, updates: Partial<LearningSubject>) => Promise<void>;
  deleteLearningSubject: (id: string) => Promise<void>;
  addLearningModule: (subjectId: string, module: Omit<LearningModule, 'id' | 'subjectId' | 'createdAt'>) => Promise<void>;
  updateLearningModule: (id: string, updates: Partial<LearningModule>) => Promise<void>;
  deleteLearningModule: (id: string) => Promise<void>;
  toggleLearningModuleCompletion: (id: string) => Promise<void>;
  reorderLearningModules: (reorderedModules: LearningModule[]) => Promise<void>;

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
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
  updateBudget: (id: string, limitAmount: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Omit<Debt, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Omit<Asset, 'id' | 'createdAt'>>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addFinancialAccount: (name: string) => Promise<void>;
  updateFinancialAccount: (id: string, name: string) => Promise<void>;
  deleteFinancialAccount: (id: string) => Promise<void>;

  // Self Rules
  addSelfRule: (ruleText: string, section?: string) => Promise<void>;
  updateSelfRuleSection: (id: string, newSection: string) => Promise<void>;
  deleteSelfRule: (id: string) => Promise<void>;
  reorderSelfRules: (reorderedRules: SelfRule[]) => Promise<void>;

  // Self Awareness Mirror
  saveSelfAssessment: (snapshot: Omit<SelfAssessmentSnapshot, 'id' | 'createdAt'>, domains: Omit<SelfAssessmentDomain, 'id' | 'snapshotId'>[]) => Promise<void>;
  createFeedbackRequest: (request: Omit<FeedbackRequest, 'id' | 'createdAt' | 'status' | 'token'>) => Promise<string>;
  closeFeedbackRequest: (id: string) => Promise<void>;
  submitPublicFeedback: (token: string, respondentName: string | null, domains: Omit<FeedbackResponseDomain, 'id' | 'responseId'>[]) => Promise<void>;
  addGrowthGoal: (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateGrowthGoal: (id: string, updates: Partial<Omit<GrowthGoal, 'id' | 'createdAt'>>) => Promise<void>;
  addGrowthGoalMilestone: (milestone: Omit<GrowthGoalMilestone, 'id'>) => Promise<void>;
  toggleGrowthGoalMilestone: (id: string) => Promise<void>;
}

const LifeOSContext = createContext<LifeOSContextProps | undefined>(undefined);

const initialDefaultState = (today: string): LifeOSState => ({
  selfRules: [],
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
  learningSchedule: null,
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
  budgets: [],
  debts: [],
  assets: [],
  financialAccounts: [
    { id: 'acc-tunai', name: 'Tunai', createdAt: new Date().toISOString() },
    { id: 'acc-bca', name: 'Bank BCA', createdAt: new Date().toISOString() },
    { id: 'acc-mandiri', name: 'Bank Mandiri', createdAt: new Date().toISOString() },
    { id: 'acc-gopay', name: 'GoPay', createdAt: new Date().toISOString() },
    { id: 'acc-ovo', name: 'OVO', createdAt: new Date().toISOString() },
    { id: 'acc-shopeepay', name: 'ShopeePay', createdAt: new Date().toISOString() }
  ],
  dictionary: [],
  selfAssessmentSnapshots: [],
  selfAssessmentDomains: [],
  feedbackRequests: [],
  feedbackResponses: [],
  feedbackResponseDomains: [],
  growthGoals: [],
  growthGoalMilestones: [],
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

  const userId = user?.id;
  const userEmail = user?.email;

  // ── Step 2: Load data ONLY after auth is resolved ──
  useEffect(() => {
    if (!authResolved) return;

    async function loadData() {
      setLoading(true);

      // ── Logged in → Supabase is the ONLY source of truth ──
      if (isDbConnected && userId) {
        try {
          // 1. Ensure user row exists in public.users table to satisfy foreign keys
          const { error: userUpsertError } = await supabase.from('users').upsert({
            id: userId,
            email: userEmail
          }, { onConflict: 'id' });

          if (userUpsertError) {
            console.error('[LifeOS] Failed to upsert user profile:', userUpsertError);
            const isNetworkError = !userUpsertError.code || 
                                   userUpsertError.message?.toLowerCase().includes('load failed') || 
                                   userUpsertError.message?.toLowerCase().includes('failed to fetch') ||
                                   userUpsertError.message?.toLowerCase().includes('network');
            
            if (isNetworkError) {
              alert(
                `Gagal menyambung ke database (Network/CORS Error):\n${userUpsertError.message}\n\n` +
                `Penyebab umum:\n` +
                `1. Koneksi internet Anda tidak stabil.\n` +
                `2. Browser Anda menggunakan AdBlocker, Brave Shield, atau VPN yang memblokir domain Supabase (ejbtjcaxfjuoedytagrp.supabase.co).\n` +
                `Silakan matikan AdBlocker/Brave Shield untuk situs ini, atau periksa jaringan Anda.`
              );
            } else {
              alert(
                `Gagal menyelaraskan profil pengguna (Database Error): ${userUpsertError.message}\n\n` +
                `Untuk memperbaikinya, jalankan perintah SQL ini di Dashboard Supabase → SQL Editor:\n` +
                `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`
              );
            }
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
            { data: budgetsData },
            { data: debtsData },
            { data: assetsData },
            { data: dictionaryData, error: dictionaryError },
            { data: financialAccountsData },
            { data: selfRulesData },
            { data: learningSchedulesData },
            { data: learningSubjectsData },
            { data: learningModulesData },
          ] = await Promise.all([
            supabase.from('ideas').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('next_day_plans').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('habit_logs').select('*').eq('user_id', userId),
            supabase.from('learning_sessions').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('weight_logs').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('meals').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('workouts').select('*, workout_exercises(*, workout_sets(*))').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('health_profiles').select('*').eq('user_id', userId),
            supabase.from('work_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('reviews').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('financial_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('budgets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('debts').select('*').eq('user_id', userId).order('next_due_date', { ascending: true }),
            supabase.from('assets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('dictionary').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('financial_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('self_rules').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('learning_schedules').select('*').eq('user_id', userId).limit(1),
            supabase.from('learning_subjects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('learning_modules').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
          ]);

          const [
            { data: saSnapshotsData },
            { data: saDomainsData },
            { data: feedbackRequestsData },
            { data: feedbackResponsesData },
            { data: feedbackResponseDomainsData },
            { data: growthGoalsData },
            { data: growthGoalMilestonesData },
          ] = await Promise.all([
            supabase.from('self_assessment_snapshots').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('self_assessment_domains').select('*').order('sort_order', { ascending: true }),
            supabase.from('feedback_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('feedback_responses').select('*').order('created_at', { ascending: false }),
            supabase.from('feedback_response_domains').select('*'),
            supabase.from('growth_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('growth_goal_milestones').select('*').order('sort_order', { ascending: true }),
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

          let finalAccounts = financialAccountsData as any[] || [];
          if (finalAccounts.length === 0) {
            const defaultAccs = ['Tunai', 'Bank BCA', 'Bank Mandiri', 'GoPay', 'OVO', 'ShopeePay'];
            const payload = defaultAccs.map(name => ({
              user_id: userId,
              name
            }));
            const { data: seededAccs, error: seedErr } = await supabase.from('financial_accounts').insert(payload).select();
            if (!seedErr && seededAccs) {
              finalAccounts = seededAccs;
            } else {
              console.error('[LifeOS] Failed to seed default accounts:', seedErr);
            }
          }

          setState(prev => ({
            ...prev,
            learningSubjects: (learningSubjectsData as any[] || []).map(s => ({
              id: s.id,
              title: s.title,
              description: s.description || '',
              createdAt: s.created_at
            })),
            learningModules: (learningModulesData as any[] || []).map(m => ({
              id: m.id,
              subjectId: m.subject_id,
              title: m.title,
              contentMaterial: m.content_material || '',
              contentVideoLink: m.content_video_link || '',
              contentImageUrl: m.content_image_url || '',
              isCompleted: m.is_completed || false,
              orderIndex: m.order_index || 0,
              createdAt: m.created_at
            })),
            selfRules: (selfRulesData as any[] || []).map(r => ({
              id: r.id,
              rule_text: r.rule_text,
              section: r.section || 'General',
              orderIndex: r.order_index || 0,
              createdAt: r.created_at
            })),
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
              goalId: p.goal_id || '',
              createdAt: p.created_at || p.createdAt
            })),
            tasks: (tasks as any[] || []).map(t => ({
              id: t.id,
              projectId: t.project_id || '',
              goalId: t.goal_id || '',
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
              notesCues: l.notes_cues || '',
              notesNotes: l.notes_notes || '',
              notesSummary: l.notes_summary || '',
              createdAt: l.created_at || l.createdAt
            })),
            selfAssessmentSnapshots: (saSnapshotsData as any[] || []).map(s => ({
              id: s.id,
              periodType: s.period_type,
              periodLabel: s.period_label,
              periodStart: s.period_start,
              periodEnd: s.period_end,
              overallReflection: s.overall_reflection || '',
              isDraft: s.is_draft,
              createdAt: s.created_at
            })),
            selfAssessmentDomains: (saDomainsData as any[] || []).map(d => ({
              id: d.id,
              snapshotId: d.snapshot_id,
              domainKey: d.domain_key,
              domainLabel: d.domain_label,
              rating: d.rating,
              strengthObservation: d.strength_observation || '',
              strengthReasoning: d.strength_reasoning || '',
              growthObservation: d.growth_observation || '',
              growthReasoning: d.growth_reasoning || '',
              sortOrder: d.sort_order || 0
            })),
            feedbackRequests: (feedbackRequestsData as any[] || []).map(r => ({
              id: r.id,
              title: r.title,
              token: r.token,
              privacyMode: r.privacy_mode,
              status: r.status,
              deadline: r.deadline,
              domains: r.domains || [],
              createdAt: r.created_at
            })),
            feedbackResponses: (feedbackResponsesData as any[] || []).map(r => ({
              id: r.id,
              requestId: r.request_id,
              respondentName: r.respondent_name,
              status: r.status,
              createdAt: r.created_at
            })),
            feedbackResponseDomains: (feedbackResponseDomainsData as any[] || []).map(d => ({
              id: d.id,
              responseId: d.response_id,
              domainKey: d.domain_key,
              rating: d.rating,
              strengthObservation: d.strength_observation || '',
              growthObservation: d.growth_observation || '',
            })),
            growthGoals: (growthGoalsData as any[] || []).map(g => ({
              id: g.id,
              domainKey: g.domain_key,
              source: g.source,
              currentState: g.current_state,
              targetState: g.target_state,
              smartSpecific: g.smart_specific || '',
              smartMeasurable: g.smart_measurable || '',
              smartAchievable: g.smart_achievable || '',
              smartRelevant: g.smart_relevant || '',
              smartTimebound: g.smart_timebound || '',
              status: g.status,
              progress: g.progress || 0,
              targetDate: g.target_date,
              nextCheckinDate: g.next_checkin_date,
              createdAt: g.created_at
            })),
            growthGoalMilestones: (growthGoalMilestonesData as any[] || []).map(m => ({
              id: m.id,
              goalId: m.goal_id,
              title: m.title,
              isCompleted: m.is_completed,
              completedAt: m.completed_at,
              sortOrder: m.sort_order || 0
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
                sets: (e.workout_sets || [])
                  .sort((a: any, b: any) => (a.set_number || 0) - (b.set_number || 0))
                  .map((s: any) => ({
                    weight: Number(s.weight) || 0,
                    reps: Number(s.reps) || 0,
                    setType: s.set_type || 'N'
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
              account: t.account || 'Tunai',
              notes: t.notes || '',
              isRecurring: t.is_recurring || false,
              recurringInterval: t.recurring_interval || 'none',
              createdAt: t.created_at || t.createdAt
            })),
            financialGoals: (financialGoalsData as any[] || []).map(fg => ({
              id: fg.id,
              title: fg.title,
              targetAmount: Number(fg.target_amount) || 0,
              currentAmount: Number(fg.current_amount) || 0,
              targetDate: fg.target_date || '',
              linkedAccountName: fg.linked_account_name || '',
              createdAt: fg.created_at || fg.createdAt
            })),
            budgets: (budgetsData as any[] || []).map(b => ({
              id: b.id,
              category: b.category,
              limitAmount: Number(b.limit_amount) || 0,
              period: b.period || 'monthly',
              createdAt: b.created_at || b.createdAt
            })),
            debts: (debtsData as any[] || []).map(d => ({
              id: d.id,
              name: d.name,
              totalAmount: Number(d.total_amount) || 0,
              remainingAmount: Number(d.remaining_amount) || 0,
              monthlyInstallment: Number(d.monthly_installment) || 0,
              dueDate: d.due_date || '',
              nextDueDate: d.next_due_date || '',
              createdAt: d.created_at || d.createdAt
            })),
            assets: (assetsData as any[] || []).map(a => ({
              id: a.id,
              name: a.name,
              value: Number(a.value) || 0,
              category: a.category || '',
              createdAt: a.created_at || a.createdAt
            })),
            dictionary: dictEntries.map(d => ({
              id: d.id,
              indonesian: d.indonesian || '',
              translation: d.translation || '',
              language: d.language || 'English',
              createdAt: d.created_at || d.createdAt || new Date().toISOString()
            })),
            financialAccounts: finalAccounts.map(fa => ({
              id: fa.id,
              name: fa.name,
              createdAt: fa.created_at || fa.createdAt
            })),
            learningSchedule: learningSchedulesData?.[0] ? {
              id: learningSchedulesData[0].id,
              mon: learningSchedulesData[0].mon || '',
              tue: learningSchedulesData[0].tue || '',
              wed: learningSchedulesData[0].wed || '',
              thu: learningSchedulesData[0].thu || '',
              fri: learningSchedulesData[0].fri || '',
              sat: learningSchedulesData[0].sat || '',
              sun: learningSchedulesData[0].sun || '',
            } : null,
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
  }, [authResolved, userId, userEmail, isDbConnected]);

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

    // Auto-push event/task to Google Calendar if connected (only if it didn't come from GCal already)
    if (!newPlan.googleEventId && (item.kind === 'event' || item.kind === 'task') && typeof window !== 'undefined' && window.gapi?.client?.calendar) {
      try {
        const titlePrefix = item.kind === 'task' ? '[Tugas] ' : '';
        const gEventId = await createCalendarEvent({
          title: `${titlePrefix}${item.title}`,
          date: item.date,
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '10:00',
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
          start_time: item.startTime || '08:00',
          end_time: item.endTime || '09:00',
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

    // Always add to dismissed list so sync won't re-import this event
    if (googleEventIdToDelete && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('dismissed_gcal_ids') || '[]';
        const dismissed: string[] = JSON.parse(raw);
        if (!dismissed.includes(googleEventIdToDelete)) {
          dismissed.push(googleEventIdToDelete);
          // Keep list manageable — only store last 500 IDs
          if (dismissed.length > 500) dismissed.splice(0, dismissed.length - 500);
          localStorage.setItem('dismissed_gcal_ids', JSON.stringify(dismissed));
        }
      } catch { /* ignore parse errors */ }
    }

    // Try to delete from Google Calendar if available
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
          status: item.status,
          goal_id: item.goalId || null
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
          goal_id: item.goalId || null,
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

  const updateProjectGoal = useCallback(async (id: string, goalId: string | null) => {
    updateStateAndPersist(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, goalId: goalId || '' } : p)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('projects').update({ goal_id: goalId || null }).eq('id', id);
      checkError(error, 'updateProjectGoal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateProject = useCallback(async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));

    if (isDbConnected) {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.area !== undefined) payload.area = updates.area;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.goalId !== undefined) payload.goal_id = updates.goalId || null;

      const { error } = await supabase.from('projects').update(payload).eq('id', id);
      checkError(error, 'updateProject');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));

    if (isDbConnected) {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.due !== undefined) payload.due = updates.due || null;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.projectId !== undefined) payload.project_id = updates.projectId || null;
      if (updates.goalId !== undefined) payload.goal_id = updates.goalId || null;

      const { error } = await supabase.from('tasks').update(payload).eq('id', id);
      checkError(error, 'updateTask');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateTaskGoal = useCallback(async (id: string, goalId: string | null) => {
    updateStateAndPersist(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, goalId: goalId || '' } : t)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('tasks').update({ goal_id: goalId || null }).eq('id', id);
      checkError(error, 'updateTaskGoal');
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

  const updateGoal = useCallback(async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g)
    }));

    if (isDbConnected) {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.currentValue !== undefined) payload.current_value = updates.currentValue;
      if (updates.targetValue !== undefined) payload.target_value = updates.targetValue;
      if (updates.unit !== undefined) payload.unit = updates.unit;
      if (updates.targetDate !== undefined) payload.target_date = updates.targetDate || null;
      if (updates.progress !== undefined) payload.progress = updates.progress;

      const { error } = await supabase.from('goals').update(payload).eq('id', id);
      checkError(error, 'updateGoal');
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
  const updateLearningSchedule = useCallback(async (schedule: Omit<LearningSchedule, 'id'>) => {
    let newId = generateId();
    updateStateAndPersist(prev => {
      const existing = prev.learningSchedule;
      if (existing) newId = existing.id;
      return {
        ...prev,
        learningSchedule: { ...schedule, id: newId }
      };
    });

    if (isDbConnected && userId) {
      const { data: existing } = await supabase.from('learning_schedules').select('id').eq('user_id', userId).single();
      if (existing) {
        const { error } = await supabase.from('learning_schedules').update({
          mon: schedule.mon, tue: schedule.tue, wed: schedule.wed,
          thu: schedule.thu, fri: schedule.fri, sat: schedule.sat, sun: schedule.sun,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
        checkError(error, 'updateLearningSchedule');
      } else {
        const { error } = await supabase.from('learning_schedules').insert([{
          id: newId,
          user_id: userId,
          mon: schedule.mon, tue: schedule.tue, wed: schedule.wed,
          thu: schedule.thu, fri: schedule.fri, sat: schedule.sat, sun: schedule.sun,
        }]);
        checkError(error, 'insertLearningSchedule');
      }
    }
  }, [isDbConnected, userId, updateStateAndPersist, checkError]);

  const addLearningSession = useCallback(async (newSession: Omit<LearningSession, 'id' | 'createdAt'>) => {
    const item: LearningSession = {
      ...newSession,
      id: generateId(),
      notesCues: '',
      notesNotes: '',
      notesSummary: '',
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
          notes: item.notes,
          notes_cues: item.notesCues,
          notes_notes: item.notesNotes,
          notes_summary: item.notesSummary
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

  const updateLearningSessionNotes = useCallback(async (id: string, cues: string, notes: string, summary: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learning: prev.learning.map(l => l.id === id ? { ...l, notesCues: cues, notesNotes: notes, notesSummary: summary } : l)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('learning_sessions').update({
        notes_cues: cues,
        notes_notes: notes,
        notes_summary: summary
      }).eq('id', id);
      checkError(error, 'updateLearningSessionNotes');
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
                  reps: set.reps,
                  set_type: set.setType || 'N'
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
          account: item.account,
          notes: item.notes,
          is_recurring: item.isRecurring || false,
          recurring_interval: item.recurringInterval || 'none'
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
          target_date: item.targetDate || null,
          linked_account_name: item.linkedAccountName || ''
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

  const addBudget = useCallback(async (newBudget: Omit<Budget, 'id' | 'createdAt'>) => {
    const item: Budget = {
      ...newBudget,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('budgets').insert({
          id: item.id,
          user_id: user.id,
          category: item.category,
          limit_amount: item.limitAmount,
          period: item.period
        });
        checkError(error, 'addBudget');
      }
    }

    updateStateAndPersist(prev => ({
      ...prev,
      budgets: [item, ...prev.budgets]
    }));
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateBudget = useCallback(async (id: string, limitAmount: number) => {
    updateStateAndPersist(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => b.id === id ? { ...b, limitAmount } : b)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('budgets').update({
        limit_amount: limitAmount
      }).eq('id', id);
      checkError(error, 'updateBudget');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteBudget = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      checkError(error, 'deleteBudget');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addFinancialAccount = useCallback(async (name: string) => {
    const item: FinancialAccount = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString()
    };

    updateStateAndPersist(prev => ({
      ...prev,
      financialAccounts: [...prev.financialAccounts, item]
    }));

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('financial_accounts').insert({
          id: item.id,
          user_id: user.id,
          name: item.name
        });
        checkError(error, 'addFinancialAccount');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteFinancialAccount = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      financialAccounts: prev.financialAccounts.filter(fa => fa.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
      checkError(error, 'deleteFinancialAccount');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateFinancialAccount = useCallback(async (id: string, name: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      financialAccounts: prev.financialAccounts.map(fa => fa.id === id ? { ...fa, name } : fa)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('financial_accounts').update({ name }).eq('id', id);
      checkError(error, 'updateFinancialAccount');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addDebt = useCallback(async (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    const item: Debt = {
      ...debt,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    updateStateAndPersist(prev => ({
      ...prev,
      debts: [...prev.debts, item].sort((a, b) => new Date(a.nextDueDate || '9999-12-31').getTime() - new Date(b.nextDueDate || '9999-12-31').getTime())
    }));
    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('debts').insert({
          id: item.id,
          user_id: user.id,
          name: item.name,
          total_amount: item.totalAmount,
          remaining_amount: item.remainingAmount,
          monthly_installment: item.monthlyInstallment,
          due_date: item.dueDate,
          next_due_date: item.nextDueDate,
          created_at: item.createdAt
        });
        checkError(error, 'addDebt');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateDebt = useCallback(async (id: string, updates: Partial<Omit<Debt, 'id' | 'createdAt'>>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      debts: prev.debts.map(d => d.id === id ? { ...d, ...updates } : d).sort((a, b) => new Date(a.nextDueDate || '9999-12-31').getTime() - new Date(b.nextDueDate || '9999-12-31').getTime())
    }));
    if (isDbConnected) {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
      if (updates.remainingAmount !== undefined) payload.remaining_amount = updates.remainingAmount;
      if (updates.monthlyInstallment !== undefined) payload.monthly_installment = updates.monthlyInstallment;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      if (updates.nextDueDate !== undefined) payload.next_due_date = updates.nextDueDate;
      const { error } = await supabase.from('debts').update(payload).eq('id', id);
      checkError(error, 'updateDebt');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteDebt = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id)
    }));
    if (isDbConnected) {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      checkError(error, 'deleteDebt');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addAsset = useCallback(async (asset: Omit<Asset, 'id' | 'createdAt'>) => {
    const item: Asset = {
      ...asset,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    updateStateAndPersist(prev => ({
      ...prev,
      assets: [item, ...prev.assets].sort((a, b) => b.value - a.value)
    }));
    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('assets').insert({
          id: item.id,
          user_id: user.id,
          name: item.name,
          value: item.value,
          category: item.category,
          created_at: item.createdAt
        });
        checkError(error, 'addAsset');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Omit<Asset, 'id' | 'createdAt'>>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, ...updates } : a).sort((a, b) => b.value - a.value)
    }));
    if (isDbConnected) {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.value !== undefined) payload.value = updates.value;
      if (updates.category !== undefined) payload.category = updates.category;
      const { error } = await supabase.from('assets').update(payload).eq('id', id);
      checkError(error, 'updateAsset');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteAsset = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id)
    }));
    if (isDbConnected) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      checkError(error, 'deleteAsset');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addSelfRule = useCallback(async (rule_text: string, section: string = 'General') => {
    const item: SelfRule = {
      id: generateId(),
      rule_text,
      section,
      orderIndex: 0,
      createdAt: new Date().toISOString()
    };

    updateStateAndPersist(prev => ({
      ...prev,
      selfRules: [item, ...prev.selfRules]
    }));

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('self_rules').insert({
          id: item.id,
          user_id: user.id,
          rule_text: item.rule_text,
          section: item.section,
          created_at: item.createdAt
        });
        checkError(error, 'addSelfRule');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateSelfRuleSection = useCallback(async (id: string, newSection: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      selfRules: prev.selfRules.map(r => r.id === id ? { ...r, section: newSection } : r)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('self_rules').update({ section: newSection }).eq('id', id);
      checkError(error, 'updateSelfRuleSection');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteSelfRule = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      selfRules: prev.selfRules.filter(r => r.id !== id)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('self_rules').delete().eq('id', id);
      checkError(error, 'deleteSelfRule');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const reorderSelfRules = useCallback(async (reorderedRules: SelfRule[]) => {
    updateStateAndPersist(prev => ({
      ...prev,
      selfRules: prev.selfRules.map(r => reorderedRules.find(newR => newR.id === r.id) || r)
    }));

    if (isDbConnected) {
      for (const rule of reorderedRules) {
        if (rule.orderIndex !== undefined) {
          const { error } = await supabase.from('self_rules').update({ 
            order_index: rule.orderIndex,
            section: rule.section 
          }).eq('id', rule.id);
          if (error) console.error('[LifeOS] Failed to reorder self rule:', error.message);
        }
      }
    }
  }, [isDbConnected, updateStateAndPersist]);

  // =========================================================================
  // LEARNING PATHS
  // =========================================================================

  const addLearningSubject = useCallback(async (title: string, description?: string) => {
    const item: LearningSubject = {
      id: generateId(),
      title,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    updateStateAndPersist(prev => ({ ...prev, learningSubjects: [item, ...prev.learningSubjects] }));
    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('learning_subjects').insert({
          id: item.id,
          user_id: user.id,
          title: item.title,
          description: item.description,
          created_at: item.createdAt
        });
        checkError(error, 'addLearningSubject');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateLearningSubject = useCallback(async (id: string, updates: Partial<LearningSubject>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learningSubjects: prev.learningSubjects.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
    if (isDbConnected) {
      const { error } = await supabase.from('learning_subjects').update({
        title: updates.title,
        description: updates.description
      }).eq('id', id);
      checkError(error, 'updateLearningSubject');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteLearningSubject = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learningSubjects: prev.learningSubjects.filter(s => s.id !== id),
      learningModules: prev.learningModules.filter(m => m.subjectId !== id)
    }));
    if (isDbConnected) {
      const { error } = await supabase.from('learning_subjects').delete().eq('id', id);
      checkError(error, 'deleteLearningSubject');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addLearningModule = useCallback(async (subjectId: string, module: Omit<LearningModule, 'id' | 'subjectId' | 'createdAt'>) => {
    const item: LearningModule = {
      ...module,
      id: generateId(),
      subjectId,
      createdAt: new Date().toISOString()
    };
    updateStateAndPersist(prev => ({ ...prev, learningModules: [...prev.learningModules, item] }));
    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('learning_modules').insert({
          id: item.id,
          subject_id: item.subjectId,
          user_id: user.id,
          title: item.title,
          content_material: item.contentMaterial,
          content_video_link: item.contentVideoLink,
          content_image_url: item.contentImageUrl,
          is_completed: item.isCompleted,
          order_index: item.orderIndex,
          created_at: item.createdAt
        });
        checkError(error, 'addLearningModule');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateLearningModule = useCallback(async (id: string, updates: Partial<LearningModule>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learningModules: prev.learningModules.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
    if (isDbConnected) {
      const { error } = await supabase.from('learning_modules').update({
        title: updates.title,
        content_material: updates.contentMaterial,
        content_video_link: updates.contentVideoLink,
        content_image_url: updates.contentImageUrl,
        is_completed: updates.isCompleted,
        order_index: updates.orderIndex
      }).eq('id', id);
      checkError(error, 'updateLearningModule');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const deleteLearningModule = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learningModules: prev.learningModules.filter(m => m.id !== id)
    }));
    if (isDbConnected) {
      const { error } = await supabase.from('learning_modules').delete().eq('id', id);
      checkError(error, 'deleteLearningModule');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const toggleLearningModuleCompletion = useCallback(async (id: string) => {
    let newStatus = false;
    updateStateAndPersist(prev => {
      const module = prev.learningModules.find(m => m.id === id);
      if (module) newStatus = !module.isCompleted;
      return {
        ...prev,
        learningModules: prev.learningModules.map(m => m.id === id ? { ...m, isCompleted: newStatus } : m)
      };
    });
    if (isDbConnected) {
      const { error } = await supabase.from('learning_modules').update({ is_completed: newStatus }).eq('id', id);
      checkError(error, 'toggleLearningModuleCompletion');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const reorderLearningModules = useCallback(async (reorderedModules: LearningModule[]) => {
    updateStateAndPersist(prev => ({
      ...prev,
      learningModules: prev.learningModules.map(m => reorderedModules.find(newM => newM.id === m.id) || m)
    }));
    if (isDbConnected) {
      for (const module of reorderedModules) {
        if (module.orderIndex !== undefined) {
          const { error } = await supabase.from('learning_modules').update({ order_index: module.orderIndex }).eq('id', module.id);
          if (error) console.error('[LifeOS] Failed to reorder learning module:', error.message);
        }
      }
    }
  }, [isDbConnected, updateStateAndPersist]);

  // =========================================================================
  // SELF AWARENESS MIRROR
  // =========================================================================

  const saveSelfAssessment = useCallback(async (snapshot: Omit<SelfAssessmentSnapshot, 'id' | 'createdAt'>, domains: Omit<SelfAssessmentDomain, 'id' | 'snapshotId'>[]) => {
    const snapItem: SelfAssessmentSnapshot = {
      ...snapshot,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    const domItems: SelfAssessmentDomain[] = domains.map(d => ({
      ...d,
      id: generateId(),
      snapshotId: snapItem.id
    }));

    updateStateAndPersist(prev => ({
      ...prev,
      selfAssessmentSnapshots: [snapItem, ...prev.selfAssessmentSnapshots],
      selfAssessmentDomains: [...prev.selfAssessmentDomains, ...domItems]
    }));

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: snapErr } = await supabase.from('self_assessment_snapshots').insert({
          id: snapItem.id,
          user_id: user.id,
          period_type: snapItem.periodType,
          period_label: snapItem.periodLabel,
          period_start: snapItem.periodStart,
          period_end: snapItem.periodEnd,
          overall_reflection: snapItem.overallReflection,
          is_draft: snapItem.isDraft
        });
        checkError(snapErr, 'saveSelfAssessment (snapshot)');
        
        if (!snapErr) {
          const domPayload = domItems.map(d => ({
            id: d.id,
            snapshot_id: d.snapshotId,
            domain_key: d.domainKey,
            domain_label: d.domainLabel,
            rating: d.rating,
            strength_observation: d.strengthObservation,
            strength_reasoning: d.strengthReasoning,
            growth_observation: d.growthObservation,
            growth_reasoning: d.growthReasoning,
            sort_order: d.sortOrder
          }));
          const { error: domErr } = await supabase.from('self_assessment_domains').insert(domPayload);
          checkError(domErr, 'saveSelfAssessment (domains)');
        }
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const createFeedbackRequest = useCallback(async (request: Omit<FeedbackRequest, 'id' | 'createdAt' | 'status' | 'token'>) => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const item: FeedbackRequest = {
      ...request,
      id: generateId(),
      token,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    updateStateAndPersist(prev => ({
      ...prev,
      feedbackRequests: [item, ...prev.feedbackRequests]
    }));

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('feedback_requests').insert({
          id: item.id,
          user_id: user.id,
          title: item.title,
          token: item.token,
          privacy_mode: item.privacyMode,
          status: item.status,
          deadline: item.deadline,
          domains: item.domains
        });
        checkError(error, 'createFeedbackRequest');
      }
    }
    return token;
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const closeFeedbackRequest = useCallback(async (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      feedbackRequests: prev.feedbackRequests.map(r => r.id === id ? { ...r, status: 'closed' } : r)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('feedback_requests').update({ status: 'closed' }).eq('id', id);
      checkError(error, 'closeFeedbackRequest');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  // Special function for unauthenticated users submitting feedback
  const submitPublicFeedback = useCallback(async (token: string, respondentName: string | null, domains: Omit<FeedbackResponseDomain, 'id' | 'responseId'>[]) => {
    // 1. Find request ID by token
    const { data: reqData, error: reqErr } = await supabase.from('feedback_requests').select('id, status').eq('token', token).single();
    if (reqErr || !reqData) throw new Error('Feedback request not found or invalid token');
    if (reqData.status !== 'open') throw new Error('Feedback request is already closed');
    
    const requestId = reqData.id;
    const responseId = generateId();

    // 2. Insert response
    const { error: resErr } = await supabase.from('feedback_responses').insert({
      id: responseId,
      request_id: requestId,
      respondent_name: respondentName,
      status: 'submitted'
    });
    if (resErr) throw resErr;

    // 3. Insert response domains
    const domPayload = domains.map(d => ({
      id: generateId(),
      response_id: responseId,
      domain_key: d.domainKey,
      rating: d.rating,
      strength_observation: d.strengthObservation,
      growth_observation: d.growthObservation
    }));
    
    const { error: domErr } = await supabase.from('feedback_response_domains').insert(domPayload);
    if (domErr) throw domErr;

  }, []);

  const addGrowthGoal = useCallback(async (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => {
    const item: GrowthGoal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    updateStateAndPersist(prev => ({
      ...prev,
      growthGoals: [item, ...prev.growthGoals]
    }));

    if (isDbConnected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('growth_goals').insert({
          id: item.id,
          user_id: user.id,
          domain_key: item.domainKey,
          source: item.source,
          current_state: item.currentState,
          target_state: item.targetState,
          smart_specific: item.smartSpecific,
          smart_measurable: item.smartMeasurable,
          smart_achievable: item.smartAchievable,
          smart_relevant: item.smartRelevant,
          smart_timebound: item.smartTimebound,
          status: item.status,
          progress: item.progress,
          target_date: item.targetDate,
          next_checkin_date: item.nextCheckinDate
        });
        checkError(error, 'addGrowthGoal');
      }
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const updateGrowthGoal = useCallback(async (id: string, updates: Partial<Omit<GrowthGoal, 'id' | 'createdAt'>>) => {
    updateStateAndPersist(prev => ({
      ...prev,
      growthGoals: prev.growthGoals.map(g => g.id === id ? { ...g, ...updates } : g)
    }));

    if (isDbConnected) {
      const dbUpdates: any = {};
      if (updates.currentState !== undefined) dbUpdates.current_state = updates.currentState;
      if (updates.targetState !== undefined) dbUpdates.target_state = updates.targetState;
      if (updates.smartSpecific !== undefined) dbUpdates.smart_specific = updates.smartSpecific;
      if (updates.smartMeasurable !== undefined) dbUpdates.smart_measurable = updates.smartMeasurable;
      if (updates.smartAchievable !== undefined) dbUpdates.smart_achievable = updates.smartAchievable;
      if (updates.smartRelevant !== undefined) dbUpdates.smart_relevant = updates.smartRelevant;
      if (updates.smartTimebound !== undefined) dbUpdates.smart_timebound = updates.smartTimebound;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
      if (updates.nextCheckinDate !== undefined) dbUpdates.next_checkin_date = updates.nextCheckinDate;
      
      const { error } = await supabase.from('growth_goals').update(dbUpdates).eq('id', id);
      checkError(error, 'updateGrowthGoal');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const addGrowthGoalMilestone = useCallback(async (milestone: Omit<GrowthGoalMilestone, 'id'>) => {
    const item: GrowthGoalMilestone = {
      ...milestone,
      id: generateId(),
    };

    updateStateAndPersist(prev => ({
      ...prev,
      growthGoalMilestones: [...prev.growthGoalMilestones, item].sort((a, b) => a.sortOrder - b.sortOrder)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('growth_goal_milestones').insert({
        id: item.id,
        goal_id: item.goalId,
        title: item.title,
        is_completed: item.isCompleted,
        completed_at: item.completedAt,
        sort_order: item.sortOrder
      });
      checkError(error, 'addGrowthGoalMilestone');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);

  const toggleGrowthGoalMilestone = useCallback(async (id: string) => {
    let newStatus = false;
    let completedAt: string | null = null;
    
    updateStateAndPersist(prev => ({
      ...prev,
      growthGoalMilestones: prev.growthGoalMilestones.map(m => {
        if (m.id === id) {
          newStatus = !m.isCompleted;
          completedAt = newStatus ? new Date().toISOString() : null;
          return { ...m, isCompleted: newStatus, completedAt };
        }
        return m;
      })
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('growth_goal_milestones').update({
        is_completed: newStatus,
        completed_at: completedAt
      }).eq('id', id);
      checkError(error, 'toggleGrowthGoalMilestone');
    }
  }, [isDbConnected, updateStateAndPersist, checkError]);


  // Dynamically compute goal progress based on linked projects and tasks
  const processedGoals = useMemo(() => {
    return state.goals.map(goal => {
      // Find projects linked to this goal
      const linkedProjects = state.projects.filter(p => p.goalId === goal.id);
      const linkedProjectIds = linkedProjects.map(p => p.id);

      // Find tasks linked directly to this goal OR via linked projects
      const linkedTasks = state.tasks.filter(t => 
        t.goalId === goal.id || 
        (t.projectId && linkedProjectIds.includes(t.projectId))
      );

      if (linkedTasks.length > 0) {
        const completedCount = linkedTasks.filter(t => t.status === 'done').length;
        const progress = Math.round((completedCount / linkedTasks.length) * 100);
        return { ...goal, progress };
      }
      return goal;
    });
  }, [state.goals, state.projects, state.tasks]);

  const memoizedState = useMemo(() => ({
    ...state,
    goals: processedGoals
  }), [state, processedGoals]);

  return (
    <LifeOSContext.Provider
      value={{
        state: memoizedState,
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
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        updateProjectGoal,
        updateTaskGoal,
        addGoal,
        updateGoal,
        updateGoalProgress,
        deleteGoal,
        addHabit,
        toggleHabit,
        updateHabit,
        deleteHabit,
        updateLearningSchedule,
        addLearningSession,
        deleteLearningSession,
        updateLearningSessionNotes,
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
        addBudget,
        updateBudget,
        deleteBudget,
        addDebt,
        updateDebt,
        deleteDebt,
        addAsset,
        updateAsset,
        deleteAsset,
        addFinancialAccount,
        updateFinancialAccount,
        deleteFinancialAccount,
        addSelfRule,
        updateSelfRuleSection,
        deleteSelfRule,
        reorderSelfRules,
        addLearningSubject,
        updateLearningSubject,
        deleteLearningSubject,
        addLearningModule,
        updateLearningModule,
        deleteLearningModule,
        toggleLearningModuleCompletion,
        reorderLearningModules,
        saveSelfAssessment,
        createFeedbackRequest,
        closeFeedbackRequest,
        submitPublicFeedback,
        addGrowthGoal,
        updateGrowthGoal,
        addGrowthGoalMilestone,
        toggleGrowthGoalMilestone,
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
