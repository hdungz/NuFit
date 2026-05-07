import type { AppData } from "./models";
import { getLocalDateDaysAgo, getLocalDateKey } from "./utils";

const now = new Date();
const today = getLocalDateKey(now);

function buildSeedMeals() {
  const mealTemplates = [
    { name: "Phở bò", calories: 450, protein: 24, carbs: 55, fat: 12, tag: "Sáng" as const, image: "https://i-giadinh.vnecdn.net/2025/11/17/Pho-bo-Ha-Noi-7-vnexpress-1763-7388-9585-1763372391.jpg" },
    { name: "Bánh mì pate", calories: 380, protein: 14, carbs: 42, fat: 16, tag: "Sáng" as const, image: "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/173733/Originals/banh-mi-pate-12.JPG" },
    { name: "Cơm gà xối mỡ", calories: 620, protein: 32, carbs: 68, fat: 18, tag: "Trưa" as const, image: "https://i.ytimg.com/vi/P0NgzDow6jk/maxresdefault.jpg" },
    { name: "Bún chả", calories: 550, protein: 28, carbs: 61, fat: 17, tag: "Trưa" as const, image: "https://vcdn1-giadinh.vnecdn.net/2021/01/08/Anh-2-8146-1610099449.jpg?w=680&h=0&q=100&dpr=2&fit=crop&s=Z-_2_a-eTyYmeLKPiixE4A" },
    { name: "Salad trộn", calories: 320, protein: 12, carbs: 20, fat: 16, tag: "Tối" as const, image: "https://nhahangvouy.com/wp-content/uploads/2025/09/Salad-Rau-Cu-1.jpg" },
    { name: "Gỏi cuốn tôm thịt", calories: 380, protein: 20, carbs: 30, fat: 12, tag: "Tối" as const, image: "https://cooponline.vn/tin-tuc/wp-content/uploads/2025/10/goi-cuon-tom-thit-chuan-vi-nuoc-cham-dau-phong-1.png" },
  ];

  return Array.from({ length: 7 }).flatMap((_, dayOffset) => {
    const date = getLocalDateDaysAgo(dayOffset);
    const breakfast = mealTemplates[dayOffset % 2];
    const lunch = mealTemplates[2 + (dayOffset % 2)];
    const dinner = mealTemplates[4 + (dayOffset % 2)];
    const items = [
      { id: `meal-${dayOffset}-1`, time: "08:00", meal: breakfast },
      { id: `meal-${dayOffset}-2`, time: "12:30", meal: lunch },
      { id: `meal-${dayOffset}-3`, time: "19:00", meal: dinner },
    ];
    return items.map((item) => ({
      id: item.id,
      date,
      time: item.time,
      name: item.meal.name,
      calories: item.meal.calories,
      proteinGram: item.meal.protein,
      carbsGram: item.meal.carbs,
      fatGram: item.meal.fat,
      tags: [item.meal.tag, "Việt Nam"] as const,
      image: item.meal.image,
      source: "manual" as const,
    }));
  });
}

function buildSessions() {
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `session-${i + 1}`,
    date: getLocalDateDaysAgo(i),
    completed: i % 3 !== 0,
    durationMinutes: i % 3 !== 0 ? 25 + (i % 4) * 5 : 0,
  }));
}

export const STORAGE_VERSION = 3;
export const STORAGE_KEY = "fitness-demo-app-data";

export const mealImageMap: Record<string, string> = {
  "Phở bò": "https://i-giadinh.vnecdn.net/2025/11/17/Pho-bo-Ha-Noi-7-vnexpress-1763-7388-9585-1763372391.jpg",
  "Bánh mì pate": "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/173733/Originals/banh-mi-pate-12.JPG",
  "Cơm gà xối mỡ": "https://i.ytimg.com/vi/P0NgzDow6jk/maxresdefault.jpg",
  "Bún chả": "https://vcdn1-giadinh.vnecdn.net/2021/01/08/Anh-2-8146-1610099449.jpg?w=680&h=0&q=100&dpr=2&fit=crop&s=Z-_2_a-eTyYmeLKPiixE4A",
  "Salad trộn": "https://nhahangvouy.com/wp-content/uploads/2025/09/Salad-Rau-Cu-1.jpg",
  "Gỏi cuốn tôm thịt": "https://cooponline.vn/tin-tuc/wp-content/uploads/2025/10/goi-cuon-tom-thit-chuan-vi-nuoc-cham-dau-phong-1.png",
  "Món ăn Việt": "https://i.ytimg.com/vi/P0NgzDow6jk/maxresdefault.jpg",
};

export const defaultAppData: AppData = {
  version: STORAGE_VERSION,
  chatMessages: [
    {
      id: "chat-1",
      role: "bot",
      content: "Xin chào! Tôi là AI Coach của bạn. Hôm nay bạn muốn tập luyện hay tối ưu bữa ăn?",
      createdAt: new Date().toISOString(),
    },
  ],
  mealEntries: [
    ...buildSeedMeals(),
  ],
  mealPlanEntries: [],
  workoutPlan: {
    id: "plan-1",
    title: "Upper Body + Cardio",
    weekLabel: "Tuần này",
    exercises: [
      { id: "ex-1", name: "Squat", reps: "15 lần", duration: "45 giây", status: "completed" },
      { id: "ex-2", name: "Push-up", reps: "12 lần", duration: "40 giây", status: "active" },
      { id: "ex-3", name: "Plank", reps: "30 giây", duration: "30 giây", status: "pending" },
      { id: "ex-4", name: "Lunges", reps: "10 lần/chân", duration: "60 giây", status: "pending" },
    ],
    sessions: [
      ...buildSessions(),
      { id: "session-today", date: today, completed: false, durationMinutes: 0 },
    ],
  },
  scanHistory: [],
};

type PersonaId = "office" | "beginner" | "family";

function cloneData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData;
}

export function resolvePersonaIdByEmail(email: string): PersonaId {
  const lower = email.toLowerCase();
  if (lower.includes("nam.beginner")) return "beginner";
  if (lower.includes("hoa.family")) return "family";
  return "office";
}

export function buildPersonaAppData(persona: PersonaId): AppData {
  const data = cloneData(defaultAppData);

  if (persona === "beginner") {
    data.chatMessages = [
      {
        id: "chat-beginner-1",
        role: "bot",
        content: "Chào Nam! Hôm nay mình tập trung vào form chuẩn cho người mới nhé.",
        createdAt: new Date().toISOString(),
      },
    ];
    data.workoutPlan.title = "Beginner Full Body";
    data.workoutPlan.exercises = [
      { id: "b-ex-1", name: "Bodyweight Squat", reps: "12 lần", duration: "45 giây", status: "active" },
      { id: "b-ex-2", name: "Knee Push-up", reps: "10 lần", duration: "40 giây", status: "pending" },
      { id: "b-ex-3", name: "Plank", reps: "25 giây", duration: "25 giây", status: "pending" },
      { id: "b-ex-4", name: "Glute Bridge", reps: "12 lần", duration: "35 giây", status: "completed" },
    ];
  }

  if (persona === "family") {
    data.chatMessages = [
      {
        id: "chat-family-1",
        role: "bot",
        content: "Chào Hoa! Mình đã chuẩn bị gợi ý thực đơn tuần cân bằng cho gia đình.",
        createdAt: new Date().toISOString(),
      },
    ];
    data.scanHistory = [
      {
        id: "scan-family-1",
        foodName: "Bún chả",
        totalCalories: 550,
        confidence: 94,
        proteinGram: 28,
        carbsGram: 61,
        fatGram: 17,
        ingredients: ["Bún", "Thịt nướng", "Rau sống"],
        image: "https://images.unsplash.com/photo-1640116309648-79c20583e1c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        createdAt: new Date().toISOString(),
      },
      {
        id: "scan-family-2",
        foodName: "Gỏi cuốn tôm thịt",
        totalCalories: 380,
        confidence: 91,
        proteinGram: 20,
        carbsGram: 30,
        fatGram: 12,
        ingredients: ["Bánh tráng", "Tôm", "Rau"],
        image: "https://images.unsplash.com/photo-1640116309648-79c20583e1c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        createdAt: new Date(Date.now() - 3_600_000).toISOString(),
      },
    ];
  }

  return data;
}
