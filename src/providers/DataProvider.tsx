"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Course, UserData } from '@/types/course';

interface DataContextType {
  globalCourses: Record<string, Course>;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  globalCourses: {},
  userData: null,
  loading: true,
  error: null,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [globalCourses, setGlobalCourses] = useState<Record<string, Course>>({});
  const [userData, setUserData] = useState<UserData | null>(null);
  const [defaultTierId, setDefaultTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Global Courses exactly once when the provider mounts
  useEffect(() => {
    let isMounted = true;
    const fetchGlobalCourses = async () => {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const coursesMap: Record<string, Course> = {};
        coursesSnap.forEach((doc) => {
          coursesMap[doc.id] = { id: doc.id, ...doc.data() } as Course;
        });
        if (isMounted) {
          setGlobalCourses(coursesMap);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Failed to fetch global courses:", err);
        if (isMounted) setError(err.message);
      }
    };
    const fetchSystemPricing = async () => {
      try {
        const docRef = doc(db, 'system', 'pricing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().tiers) {
          const tiers = docSnap.data().tiers;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const freeTier = tiers.find((t: any) => t.price === "₹0" || t.price === "$0");
          if (isMounted && freeTier) {
            setDefaultTierId(freeTier.id);
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Failed to fetch system pricing:", err);
      }
    };
    
    fetchGlobalCourses();
    fetchSystemPricing();
    
    return () => { isMounted = false; };
  }, []);

  // Listen to User Data
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserData(null);
       
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        
        // Ensure required arrays/objects exist to prevent crashes
        const parsedData: UserData = {
          ...rawData,
          userCourses: rawData.userCourses || [],
          stats: rawData.stats || { xp: 100, streak: 0, rank: 5000, lessonsCompleted: 0 },
          isPremium: rawData.isPremium ?? false,
          tierId: rawData.tierId || defaultTierId || '',
          challengesCompleted: rawData.challengesCompleted || 0,
          interviewsCompleted: rawData.interviewsCompleted || 0,
        };

        // Check if plan has expired
        if (parsedData.isPremium && parsedData.planExpiresAt) {
          const expiryDate = new Date(parsedData.planExpiresAt);
          if (new Date() > expiryDate && defaultTierId) {
            console.log("Plan expired! Resetting to free tier dynamically...");
            parsedData.isPremium = false;
            parsedData.tierId = defaultTierId;
            
            // Asynchronously update Firestore to downgrade the user permanently
            updateDoc(userRef, {
              isPremium: false,
              tierId: defaultTierId,
              planExpiresAt: null
            }).catch(e => console.error("Failed to downgrade user:", e));
          }
        }
        
        setUserData(parsedData);

        // Write any missing fields back to Firestore so Firebase stays in sync with the webapp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const missingFields: Record<string, any> = {};
        if (rawData.stats === undefined) missingFields.stats = { xp: 100, streak: 0, rank: 5000, lessonsCompleted: 0 };
        if (rawData.userCourses === undefined) missingFields.userCourses = [];
        if (rawData.isPremium === undefined) missingFields.isPremium = false;
        if (rawData.challengesCompleted === undefined) missingFields.challengesCompleted = 0;
        if (rawData.interviewsCompleted === undefined) missingFields.interviewsCompleted = 0;
        if (rawData.isDeleted === undefined) missingFields.isDeleted = false;
        if (rawData.deletedAt === undefined) missingFields.deletedAt = null;
        if (Object.keys(missingFields).length > 0) {
          updateDoc(userRef, missingFields).catch(e => console.error("Failed to sync missing fields to Firestore:", e));
        }
      } else {
        setUserData({ userCourses: [] });
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to listen to user data:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, defaultTierId]);

  // Consider it globally loading if auth is loading or data is still fetching and we have a user
  const isGlobalLoading = authLoading || (user !== null && loading);

  return (
    <DataContext.Provider value={{ globalCourses, userData, loading: isGlobalLoading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
