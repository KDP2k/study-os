import { Assignment, Course, Flashcard, Note, ResourceLink } from "./types";

export function courseContextMarkdown(
  course: Course,
  notes: Note[],
  flashcards: Flashcard[],
  assignments: Assignment[],
  resources: ResourceLink[]
) {
  const noteText = notes.length
    ? notes.map((note) => `## ${note.title}\n\n${note.content || "_(empty)_"}`).join("\n\n---\n\n")
    : "_No notes yet._";

  const cards = flashcards.length
    ? flashcards.map((card, index) => `${index + 1}. **Q:** ${card.prompt}\n   **A:** ${card.answer}`).join("\n")
    : "_No cue cards yet._";

  const assignmentText = assignments.length
    ? assignments.map((assignment) => `- ${assignment.title} — due ${assignment.dueAt.slice(0, 10)} — ${assignment.weight}%`).join("\n")
    : "_No assignments yet._";

  const resourceText = resources.length
    ? resources.map((resource) => `- [${resource.title}](${resource.url}) — ${resource.type}`).join("\n")
    : "_No resources yet._";

  return `# STUDY CONTEXT\n\nCourse: ${course.code}\nCourse Name: ${course.title}\nSemester: ${course.semesterId}\n\n## Suggested Topic Roadmap\n\n${course.roadmap.map((topic) => `- ${topic}`).join("\n")}\n\n# Lecture Notes\n\n${noteText}\n\n# Cue Cards\n\n${cards}\n\n# Assignments\n\n${assignmentText}\n\n# Resources\n\n${resourceText}\n\n# AI STUDY INSTRUCTIONS\n\n- Use my course material above as the primary source.\n- Clearly identify uncertainty or missing context.\n- Prefer active recall over passive explanation.\n- When quizzing me, do not reveal the solution before I attempt it.\n- Call out misconceptions and convert weak areas into targeted practice.\n- When creating flashcards, make them atomic and test one idea at a time.\n`;
}
