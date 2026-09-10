"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { courseById, semesterById } from "@/lib/data";
import { courseContextMarkdown } from "@/lib/export";
import { initialState, loadState, saveState } from "@/lib/storage";
import { scheduleCard } from "@/lib/study";
import { fetchStudyState, hasStudyData, syncStudyState } from "@/lib/supabase/studyRepository";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Assignment,
  CardRating,
  Flashcard,
  Note,
  ResourceLink,
  Semester,
  PersonalEvent,
  DrawingDocument,
  DrawingPage,
  SemesterId,
  StudyState
} from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "signed-out";
type SyncStatus = "idle" | "loading" | "syncing" | "synced" | "error";

interface StudyContextValue {
  state: StudyState;
  hydrated: boolean;
  selectedSemesterId: SemesterId;
  semester: Semester;
  authStatus: AuthStatus;
  syncStatus: SyncStatus;
  syncError: string;
  authMessage: string;
  userEmail: string;
  supabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshFromCloud: () => Promise<void>;
  importLocalDataToCloud: () => Promise<void>;
  setSelectedSemester: (id: SemesterId) => void;
  addNote: (courseId: string, seed?: Partial<Note>) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFlashcard: (courseId: string, seed?: Partial<Flashcard>) => string;
  updateFlashcard: (id: string, patch: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  rateFlashcard: (id: string, rating: CardRating) => void;
  addAssignment: (courseId: string, seed?: Partial<Assignment>) => string;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  addResource: (courseId: string, seed?: Partial<ResourceLink>) => string;
  deleteResource: (id: string) => void;
  addPersonalEvent: (seed?: Partial<PersonalEvent>) => string;
  updatePersonalEvent: (id: string, patch: Partial<PersonalEvent>) => void;
  deletePersonalEvent: (id: string) => void;
  addDrawing: (seed?: Partial<DrawingDocument>) => string;
  updateDrawing: (id: string, patch: Partial<DrawingDocument>) => void;
  deleteDrawing: (id: string) => void;
  addDrawingPage: (drawingId: string) => string;
  updateDrawingPage: (drawingId: string, pageId: string, patch: Partial<DrawingPage>) => void;
  deleteDrawingPage: (drawingId: string, pageId: string) => void;
  courseContext: (courseId: string) => string;
  resetAllData: () => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudyState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const configured = isSupabaseConfigured();

  const userIdRef = useRef<string | null>(null);
  const cloudReadyRef = useRef(false);
  const localSnapshotRef = useRef<StudyState>(initialState);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrationInFlightRef = useRef<string | null>(null);

  const hydrateForUser = useCallback(async (userId: string, email = "") => {
    if (!configured) return;
    if (hydrationInFlightRef.current === userId) return;
    hydrationInFlightRef.current = userId;
    cloudReadyRef.current = false;
    setAuthStatus("loading");
    setSyncStatus("loading");
    setSyncError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const local = localSnapshotRef.current;
      const cloud = await fetchStudyState(supabase, userId, local.selectedSemesterId);

      // First cloud login: automatically promote any existing local prototype data.
      if (!hasStudyData(cloud) && hasStudyData(local)) {
        await syncStudyState(supabase, userId, local);
        setState(local);
      } else {
        setState({ ...cloud, selectedSemesterId: local.selectedSemesterId });
      }

      userIdRef.current = userId;
      setUserEmail(email);
      setAuthStatus("authenticated");
      setHydrated(true);
      setSyncStatus("synced");
      cloudReadyRef.current = true;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Could not load cloud data.");
      setSyncStatus("error");
      setAuthStatus("authenticated");
      setHydrated(true);
      userIdRef.current = userId;
      setUserEmail(email);
    } finally {
      hydrationInFlightRef.current = null;
    }
  }, [configured]);

  useEffect(() => {
    const local = loadState();
    localSnapshotRef.current = local;
    setState(local);
    setHydrated(true);

    if (!configured) {
      setAuthStatus("signed-out");
      setSyncStatus("error");
      setSyncError("Supabase is not configured.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthStatus("signed-out");
        setSyncStatus("error");
        setSyncError(error.message);
        return;
      }
      const user = data.session?.user;
      if (user) void hydrateForUser(user.id, user.email || "");
      else {
        setAuthStatus("signed-out");
        setSyncStatus("idle");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        userIdRef.current = null;
        cloudReadyRef.current = false;
        setUserEmail("");
        setAuthStatus("signed-out");
        setSyncStatus("idle");
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (userIdRef.current !== session.user.id && hydrationInFlightRef.current !== session.user.id) {
          void hydrateForUser(session.user.id, session.user.email || "");
        }
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [configured, hydrateForUser]);

  // Keep a local cache for instant recovery/offline safety.
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
    localSnapshotRef.current = state;
  }, [state, hydrated]);

  // Debounced cloud persistence. Notes can update on every keystroke without flooding Supabase.
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !configured || !userId || !cloudReadyRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncStatus("syncing");
    syncTimerRef.current = setTimeout(async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        await syncStudyState(supabase, userId, state);
        setSyncError("");
        setSyncStatus("synced");
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : "Cloud sync failed.");
        setSyncStatus("error");
      }
    }, 850);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, hydrated, configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!configured) throw new Error("Supabase is not configured.");
    setAuthMessage("");
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await hydrateForUser(data.user.id, data.user.email || email);
  }, [configured, hydrateForUser]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!configured) throw new Error("Supabase is not configured.");
    setAuthMessage("");
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session?.user) {
      await hydrateForUser(data.session.user.id, data.session.user.email || email);
    } else {
      setAuthMessage("Account created. Check your email for Supabase's confirmation link, then sign in.");
    }
  }, [configured, hydrateForUser]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    userIdRef.current = null;
    cloudReadyRef.current = false;
    setAuthStatus("signed-out");
    setUserEmail("");
  }, [configured]);

  const refreshFromCloud = useCallback(async () => {
    const userId = userIdRef.current;
    if (!configured || !userId) return;
    setSyncStatus("loading");
    try {
      const cloud = await fetchStudyState(getSupabaseBrowserClient(), userId, state.selectedSemesterId);
      cloudReadyRef.current = false;
      setState(cloud);
      localSnapshotRef.current = cloud;
      setSyncError("");
      setSyncStatus("synced");
      requestAnimationFrame(() => { cloudReadyRef.current = true; });
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Could not refresh cloud data.");
      setSyncStatus("error");
    }
  }, [configured, state.selectedSemesterId]);

  const importLocalDataToCloud = useCallback(async () => {
    const userId = userIdRef.current;
    if (!configured || !userId) throw new Error("Sign in before importing local data.");
    const local = loadState();
    setSyncStatus("syncing");
    await syncStudyState(getSupabaseBrowserClient(), userId, local);
    cloudReadyRef.current = false;
    setState(local);
    localSnapshotRef.current = local;
    setSyncError("");
    setSyncStatus("synced");
    requestAnimationFrame(() => { cloudReadyRef.current = true; });
  }, [configured]);

  const setSelectedSemester = useCallback((selectedSemesterId: SemesterId) => {
    setState((current) => ({ ...current, selectedSemesterId }));
  }, []);

  const addNote = useCallback((courseId: string, seed: Partial<Note> = {}) => {
    const id = uid("note");
    const now = new Date().toISOString();
    const note: Note = {
      id,
      courseId,
      title: seed.title || "Untitled lecture note",
      content: seed.content || "",
      createdAt: now,
      updatedAt: now,
      tags: seed.tags || [],
      reviewStage: seed.reviewStage ?? 0,
      nextReviewAt: seed.nextReviewAt
    };
    setState((current) => ({ ...current, notes: [note, ...current.notes] }));
    return id;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setState((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note
      )
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
  }, []);

  const addFlashcard = useCallback((courseId: string, seed: Partial<Flashcard> = {}) => {
    const id = uid("card");
    const now = new Date().toISOString();
    const card: Flashcard = {
      id,
      courseId,
      prompt: seed.prompt || "",
      answer: seed.answer || "",
      type: seed.type || "standard",
      createdAt: now,
      dueAt: seed.dueAt || now,
      intervalDays: seed.intervalDays ?? 0,
      reviews: seed.reviews ?? 0,
      lapses: seed.lapses ?? 0,
      sourceNoteId: seed.sourceNoteId
    };
    setState((current) => ({ ...current, flashcards: [card, ...current.flashcards] }));
    return id;
  }, []);

  const updateFlashcard = useCallback((id: string, patch: Partial<Flashcard>) => {
    setState((current) => ({
      ...current,
      flashcards: current.flashcards.map((card) => (card.id === id ? { ...card, ...patch } : card))
    }));
  }, []);

  const deleteFlashcard = useCallback((id: string) => {
    setState((current) => ({ ...current, flashcards: current.flashcards.filter((card) => card.id !== id) }));
  }, []);

  const rateFlashcard = useCallback((id: string, rating: CardRating) => {
    setState((current) => {
      const card = current.flashcards.find((item) => item.id === id);
      if (!card) return current;
      const nextCard = scheduleCard(card, rating);
      const mistakes = rating === "again"
        ? (() => {
            const existing = current.mistakes.find((item) => item.cardId === card.id);
            if (existing) {
              return current.mistakes.map((item) =>
                item.id === existing.id ? { ...item, count: item.count + 1, createdAt: new Date().toISOString() } : item
              );
            }
            return [
              {
                id: uid("mistake"),
                courseId: card.courseId,
                cardId: card.id,
                topic: card.prompt.slice(0, 90) || "Flashcard recall",
                createdAt: new Date().toISOString(),
                count: 1
              },
              ...current.mistakes
            ];
          })()
        : current.mistakes;
      return {
        ...current,
        flashcards: current.flashcards.map((item) => (item.id === id ? nextCard : item)),
        mistakes
      };
    });
  }, []);

  const addAssignment = useCallback((courseId: string, seed: Partial<Assignment> = {}) => {
    const id = uid("assignment");
    const assignment: Assignment = {
      id,
      courseId,
      title: seed.title || "New assessment",
      dueAt: seed.dueAt || new Date().toISOString(),
      weight: seed.weight ?? 0,
      score: seed.score,
      status: seed.status || "not-started",
      notes: seed.notes || ""
    };
    setState((current) => ({ ...current, assignments: [assignment, ...current.assignments] }));
    return id;
  }, []);

  const updateAssignment = useCallback((id: string, patch: Partial<Assignment>) => {
    setState((current) => ({
      ...current,
      assignments: current.assignments.map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    setState((current) => ({ ...current, assignments: current.assignments.filter((item) => item.id !== id) }));
  }, []);

  const addResource = useCallback((courseId: string, seed: Partial<ResourceLink> = {}) => {
    const id = uid("resource");
    const resource: ResourceLink = {
      id,
      courseId,
      title: seed.title || "New resource",
      url: seed.url || "",
      type: seed.type || "link",
      createdAt: new Date().toISOString()
    };
    setState((current) => ({ ...current, resources: [resource, ...current.resources] }));
    return id;
  }, []);

  const deleteResource = useCallback((id: string) => {
    setState((current) => ({ ...current, resources: current.resources.filter((item) => item.id !== id) }));
  }, []);

  const addPersonalEvent = useCallback((seed: Partial<PersonalEvent> = {}) => {
    const id = uid("event");
    const now = new Date().toISOString();
    const start = seed.startsAt || now;
    const event: PersonalEvent = {
      id,
      title: seed.title || "New event",
      description: seed.description || "",
      location: seed.location || "",
      category: seed.category || "Personal",
      startsAt: start,
      endsAt: seed.endsAt,
      allDay: seed.allDay ?? false,
      notes: seed.notes || "",
      createdAt: now,
      updatedAt: now
    };
    setState((current) => ({ ...current, personalEvents: [...current.personalEvents, event] }));
    return id;
  }, []);

  const updatePersonalEvent = useCallback((id: string, patch: Partial<PersonalEvent>) => {
    setState((current) => ({ ...current, personalEvents: current.personalEvents.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }));
  }, []);

  const deletePersonalEvent = useCallback((id: string) => {
    setState((current) => ({ ...current, personalEvents: current.personalEvents.filter((item) => item.id !== id) }));
  }, []);

  const addDrawing = useCallback((seed: Partial<DrawingDocument> = {}) => {
    const id = uid("drawing");
    const now = new Date().toISOString();
    const pageId = uid("page");
    const drawing: DrawingDocument = {
      id,
      courseId: seed.courseId,
      noteId: seed.noteId,
      title: seed.title || "Workspace",
      createdAt: now,
      updatedAt: now,
      pages: seed.pages || [{ id: pageId, pageNumber: 1, width: 1400, height: 900, background: "dot", paper: "light", elements: [] }]
    };
    setState((current) => ({ ...current, drawings: [drawing, ...current.drawings] }));
    return id;
  }, []);

  const updateDrawing = useCallback((id: string, patch: Partial<DrawingDocument>) => {
    setState((current) => ({ ...current, drawings: current.drawings.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }));
  }, []);

  const deleteDrawing = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      drawings: current.drawings.filter((item) => item.id !== id),
      notes: current.notes.map((note) => ({ ...note, drawingIds: (note.drawingIds || []).filter((drawingId) => drawingId !== id) })),
      flashcards: current.flashcards.map((card) => ({
        ...card,
        promptContent: card.promptContent?.filter((block) => block.type !== "drawing" || block.drawingId !== id),
        answerContent: card.answerContent?.filter((block) => block.type !== "drawing" || block.drawingId !== id)
      }))
    }));
  }, []);

  const addDrawingPage = useCallback((drawingId: string) => {
    const pageId = uid("page");
    setState((current) => ({ ...current, drawings: current.drawings.map((drawing) => drawing.id === drawingId ? { ...drawing, updatedAt: new Date().toISOString(), pages: [...drawing.pages, { id: pageId, pageNumber: drawing.pages.length + 1, width: 1400, height: 900, background: "dot", paper: "light", elements: [] }] } : drawing) }));
    return pageId;
  }, []);

  const updateDrawingPage = useCallback((drawingId: string, pageId: string, patch: Partial<DrawingPage>) => {
    setState((current) => ({ ...current, drawings: current.drawings.map((drawing) => drawing.id === drawingId ? { ...drawing, updatedAt: new Date().toISOString(), pages: drawing.pages.map((page) => page.id === pageId ? { ...page, ...patch } : page) } : drawing) }));
  }, []);

  const deleteDrawingPage = useCallback((drawingId: string, pageId: string) => {
    setState((current) => ({ ...current, drawings: current.drawings.map((drawing) => {
      if (drawing.id !== drawingId || drawing.pages.length <= 1) return drawing;
      const pages = drawing.pages.filter((page) => page.id !== pageId).map((page, index) => ({ ...page, pageNumber: index + 1 }));
      return { ...drawing, pages, updatedAt: new Date().toISOString() };
    }) }));
  }, []);

  const courseContext = useCallback(
    (courseId: string) => {
      const course = courseById[courseId];
      if (!course) return "";
      return courseContextMarkdown(
        course,
        state.notes.filter((item) => item.courseId === courseId),
        state.flashcards.filter((item) => item.courseId === courseId),
        state.assignments.filter((item) => item.courseId === courseId),
        state.resources.filter((item) => item.courseId === courseId)
      );
    },
    [state]
  );

  const resetAllData = useCallback(() => setState((current) => ({ ...initialState, selectedSemesterId: current.selectedSemesterId })), []);

  const value = useMemo<StudyContextValue>(() => ({
    state,
    hydrated,
    selectedSemesterId: state.selectedSemesterId,
    semester: semesterById[state.selectedSemesterId],
    authStatus,
    syncStatus,
    syncError,
    authMessage,
    userEmail,
    supabaseConfigured: configured,
    signIn,
    signUp,
    signOut,
    refreshFromCloud,
    importLocalDataToCloud,
    setSelectedSemester,
    addNote,
    updateNote,
    deleteNote,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    rateFlashcard,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addResource,
    deleteResource,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    addDrawingPage,
    updateDrawingPage,
    deleteDrawingPage,
    courseContext,
    resetAllData
  }), [
    state,
    hydrated,
    authStatus,
    syncStatus,
    syncError,
    authMessage,
    userEmail,
    configured,
    signIn,
    signUp,
    signOut,
    refreshFromCloud,
    importLocalDataToCloud,
    setSelectedSemester,
    addNote,
    updateNote,
    deleteNote,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    rateFlashcard,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addResource,
    deleteResource,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    addDrawingPage,
    updateDrawingPage,
    deleteDrawingPage,
    courseContext,
    resetAllData
  ]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const value = useContext(StudyContext);
  if (!value) throw new Error("useStudy must be used inside StudyProvider");
  return value;
}
