"use client";

import { useState, useEffect } from "react";
// Removed unused firebase imports
import { useAuth } from "@/hooks/useAuth";
import { useData } from '@/providers/DataProvider';
import { Course } from "@/types/course";
import { downloadPDF } from "@/lib/generateCertificate";
import Link from "next/link";

export default function CompletedHistoryPage() {
  const { user } = useAuth();
  const { userData, globalCourses, loading: dataLoading } = useData();
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);

  const loading = dataLoading;

  useEffect(() => {
    if (loading || !userData || !user) return;

    const completed: Course[] = [];
    const seenCourses = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userData.userCourses.forEach((courseData: any) => {
      if (courseData.status === 'COMPLETED' && !seenCourses.has(courseData.id)) {
        seenCourses.add(courseData.id);
        const globalCourse = globalCourses[courseData.id] || {};
        completed.push({
          id: courseData.id,
          slug: globalCourse.slug || courseData.id,
          title: globalCourse.title || "Course",
          emoji: globalCourse.emoji || "📚",
          language: globalCourse.language || "",
          difficulty: globalCourse.difficulty || "",
          description: globalCourse.description || "",
          syllabus: Array.from({ length: globalCourse.syllabus?.length || 1 }).map((_, i) => ({ week: i + 1 })),
          score: courseData.score
        } as unknown as Course);
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompletedCourses(completed);
  }, [userData, globalCourses, loading, user]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
          Course Completion History
        </h1>
        <p className="text-slate-400">
          Review your accomplishments, download certificates, and access past course materials.
        </p>
      </header>

      {completedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <div className="text-6xl mb-6 opacity-80">🎓</div>
          <h2 className="text-2xl font-bold text-slate-200 mb-2">No Completed Courses Yet</h2>
          <p className="text-slate-500 max-w-md text-center mb-8">
            You haven&apos;t fully completed any courses yet. Once you finish 100% of a course&apos;s syllabus, it will appear here as a permanent record of your achievement!
          </p>
          <Link
            href="/dashboard/courses"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/20"
          >
            Continue Learning
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedCourses.map((course) => (
            <div key={course.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition group shadow-lg">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400 w-full"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-5xl">{course.emoji}</div>
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <span>✓</span> Verified Completion
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-100 mb-2">{course.title}</h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2">{course.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Language</div>
                    <div className="text-slate-300 font-medium">{course.language}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Difficulty</div>
                    <div className="text-slate-300 font-medium">{course.difficulty}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Modules</div>
                    <div className="text-slate-300 font-medium">{course.syllabus.length} Completed</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Est. Time</div>
                    <div className="text-slate-300 font-medium">{course.estimatedHours || 12} Hours</div>
                  </div>
                  {course.score !== undefined && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Exam Score</div>
                      <div className={`font-medium ${course.score >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {course.score}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/history/${course.slug || course.id}`}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center rounded-xl transition font-medium text-sm border border-slate-700 hover:border-slate-600"
                  >
                    Review Material
                  </Link>

                  {/* Dynamic Test & Certificate Logic */}
                  {course.score !== undefined && course.score >= 75 ? (
                    <button
                      className="flex-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-400 text-center rounded-xl transition font-medium text-sm border border-emerald-500/30"
                      onClick={() => {
                        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                        downloadPDF(course.title, user?.displayName || "Student", dateStr);
                      }}
                    >
                      Download Certificate
                    </button>
                  ) : course.score !== undefined ? (
                    <Link
                      href={`/dashboard/history/${course.slug || course.id}/test`}
                      className="flex-1 py-2.5 bg-amber-600/10 hover:bg-amber-600 hover:text-white text-amber-400 text-center rounded-xl transition font-medium text-sm border border-amber-500/30"
                    >
                      {course.score !== undefined ? (
                        course.score !== 0 ? `Re-test (${course.score}%)` : "Take Test"
                      ) : "Take Test"}
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/history/${course.slug || course.id}/test`}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-center rounded-xl transition font-medium text-sm border border-indigo-500/30"
                    >
                      Take Test
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
