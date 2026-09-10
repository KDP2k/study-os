import { StudyState } from "./types";

export const STORAGE_KEY = "lakehead-study-os:v1";

export const initialState: StudyState = {
  selectedSemesterId: "fall-2026",
  notes: [],
  flashcards: [],
  assignments: [],
  resources: [],
  mistakes: [],
  personalEvents: [],
  drawings: []
};

export function loadState(): StudyState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    return {
      ...initialState,
      ...parsed,
      personalEvents: parsed.personalEvents || [],
      drawings: parsed.drawings || [],
      notes: (parsed.notes || []).map((n) => ({ ...n, drawingIds: n.drawingIds || [] })),
      flashcards: (parsed.flashcards || []).map((c) => ({ ...c }))
    };
  } catch {
    return initialState;
  }
}

export function saveState(state: StudyState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser localStorage is intentionally only a recovery cache. Large vector
    // workspaces can exceed browser quotas; cloud data remains the source of truth.
    const lightweight = { ...state, drawings: [] };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight)); } catch { /* cloud sync continues */ }
  }
}
