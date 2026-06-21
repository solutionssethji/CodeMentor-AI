"use client";

import { useState, useEffect, useRef } from "react";
import { Course } from "@/types/course";
import { CourseCard } from "@/components/CourseCard";

const ITEMS_PER_LOAD = 18;


export function CourseList({ 
  courses: initialCourses, 
  enrolledIds = new Set(), 
  completedIds = new Set() 
}: { 
  courses: Course[], 
  enrolledIds?: Set<string>, 
  completedIds?: Set<string> 
}) {
  // Deduplicate initial courses to ensure absolute uniqueness by title
  const uniqueInitialCourses = Array.from(new Map(initialCourses.map(c => [c.title, c])).values());
  
  const [allCourses] = useState<Course[]>(uniqueInitialCourses);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [searchQuery, setSearchQuery] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter courses based on search query
  const filteredCourses = allCourses.filter((course) => {
    const query = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(query) ||
      course.language.toLowerCase().includes(query) ||
      course.difficulty.toLowerCase().includes(query)
    );
  });

  // Reset infinite scroll when searching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + ITEMS_PER_LOAD, filteredCourses.length));
          }, 300);
        }
      },
      { rootMargin: "400px" } 
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    const currentTarget = observerTarget.current;
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [searchQuery, filteredCourses.length, allCourses.length]);

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  
  const hasMore = visibleCount < filteredCourses.length;

  return (
    <div className="space-y-8 pb-20">
      
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          🔍
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses by title, language, or difficulty..."
          className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-lg"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-4">🙈</div>
          <h3 className="text-xl font-bold mb-2">No courses found</h3>
          <p>Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              isEnrolled={enrolledIds.has(course.id)}
              isCompleted={completedIds.has(course.id)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {!hasMore && filteredCourses.length > 0 && (
        <div className="text-center py-8 text-slate-500">
          You&apos;ve reached the end of the catalog!
        </div>
      )}
    </div>
  );
}
