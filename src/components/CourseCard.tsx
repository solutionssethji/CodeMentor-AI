"use client";

import { useState } from "react";
import { Course } from "@/types/course";
import { useRouter } from "next/navigation";
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import UpgradeModal from './UpgradeModal';

export function CourseCard({ course, isEnrolled = false, isCompleted = false }: { course: Course, isEnrolled?: boolean, isCompleted?: boolean }) {
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'documents' | 'user_study' | 'complement_course'>('syllabus');
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [viewingCaseStudy, setViewingCaseStudy] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const router = useRouter();

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

  return (
    <>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        title="Upgrade to Unlock"
        message={upgradeMessage} 
        onClose={() => setShowUpgradeModal(false)} 
      />
      
      {/* Modals for Document and Case Study */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">📄 {viewingDoc}</h3>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800">✕</button>
            </div>
            <div className="flex-1 w-full h-[60vh] bg-slate-950/50 relative">
              <iframe 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                src={course?.documents?.find((d: any) => d.title === viewingDoc)?.url || "/sample.pdf"} 
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Case Study: {viewingCaseStudy}</h3>
              <button onClick={() => setViewingCaseStudy(null)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800">✕</button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-300 leading-relaxed">
              <p><strong>Abstract:</strong> This case study explores how a top-tier tech company mitigated LLM hallucinations by 40% using Retrieval-Augmented Generation (RAG) and strict prompt guardrails. We will analyze their architecture choices and implementation challenges.</p>
              
              <h4 className="text-lg font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">1. The Problem Space</h4>
              <p>In early 2024, the engineering team noticed that their customer-facing chatbot was generating factually incorrect information (&quot;hallucinations&quot;) in approximately 12% of user interactions. This led to significant customer dissatisfaction and increased support ticket volumes.</p>
              
              <h4 className="text-lg font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">2. Architecture Decisions</h4>
              <p>Instead of relying purely on the model&apos;s parametric memory, the team implemented a RAG architecture. They vectorized their entire product documentation library using specialized embeddings and stored them in a high-performance vector database.</p>
              
              <h4 className="text-lg font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">3. Prompt Guardrails</h4>
              <p>They wrapped the LLM generation step with a secondary evaluation prompt. If the evaluator model determined that the primary response contained claims not present in the retrieved context, the response was blocked and a fallback message was triggered.</p>
              
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl mt-8">
                <p className="text-indigo-200 font-medium">Key Takeaway: RAG combined with structural prompt guardrails provides the most robust defense against enterprise LLM hallucinations.</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900 rounded-b-2xl">
              <span className="text-sm text-slate-500">Estimated read time: 5 mins</span>
              <button onClick={() => setViewingCaseStudy(null)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow font-medium">Mark as Read</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500 transition cursor-pointer flex flex-col h-full shadow-lg">
        <div className="text-4xl mb-4">{course.emoji}</div>
        <h2 className="text-xl font-bold mb-2">{course.title}</h2>
        <p className="text-slate-400 text-sm mb-4 flex-grow">{course.description}</p>
        
        <div className="flex gap-2 text-sm text-slate-400 mb-6">
          <span className="bg-slate-800 px-2 py-1 rounded">{course.language}</span>
          <span className="bg-slate-800 px-2 py-1 rounded">{course.difficulty}</span>
        </div>

        <button 
          onClick={() => {
            if (isEnrolled || isCompleted) {
              router.push(`/dashboard/courses/${encodeURIComponent(course.slug || course.id)}`);
            } else {
              setShowSyllabus(true);
              setActiveTab('syllabus');
            }
          }}
          className={`w-full py-2 border rounded-lg transition font-medium mb-2 ${
            isCompleted ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white' :
            isEnrolled ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600 hover:text-white' :
            'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isCompleted ? 'Completed ✓' : isEnrolled ? 'Continue Learning' : 'View Syllabus'}
        </button>
      </div>

      {showSyllabus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex flex-col gap-4 sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span>{course.emoji}</span> {course.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{course.language} • {course.difficulty}</p>
                </div>
                <button 
                  onClick={() => setShowSyllabus(false)}
                  className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex gap-2 border-b border-slate-800 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { id: 'syllabus', label: '📅 Weekly Plan' },
                  { id: 'documents', label: '📄 Documents' },
                  { id: 'user_study', label: '👥 User Study' },
                  { id: 'complement_course', label: '🔗 Complement Course' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap border-b-2 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {activeTab === 'syllabus' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {course.syllabus.map((week) => (
                    <div key={week.week} className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition">
                      <h4 className="text-indigo-400 font-bold text-lg mb-3 border-b border-slate-800/50 pb-2">
                        Week {week.week}: {week.title}
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                        {week.topics.map((topic, i) => (
                          <li key={i}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-white mb-6">Course Documents & Resources</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(course.documents || []).map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{doc.icon}</span>
                          <div>
                            <h3 className="text-slate-200 font-medium group-hover:text-white transition-colors">{doc.title}</h3>
                            <p className="text-xs text-slate-500">{doc.type} • {doc.size}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingDoc(doc.title);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-900 rounded-full transition-colors"
                        >
                          ↓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'user_study' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-white mb-6">User Studies & Case Scenarios</h2>
                  <div className="space-y-6">
                    <div className="bg-slate-800/30 p-6 border border-slate-700 rounded-xl">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-200">Case Study: Production Scale {course.language}</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-medium">Required Reading</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Explore how a top-tier tech company optimized their systems using {course.language} and advanced architectural patterns. Analyze their implementation challenges and solutions.
                      </p>
                      <button 
                        onClick={() => setViewingCaseStudy(`Production Scale ${course.language}`)}
                        className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors"
                      >
                        Read Case Study →
                      </button>
                    </div>

                    <div className="bg-slate-800/30 p-6 border border-slate-700 rounded-xl opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-200">Interactive Scenario: Code Optimization</h3>
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-medium">Optional Practice</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Step into the role of a senior engineer and optimize a legacy {course.language} codebase. You will be evaluated on latency, security, and scalability.
                      </p>
                      <button 
                        onClick={async () => {
                          const user = auth.currentUser;
                          if (user) {
                            try {
                              await setDoc(doc(db, 'users', user.uid), {
                                workspaceSession: {
                                  title: `Interactive Scenario: Optimize ${course.language}`,
                                  language: course.language.toLowerCase(),
                                  code: ''
                                }
                              }, { merge: true });
                            } catch (e) {
                              console.error("Failed to save session to Firestore", e);
                            }
                          }
                          router.push('/dashboard/ai-workspace');
                        }}
                        className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors"
                      >
                        Start Scenario →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'complement_course' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-white mb-6">Recommended Complementary Content</h2>
                  <p className="text-slate-400 mb-6">Enhance your learning with these hand-picked external resources that complement this course.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
              <button 
                onClick={async () => {
                  const user = auth.currentUser;
                  if (user && !isEnrolled) {
                    try {
                      const userRef = doc(db, 'users', user.uid);
                      const userSnap = await getDoc(userRef);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      let userData: any = {};
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      let userCourses: any[] = [];
                      if (userSnap.exists()) {
                        userData = userSnap.data();
                        userCourses = userData.userCourses || [];
                      }

                      const pricingDoc = await getDoc(doc(db, 'system', 'pricing'));
                      let courseLimit = 2; // Hobbyist fallback limit
                      if (pricingDoc.exists()) {
                        const tiers = pricingDoc.data().tiers || [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const userTier = tiers.find((t: any) => t.id === (userData.tierId || 'b1f81d1d-0e42-4f9e-9d22-1b1a78e1c613'));
                        if (userTier && userTier.courseCount !== undefined) {
                          courseLimit = userTier.courseCount;
                        }
                      }

                      if (courseLimit !== -1 && userCourses.length >= courseLimit) {
                        setUpgradeMessage(`Your current plan allows a maximum of ${courseLimit} courses.`);
                        setShowUpgradeModal(true);
                        return;
                      }
                      
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const existingCourseIndex = userCourses.findIndex((c: any) => c.id === course.id);
                      if (existingCourseIndex === -1) {
                        userCourses.push({
                          id: course.id,
                          status: 'IN_PROGRESS',
                          score: 0,
                          completedWeeks: []
                        });
                      }
                      
                      await setDoc(userRef, {
                        userCourses,
                        activeCourseId: course.id
                      }, { merge: true });
                    } catch (e) {
                      console.error("Failed to save active course to Firestore", e);
                    }
                  } else if (user && isEnrolled) {
                    // Just set active course if already enrolled
                    try {
                      await setDoc(doc(db, 'users', user.uid), {
                        activeCourseId: course.id
                      }, { merge: true });
                    } catch {}
                  }
                  router.push(`/dashboard/courses/${encodeURIComponent(course.slug || course.id)}`);
                }}
                className={`w-full py-3 text-white rounded-lg transition font-bold text-lg shadow-lg ${
                  isCompleted ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' :
                  isEnrolled ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' :
                  'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                }`}
              >
                {isCompleted ? 'Review Course Dashboard' : isEnrolled ? 'Go to Dashboard' : 'Start Learning'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
