"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import UpgradeModal from "@/components/UpgradeModal";

export default function MockInterviewsPage() {
  const [isActive, setIsActive] = useState(false);
  const [role, setRole] = useState("Frontend Developer");
  const [experienceLevel, setExperienceLevel] = useState("Junior (1-3)");
  const [technologies, setTechnologies] = useState("");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [duration, setDuration] = useState("20 min");
  
  const [code, setCode] = useState("// Write your code here\n");
  const [language, setLanguage] = useState("javascript");
  
  // Dynamic Configs from Firebase
  const [config, setConfig] = useState({
    roles: ["Frontend Developer", "Backend Developer", "Flutter Developer", "Full Stack Developer", "Data Analyst", "DevOps Engineer", "QA Engineer"],
    experienceLevels: ["Fresher (0-1)", "Junior (1-3)", "Mid-Level (3-5)", "Senior (5-8)", "Lead (8+)"],
    interviewTypes: ["Technical", "HR", "System Design", "Behavioral", "Mixed"],
    difficulties: ["Beginner", "Intermediate", "Advanced"],
    durations: ["10 min", "20 min", "30 min", "60 min"],
    languages: [
      { id: "javascript", name: "JavaScript / TypeScript" },
      { id: "python", name: "Python" },
      { id: "java", name: "Java" },
      { id: "csharp", name: "C#" },
      { id: "cpp", name: "C++" },
      { id: "go", name: "Go" },
      { id: "rust", name: "Rust" },
      { id: "swift", name: "Swift" },
      { id: "kotlin", name: "Kotlin" },
      { id: "dart", name: "Dart" },
      { id: "php", name: "PHP" },
      { id: "ruby", name: "Ruby" },
      { id: "sql", name: "SQL" }
    ]
  });
  const [configLoading, setConfigLoading] = useState(true);

  const [messages, setMessages] = useState<{role: string, content: string, isHidden?: boolean}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [isStarting, setStarting] = useState(false);
  
  const { user } = useAuth();


  // Load configuration from Firestore
  useEffect(() => {
    const configRef = doc(db, 'system', 'interview_config');
    
    // Attempt to set defaults if missing
    getDoc(configRef).then(snap => {
      if (!snap.exists()) {
        setDoc(configRef, config).catch(e => console.error("Failed to seed config", e));
      }
    });

    // Listen for live config changes
    const unsub = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(prev => ({ ...prev, ...data }));
        
        // Ensure initial selections are valid
        if (data.roles?.length && !data.roles.includes(role)) setRole(data.roles[0]);
        if (data.experienceLevels?.length && !data.experienceLevels.includes(experienceLevel)) setExperienceLevel(data.experienceLevels[0]);
        if (data.interviewTypes?.length && !data.interviewTypes.includes(interviewType)) setInterviewType(data.interviewTypes[0]);
        if (data.difficulties?.length && !data.difficulties.includes(difficulty)) setDifficulty(data.difficulties[0]);
        if (data.durations?.length && !data.durations.includes(duration)) setDuration(data.durations[0]);
      }
      setConfigLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    if (!user) return;
    setStarting(true);
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(docRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const interviewsCount = data.interviewsCompleted || 0;
        
        const pricingDoc = await getDoc(doc(db, 'system', 'pricing'));
        let interviewLimit = 2; // Hobbyist fallback
        if (pricingDoc.exists()) {
          const tiers = pricingDoc.data().tiers || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userTier = tiers.find((t: any) => t.id === (data.tierId || 'b1f81d1d-0e42-4f9e-9d22-1b1a78e1c613'));
          if (userTier && userTier.interviewCount !== undefined) {
            interviewLimit = userTier.interviewCount;
          }
        }

        if (interviewLimit !== -1 && interviewsCount >= interviewLimit) {
          setUpgradeMessage(`Your current plan allows a maximum of ${interviewLimit} mock interviews.`);
          setShowUpgradeModal(true);
          setStarting(false);
          return;
        }
        
        // Increment the count immediately upon starting
        await updateDoc(docRef, {
          interviewsCompleted: interviewsCount + 1
        });
      }
    } catch (e) {
      console.error("Failed to verify interview limit", e);
      setStarting(false);
      return;
    }

    setIsActive(true);
    setIsTimeUp(false);
    setStarting(false);
    const minutes = parseInt(duration.split(" ")[0]) || 20;
    setTimeLeft(minutes * 60);

    const initialMessage = { 
      role: 'user', 
      content: `Hello! I am ready to begin my mock ${interviewType} interview for the ${role} position (${difficulty} level, ${experienceLevel} experience). My key technologies are: ${technologies || language}. The duration is set to ${duration}.`,
      isHidden: true
    };
    setMessages([initialMessage]);
    askAI([initialMessage]);
  };

  const askAI = async (newMessages: {role: string, content: string, isHidden?: boolean}[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          role, 
          difficulty, 
          language, 
          experienceLevel, 
          technologies, 
          interviewType, 
          duration 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.text) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      let responseText = data.text;
      
      if (responseText.includes("[INTERVIEW_CONCLUDED]")) {
        responseText = responseText.replace("[INTERVIEW_CONCLUDED]", "").trim();
        setIsTimeUp(true);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error: " + (e.message || "Network issue") }]);
    }
    setIsLoading(false);
  };

  const submitCode = () => {
    if (!code.trim() || code === "// Write your code here\n" || isLoading || isTimeUp) return;
    
    const newMessages = [...messages, { 
      role: "user", 
      content: `I've submitted my code:\n\n\`\`\`${language}\n${code}\n\`\`\`` 
    }];
    setMessages(newMessages);
    setCode("// Write your code here\n"); // Clear the editor
    askAI(newMessages);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isTimeUp) return;
    
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    askAI(newMessages);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && !isTimeUp) {
      intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setIsTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (isTimeUp && isActive) {
      const timeUpMessage = { 
        role: "user", 
        content: "System Message: The interview time has expired. Please immediately conclude the interview and provide my final feedback summary. Do not ask any more questions.",
        isHidden: true 
      };
      setMessages(prev => {
        const newMessages = [...prev, timeUpMessage];
        askAI(newMessages);
        return newMessages;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp, isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isActive) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full">
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          title="Upgrade to Unlock"
          message={upgradeMessage} 
          onClose={() => setShowUpgradeModal(false)} 
        />
        <h1 className="text-3xl font-bold mb-2 text-slate-100">Mock Interviews</h1>
        <p className="text-slate-400 mb-8">Prepare for your next technical interview with our AI-powered mock interviewer.</p>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-200">Interview Settings</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Target Role</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={configLoading}
                >
                  {config.roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Experience Level</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition appearance-none"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  disabled={configLoading}
                >
                  {config.experienceLevels.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Technologies */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Key Technologies</label>
                <input 
                  type="text"
                  placeholder="e.g. Flutter, Dart, Firebase, REST API"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                />
              </div>

              {/* Interview Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Interview Type</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition appearance-none"
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  disabled={configLoading}
                >
                  {config.interviewTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Difficulty Level</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition appearance-none"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={configLoading}
                >
                  {config.difficulties.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Duration</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition appearance-none"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={configLoading}
                >
                  {config.durations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Programming Language Editor Syntax */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-300">Code Editor Syntax Highlighting</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={configLoading}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition appearance-none"
                >
                  {config.languages.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={handleStart}
                disabled={isStarting}
                className={`w-full py-4 bg-indigo-600 text-white rounded-lg font-bold text-lg transition shadow-lg shadow-indigo-600/20 ${isStarting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'}`}
              >
                {isStarting ? "Starting..." : "Start Mock Interview"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] m-4 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Code Editor Area */}
      <div className="w-1/2 border-r border-slate-800 flex flex-col">
        <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
          </div>
          <div className="flex gap-3 items-center">
            {isActive && (
              <div className={`px-3 py-1.5 rounded border text-sm font-mono font-bold ${
                timeLeft <= 60 
                  ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}>
                {isTimeUp ? "TIME UP" : formatTime(timeLeft)}
              </div>
            )}
            <select 
              className="bg-slate-800 text-sm px-3 py-1.5 rounded border border-slate-700 outline-none text-slate-300"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {config.languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setIsActive(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition text-sm font-medium"
            >
              End Interview
            </button>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'monospace',
              padding: { top: 16 }
            }}
          />
        </div>
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button 
            onClick={submitCode}
            disabled={isLoading || isTimeUp}
            className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg ${
              (isLoading || isTimeUp) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Submit Code
          </button>
        </div>
      </div>

      {/* AI Chat Area */}
      <div className="w-1/2 flex flex-col bg-slate-900/50">
        <div className="p-4 border-b border-slate-800 bg-slate-900 font-bold flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <span>👨‍💼</span> AI Interviewer
          </div>
          <div className="text-xs font-medium px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
            {role} • {difficulty}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {messages.filter(msg => !msg.isHidden).map((msg: any, idx: number) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isTimeUp}
              placeholder={isTimeUp ? "Time is up!" : "Type your answer..."}
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-500 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading || isTimeUp}
              className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg transition text-sm font-bold shadow-md shadow-indigo-600/20 ${
                (!input.trim() || isLoading || isTimeUp) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
