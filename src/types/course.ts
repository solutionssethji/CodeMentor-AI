export type Course = {
  id: string;
  slug: string;
  score?: number;
  title: string;
  description: string;
  language: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  emoji: string;
  syllabus: { id?: string; slug: string; week: number; title: string; topics: string[] }[];
  documents?: { title: string; type: string; size: string; icon: string; url?: string }[];
  videos?: { title: string; author: string; duration: string; color: string; icon: string; url: string }[];
};

export type UserCourseProgress = {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  completedWeeks: number[];
  completedTopics?: string[];
};

export type UserStats = {
  streak: number;
  xp: number;
  rank: number;
  lessonsCompleted: number;
};

export type UserData = {
  userCourses: UserCourseProgress[];
  isPremium?: boolean;
  tierId?: string;
  planExpiresAt?: string;
  challengesCompleted?: number;
  interviewsCompleted?: number;
  stats?: UserStats;
  lastActiveDate?: string;
  dailyChallenge?: {
    title: string;
    description: string;
    xpReward: number;
    isSolved?: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generatedChallenge?: any;
  lastSolvedChallengeDate?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
