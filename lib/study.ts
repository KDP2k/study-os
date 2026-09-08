import { CardRating, Flashcard } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function isDue(card: Flashcard, now = new Date()) {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

export function scheduleCard(card: Flashcard, rating: CardRating, now = new Date()): Flashcard {
  const reviews = card.reviews + 1;
  let intervalDays = card.intervalDays;
  let dueAt = new Date(now);
  let lapses = card.lapses;

  if (rating === "again") {
    dueAt = new Date(now.getTime() + 10 * 60 * 1000);
    intervalDays = 0;
    lapses += 1;
  } else if (rating === "hard") {
    intervalDays = Math.max(1, Math.round((intervalDays || 1) * 1.35));
    dueAt = new Date(now.getTime() + intervalDays * DAY);
  } else if (rating === "good") {
    intervalDays = intervalDays === 0 ? 1 : Math.max(2, Math.round(intervalDays * 2.15));
    dueAt = new Date(now.getTime() + intervalDays * DAY);
  } else {
    intervalDays = intervalDays === 0 ? 4 : Math.max(4, Math.round(intervalDays * 3));
    dueAt = new Date(now.getTime() + intervalDays * DAY);
  }

  return {
    ...card,
    dueAt: dueAt.toISOString(),
    intervalDays,
    reviews,
    lapses,
    lastRating: rating
  };
}

export function nextLectureReview(stage: number, from = new Date()) {
  const delays = [1, 4, 8, 15, 30];
  const delay = delays[Math.min(stage, delays.length - 1)];
  return new Date(from.getTime() + delay * DAY).toISOString();
}
