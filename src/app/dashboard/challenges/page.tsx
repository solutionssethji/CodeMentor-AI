"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';

export default function DailyChallengesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [challenge, setChallenge] = useState<any>(null);
  const [challengeTech, setChallengeTech] = useState<string>('javascript');
  const [isSolvedToday, setIsSolvedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchChallenge = async () => {
      if (authLoading || !user) {
        if (!authLoading && !user) setIsLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let previousChallenge: any = null;
      let tech = 'JavaScript';
      let level = 'Beginner';

      try {
        const today = new Date().toISOString().split('T')[0];

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          tech = data.techStack || tech;
          level = data.experienceLevel || level;
          
          const challengesCount = data.challengesCompleted || 0;
          
          const pricingDoc = await getDoc(doc(db, 'system', 'pricing'));
          let challengeLimit = 2; // Hobbyist fallback
          if (pricingDoc.exists()) {
            const tiers = pricingDoc.data().tiers || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userTier = tiers.find((t: any) => t.id === (data.tierId || 'b1f81d1d-0e42-4f9e-9d22-1b1a78e1c613'));
            if (userTier && userTier.challengeCount !== undefined) {
              challengeLimit = userTier.challengeCount;
            }
          }

          if (challengeLimit !== -1 && challengesCount >= challengeLimit) {
            setUpgradeMessage(`Your current plan allows a maximum of ${challengeLimit} daily challenges.`);
            setShowUpgradeModal(true);
            setIsLoading(false);
            return;
          }
          
          if (data.lastSolvedChallengeDate === today) {
            setIsSolvedToday(true);
          }

          // Check Firebase for today's generated challenge
          if (data.generatedChallenge) {
            previousChallenge = data.generatedChallenge;
            if (previousChallenge.date === today && !previousChallenge.data?.isFallback) {
              setChallenge(previousChallenge.data);
              setChallengeTech(tech.toLowerCase());
              setIsLoading(false);
              return;
            }
          }
        }

        const response = await fetch(`/api/challenge?date=${today}&tech=${encodeURIComponent(tech)}&level=${encodeURIComponent(level)}`);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errorMessage = errData.error || 'Failed to fetch AI challenge due to Google API Rate Limits. Please wait 1 minute.';
          
          if (previousChallenge && previousChallenge.data) {
            setChallenge(previousChallenge.data);
            setChallengeTech(tech.toLowerCase());
          } else {
            setError(errorMessage);
          }
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        setChallenge(data);
        setChallengeTech(tech.toLowerCase());
        // Save the successful AI challenge to Firebase for persistence
        await updateDoc(docRef, {
          generatedChallenge: {
            date: today,
            data: data
          }
        });
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Challenge fetch error:", err);
        
        // If the API request fails entirely, try to use the last known good challenge from Firebase
        if (previousChallenge && previousChallenge.data) {
          setChallenge(previousChallenge.data);
          setChallengeTech(tech.toLowerCase());
        } else {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [user, authLoading]);

  const handleSolve = async () => {
    if (!challenge || !user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        workspaceSession: {
          code: challenge.starterCode,
          title: challenge.title,
          language: challengeTech
        }
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save workspace session", e);
    }
    router.push('/dashboard/ai-workspace');
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">The AI is generating today&apos;s challenge...</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Google API Quota Reached</h2>
        <p className="text-slate-400 max-w-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        title="Upgrade to Unlock"
        message={upgradeMessage} 
        onClose={() => {
          setShowUpgradeModal(false);
          router.push('/dashboard');
        }} 
      />
      <div className="p-6 max-w-4xl mx-auto">
        {searchParams?.get('success') === 'true' && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="text-green-400 font-bold">Congratulations!</h3>
                <p className="text-green-200/80 text-sm">You have successfully solved today&apos;s challenge. Come back tomorrow for a new one!</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
          {isSolvedToday ? (
            <button 
              disabled
              className="bg-green-600/50 text-green-200 px-6 py-2 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed border border-green-500/30"
            >
              <span>✅ Solved</span>
            </button>
          ) : (
            <button 
              onClick={handleSolve}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg shadow-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>Solve in Workspace</span>
              <span>→</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="bg-slate-800/50 p-6 border-b border-slate-800 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{typeof challenge.title === 'object' ? JSON.stringify(challenge.title) : challenge.title}</h2>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                challenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                challenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {typeof challenge.difficulty === 'object' ? JSON.stringify(challenge.difficulty) : challenge.difficulty}
              </div>
            </div>
            <div className="text-slate-500 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="p-6">
            <div className="prose prose-invert max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
              <ReactMarkdown>{typeof challenge.description === 'object' ? JSON.stringify(challenge.description) : (challenge.description || '')}</ReactMarkdown>
            </div>

            {challenge.examples && challenge.examples.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Examples</h3>
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {challenge.examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <div className="font-mono text-sm mb-2"><span className="text-slate-500 select-none">Input: </span> <span className="text-green-400">{typeof ex.input === 'object' ? JSON.stringify(ex.input) : ex.input}</span></div>
                      <div className="font-mono text-sm mb-2"><span className="text-slate-500 select-none">Output: </span> <span className="text-indigo-400">{typeof ex.output === 'object' ? JSON.stringify(ex.output) : ex.output}</span></div>
                      {ex.explanation && (
                        <div className="text-sm text-slate-400 mt-2 border-t border-slate-800 pt-2">
                          {typeof ex.explanation === 'object' ? JSON.stringify(ex.explanation) : ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
