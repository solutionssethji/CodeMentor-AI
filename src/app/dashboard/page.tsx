"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useData } from "@/providers/DataProvider";


interface FormattedActiveCourse {
  id: string;
  slug?: string;
  title: string;
  chapter: string;
  progress: number;
  color: string;
}

interface DashboardData {
  stats: {
    streak: number;
    xp: number;
    rank: number;
    lessonsCompleted: number;
  };
  activeCourses: FormattedActiveCourse[];
  dailyChallenge: {
    title: string;
    description: string;
    xpReward: number;
    isSolved?: boolean;
  } | null;
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const { userData, globalCourses, loading: dataLoading } = useData();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user || dataLoading || !userData) return;
    
    const calculateDashboardData = async () => {
      const defaultData = {
      techStack: 'JavaScript',
      experienceLevel: 'Beginner',
      stats: {
        streak: 0,
        xp: 100,
        rank: 5000,
        lessonsCompleted: 0
      },
      activeCourses: [],
      dailyChallenge: null
    };

    let totalLessonsCompleted = 0;
    const seenCourses = new Set<string>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userData.userCourses.forEach((c: any) => {
      if (!seenCourses.has(c.id)) {
        seenCourses.add(c.id);
        totalLessonsCompleted += c.status==='COMPLETED' ? 1 : 0;
      }
    });
    
    const realActiveCourses: FormattedActiveCourse[] = userData.userCourses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((courseData: any) => courseData.status === 'IN_PROGRESS')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((courseData: any, index: number, self: any[]) => 
        // deduplicate in case of multiple IN_PROGRESS entries
        index === self.findIndex((c) => c.id === courseData.id)
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((courseData: any) => {
        const cWeeks = courseData.completedWeeks || [];
        const globalCourse = globalCourses[courseData.id] || {};
        const syllabusLength = globalCourse.syllabus?.length || 0;
        const percent = syllabusLength === 0 ? 0 : Math.round((cWeeks.length / syllabusLength) * 100);
        
        const currentChapter = `Week ${cWeeks.length + 1}`;

        return {
          id: courseData.id,
          slug: globalCourse.slug,
          title: globalCourse.title || "Course",
          chapter: currentChapter,
          progress: percent,
          color: "bg-indigo-500"
        };
    }).filter((c: FormattedActiveCourse) => c.progress < 100);

    const totalXP = userData.stats?.xp || defaultData.stats.xp;
    
    let calculatedRank = 1;
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allUsers.sort((a: any, b: any) => (b.stats?.xp || 0) - (a.stats?.xp || 0));
      const rankIndex = allUsers.findIndex(u => u.id === user.uid);
      if (rankIndex >= 0) {
        calculatedRank = rankIndex + 1;
      } else {
        calculatedRank = Math.max(1, 5000 - Math.floor(totalXP / 10));
      }
    } catch (e) {
      console.error("Error calculating true rank", e);
      calculatedRank = Math.max(1, 5000 - Math.floor(totalXP / 10));
    }

    const today = new Date().toISOString().split('T')[0];
    let currentStreak = userData.stats?.streak || 0;
    let lastActiveDate = userData.lastActiveDate;
    let needsDatabaseUpdate = false;

    if (lastActiveDate !== today) {
      if (lastActiveDate) {
        const lastActive = new Date(lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastActiveDate = today;
      needsDatabaseUpdate = true;
    }

    if (userData.stats?.lessonsCompleted !== totalLessonsCompleted) {
      needsDatabaseUpdate = true;
    }

    const calculatedData = {
      ...userData,
      stats: {
        ...defaultData.stats,
        ...userData.stats,
        xp: totalXP,
        rank: calculatedRank,
        streak: currentStreak,
        lessonsCompleted: totalLessonsCompleted
      },
      activeCourses: realActiveCourses.length > 0 ? realActiveCourses : [],
      dailyChallenge: userData.dailyChallenge || defaultData.dailyChallenge,
    };
    
    if (needsDatabaseUpdate) {
      setDoc(doc(db, 'users', user.uid), { 
        stats: calculatedData.stats,
        lastActiveDate: today 
      }, { merge: true }).catch(console.error);
    }

    const isSolvedToday = userData.lastSolvedChallengeDate === today;

    // Try to pull the generated AI challenge from Firebase to show on the dashboard
    if (userData.generatedChallenge) {
      const previousChallenge = userData.generatedChallenge;
      
      if (previousChallenge.date === today && previousChallenge.data) {
        calculatedData.dailyChallenge = {
          title: typeof previousChallenge.data.title === 'string' ? previousChallenge.data.title : JSON.stringify(previousChallenge.data.title || 'Challenge'),
          description: typeof previousChallenge.data.description === 'string' 
            ? previousChallenge.data.description.substring(0, 100) + '...' 
            : JSON.stringify(previousChallenge.data.description || '').substring(0, 100) + '...',
          xpReward: 500,
          isSolved: isSolvedToday
        };
      }
    }
    
    if (calculatedData.dailyChallenge && calculatedData.dailyChallenge.isSolved === undefined) {
      calculatedData.dailyChallenge.isSolved = isSolvedToday;
    }

    setData(calculatedData as DashboardData);
    };

    calculateDashboardData();
  }, [userData, dataLoading, globalCourses, user]);

  if (dataLoading || !data) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-28"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-24"></div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-24"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if ('error' in data) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Database Connection Error</h2>
          <p className="text-slate-300 mb-4">We could not connect to your Firebase database. Please make sure you have explicitly created a &quot;Firestore Database&quot; inside your Firebase Console.</p>
          <div className="bg-slate-950 p-4 rounded text-left text-sm font-mono text-red-300">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data as any).error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-100">
          Welcome back, {userData?.displayName ? userData.displayName.split(' ')[0] : (userData?.firstName ? userData.firstName : (user?.displayName ? user.displayName.split(' ')[0] : 'Developer'))}!
        </h2>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-orange-400 flex items-center gap-2">🔥 {data.stats.streak} Days</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Total XP</p>
          <p className="text-3xl font-bold text-indigo-400">{data.stats.xp.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Global Rank</p>
          <p className="text-3xl font-bold text-cyan-400">#{data.stats.rank.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Lessons Completed</p>
          <p className="text-3xl font-bold text-emerald-400">{data.stats.lessonsCompleted}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Courses */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold mb-4 text-slate-200">Continue Learning</h3>
          <div className="space-y-4">
            {data.activeCourses.length > 0 ? data.activeCourses.map((course) => (
              <Link href={`/dashboard/courses/${encodeURIComponent(course.slug || course.id)}`} key={course.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md flex items-center justify-between hover:border-indigo-500/50 transition-colors block cursor-pointer">
                <div>
                  <h4 className="font-bold text-lg mb-1 text-slate-200">{course.title}</h4>
                  <p className="text-slate-400 text-sm">{course.chapter}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-2">{course.progress}% Completed</p>
                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${course.color}`} style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-4">You have no active courses at the moment.</p>
                <a href="/courses" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition inline-block">
                  Browse Course Catalog
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Daily Challenge */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-slate-200">Daily AI Challenge</h3>
          {data.dailyChallenge ? (
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-xl border border-indigo-500/30 shadow-lg">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-lg mb-4 text-xl">⚔️</div>
              <h4 className="font-bold text-lg mb-2 text-slate-200">{data.dailyChallenge.title}</h4>
              <p className="text-slate-300 text-sm mb-6">{data.dailyChallenge.description}</p>
              {data.dailyChallenge.isSolved ? (
                <div className="block w-full text-center py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold">
                  ✅ Solved Today
                </div>
              ) : (
                <a href="/dashboard/challenges" className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-white transition shadow-lg shadow-indigo-600/20">
                  Solve Challenge (+{data.dailyChallenge.xpReward} XP)
                </a>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed p-6 rounded-xl text-center shadow-md">
              <div className="text-4xl mb-3 opacity-50 grayscale group-hover:grayscale-0 transition-all">🤖</div>
              <h4 className="font-bold text-lg mb-2 text-slate-200">No Active Challenge</h4>
              <p className="text-slate-400 text-sm mb-6">You don&apos;t have a daily AI challenge right now.</p>
              <a 
                href="/dashboard/challenges" 
                className="block w-full text-center py-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 rounded-lg transition-colors font-medium"
              >
                Generate Daily Challenge
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
