"use client";

import { semesters } from "@/lib/data";
import { useStudy } from "./StudyProvider";

export function SemesterSwitcher() {
  const { selectedSemesterId, setSelectedSemester } = useStudy();
  return (
    <div className="semester-switcher" role="tablist" aria-label="Semester">
      {semesters.map((semester) => (
        <button key={semester.id} onClick={() => setSelectedSemester(semester.id)} className={selectedSemesterId === semester.id ? "active" : ""} role="tab">
          <span>{semester.title}</span><small>{semester.courses.length} courses · {semester.season}</small>
        </button>
      ))}
    </div>
  );
}
