/**
 * Types and Interfaces
 */
export type Gender = 'male' | 'female';
export type Goal = 'muscle_gain' | 'lose_weight' | 'maintain';

export interface UserProfile {
  weight_kg: number;
  height_cm: number;
  age_years: number;
  gender: Gender;
  activity_level: number;
  goal: Goal;
}

export interface MacroSplit {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface DailyTargets extends MacroSplit {
  bmr: number;
  tdee: number;
  meals: {
    breakfast: MacroSplit;
    snack_1: MacroSplit;
    lunch: MacroSplit;
    snack_2: MacroSplit;
    dinner: MacroSplit;
  };
}

/**
 * 1. Core Nutrition Calculation Engine
 */
export function calculateDailyNutrition(profile: UserProfile): DailyTargets | null {
  const { weight_kg, height_cm, age_years, gender, activity_level, goal } = profile;

  // --- Error Handling & Validation ---
  if (!weight_kg || !height_cm || !age_years || !gender || !activity_level || !goal) return null;
  if (weight_kg <= 0 || height_cm <= 0 || age_years <= 0) return null;
  if (activity_level < 1.0 || activity_level > 2.5) return null;

  // --- BMR (Mifflin-St Jeor) ---
  let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years);
  bmr += (gender === 'male') ? 5 : -161;

  // --- TDEE ---
  const tdee = bmr * activity_level;

  // --- Goal Adjustments ---
  let target_calories = tdee;
  if (goal === 'muscle_gain') target_calories += 350;
  else if (goal === 'lose_weight') target_calories -= 500;
  // maintain adds 0

  // --- Macronutrient Split ---
  // Protein: 2.0g per kg (4 kcal/g)
  const protein_g = 2.0 * weight_kg;
  const protein_cals = protein_g * 4;

  // Fat: 25% of Target Calories (9 kcal/g)
  const fat_cals = target_calories * 0.25;
  const fat_g = fat_cals / 9;

  // Carbs: Remaining calories (4 kcal/g)
  const carbs_cals = target_calories - protein_cals - fat_cals;
  let carbs_g = carbs_cals / 4;

  // Validation if extreme parameters cause negative carbs
  if (carbs_g < 0) {
    carbs_g = 0;
  }

  const dailyTotal: MacroSplit = {
    calories: Math.round(target_calories),
    protein_g: Math.round(protein_g),
    fat_g: Math.round(fat_g),
    carbs_g: Math.round(carbs_g),
  };

  return {
    bmr: Math.round(bmr * 10) / 10, // keep 1 decimal for BMR/TDEE exactness
    tdee: Math.round(tdee * 10) / 10,
    ...dailyTotal,
    meals: distributeMeals(dailyTotal)
  };
}

/**
 * 2. Logic Function to Distribute Daily Macros into 5 Meal Slots
 */
function distributeMeals(total: MacroSplit) {
  const distribute = (percentage: number): MacroSplit => ({
    calories: Math.round(total.calories * percentage),
    protein_g: Math.round(total.protein_g * percentage),
    fat_g: Math.round(total.fat_g * percentage),
    carbs_g: Math.round(total.carbs_g * percentage),
  });

  return {
    breakfast: distribute(0.20), // 20%
    snack_1: distribute(0.10),   // 10%
    lunch: distribute(0.30),     // 30%
    snack_2: distribute(0.10),   // 10%
    dinner: distribute(0.30),    // 30%
  };
}
