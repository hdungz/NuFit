import { buildPersonaAppData, resolvePersonaIdByEmail } from "../lib/mockData";
import { writeAppData } from "../lib/storage";

const AUTH_STORAGE_KEY = "fitness-demo-auth-session";

type AuthSession = {
  email: string;
  displayName: string;
  loggedInAt: string;
};
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const session = readSession();
  if (!session) return null;
  const createdAt = new Date(session.loggedInAt).getTime();
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_TTL_MS) {
    logout();
    return null;
  }
  return session;
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!email.trim() || !password.trim()) return { ok: false, error: "Vui lòng nhập email và mật khẩu." };
  const normalizedEmail = email.trim();
  writeAppData(buildPersonaAppData(resolvePersonaIdByEmail(normalizedEmail)));
  saveSession({
    email: normalizedEmail,
    displayName: normalizedEmail.split("@")[0] || "Bạn",
    loggedInAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function register(
  displayName: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!displayName.trim() || !email.trim() || !password.trim()) {
    return { ok: false, error: "Vui lòng nhập đầy đủ thông tin." };
  }
  const normalizedEmail = email.trim();
  writeAppData(buildPersonaAppData(resolvePersonaIdByEmail(normalizedEmail)));
  saveSession({
    email: normalizedEmail,
    displayName: displayName.trim(),
    loggedInAt: new Date().toISOString(),
  });
  return { ok: true };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getPersonaLabel(email: string | undefined): string {
  if (!email) return "Khách";
  const persona = resolvePersonaIdByEmail(email);
  if (persona === "beginner") return "Persona Beginner Gym";
  if (persona === "family") return "Persona Family Nutrition";
  return "Persona Office Busy";
}

export function getPersonaKey(email: string | undefined): "office" | "beginner" | "family" {
  if (!email) return "office";
  return resolvePersonaIdByEmail(email);
}
