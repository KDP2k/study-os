"use client";

import { useState } from "react";
import { CourseArt } from "@/lib/types";

const artNumbers: Record<CourseArt, number> = {
  compiler: 1, networks: 2, society: 3, economics: 4,
  testing: 5, performance: 6, numerical: 7, datamining: 8,
};
const artLabels: Record<CourseArt, string> = {
  compiler: "Compiler & Algorithm Design", networks: "Advanced Computer Networks",
  society: "Technology & Society", economics: "Engineering Economics",
  testing: "Software Testing", performance: "Performance Analysis",
  numerical: "Numerical Methods", datamining: "Data Mining",
};

export function CourseArtwork({ art, compact = false }: { art: CourseArt; compact?: boolean }) {
  const base = `image_${artNumbers[art]}`;
  const [src, setSrc] = useState(`/course-art/${base}.png`);
  return <div className={`course-art course-art-${art} ${compact ? "course-art-compact" : ""}`} aria-hidden="true">
    <img src={src} onError={()=>{ if(src.endsWith(".png")) setSrc(`/course-art/${base}.jpg`); }} alt="" />
    <div className="course-art-tech-overlay" />
    <div className="course-art-file-tag"><span>{base}</span><small>{artLabels[art]}</small></div>
  </div>;
}
