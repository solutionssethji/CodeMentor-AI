"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export default function Home() {
  const { user, loading } = useAuth();

  const [config, setConfig] = useState({
    heroTitle: "Master any programming language with your",
    heroSubtitle: "Personal AI Tutor",
    heroDescription: "From syntax basics to system design, CodeMentor AI provides real-time feedback, mock interviews, and personalized coding challenges.",
    features: [
      {
        icon: "🤖",
        title: "AI Code Explainer",
        description: "Paste any code and let the AI break it down line by line so you can understand the core concepts.",
        linkText: "Try Explainer",
        linkUrl: "/dashboard/ai-workspace",
        colorClass: "indigo"
      },
      {
        icon: "🐛",
        title: "Smart Debugger",
        description: "Stuck on an error? Our AI debugger finds the root cause and suggests optimized fixes instantly.",
        linkText: "Try Debugger",
        linkUrl: "/dashboard/ai-workspace",
        colorClass: "cyan"
      },
      {
        icon: "🎤",
        title: "Mock Interviews",
        description: "Practice real technical interviews tailored to top companies with instant feedback on your performance.",
        linkText: "Start Interview",
        linkUrl: "/dashboard/interviews",
        colorClass: "emerald"
      }
    ]
  });

  useEffect(() => {
    const configRef = doc(db, 'system', 'landing_page');
    
    getDoc(configRef).then(snap => {
      if (!snap.exists()) {
        setDoc(configRef, config).catch(e => console.error("Failed to seed landing page config", e));
      }
    });

    const unsub = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          CodeMentor AI
        </h1>
        <nav className="flex items-center space-x-6">
          <Link href="/courses" className="hover:text-cyan-400 transition">Courses</Link>
          <Link href="/pricing" className="hover:text-cyan-400 transition">Pricing</Link>
          
          {!loading && user ? (
            <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
              <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-medium transition">
                Go to Dashboard
              </Link>
              <button onClick={() => auth.signOut()} className="hover:text-slate-300 font-medium transition">
                Sign Out
              </button>
            </div>
          ) : !loading ? (
            <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
              <Link href="/login" className="hover:text-slate-300 font-medium transition">Sign In</Link>
              <Link href="/login" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-medium transition">
                Sign Up
              </Link>
            </div>
          ) : null}
        </nav>
      </header>

      <main className="flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
          {config.heroTitle} <span className="text-indigo-400">{config.heroSubtitle}</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mb-10">
          {config.heroDescription}
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-bold shadow-lg shadow-indigo-500/30 transition">
            Start Learning for Free
          </Link>
          <Link href="/demo" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-lg font-bold border border-slate-700 transition">
            View Demo
          </Link>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 py-20">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {config.features.map((feature: any, idx: number) => {
          // Map stored color classes to actual tailwind classes safely
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bgColors: any = { indigo: "bg-indigo-500/20 text-indigo-400", cyan: "bg-cyan-500/20 text-cyan-400", emerald: "bg-emerald-500/20 text-emerald-400" };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const borderHoverColors: any = { indigo: "hover:border-indigo-500", cyan: "hover:border-cyan-500", emerald: "hover:border-emerald-500" };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const shadowHoverColors: any = { indigo: "hover:shadow-indigo-500/10", cyan: "hover:shadow-cyan-500/10", emerald: "hover:shadow-emerald-500/10" };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textColors: any = { indigo: "text-indigo-400", cyan: "text-cyan-400", emerald: "text-emerald-400" };

          const bg = bgColors[feature.colorClass] || bgColors.indigo;
          const borderHover = borderHoverColors[feature.colorClass] || borderHoverColors.indigo;
          const shadowHover = shadowHoverColors[feature.colorClass] || shadowHoverColors.indigo;
          const text = textColors[feature.colorClass] || textColors.indigo;

          return (
            <Link key={idx} href={feature.linkUrl} className="block group">
              <div className={`bg-slate-900 p-8 rounded-2xl border border-slate-800 h-full transition shadow-lg ${borderHover} ${shadowHover}`}>
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-6 text-2xl group-hover:scale-110 transition ${bg}`}>{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 mb-6">{feature.description}</p>
                <div className={`${text} font-medium group-hover:translate-x-2 transition inline-flex items-center gap-2`}>{feature.linkText} <span>→</span></div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
