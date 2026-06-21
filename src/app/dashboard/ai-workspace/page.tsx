"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const defaultSnippets: Record<string, string> = {
  javascript: "function reverseList(head) {\n  let prev = null;\n  let current = head;\n  while (current !== null) {\n    let next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  return prev;\n}",
  python: "def reverse_list(head):\n    prev = None\n    current = head\n    while current:\n        next_node = current.next\n        current.next = prev\n        prev = current\n        current = next_node\n    return prev",
  typescript: "function reverseList<T>(head: ListNode<T> | null): ListNode<T> | null {\n  let prev = null;\n  let current = head;\n  while (current !== null) {\n    let next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  return prev;\n}",
  java: "public class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null;\n        ListNode current = head;\n        while (current != null) {\n            ListNode nextTemp = current.next;\n            current.next = prev;\n            prev = current;\n            current = nextTemp;\n        }\n        return prev;\n    }\n}",
  cpp: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* current = head;\n        while (current != nullptr) {\n            ListNode* nextTemp = current->next;\n            current->next = prev;\n            prev = current;\n            current = nextTemp;\n        }\n        return prev;\n    }\n};",
  dart: "class Solution {\n  ListNode? reverseList(ListNode? head) {\n    ListNode? prev = null;\n    ListNode? current = head;\n    while (current != null) {\n      ListNode? nextTemp = current.next;\n      current.next = prev;\n      prev = current;\n      current = nextTemp;\n    }\n    return prev;\n  }\n}",
};

export default function AIWorkspace() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultSnippets["javascript"]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([
    { id: "1", role: "assistant", content: "Hi! I'm your AI tutor. Paste some code in the editor, and ask me to explain, optimize, or debug it!" }
  ]);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleSolveComplete = async () => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'users', user.uid);
      
      const userSnap = await getDoc(docRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Prevent farming XP by clicking multiple times
        if (data.lastSolvedChallengeDate !== today) {
          const currentStats = data.stats || { xp: 100, streak: 0, rank: 5000, lessonsCompleted: 0 };
          const newXp = (currentStats.xp || 100) + 500;
          const newChallengesCompleted = (data.challengesCompleted || 0) + 1;
          
          await updateDoc(docRef, {
            lastSolvedChallengeDate: today,
            'stats.xp': newXp,
            challengesCompleted: newChallengesCompleted
          });
        } else {
          // Just update the date if it's somehow missing, but don't give XP again
          await updateDoc(docRef, {
            lastSolvedChallengeDate: today
          });
        }
      }
      router.push('/dashboard/challenges?success=true');
    }
  };

  useEffect(() => {
    async function fetchSession() {
      if (authLoading || !user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().workspaceSession) {
          const session = docSnap.data().workspaceSession;
          if (session.language) {
            setLanguage(session.language);
          }
          if (session.code) {
            setCode(session.code);
          }
          if (session.title) {
            setMessages([{ 
              id: "1", 
              role: "assistant", 
              content: `Welcome to the scenario: **${session.title}**!\n\nI'm ready to help you solve it. You can ask for a hint, or write your code and click "Evaluate Code" to submit it!` 
            }]);
          }
          
          // Clear session after loading to prevent reopening it next time they navigate here manually
          await updateDoc(docRef, { workspaceSession: null });
        }
      } catch (e) {
        console.error("Failed to load workspace session from Firestore", e);
      }
    }
    fetchSession();
  }, [user, authLoading]);

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const text = overrideInput || input;
    if (!text.trim() || isLoading) return;
    
    if (!overrideInput) setInput("");
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user', content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          code,
          language
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      
      if (data.isSolved) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: `🎉 **Congratulations!** Your solution is completely correct!\n\nAwarding 500 XP and redirecting...` }]);
        setTimeout(() => {
          handleSolveComplete();
        }, 2500);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <div className="flex items-center gap-4">
            <select 
              className="bg-slate-800 text-sm px-2 py-1 rounded border border-slate-700 outline-none text-white"
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (defaultSnippets[newLang]) {
                  setCode(defaultSnippets[newLang]);
                } else {
                  setCode("// Write your code here");
                }
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="csharp">C#</option>
              <option value="ruby">Ruby</option>
              <option value="php">PHP</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
              <option value="dart">Dart</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
              <option value="yaml">YAML</option>
              <option value="xml">XML</option>
              <option value="markdown">Markdown</option>
            </select>
            <button 
              onClick={() => {
                const evalInput = "Please evaluate the current code I have written in the editor. Is it correct? How can I improve it?";
                handleSend(undefined, evalInput);
              }}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-1 rounded shadow transition font-medium"
            >
              {isLoading ? 'Evaluating...' : 'Evaluate Code'}
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
      </div>

      {/* AI Chat Area */}
      <div className="w-1/2 flex flex-col bg-slate-900/50 relative">
        <div className="p-4 border-b border-slate-800 bg-slate-900 font-bold flex items-center gap-2">
          <span>🤖</span> AI Assistant
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-4 text-sm shadow-md overflow-hidden ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                {msg.role === 'user' ? (
                  <div className="break-words">{msg.content}</div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-xl p-3 text-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI a question about your code..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500 transition text-white"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition text-sm font-bold"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
