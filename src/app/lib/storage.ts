import { defaultAppData, STORAGE_KEY, STORAGE_VERSION } from "./mockData";
import type { AppData } from "./models";

const hasWindow = typeof window !== "undefined";

function withVersion(data: AppData): AppData {
  return { ...data, version: STORAGE_VERSION };
}

export function readAppData(): AppData {
  if (!hasWindow) {
    return defaultAppData;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    writeAppData(defaultAppData);
    return defaultAppData;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      const migrated = migrateData(parsed);
      writeAppData(migrated);
      return migrated;
    }
    return parsed as AppData;
  } catch {
    writeAppData(defaultAppData);
    return defaultAppData;
  }
}

export function writeAppData(data: AppData): void {
  if (!hasWindow) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withVersion(data)));
}

export function updateAppData(updater: (current: AppData) => AppData): AppData {
  const current = readAppData();
  const next = withVersion(updater(current));
  writeAppData(next);
  return next;
}

export function resetAppData(): AppData {
  writeAppData(defaultAppData);
  return defaultAppData;
}

function migrateData(raw: Partial<AppData> | null | undefined): AppData {
  if (!raw) return defaultAppData;

  return {
    version: STORAGE_VERSION,
    chatMessages: raw.chatMessages ?? defaultAppData.chatMessages,
    mealEntries: raw.mealEntries ?? defaultAppData.mealEntries,
    mealPlanEntries: (raw as AppData).mealPlanEntries ?? defaultAppData.mealPlanEntries,
    workoutPlan: raw.workoutPlan ?? defaultAppData.workoutPlan,
    scanHistory: raw.scanHistory ?? defaultAppData.scanHistory,
  };
}
