export type Season = "fall" | "winter";
export type SemesterId = "fall-2026" | "winter-2027";
export type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export type CourseArt = "compiler" | "networks" | "society" | "economics" | "testing" | "performance" | "numerical" | "datamining";

export interface ScheduleEvent {
  id: string;
  courseId: string;
  section: string;
  title: string;
  type: "lecture" | "lab" | "online";
  day: DayName;
  start: string;
  end: string;
  room?: string;
  instructor?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  semesterId: SemesterId;
  section: string;
  labSection?: string;
  instructor?: string;
  art: CourseArt;
  shortName: string;
  registrationUrl?: string;
  advancedTopics: string[];
  roadmap: string[];
}

export interface Semester {
  id: SemesterId;
  title: string;
  label: string;
  season: Season;
  startsOn: string;
  courses: Course[];
  schedule: ScheduleEvent[];
}

export interface Note {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  reviewStage: number;
  nextReviewAt?: string;
}

export type CardRating = "again" | "hard" | "good" | "easy";

export interface Flashcard {
  id: string;
  courseId: string;
  prompt: string;
  answer: string;
  type: "standard" | "cloze" | "code" | "conceptual" | "derivation" | "error";
  createdAt: string;
  dueAt: string;
  intervalDays: number;
  reviews: number;
  lapses: number;
  lastRating?: CardRating;
  sourceNoteId?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueAt: string;
  weight: number;
  score?: number;
  status: "not-started" | "in-progress" | "submitted" | "graded";
  notes?: string;
}

export interface ResourceLink {
  id: string;
  courseId: string;
  title: string;
  url: string;
  type: "pdf" | "slides" | "link" | "syllabus" | "lab" | "assignment";
  createdAt: string;
}

export interface MistakeRecord {
  id: string;
  courseId: string;
  cardId?: string;
  topic: string;
  createdAt: string;
  count: number;
}

export interface StudyState {
  selectedSemesterId: SemesterId;
  notes: Note[];
  flashcards: Flashcard[];
  assignments: Assignment[];
  resources: ResourceLink[];
  mistakes: MistakeRecord[];
}
