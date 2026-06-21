"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useData } from '@/providers/DataProvider';
import { useParams, useRouter } from "next/navigation";
import { downloadPDF } from "@/lib/generateCertificate";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export default function CourseTestPage() {
  const params = useParams();
  const rawCourseSlug = params.courseSlug as string;
  const courseSlug = decodeURIComponent(rawCourseSlug);

  const { user } = useAuth();
  const { userData, globalCourses, loading: dataLoading } = useData();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (dataLoading || !user || !userData) return;
    
    let isMounted = true;

    const generateTest = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let targetCourse: any = null;
        for (const id in globalCourses) {
          const c = globalCourses[id];
          if (c.slug === courseSlug || c.id === courseSlug) {
            targetCourse = c;
            break;
          }
        }
        
        if (!targetCourse) {
          throw new Error("Course not found.");
        }
        
        if (isMounted) {
          setCourseId(targetCourse.id);
        }

        const response = await fetch('/api/course-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseTitle: targetCourse.title,
            syllabus: targetCourse.syllabus,
            difficulty: targetCourse.difficulty
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate AI test.");
        }

        const testData = await response.json();
        
        if (isMounted) {
          setQuestions(testData.questions);
          setLoading(false);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    generateTest();
    return () => { isMounted = false; };
  }, [user, userData, globalCourses, dataLoading, courseSlug]);

  const handleSubmit = async () => {
    if (!user || isSubmitting || !courseId) return;
    setIsSubmitting(true);

    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const userCourses = data.userCourses || [];
        
        let scoreUpdated = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const courseIndex = userCourses.findIndex((c: any) => c.id === courseId);
        
        if (courseIndex > -1) {
          const currentScore = userCourses[courseIndex].score;
          if (currentScore === undefined || finalScore > currentScore) {
            scoreUpdated = true;
            userCourses[courseIndex].score = finalScore;
          }
        }

        if (scoreUpdated) {
          await setDoc(userRef, { 
            userCourses
          }, { merge: true });
        }
      }
    } catch (e) {
      console.error("Failed to save score:", e);
    }

    setIsSubmitting(false);
  };

  // Timer logic
  useEffect(() => {
    if (loading || isSubmitting || score !== null) return;
    
    if (timeLeft <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSubmit(); // Auto-submit when time's up
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, isSubmitting, score]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (score !== null) return; // Don't allow changes after submit
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-6xl mb-6 animate-pulse">🤖</div>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Generating Certification Exam...</h2>
        <p className="text-slate-400 mb-8 max-w-md text-center">
          CodeMentor AI is actively analyzing the course syllabus and generating 10 unique questions to test your knowledge.
        </p>
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Failed to load test</h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">{error}</p>
        <button 
          onClick={() => router.push('/dashboard/history')}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Render Post-Test Result
  if (score !== null) {
    const passed = score >= 75;
    return (
      <div className="p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl text-center shadow-2xl">
          <div className="text-8xl mb-6">{passed ? '🎉' : '📚'}</div>
          <h1 className={`text-4xl font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-slate-400 mb-8 text-lg">
            You scored <span className="font-bold text-white">{score}%</span> on the certification exam.
            <br />
            {passed ? 'You have successfully passed the minimum requirement (75%).' : 'You did not meet the 75% requirement. Review the material and try again!'}
          </p>

          <button 
            onClick={() => {
              if (passed) {
                const courseTitle = questions.length > 0 ? "AI Certification Exam" : "Course";
                const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                downloadPDF(courseTitle, user?.displayName || "Student", dateStr);
              } else {
                router.push('/dashboard/history');
              }
            }}
            className={`px-8 py-4 rounded-xl font-bold text-white transition shadow-lg w-full ${
              passed ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
            }`}
          >
            {passed ? 'Download Certificate Now' : 'Back to Course History'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-950/80 backdrop-blur-lg p-4 rounded-2xl z-10 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Certification Exam</h1>
          <p className="text-slate-400 text-sm">Pass with 75% to unlock your certificate.</p>
        </div>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-indigo-400'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="space-y-8 mb-12">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-medium text-slate-200 mb-6">
              <span className="text-indigo-400 font-bold mr-2">{qIndex + 1}.</span> 
              {q.question}
            </h3>
            <div className="space-y-3">
              {q.options.map((option, oIndex) => {
                const isSelected = answers[qIndex] === oIndex;
                return (
                  <div 
                    key={oIndex}
                    onClick={() => handleSelectOption(qIndex, oIndex)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-indigo-400' : 'border-slate-500'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />}
                    </div>
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 flex justify-center z-20">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length < questions.length}
          className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/20"
        >
          {isSubmitting ? 'Submitting Exam...' : Object.keys(answers).length < questions.length ? `Answer all questions (${Object.keys(answers).length}/${questions.length})` : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}
