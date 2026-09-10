"use client";

import Link from "next/link";
import { Course } from "@/lib/types";
import { CourseArtwork } from "./CourseArtwork";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

export function CourseCard({ course }: { course: Course }) {
  const { state } = useStudy();
  const notes = state.notes.filter((item) => item.courseId === course.id).length;
  const cards = state.flashcards.filter((item) => item.courseId === course.id).length;
  const due = state.flashcards.filter((item) => item.courseId === course.id && new Date(item.dueAt) <= new Date()).length;
  return (
    <Link href={`/app/courses/${course.id}`} className="course-card">
      <CourseArtwork art={course.art}/>
      <div className="course-card-body">
        <div className="course-code-row"><span>{course.code}</span>{course.labSection && <small>+ LAB</small>}</div>
        <h3>{course.title}</h3>
        <div className="course-meta"><span>{notes} notes</span><span>{cards} cards</span>{due > 0 && <span className="due-pill">{due} due</span>}</div>
        <div className="course-open">Open course <Icon name="arrow" size={15}/></div>
      </div>
    </Link>
  );
}
