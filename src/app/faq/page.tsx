"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowLeft } from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "How do I start a new course?",
    answer:
      "To start a new course, navigate to the Courses section from your dashboard. Browse available courses and click the 'Start' button. You can track your progress and resume from where you left off anytime.",
  },
  {
    id: 2,
    question: "What are XP points and how do I earn them?",
    answer:
      "XP (Experience Points) are earned by completing lessons, challenges, and daily tasks. Each activity has a different XP value. As you accumulate XP, you level up and unlock new features and courses.",
  },
  {
    id: 3,
    question: "How does the streak system work?",
    answer:
      "A streak represents consecutive days of learning. Each day you complete at least one lesson or challenge, your streak increases by 1. Missing a day resets your streak. Maintaining streaks helps keep you motivated and engaged!",
  },
  {
    id: 4,
    question: "Can I download my certificates?",
    answer:
      "Yes! Once you complete a course, a certificate is automatically generated and becomes available in your profile. You can download it as a PDF and share it with others.",
  },
  {
    id: 5,
    question: "How does the interview preparation work?",
    answer:
      "The interview section provides real-world coding problems and interview questions. You can practice solving problems, get instant feedback, and track your performance to identify areas for improvement.",
  },
  {
    id: 6,
    question: "What are challenges and how do I participate?",
    answer:
      "Challenges are time-limited coding problems that test your skills. You can participate in daily challenges to earn bonus XP and compete with other users. Each challenge has a difficulty level and specific requirements.",
  },
  {
    id: 7,
    question: "What are the available pricing plans?",
    answer:
      "We offer flexible pricing plans to suit different needs. Visit our pricing page to see detailed information about each plan, including features, duration, and pricing. You can upgrade anytime from your dashboard.",
  },
  {
    id: 8,
    question: "Is there a free trial available?",
    answer:
      "Yes! New users get access to a free trial with limited features. This allows you to explore the platform and try out basic courses before deciding to upgrade to a premium plan.",
  },
  {
    id: 9,
    question: "How do I reset my password?",
    answer:
      "On the login page, click 'Forgot Password' and enter your email. You'll receive an email with instructions to reset your password. Follow the link to create a new password.",
  },
  {
    id: 10,
    question: "Can I delete my account?",
    answer:
      "Yes, you can delete your account from the Profile settings. Please note that this action is permanent and will delete all your progress and data. Contact support if you need any assistance.",
  },
];

export default function PublicFAQPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-slate-300">
            Find answers to common questions about CodeMentorAI
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors"
            >
              <button
                onClick={() => toggleExpand(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <span className="font-semibold text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-indigo-400 flex-shrink-0 transition-transform ${
                    expandedId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedId === faq.id && (
                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700 text-slate-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-indigo-900/20 to-cyan-900/20 border border-indigo-700/50 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-2">
            Need More Help?
          </h3>
          <p className="text-slate-300 mb-4">
            If you didn't find the answer you're looking for, please log in to your account and use the Help feature in your dashboard to contact our support team.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Log In to Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
