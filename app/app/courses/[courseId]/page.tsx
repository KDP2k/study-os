import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/CourseDetail";
import { allCourses, courseById } from "@/lib/data";

export function generateStaticParams(){return allCourses.map((course)=>({courseId:course.id}))}

export default async function Page({params}:{params:Promise<{courseId:string}>}){
  const {courseId}=await params;
  const course=courseById[courseId];
  if(!course)notFound();
  return <CourseDetail course={course}/>;
}
