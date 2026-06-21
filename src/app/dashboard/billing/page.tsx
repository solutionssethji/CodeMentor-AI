"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, collection, query, getDocs, where, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useData } from "@/providers/DataProvider";
import Link from "next/link";

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  tierName: string;
  status: string;
  createdAt: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const { userData } = useData();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tierInfo, setTierInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTierInfo() {
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
          setTierInfo(myTier);
        }
      } catch (e) {
        console.error("Failed to fetch tier info", e);
      }
    }
    fetchTierInfo();
  }, [userData]);

  useEffect(() => {
    async function fetchPayments() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'payments'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedPayments: PaymentRecord[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPayments.push({ id: doc.id, ...doc.data() } as PaymentRecord);
        });
        
        // Sort in memory to avoid requiring a composite index in Firestore
        fetchedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setPayments(fetchedPayments);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [user]);

  const handleRecoverReceipt = async () => {
    if (!user || !userData) return;
    try {
      setLoading(true);
      const purchasedTier = tierInfo || { title: 'Premium Plan', price: '₹1499' };
      const amount = purchasedTier.price === "₹0" || purchasedTier.price === "$0" ? 0 : parseInt(purchasedTier.price.replace(/[^0-9]/g, ''), 10) || 0;
      
      const paymentRef = doc(collection(db, 'payments'));
      await setDoc(paymentRef, {
        uuid: paymentRef.id,
        userId: user.uid,
        userEmail: user.email || '',
        tierId: userData.tierId || '',
        tierName: purchasedTier.title,
        amount: amount,
        currency: 'INR',
        razorpayOrderId: 'reco_legacy_order',
        razorpayPaymentId: 'reco_legacy_payment',
        status: 'SUCCESS',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      });
      window.location.reload();
    } catch (e) {
      console.error("Failed to recover receipt", e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      
      {/* Current Package Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Package Information</h2>
        {tierInfo ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{typeof tierInfo.title === 'object' ? JSON.stringify(tierInfo.title) : tierInfo.title}</h3>
                {tierInfo.price === "₹0" || tierInfo.price === "$0" ? (
                  <p className="text-slate-400">Free Plan</p>
                ) : (
                  <p className="text-slate-400">{typeof tierInfo.price === 'object' ? JSON.stringify(tierInfo.price) : tierInfo.price}/month</p>
                )}
              </div>
              
              <div className="flex flex-col md:items-end gap-3">
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold w-fit ${userData?.isPremium ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-300'}`}>
                  {userData?.isPremium ? 'ACTIVE SUBSCRIPTION' : 'DEFAULT PLAN'}
                </div>
                {userData?.planExpiresAt && (
                  <p className="text-sm text-slate-400 font-medium">
                    Expires on: <span className="text-slate-200">{new Date(userData.planExpiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Plan Features & Limits</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> {tierInfo.courseCount === -1 ? 'Unlimited Courses' : `Max ${tierInfo.courseCount} Courses`}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> {tierInfo.challengeCount === -1 ? 'Unlimited AI Challenges' : `Max ${tierInfo.challengeCount} AI Challenges`}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> {tierInfo.interviewCount === -1 ? 'Unlimited Mock Interviews' : `Max ${tierInfo.interviewCount} Mock Interviews`}
                </li>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {tierInfo.features && tierInfo.features.map((feature: any, i: number) => {
                  if (typeof feature !== 'string') return null;
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span> {feature}
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end">
              <Link href="/pricing" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-lg shadow-indigo-600/20">
                Upgrade / Change Plan
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-40 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
        )}
      </section>

      {/* Purchase History Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Purchase History</h2>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4 opacity-50 grayscale">🧾</div>
            <h3 className="text-xl font-bold text-white mb-2">No Purchase History</h3>
            <p className="text-slate-400 mb-6">You have not made any payments yet.</p>
            <div className="flex justify-center gap-4">
              <Link href="/pricing" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition inline-block">
                View Plans
              </Link>
              {userData?.isPremium && (
                <button onClick={handleRecoverReceipt} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition inline-block">
                  Recover Legacy Receipt
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">{payment.tierName}</td>
                    <td className="px-6 py-4">
                      {payment.currency === 'INR' ? '₹' : payment.currency === 'USD' ? '$' : payment.currency}
                      {payment.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        payment.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {payment.razorpayPaymentId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </section>
    </div>
  );
}
