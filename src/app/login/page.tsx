"use client";
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Clock, AlertTriangle } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [techStack, setTechStack] = useState('JavaScript');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deletedAccountInfo, setDeletedAccountInfo] = useState<{ deletedAt: string } | null>(null);
  const router = useRouter();

  // Handle redirect if passed
  const getRedirectPath = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('redirect') || '/dashboard';
    }
    return '/dashboard';
  };

  const getReadableError = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Check if account is soft-deleted
        const userSnap = await getDoc(doc(db, 'users', credential.user.uid));
        if (userSnap.exists() && userSnap.data().isDeleted === true) {
          // Sign them back out immediately — show deletion notice
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          setDeletedAccountInfo({ deletedAt: userSnap.data().deletedAt });
          setLoading(false);
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: `${firstName} ${lastName}`.trim()
          });
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName,
            lastName,
            email,
            techStack,
            experienceLevel,
            preferredModel: 'chatgpt',
            isPremium: false,
            tierId: 'b1f81d1d-0e42-4f9e-9d22-1b1a78e1c613',
            challengesCompleted: 0,
            interviewsCompleted: 0,
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date().toISOString()
          });
        }
      }
      router.push(getRedirectPath());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(getReadableError(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!deletedAccountInfo) return;
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await updateDoc(doc(db, 'users', credential.user.uid), {
        isDeleted: false,
        deletedAt: null,
      });
      setDeletedAccountInfo(null);
      router.push('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(getReadableError(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setResettingPassword(true);
    
    try {
      // Check if the user actually exists before sending the email
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        setError('No account is registered with this email address.');
        setResettingPassword(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(getReadableError(err.code || ''));
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">

      {/* Deleted account notice screen */}
      {deletedAccountInfo ? (
        <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Account Scheduled for Deletion</h1>
              <p className="text-slate-400 text-sm">Your account is pending permanent deletion</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Clock className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Deletion requested on: <span className="text-white font-medium">{new Date(deletedAccountInfo.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Permanent deletion on: <span className="text-red-400 font-medium">{new Date(new Date(deletedAccountInfo.deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-6">
            Your account and all data will be <strong className="text-red-400">permanently deleted in 30 days</strong>. 
            If you changed your mind, you can cancel the deletion and restore full access immediately.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCancelDeletion}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Restoring...' : '✓ Cancel Deletion & Restore My Account'}
            </button>
            <button
              onClick={() => setDeletedAccountInfo(null)}
              disabled={loading}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
            >
              Go Back to Login
            </button>
          </div>
        </div>
      ) : (

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="flex justify-center items-center gap-3 text-3xl font-bold text-slate-100 mb-2">
            <img src="/logo.png" alt="CodeMentorAI Logo" className="h-10 w-auto" />
            CodeMentor AI
          </h1>
          <p className="text-slate-400">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to track your progress.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-3 rounded-lg text-sm mb-6">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition"
                  placeholder="John"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition"
              placeholder="developer@example.com"
            />
          </div>

          {!isLogin && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Tech Stack</label>
                <select
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition"
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="C">C</option>
                  <option value="C#">C#</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="Ruby">Ruby</option>
                  <option value="PHP">PHP</option>
                  <option value="Swift">Swift</option>
                  <option value="Kotlin">Kotlin</option>
                  <option value="Dart">Dart</option>
                  <option value="Flutter">Flutter</option>
                  <option value="React">React</option>
                  <option value="Angular">Angular</option>
                  <option value="Vue">Vue</option>
                  <option value="Node.js">Node.js</option>
                  <option value="Django">Django</option>
                  <option value="Spring Boot">Spring Boot</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  {resettingPassword ? 'Sending...' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-indigo-600 text-white rounded-lg font-bold transition shadow-lg ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
      )}

      {/* Global Footer */}
      <div className="mt-auto pt-8 w-full text-center">
        <div className="mb-4 text-sm">
          <Link href="/privacy" className="text-slate-500 hover:text-indigo-400 transition mx-3">Privacy Policy</Link>
          <span className="text-slate-700">|</span>
          <Link href="/terms" className="text-slate-500 hover:text-indigo-400 transition mx-3">Terms & Conditions</Link>
        </div>
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Secured by{" "}
          <a href="https://sethji-solutions.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition">
            Sethji Solutions Private Limited
          </a>
          . All rights reserved.
        </p>
      </div>
    </div>
  );
}
