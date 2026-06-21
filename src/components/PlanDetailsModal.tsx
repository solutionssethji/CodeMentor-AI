import React from 'react';
import Link from 'next/link';

interface PlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tierInfo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
}

export default function PlanDetailsModal({ isOpen, onClose, tierInfo, userData }: PlanDetailsModalProps) {
  if (!isOpen || !tierInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Plan Details</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
              ✕
            </button>
          </div>
          
          <div className="mb-6 pb-6 border-b border-slate-800">
            <h4 className="text-lg font-bold text-white mb-1">{typeof tierInfo.title === 'object' ? JSON.stringify(tierInfo.title) : tierInfo.title}</h4>
            <p className="text-slate-400 text-sm mb-3">{tierInfo.price === "₹0" || tierInfo.price === "$0" ? "Free Plan" : `${typeof tierInfo.price === 'object' ? JSON.stringify(tierInfo.price) : tierInfo.price}/mo`}</p>
            
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                <p className={`text-sm font-bold ${userData?.isPremium ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {userData?.isPremium ? 'ACTIVE' : 'DEFAULT'}
                </p>
              </div>
              {userData?.planExpiresAt && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Expires On</p>
                  <p className="text-sm font-bold text-slate-300">
                    {new Date(userData.planExpiresAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span> {tierInfo.courseCount === -1 ? 'Unlimited Courses' : `Max ${tierInfo.courseCount} Courses`}
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span> {tierInfo.challengeCount === -1 ? 'Unlimited AI Challenges' : `Max ${tierInfo.challengeCount} AI Challenges`}
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span> {tierInfo.interviewCount === -1 ? 'Unlimited Mock Interviews' : `Max ${tierInfo.interviewCount} Mock Interviews`}
            </li>
            {tierInfo.features && tierInfo.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-emerald-400 font-bold">✓</span> {feature}
              </li>
            ))}
          </ul>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold transition bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </button>
            <Link 
              href="/pricing"
              className="flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
            >
              All Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
