import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const userId = "test_user"; // Hardcoded for now until authentication is added
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    let userData;

    if (userSnap.exists()) {
      userData = userSnap.data();
    } else {
      // Create initial user document if it doesn't exist
      userData = {
        stats: {
          streak: 0,
          xp: 100,
          rank: 5000,
          lessonsCompleted: 0
        },
        activeCourses: [
          {
            id: 1,
            title: "Welcome to CodeMentor AI",
            chapter: "Introduction to AI Interviews",
            progress: 10,
            color: "bg-indigo-500"
          }
        ],
        dailyChallenge: {
          title: "Setup Firebase Database",
          description: "Successfully connect your Next.js application to a real Firebase Firestore database.",
          xpReward: 500
        }
      };
      await setDoc(userRef, userData);
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Firebase fetch error:", error);
    return NextResponse.json({ error: "Failed to load database" }, { status: 500 });
  }
}
