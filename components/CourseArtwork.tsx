import { CourseArt } from "@/lib/types";

const artFiles: Record<CourseArt, string> = {
  compiler: "image_1.jpg",
  networks: "image_2.jpg",
  society: "image_3.jpg",
  economics: "image_4.jpg",
  testing: "image_5.jpg",
  performance: "image_6.jpg",
  numerical: "image_7.jpg",
  datamining: "image_8.jpg",
};

const artLabels: Record<CourseArt, string> = {
  compiler: "Compiler & Algorithm Design",
  networks: "Advanced Computer Networks",
  society: "Technology & Society",
  economics: "Engineering Economics",
  testing: "Software Testing",
  performance: "Performance Analysis",
  numerical: "Numerical Methods",
  datamining: "Data Mining",
};

export function CourseArtwork({ art, compact = false }: { art: CourseArt; compact?: boolean }) {
  return (
    <div className={`course-art course-art-${art} ${compact ? "course-art-compact" : ""}`} aria-hidden="true">
      <img src={`/course-art/${artFiles[art]}`} alt="" />
      <div className="course-art-tech-overlay" />
      <div className="course-art-file-tag"><span>{artFiles[art].replace(".jpg", "")}</span><small>{artLabels[art]}</small></div>
    </div>
  );
}
