"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, updateDoc, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Script from "next/script";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import MessageModal from "@/components/MessageModal";

export default function PricingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'success'|'error'|'info'}>({isOpen: false, title: '', message: '', type: 'info'});
  const [onModalClose, setOnModalClose] = useState<(() => void) | null>(null);
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid))
        .then((snap) => {
          if (snap.exists()) {
            setUserData(snap.data());
          }
        })
        .catch((e) => {
          // Ignore missing permissions if user data isn't accessible
          console.warn("Could not fetch user data:", e.message);
        });
    }
  }, [user]);

  const currentTierId = userData?.tierId?.toLowerCase() || tiers.find(t => t.price === "₹0" || t.price === "$0")?.id?.toLowerCase();
  const currentTier = tiers.find(t => t.id?.toLowerCase() === currentTierId);
  const currentNumericPrice = currentTier ? parseInt(currentTier.price.replace(/[^0-9]/g, ''), 10) || 0 : 0;

  const showModal = (title: string, message: string, type: 'success'|'error'|'info', onClose?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type });
    setOnModalClose(() => onClose || null);
  };

  const handleModalClose = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    if (onModalClose) onModalClose();
  };

  useEffect(() => {
    async function fetchPricing() {
      try {
        const docRef = doc(db, 'system', 'pricing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().tiers) {
          setTiers(docSnap.data().tiers);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        // Suppress the giant red Firebase error in the console by logging it as a gentle warning
        console.warn("Using fallback pricing tiers (Firestore access denied for guests):", e.message);
        setTiers([
          {
            id: "b1f81d1d-0e42-4f9e-9d22-1b1a78e1c613",
            slug: "hobbyist",
            title: "Hobbyist",
            price: "₹0",
            courseCount: 2,
            challengeCount: 2,
            interviewCount: 2,
            features: ["Community Access"],
            isPopular: false
          },
          {
            id: "4a2e8c25-f8c5-4d7a-a634-1c9f8a37b12d",
            slug: "pro",
            title: "Pro (Career Builder)",
            price: "₹1499",
            courseCount: -1,
            challengeCount: -1,
            interviewCount: 5,
            features: ["Priority Support"],
            isPopular: true
          },
          {
            id: "7f8b9d3e-1e5c-4a2f-9c8b-6f4a7d1e8c2b",
            slug: "elite",
            title: "Elite",
            price: "₹3999",
            courseCount: -1,
            challengeCount: -1,
            interviewCount: -1,
            features: ["AI Resume Reviews", "Beta AI Model Access"],
            isPopular: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
  }, []);

  const handleUpgrade = async (tierId: string, priceString: string) => {
    if (!user) {
      showModal("Login Required", "Please log in to upgrade your plan.", "info", () => router.push("/login"));
      return;
    }

    // Extract numeric price from string like "₹1499"
    const numericPrice = parseInt(priceString.replace(/[^0-9]/g, ''), 10);
    
    if (isNaN(numericPrice) || numericPrice === 0) {
      showModal("Invalid Plan", "This plan is free or invalid.", "error");
      return;
    }

    setProcessingId(tierId);
    try {
      // 1. Create order
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericPrice }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: orderData.amount, // Amount is in currency subunits. Default currency is INR.
        currency: orderData.currency,
        name: "CodeMentor AI",
        description: "Upgrade Plan",
        order_id: orderData.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            // 3. Verify payment on server
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              // 4. Update Firestore user document
              await updateDoc(doc(db, 'users', user.uid), {
                isPremium: true,
                tierId: tierId,
                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              });
              
              // 5. Store payment record
              const purchasedTier = tiers.find(t => t.id === tierId);
              const paymentRef = doc(collection(db, 'payments'));
              await setDoc(paymentRef, {
                uuid: paymentRef.id,
                userId: user.uid,
                userEmail: user.email || '',
                tierId: tierId,
                tierName: purchasedTier?.title || "Premium Plan",
                amount: numericPrice,
                currency: orderData.currency || 'INR',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                status: 'SUCCESS',
                createdAt: new Date().toISOString()
              });
              showModal("Payment Successful!", "Your plan has been upgraded.", "success", () => router.push('/dashboard'));
            } else {
              showModal("Verification Failed", "Payment verification failed. Please contact support.", "error");
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            console.error("Verification error:", err);
            showModal("Error", "Payment verification error.", "error");
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#4f46e5" // indigo-600
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp1 = new (window as any).Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp1.on('payment.failed', function (response: any) {
        showModal("Payment Failed", response.error.description || "The transaction failed.", "error");
      });
      rzp1.open();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      showModal("Error", "Error initiating payment.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <Link href="/" className="text-sm hover:text-cyan-400 transition inline-block mb-10">← Back to Home</Link>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Simple, transparent pricing</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">
          Whether you&apos;re a hobbyist or preparing for FAANG interviews, we have a plan for you.
        </p>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {tiers.map((tier, i) => {
              const tierNumericPrice = parseInt(tier.price.replace(/[^0-9]/g, ''), 10) || 0;
              
              // If user is not logged in, they have no current plan and nothing is disabled.
              const isCurrentPlan = user ? (currentTierId === tier.id?.toLowerCase()) : false;
              const isDisabled = user ? (tierNumericPrice <= currentNumericPrice) : false;
              
              return (
                <PricingCard 
                  key={tier.id || i}
                  title={tier.title} 
                  price={tier.price} 
                  isPopular={tier.isPopular}
                  features={tier.features}
                  courseCount={tier.courseCount}
                  challengeCount={tier.challengeCount}
                  interviewCount={tier.interviewCount}
                  isProcessing={processingId === tier.id}
                  isCurrentPlan={isCurrentPlan}
                  isDisabled={isDisabled}
                  onSelect={() => handleUpgrade(tier.id, tier.price)}
                />
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PricingCard({ title, price, features, isPopular = false, courseCount, challengeCount, interviewCount, isProcessing, isCurrentPlan, isDisabled, onSelect }: any) {
  const dynamicFeatures = [];
  if (courseCount !== undefined) {
    dynamicFeatures.push(courseCount === -1 ? "Unlimited Courses" : `Max ${courseCount} Courses`);
  }
  if (challengeCount !== undefined) {
    dynamicFeatures.push(challengeCount === -1 ? "Unlimited AI Challenges" : `Max ${challengeCount} AI Challenges`);
  }
  if (interviewCount !== undefined) {
    dynamicFeatures.push(interviewCount === -1 ? "Unlimited Mock Interviews" : `Max ${interviewCount} Mock Interviews`);
  }
  
  const allFeatures = [...dynamicFeatures, ...(features || [])];

  return (
    <div className={`bg-slate-900 border rounded-2xl p-8 relative flex flex-col ${isPopular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'border-slate-800'}`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-bold tracking-wide">
          MOST POPULAR
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{typeof title === 'object' ? JSON.stringify(title) : title}</h3>
      <div className="text-4xl font-extrabold mb-6">
        {typeof price === 'object' ? JSON.stringify(price) : price}
        {price !== "₹0" && price !== "$0" && <span className="text-lg text-slate-400 font-normal">/mo</span>}
      </div>
      
      <ul className="space-y-4 mb-8 flex-1">
        {allFeatures.map((feature, i) => {
          if (typeof feature !== 'string') return null;
          return (
            <li key={i} className="flex items-center gap-3 text-slate-300">
              <span className="text-emerald-400">✓</span> {feature}
            </li>
          );
        })}
      </ul>
      
      <button 
        onClick={onSelect}
        disabled={isProcessing || isDisabled}
        className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
          isCurrentPlan 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default' 
            : isDisabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isPopular 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-slate-800 hover:bg-slate-700 text-white'
        }`}
      >
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : isDisabled ? (
          'Unavailable'
        ) : (
          'Get Started'
        )}
      </button>
    </div>
  );
}
