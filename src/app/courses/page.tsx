"use client";

import Link from "next/link";
import { CourseList } from "@/components/CourseList";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Course } from "@/types/course";
import { useAuth } from "@/hooks/useAuth";
import { doc, onSnapshot } from "firebase/firestore";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetchedCourses);
      } catch (e) {
        console.error("Failed to fetch courses", e);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userCourses = data.userCourses || [];
        
        const enrolledSet = new Set<string>();
        const completedSet = new Set<string>();
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userCourses.forEach((courseData: any) => {
          if (courseData.status === 'IN_PROGRESS') {
            enrolledSet.add(courseData.id);
          } else if (courseData.status === 'COMPLETED') {
            completedSet.add(courseData.id);
          }
        });
        
        setEnrolledIds(enrolledSet);
        setCompletedIds(completedSet);
      }
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-10 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            Course Catalog
          </h1>
          <p className="text-slate-400 text-sm mb-4">Explore our unlimited library of {courses.length} interactive courses.</p>
        </div>
        <Link href="/" className="hover:text-cyan-400 transition">← Back to Home</Link>
      </header>
      
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 animate-pulse">Loading course catalog from the cloud...</p>
          </div>
        ) : (
          <CourseList 
            courses={courses} 
            enrolledIds={enrolledIds} 
            completedIds={completedIds} 
          />
        )}
      </div>
    </div>
  );
}
