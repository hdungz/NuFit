import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/screens/Home";
import { WorkoutCoaching } from "./components/screens/WorkoutCoaching";
import { CalendarSchedule } from "./components/screens/CalendarSchedule";
import { MealPlanning } from "./components/screens/MealPlanning";
import { FoodDiary } from "./components/screens/FoodDiary";
import { CalorieScanner } from "./components/screens/CalorieScanner";
import { Recipes } from "./components/screens/Recipes";
import { ChatSupport } from "./components/screens/ChatSupport";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "workout", Component: WorkoutCoaching },
      { path: "calendar", Component: CalendarSchedule },
      { path: "meal-plan", Component: MealPlanning },
      { path: "food-diary", Component: FoodDiary },
      { path: "calorie-scanner", Component: CalorieScanner },
      { path: "recipes", Component: Recipes },
      { path: "chat", Component: ChatSupport },
    ],
  },
]);
