import type { Conversation } from "./types";

const LS_KEY = "aether_conversations";
const LS_PAGE_KEY = "aether_current_page";

// ── localStorage helpers ────────────────────────────────────
export function saveToLocal(conversations: Conversation[]): void {
  try {
    // Serialize dates properly
    const serialized = conversations.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}

export function loadFromLocal(): Conversation[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export function savePageToLocal(page: string): void {
  try { localStorage.setItem(LS_PAGE_KEY, page); } catch {}
}

export function loadPageFromLocal(): string {
  try { return localStorage.getItem(LS_PAGE_KEY) || "chat"; } catch { return "chat"; }
}

// ── Backend sync helpers ────────────────────────────────────
export async function syncToBackend(conversations: Conversation[]): Promise<void> {
  try {
    await fetch("/api/memory/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversations }),
    });
  } catch {
    // Silently fail — localStorage is the primary store
  }
}

export async function loadFromBackend(): Promise<Conversation[] | null> {
  try {
    const res = await fetch("/api/memory/load");
    if (!res.ok) return null;
    const data = await res.json();
    return data.conversations.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return null;
  }
}

// Debounce helper to avoid thrashing localStorage/backend on every keystroke
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
