"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageSquare } from "lucide-react";
import HelpModal from "@/components/HelpModal";

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
    question: "How do I upgrade my account?",
    answer:
      "Visit the Billing section in your dashboard to view available plans. You can upgrade to premium to unlock advanced features, more courses, and priority support.",
  },
  {
    id: 8,
    question: "How can I track my learning progress?",
    answer:
      "Your dashboard shows comprehensive statistics including your rank, total XP, current streak, and courses completed. You can also view detailed progress for each course in the Courses section.",
  },
  {
    id: 9,
    question: "Is there a mobile app available?",
    answer:
      "Currently, our platform is web-based and optimized for both desktop and mobile browsers. A dedicated mobile app is in development and will be available soon.",
  },
  {
    id: 10,
    question: "How do I contact support?",
    answer:
      "You can reach out to our support team using the Help feature available throughout the platform. We typically respond within 24 hours. For urgent issues, please use the priority support option.",
  },
];

export default function HelpPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Help & Support</h1>
          <p className="text-slate-300">
            Find answers to common questions or reach out to our support team
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Help Button */}
        <div className="mb-12 flex flex-wrap gap-3">
          <button
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
          >
            <MessageSquare size={20} />
            Send us a Message
          </button>
          <Link
            href="/dashboard/ai-workspace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-all"
          >
            Open Chat
          </Link>
        </div>

        {/* FAQs Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>

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
        </div>

        {/* Contact Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-indigo-900/20 to-cyan-900/20 border border-indigo-700/50 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-2">
            Didn't find what you're looking for?
          </h3>
          <p className="text-slate-300 mb-4">
            Our support team is here to help. Send us a message and we'll get
            back to you as soon as possible.
          </p>
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}
