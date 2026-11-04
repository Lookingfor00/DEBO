const ANON_KEY = "kf_anon_id";
const SESSION_KEY = "kf_session";
const VISIT_KEY = "kf_visit_count";
const FIRST_SEEN_KEY = "kf_first_seen_at";

const SESSION_TTL_MS = 30 * 60 * 1000;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

type SessionState = {
  id: string;
  lastSeenAt: number;
};

function readSession(): SessionState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (typeof parsed.id !== "string" || typeof parsed.lastSeenAt !== "number") {
      return null;
    }
    return { id: parsed.id, lastSeenAt: parsed.lastSeenAt };
  } catch {
    return null;
  }
}

function writeSession(state: SessionState): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  const existing = readLocal(ANON_KEY);
  if (existing) return existing;
  const id = uuid();
  writeLocal(ANON_KEY, id);
  if (!readLocal(FIRST_SEEN_KEY)) {
    writeLocal(FIRST_SEEN_KEY, new Date().toISOString());
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const now = Date.now();
  const existing = readSession();
  if (existing && now - existing.lastSeenAt < SESSION_TTL_MS) {
    writeSession({ id: existing.id, lastSeenAt: now });
    return existing.id;
  }
  const id = uuid();
  writeSession({ id, lastSeenAt: now });
  const visits = Number(readLocal(VISIT_KEY) || "0") + 1;
  writeLocal(VISIT_KEY, String(visits));
  return id;
}

export function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(readLocal(VISIT_KEY) || "0");
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function isReturningVisitor(): boolean {
  return getVisitCount() > 1;
}
