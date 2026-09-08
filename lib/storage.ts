import { StudyState } from "./types";

export const STORAGE_KEY = "lakehead-study-os:v1";

export const initialState: StudyState = {
  selectedSemesterId: "fall-2026",
  notes: [],
  flashcards: [],
  assignments: [],
  resources: [],
  mistakes: []
};

export function loadState(): StudyState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export function saveState(state: StudyState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
