"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/providers/DataProvider";
import { useProfile } from "@/hooks/useProfile";
import { Camera, Trash2, Edit3, Save, X, AlertTriangle, User, Award } from "lucide-react";
import Image from "next/image";
import { doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user } = useAuth();
  const { userData } = useData();
  const { updateDisplayName, uploadProfilePicture, deleteProfilePicture, deleteAccount, loading, error } = useProfile();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const [tierName, setTierName] = useState<string>("Loading...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [calculatedStats, setCalculatedStats] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTierName() {
      if (!userData) return;
      try {
        const docRef = doc(db, 'system', 'pricing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().tiers) {
          const tiers = docSnap.data().tiers;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentTierId = userData.tierId?.toLowerCase() || tiers.find((t: any) => t.price === "₹0" || t.price === "$0")?.id?.toLowerCase();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const myTier = tiers.find((t: any) => t.id?.toLowerCase() === currentTierId);
          if (myTier) {
            setTierName(typeof myTier.title === 'object' ? (myTier.title.en || JSON.stringify(myTier.title)) : myTier.title);
          } else {
             setTierName(userData.isPremium ? 'Premium Plan' : 'Free Plan');
          }
        }
      } catch (e) {
        console.error("Failed to fetch tier info", e);
        setTierName(userData.isPremium ? 'Premium Plan' : 'Free Plan');
      }
    }
    fetchTierName();
  }, [userData]);

  useEffect(() => {
    if (!user || !userData) return;

    const calculateDynamicStats = async () => {
      let totalLessonsCompleted = 0;
      const seenCourses = new Set<string>();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userData.userCourses.forEach((c: any) => {
        if (!seenCourses.has(c.id)) {
          seenCourses.add(c.id);
          totalLessonsCompleted += c.status==='COMPLETED' ? 1 : 0;
        }
      });
      
      const totalXP = userData.stats?.xp || 100;
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

      const finalStats = {
        ...userData.stats,
        xp: totalXP,
        rank: calculatedRank,
        streak: currentStreak,
        lessonsCompleted: totalLessonsCompleted
      };

      setCalculatedStats(finalStats);

      if (needsDatabaseUpdate) {
        setDoc(doc(db, 'users', user.uid), { 
          stats: finalStats,
          lastActiveDate: today 
        }, { merge: true }).catch(console.error);
      }
    };

    calculateDynamicStats();
  }, [userData, user]);

  if (!user || !userData || !calculatedStats) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const dbName = userData.displayName || (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : null);
  const avatarUrl = userData.photoURL !== undefined ? userData.photoURL : user.photoURL;

  const handleEditNameClick = () => {
    let first = userData.firstName || "";
    let last = userData.lastName || "";
    if (!first && user.displayName) {
      const parts = user.displayName.split(" ");
      first = parts[0] || "";
      last = parts.slice(1).join(" ") || "";
    }
    setNewFirstName(first);
    setNewLastName(last);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newFirstName.trim()) return;
    try {
      await updateDisplayName(newFirstName.trim(), newLastName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadProfilePicture(file);
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
    }
  };

  const handleDeletePicture = async () => {
    try {
      await deleteProfilePicture();
      setShowDeleteAvatarConfirm(false);
    } catch (err) {
      console.error("Failed to delete picture:", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      setShowDeleteConfirm(false);
      // auth/requires-recent-login is handled inside deleteAccount (signs user out → redirects to login)
      if (err.code !== "auth/requires-recent-login" && !err.message?.includes("recent-login")) {
        alert(err.message || "Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12 mb-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden relative">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-500" />
                )}
                                {/* Image Overlay */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white transition-colors disabled:opacity-50"
                    title="Upload new picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  {avatarUrl && (
                    <button 
                      onClick={() => setShowDeleteAvatarConfirm(true)}
                      disabled={loading}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50"
                      title="Remove picture"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                {isEditingName ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input 
                      type="text" 
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="First Name"
                      className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-lg font-bold w-full sm:w-32"
                      autoFocus
                    />
                    <input 
                      type="text" 
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Last Name"
                      className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-lg font-bold w-full sm:w-32"
                    />
                    <div className="flex items-center">
                      <button 
                        onClick={handleSaveName}
                        disabled={loading}
                        className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setIsEditingName(false)}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:bg-slate-800 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-100">
                      {dbName || user.displayName || "Anonymous User"}
                    </h2>
                    <button 
                      onClick={handleEditNameClick}
                      className="text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-400">{userData.email || user.email}</p>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/20">
              <Award className="w-4 h-4" />
              <span className="font-semibold">{tierName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-orange-400 flex items-center gap-2">🔥 {calculatedStats.streak} Days</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Total XP</p>
          <p className="text-3xl font-bold text-indigo-400">{calculatedStats.xp.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Global Rank</p>
          <p className="text-3xl font-bold text-cyan-400">#{calculatedStats.rank.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
          <p className="text-slate-400 text-sm mb-1">Lessons Completed</p>
          <p className="text-3xl font-bold text-emerald-400">{calculatedStats.lessonsCompleted}</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-100">Danger Zone</h3>
            <p className="text-slate-400 mt-1 mb-6 max-w-xl">
              Permanently delete your account and all associated data. This action cannot be undone. 
              You will lose access to all your courses, progress, and AI workspace history.
            </p>
            
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-medium transition-all duration-200 border border-red-500/20 hover:border-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

      {/* Delete Avatar Confirmation Modal */}
      {showDeleteAvatarConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Delete Profile Picture</h3>
            <p className="text-slate-400 mb-6">Are you sure you want to remove your profile picture?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteAvatarConfirm(false)}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePicture}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/20 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Delete Account</h3>
                <p className="text-slate-400">Are you sure you want to delete your account? You will be logged out immediately.</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
