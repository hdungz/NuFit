export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: {
    requestId: string;
    status: number;
    simulated: true;
    retryable: boolean;
    latencyMs: number;
  };
};

export type ChatRole = "user" | "bot";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type MealTag = "Sáng" | "Trưa" | "Tối" | "Snack" | "Healthy" | "Việt Nam";

export type MealEntry = {
  id: string;
  date: string;
  time: string;
  name: string;
  calories: number;
  proteinGram: number;
  carbsGram: number;
  fatGram: number;
  tags: MealTag[];
  image: string;
  source: "manual" | "scanner";
};

export type WorkoutExercise = {
  id: string;
  name: string;
  reps: string;
  duration: string;
  status: "pending" | "active" | "completed";
};

export type WorkoutSession = {
  id: string;
  date: string;
  completed: boolean;
  durationMinutes: number;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  weekLabel: string;
  exercises: WorkoutExercise[];
  sessions: WorkoutSession[];
};

export type MealPlanEntry = {
  id: string;
  date: string;
  mealType: "Sáng" | "Trưa" | "Tối" | "Snack";
  name: string;
  calories: number;
  proteinGram: number;
  carbsGram: number;
  fatGram: number;
  source: "ai" | "manual";
};

export type DetectedFoodItem = {
  name: string;
  quantity: string;
  estimatedWeightGrams: number;
  calories: number;
  proteinGram: number;
  carbsGram: number;
  fatGram: number;
  ingredients: string[];
};

export type ScanResult = {
  id: string;
  foodName: string;
  totalCalories: number;
  confidence: number;
  proteinGram: number;
  carbsGram: number;
  fatGram: number;
  ingredients: string[];
  image: string;
  createdAt: string;
  items?: DetectedFoodItem[];
  foodCount?: number;
};

export type AppData = {
  version: number;
  chatMessages: ChatMessage[];
  mealEntries: MealEntry[];
  mealPlanEntries: MealPlanEntry[];
  workoutPlan: WorkoutPlan;
  scanHistory: ScanResult[];
};
