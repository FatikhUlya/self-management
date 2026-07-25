// ─── Supabase Database Types ───
// Generated from schema to ensure type safety

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<UserRow>;
      };
      ideas: {
        Row: IdeaRow;
        Insert: Omit<IdeaRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<IdeaRow>;
      };
      journals: {
        Row: JournalRow;
        Insert: Omit<JournalRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<JournalRow>;
      };
      next_day_plans: {
        Row: PlanRow;
        Insert: Omit<PlanRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<PlanRow>;
      };
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<ProjectRow>;
      };
      tasks: {
        Row: TaskRow;
        Insert: Omit<TaskRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<TaskRow>;
      };
      goals: {
        Row: GoalRow;
        Insert: Omit<GoalRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<GoalRow>;
      };
      habits: {
        Row: HabitRow;
        Insert: Omit<HabitRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<HabitRow>;
      };
      habit_logs: {
        Row: HabitLogRow;
        Insert: Omit<HabitLogRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<HabitLogRow>;
      };
      learning_sessions: {
        Row: LearningRow;
        Insert: Omit<LearningRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<LearningRow>;
      };
      health_profiles: {
        Row: HealthProfileRow;
        Insert: Omit<HealthProfileRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<HealthProfileRow>;
      };
      weight_logs: {
        Row: WeightLogRow;
        Insert: Omit<WeightLogRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<WeightLogRow>;
      };
      meals: {
        Row: MealRow;
        Insert: Omit<MealRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<MealRow>;
      };
      workouts: {
        Row: WorkoutRow;
        Insert: Omit<WorkoutRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<WorkoutRow>;
      };
      workout_exercises: {
        Row: WorkoutExerciseRow;
        Insert: Omit<WorkoutExerciseRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<WorkoutExerciseRow>;
      };
      workout_sets: {
        Row: WorkoutSetRow;
        Insert: Omit<WorkoutSetRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<WorkoutSetRow>;
      };
      work_applications: {
        Row: WorkApplicationRow;
        Insert: Omit<WorkApplicationRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<WorkApplicationRow>;
      };
      reviews: {
        Row: ReviewRow;
        Insert: Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<ReviewRow>;
      };
      self_assessment_snapshots: {
        Row: SelfAssessmentSnapshotRow;
        Insert: Omit<SelfAssessmentSnapshotRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<SelfAssessmentSnapshotRow>;
      };
      self_assessment_domains: {
        Row: SelfAssessmentDomainRow;
        Insert: Omit<SelfAssessmentDomainRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<SelfAssessmentDomainRow>;
      };
      feedback_requests: {
        Row: FeedbackRequestRow;
        Insert: Omit<FeedbackRequestRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<FeedbackRequestRow>;
      };
      feedback_responses: {
        Row: FeedbackResponseRow;
        Insert: Omit<FeedbackResponseRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<FeedbackResponseRow>;
      };
      feedback_response_domains: {
        Row: FeedbackResponseDomainRow;
        Insert: Omit<FeedbackResponseDomainRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<FeedbackResponseDomainRow>;
      };
      growth_goals: {
        Row: GrowthGoalRow;
        Insert: Omit<GrowthGoalRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<GrowthGoalRow>;
      };
      growth_goal_milestones: {
        Row: GrowthGoalMilestoneRow;
        Insert: Omit<GrowthGoalMilestoneRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<GrowthGoalMilestoneRow>;
      };
    };
  };
}

// ─── Row Types ───

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  locale: 'id' | 'en';
  display_mode: 'auto' | 'desktop' | 'mobile';
  created_at: string;
  updated_at: string;
}

export interface IdeaRow {
  id: string;
  user_id: string;
  title: string;
  area: string;
  priority: 'Low' | 'Medium' | 'High';
  notes: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface JournalRow {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  energy: number;
  gratitude_1: string;
  gratitude_2: string;
  gratitude_3: string;
  win: string;
  reflection: string;
  next_action: string;
  created_at: string;
  updated_at: string;
}

export interface PlanRow {
  id: string;
  user_id: string;
  date: string;
  title: string;
  kind: 'task' | 'event';
  start_time: string;
  end_time: string;
  priority: 'Low' | 'Medium' | 'High';
  area: string;
  notes: string;
  status: 'scheduled' | 'done';
  google_event_id: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  area: string;
  status: 'active' | 'paused' | 'done';
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  due: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'todo' | 'doing' | 'done';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  category: string;
  current_value: number;
  target_value: number;
  unit: string;
  target_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  area: string;
  frequency: 'daily' | 'weekly';
  target_per_week: number;
  created_at: string;
  updated_at: string;
}

export interface HabitLogRow {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  created_at: string;
}

export interface LearningRow {
  id: string;
  user_id: string;
  date: string;
  topic: string;
  resource: string;
  link: string;
  status: 'to_learn' | 'learning' | 'completed';
  minutes: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface HealthProfileRow {
  id: string;
  user_id: string;
  height: number;
  age: number;
  activity_level: string;
  meal_goal_calories: number;
  created_at: string;
  updated_at: string;
}

export interface WeightLogRow {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MealRow {
  id: string;
  user_id: string;
  date: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  food: string;
  protein: number;
  calories: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutRow {
  id: string;
  user_id: string;
  date: string;
  type: string;
  program: string;
  category: 'strength' | 'simple';
  activity: string;
  minutes: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface WorkoutSetRow {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  created_at: string;
}

export interface WorkApplicationRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: 'wishlist' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  priority: 'Low' | 'Medium' | 'High';
  deadline: string | null;
  applied_date: string | null;
  source: string;
  link: string;
  next_action: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  date: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  score: number;
  wins: string;
  lessons: string;
  challenges: string;
  focus: string;
  evaluation_notes: string;
  auto_metrics: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SelfAssessmentSnapshotRow {
  id: string;
  user_id: string;
  period_type: 'weekly' | 'monthly' | 'custom';
  period_label: string;
  period_start: string;
  period_end: string;
  overall_reflection: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface SelfAssessmentDomainRow {
  id: string;
  snapshot_id: string;
  domain_key: string;
  domain_label: string;
  rating: number;
  strength_observation: string;
  strength_reasoning: string;
  growth_observation: string;
  growth_reasoning: string;
  sort_order: number;
  created_at: string;
}

export interface FeedbackRequestRow {
  id: string;
  user_id: string;
  title: string;
  token: string;
  privacy_mode: 'anonymous' | 'optional' | 'required';
  status: 'open' | 'closed';
  deadline: string | null;
  domains: string[];
  created_at: string;
  updated_at: string;
}

export interface FeedbackResponseRow {
  id: string;
  request_id: string;
  respondent_name: string | null;
  status: string;
  created_at: string;
}

export interface FeedbackResponseDomainRow {
  id: string;
  response_id: string;
  domain_key: string;
  rating: number;
  strength_observation: string;
  growth_observation: string;
  created_at: string;
}

export interface GrowthGoalRow {
  id: string;
  user_id: string;
  domain_key: string | null;
  source: 'self' | 'feedback' | 'mixed';
  current_state: string;
  target_state: string;
  smart_specific: string;
  smart_measurable: string;
  smart_achievable: string;
  smart_relevant: string;
  smart_timebound: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'stopped';
  progress: number;
  target_date: string | null;
  next_checkin_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrowthGoalMilestoneRow {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}
