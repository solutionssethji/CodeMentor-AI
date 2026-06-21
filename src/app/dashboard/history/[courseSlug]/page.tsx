"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { downloadPDF } from "@/lib/generateCertificate";
import { Course } from '@/types/course';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/providers/DataProvider';

type Tab = 'syllabus' | 'documents' | 'user_study' | 'complement_course';

export default function HistoryDetailsPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const unwrappedParams = use(params);
  const courseSlug = unwrappedParams.courseSlug;
  const { user } = useAuth();
  const { userData, globalCourses, loading: dataLoading } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('syllabus');
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [viewingCaseStudy, setViewingCaseStudy] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  
  const loading = dataLoading;

  const handleDownload = (docTitle: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = course?.documents?.find((d: any) => d.title === docTitle)?.url || "/sample.pdf";
    const element = document.createElement("a");
    element.href = url;
    element.download = `${docTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    if (loading || !userData || !user) return;
    
    // Find target course from globalCourses based on slug or id
    let targetCourse: Course | null = null;
    for (const id in globalCourses) {
      const c = globalCourses[id];
      if (c.slug === courseSlug || c.id === courseSlug) {
        targetCourse = c;
        break;
      }
    }
    
    if (!targetCourse) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCourse(null);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchedCourse = userData.userCourses.find((c: any) => c.id === targetCourse!.id);
    if (matchedCourse && matchedCourse.status === 'COMPLETED') {
      setCourse({ ...targetCourse!, score: matchedCourse.score });
    } else {
      setCourse(null);
    }
  }, [userData, globalCourses, loading, user, courseSlug]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="text-3xl font-bold text-white mb-4">Course Not Found</h2>
        <p className="text-slate-400 max-w-md mb-8">
          We couldn&apos;t find the history details for this course.
        </p>
        <Link 
          href="/dashboard/history"
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-lg shadow-indigo-500/20"
        >
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto relative flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Modals */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">📄 {viewingDoc}</h3>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800">✕</button>
            </div>
            <div className="flex-1 w-full h-[60vh] bg-slate-950/50 relative">
              <iframe 
                src={course?.documents?.find(d => d.title === viewingDoc)?.url || "/sample.pdf"} 
                className="w-full h-full border-0" 
                title={`Document Viewer - ${viewingDoc}`} 
              />
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setViewingDoc(null)} className="px-4 py-2 text-slate-300 hover:text-white transition">Close</button>
              <button onClick={() => viewingDoc && handleDownload(viewingDoc)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition shadow">Download File</button>
            </div>
          </div>
        </div>
      )}

      {viewingCaseStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Case Study: {viewingCaseStudy}</h3>
              <button onClick={() => setViewingCaseStudy(null)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800">✕</button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-300 leading-relaxed">
              <p><strong>Abstract:</strong> This case study explores how a top-tier tech company optimized their infrastructure and reduced technical debt by 40% using advanced {course?.language || "programming"} patterns. We will analyze their architecture choices and implementation challenges.</p>
              
              <h4 className="text-lg font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">1. The Problem Space</h4>
              <p>In early 2024, the engineering team noticed that their legacy monolithic backend was causing significant latency issues during peak traffic. This led to customer dissatisfaction and increased support ticket volumes.</p>
              
              <h4 className="text-lg font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">2. Architecture Decisions</h4>
              <p>Instead of relying on vertical scaling, the team implemented a modern architecture using {course?.language || "the latest standards"}. They containerized their workloads and implemented strict type safety and design patterns.</p>
              
              <h4 className="text-lg font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">3. Implementation Guardrails</h4>
              <p>They wrapped the core deployment step with automated CI/CD pipelines. If the evaluator determined that the primary build contained memory leaks or unhandled exceptions in {course?.language || "the codebase"}, the deployment was blocked and a fallback was triggered.</p>
              
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl mt-8">
                <p className="text-indigo-200 font-medium">Key Takeaway: Modern design patterns combined with {course?.language || "strict"} guardrails provide the most robust defense against enterprise system failures.</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900 rounded-b-2xl">
              <span className="text-sm text-slate-500">Estimated read time: 5 mins</span>
              <button onClick={() => setViewingCaseStudy(null)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow font-medium">Mark as Read</button>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Completed Course
            </span>
            <span className="text-slate-400 text-sm">Archived Material</span>
          </div>
          <Link 
            href="/dashboard/history" 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700"
          >
            ← Back to History
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-white">{course.title}</h1>
          <div className="flex gap-3">
            {course.score !== undefined && course.score >= 75 ? (
              <button
                onClick={() => {
                  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  downloadPDF(course.title, user?.displayName || "Developer", date);
                }}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <span className="text-xl">🎓</span> Download Certificate
              </button>
            ) : (
              <Link
                href={`/dashboard/history/${encodeURIComponent(course.slug || course.id)}/test`}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span className="text-xl">📝</span> Take Final Test
              </Link>
            )}
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 font-medium">Course Progress</span>
            <span className="text-emerald-400 font-bold">100% Completed</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-800 mb-6 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'syllabus'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          📅 Weekly Plan
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          📄 Documents
        </button>
        <button
          onClick={() => setActiveTab('user_study')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'user_study'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          👥 User Study
        </button>
        <button
          onClick={() => setActiveTab('complement_course')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'complement_course'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          🔗 Complement Course
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 min-h-[400px]">
        
        {/* Syllabus Tab */}
        {activeTab === 'syllabus' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Course Syllabus</h2>
            {(!course.syllabus || course.syllabus.length === 0) ? (
              <div className="text-slate-400 py-8 text-center">
                This course currently has no syllabus modules available.
              </div>
            ) : (
              <div className="space-y-4">
                {course.syllabus.map((week) => {
                
                return (
                <div key={week.week} className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="font-bold w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        ✓
                      </div>
                      <h3 className="text-lg font-bold text-slate-400 line-through">
                        {week.title}
                      </h3>
                    </div>
                    <ul className="list-disc list-inside text-sm ml-14 space-y-1 text-slate-500">
                      {week.topics.map((topic, i) => (
                        <li key={i}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 md:self-end">
                    <button 
                      disabled={true}
                      className="px-6 py-2.5 font-medium rounded-lg transition-colors border whitespace-nowrap bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-not-allowed"
                    >
                      Completed ✓
                    </button>
                  </div>
                </div>
              )})}
            </div>
            )}
          </div>
        )}
        
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Course Documents & Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(course.documents || []).map((doc, i) => (
                <div key={i} onClick={() => setViewingDoc(doc.title)} className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <h3 className="text-slate-200 font-medium group-hover:text-white transition-colors">{doc.title}</h3>
                      <p className="text-xs text-slate-500">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc.title); }}
                    className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 rounded-full transition-colors"
                  >
                    ↓
                  </button>
                </div>
              ))}
              {(!course.documents || course.documents.length === 0) && (
                <div className="col-span-2 text-center text-slate-500 py-8">
                  No documents available for this course.
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Study Tab */}
        {activeTab === 'user_study' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-white mb-6">User Case Studies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} onClick={() => setViewingCaseStudy(`Enterprise Migration Case Study ${i}: ${course?.language || "Modern Stack"}`)} className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="text-emerald-400 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">Enterprise Migration Case Study {i}</h3>
                  <p className="text-sm text-slate-400 mb-4">Learn how a Fortune 500 company successfully migrated their legacy systems using the {course?.language || ""} concepts taught in this course.</p>
                  <span className="text-emerald-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read Study →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complement Course Tab */}
        {activeTab === 'complement_course' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Complementary Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(course.videos || []).map((item, i) => (
                <a 
                  key={i} 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-gradient-to-br ${item.color} border border-slate-700/50 p-5 rounded-xl flex flex-col h-full hover:border-slate-500 transition-colors cursor-pointer block`}
                >
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-slate-200 font-bold mb-2 flex-grow">{item.title}</h3>
                  <div className="text-xs text-slate-400 flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
                    <span>{item.author}</span>
                    <span className="bg-slate-900/50 px-2 py-1 rounded">{item.duration}</span>
                  </div>
                </a>
              ))}
              {(!course.videos || course.videos.length === 0) && (
                <div className="col-span-3 text-center text-slate-500 py-8">
                  No complementary videos found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
