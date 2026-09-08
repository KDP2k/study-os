import type { SupabaseClient } from "@supabase/supabase-js";
import { allCourses, semesters } from "@/lib/data";
import type { StudyState } from "@/lib/types";
import { initialState } from "@/lib/storage";

type AcademicMaps = {
  courseDbByAppId: Record<string, string>;
  appCourseByDbId: Record<string, string>;
};

function assertNoError(error: { message?: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message || "Unknown Supabase error"}`);
}

export function hasStudyData(state: StudyState) {
  return Boolean(
    state.notes.length ||
      state.flashcards.length ||
      state.assignments.length ||
      state.resources.length ||
      state.mistakes.length
  );
}

async function ensureAcademicData(supabase: SupabaseClient, userId: string): Promise<AcademicMaps> {
  const semesterPayload = semesters.map((semester) => ({
    user_id: userId,
    slug: semester.id,
    title: semester.title,
    season: semester.season,
    starts_on: semester.startsOn
  }));

  const { error: semesterUpsertError } = await supabase
    .from("semesters")
    .upsert(semesterPayload, { onConflict: "user_id,slug" });
  assertNoError(semesterUpsertError, "Could not seed semesters");

  const { data: semesterRows, error: semesterSelectError } = await supabase
    .from("semesters")
    .select("id,slug")
    .eq("user_id", userId);
  assertNoError(semesterSelectError, "Could not load semesters");

  const semesterDbBySlug = Object.fromEntries((semesterRows || []).map((row: any) => [row.slug, row.id]));

  const coursePayload = allCourses.map((course) => ({
    user_id: userId,
    semester_id: semesterDbBySlug[course.semesterId],
    code: course.code,
    title: course.title,
    short_name: course.shortName,
    section: course.section,
    lab_section: course.labSection || null,
    instructor: course.instructor || null,
    art_key: course.art,
    registration_url: course.registrationUrl || null
  }));

  const { error: courseUpsertError } = await supabase
    .from("courses")
    .upsert(coursePayload, { onConflict: "user_id,semester_id,code" });
  assertNoError(courseUpsertError, "Could not seed courses");

  const { data: courseRows, error: courseSelectError } = await supabase
    .from("courses")
    .select("id,code")
    .eq("user_id", userId);
  assertNoError(courseSelectError, "Could not load courses");

  const appIdByCode = Object.fromEntries(allCourses.map((course) => [course.code, course.id]));
  const courseDbByAppId: Record<string, string> = {};
  const appCourseByDbId: Record<string, string> = {};

  for (const row of courseRows || []) {
    const appId = appIdByCode[(row as any).code];
    if (appId) {
      courseDbByAppId[appId] = (row as any).id;
      appCourseByDbId[(row as any).id] = appId;
    }
  }

  return { courseDbByAppId, appCourseByDbId };
}

async function reconcileTable(
  supabase: SupabaseClient,
  userId: string,
  table: string,
  rows: Record<string, unknown>[],
  clientIds: string[]
) {
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "user_id,client_id" });
    assertNoError(error, `Could not sync ${table}`);
  }

  const { data: existing, error: existingError } = await supabase
    .from(table)
    .select("client_id")
    .eq("user_id", userId);
  assertNoError(existingError, `Could not reconcile ${table}`);

  const wanted = new Set(clientIds);
  const stale = (existing || [])
    .map((row: any) => row.client_id as string)
    .filter((id: string) => id && !wanted.has(id));

  if (stale.length) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .in("client_id", stale);
    assertNoError(deleteError, `Could not remove deleted ${table}`);
  }
}

export async function syncStudyState(supabase: SupabaseClient, userId: string, state: StudyState) {
  const { courseDbByAppId } = await ensureAcademicData(supabase, userId);

  const notes = state.notes
    .filter((note) => courseDbByAppId[note.courseId])
    .map((note) => ({
      user_id: userId,
      course_id: courseDbByAppId[note.courseId],
      client_id: note.id,
      title: note.title,
      markdown: note.content,
      tags: note.tags,
      review_stage: note.reviewStage,
      next_review_at: note.nextReviewAt || null,
      created_at: note.createdAt,
      updated_at: note.updatedAt
    }));

  const cards = state.flashcards
    .filter((card) => courseDbByAppId[card.courseId])
    .map((card) => ({
      user_id: userId,
      course_id: courseDbByAppId[card.courseId],
      client_id: card.id,
      source_note_client_id: card.sourceNoteId || null,
      card_type: card.type,
      prompt: card.prompt,
      answer: card.answer,
      due_at: card.dueAt,
      scheduled_days: card.intervalDays,
      reps: card.reviews,
      lapses: card.lapses,
      last_rating: card.lastRating || null,
      created_at: card.createdAt,
      updated_at: new Date().toISOString()
    }));

  const assignments = state.assignments
    .filter((item) => courseDbByAppId[item.courseId])
    .map((item) => ({
      user_id: userId,
      course_id: courseDbByAppId[item.courseId],
      client_id: item.id,
      title: item.title,
      due_at: item.dueAt,
      weight: item.weight,
      score: item.score ?? null,
      status: item.status,
      notes: item.notes || "",
      updated_at: new Date().toISOString()
    }));

  const resources = state.resources
    .filter((item) => courseDbByAppId[item.courseId])
    .map((item) => ({
      user_id: userId,
      course_id: courseDbByAppId[item.courseId],
      client_id: item.id,
      title: item.title,
      resource_type: item.type,
      url: item.url || null,
      metadata: {},
      created_at: item.createdAt
    }));

  const mistakes = state.mistakes
    .filter((item) => courseDbByAppId[item.courseId])
    .map((item) => ({
      user_id: userId,
      course_id: courseDbByAppId[item.courseId],
      client_id: item.id,
      flashcard_client_id: item.cardId || null,
      label: item.topic,
      miss_count: item.count,
      last_missed_at: item.createdAt,
      created_at: item.createdAt
    }));

  await reconcileTable(supabase, userId, "notes", notes, state.notes.map((x) => x.id));
  await reconcileTable(supabase, userId, "flashcards", cards, state.flashcards.map((x) => x.id));
  await reconcileTable(supabase, userId, "assessments", assignments, state.assignments.map((x) => x.id));
  await reconcileTable(supabase, userId, "resources", resources, state.resources.map((x) => x.id));
  await reconcileTable(supabase, userId, "mistakes", mistakes, state.mistakes.map((x) => x.id));
}

export async function fetchStudyState(
  supabase: SupabaseClient,
  userId: string,
  selectedSemesterId: StudyState["selectedSemesterId"] = initialState.selectedSemesterId
): Promise<StudyState> {
  const { appCourseByDbId } = await ensureAcademicData(supabase, userId);

  const [notesResult, cardsResult, assignmentsResult, resourcesResult, mistakesResult] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("flashcards").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("assessments").select("*").eq("user_id", userId).order("due_at", { ascending: true }),
    supabase.from("resources").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("mistakes").select("*").eq("user_id", userId).order("last_missed_at", { ascending: false })
  ]);

  assertNoError(notesResult.error, "Could not load notes");
  assertNoError(cardsResult.error, "Could not load flashcards");
  assertNoError(assignmentsResult.error, "Could not load assignments");
  assertNoError(resourcesResult.error, "Could not load resources");
  assertNoError(mistakesResult.error, "Could not load mistakes");

  return {
    selectedSemesterId,
    notes: (notesResult.data || []).flatMap((row: any) => {
      const courseId = appCourseByDbId[row.course_id];
      if (!courseId) return [];
      return [{
        id: row.client_id || row.id,
        courseId,
        title: row.title,
        content: row.markdown || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: row.tags || [],
        reviewStage: row.review_stage || 0,
        nextReviewAt: row.next_review_at || undefined
      }];
    }),
    flashcards: (cardsResult.data || []).flatMap((row: any) => {
      const courseId = appCourseByDbId[row.course_id];
      if (!courseId) return [];
      return [{
        id: row.client_id || row.id,
        courseId,
        prompt: row.prompt,
        answer: row.answer,
        type: row.card_type,
        createdAt: row.created_at,
        dueAt: row.due_at,
        intervalDays: row.scheduled_days || 0,
        reviews: row.reps || 0,
        lapses: row.lapses || 0,
        lastRating: row.last_rating || undefined,
        sourceNoteId: row.source_note_client_id || undefined
      }];
    }),
    assignments: (assignmentsResult.data || []).flatMap((row: any) => {
      const courseId = appCourseByDbId[row.course_id];
      if (!courseId) return [];
      return [{
        id: row.client_id || row.id,
        courseId,
        title: row.title,
        dueAt: row.due_at,
        weight: Number(row.weight || 0),
        score: row.score === null ? undefined : Number(row.score),
        status: row.status,
        notes: row.notes || ""
      }];
    }),
    resources: (resourcesResult.data || []).flatMap((row: any) => {
      const courseId = appCourseByDbId[row.course_id];
      if (!courseId) return [];
      return [{
        id: row.client_id || row.id,
        courseId,
        title: row.title,
        url: row.url || "",
        type: row.resource_type,
        createdAt: row.created_at
      }];
    }),
    mistakes: (mistakesResult.data || []).flatMap((row: any) => {
      const courseId = appCourseByDbId[row.course_id];
      if (!courseId) return [];
      return [{
        id: row.client_id || row.id,
        courseId,
        cardId: row.flashcard_client_id || undefined,
        topic: row.label,
        createdAt: row.last_missed_at || row.created_at,
        count: row.miss_count || 1
      }];
    })
  };
}
