"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/types/course';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/providers/DataProvider';
import { CourseCard } from '@/components/CourseCard';

export default function DashboardCoursesPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const { userData, globalCourses, loading: dataLoading } = useData();
  const { user, loading: authLoading } = useAuth();
  
  const loading = dataLoading || authLoading;

  useEffect(() => {
    if (loading || !userData || !user) return;
    
    const enrolled: Course[] = [];
    const seenCourses = new Set<string>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userData.userCourses.forEach((courseData: any) => {
      if (courseData.status === 'IN_PROGRESS' && !seenCourses.has(courseData.id)) {
        seenCourses.add(courseData.id);
        const globalCourse = globalCourses[courseData.id] || {};
        const courseObj = {
          id: courseData.id,
          slug: globalCourse.slug || courseData.id,
          title: globalCourse.title || "Course",
          emoji: globalCourse.emoji || "📚",
          language: globalCourse.language || "",
          difficulty: globalCourse.difficulty || "",
          description: globalCourse.description || "",
          syllabus: Array.from({ length: globalCourse.syllabus?.length || 1 }).map((_, i) => ({ week: i + 1 }))
        } as unknown as Course;

        enrolled.push(courseObj);
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnrolledCourses(enrolled);
  }, [userData, globalCourses, loading, user]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasCourses = enrolledCourses.length > 0;

  if (!hasCourses) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="text-6xl mb-6">📚</div>
        <h2 className="text-3xl font-bold text-white mb-4">No Active Courses</h2>
        <p className="text-slate-400 max-w-md mb-8">
          You haven&apos;t started any courses yet. Head over to the Course Catalog to pick your first interactive bootcamp!
        </p>
        <Link 
          href="/courses"
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-lg shadow-indigo-500/20"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
          <p className="text-slate-400">Continue where you left off or review your completed material.</p>
        </div>
        <Link 
          href="/courses" 
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700"
        >
          📚 Browse Catalog
        </Link>
      </div>

      {enrolledCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Currently Enrolled</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolledCourses.map((course, index) => course ? (
              <CourseCard key={course.id || `course-${index}`} course={course} isEnrolled={true} />
            ) : null)}
          </div>
        </div>
      )}

    </div>
  );
}
