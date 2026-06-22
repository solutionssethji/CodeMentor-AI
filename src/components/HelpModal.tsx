"use client";
import { useState } from "react";
import { X, Send, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setStatus("error");
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (!user) {
      setStatus("error");
      setErrorMessage("You must be logged in to send a message");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      // Generate UUID
      const uuid = crypto.randomUUID();
      setTicketId(uuid);

      // Save to Firebase with UUID as document ID
      await setDoc(doc(db, "help_messages", uuid), {
        ticketId: uuid,
        userId: user.uid,
        userEmail: user.email,
        subject: subject.trim(),
        message: message.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus("success");
      setSubject("");
      setMessage("");

      // Auto close after 4 seconds
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setTicketId("");
        setCopied(false);
      }, 4000);
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("error");
      setErrorMessage(
        "Failed to send message. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyTicketId = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Send us a Message</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
        {status === "success" && (
            <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-300 font-semibold">Message Sent!</p>
                <p className="text-green-200 text-sm">
                  Our support team will get back to you soon.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Bug Report, Feature Request"
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or request..."
                disabled={loading}
                rows={5}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
              />
            </div>

            {/* Email Display */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
