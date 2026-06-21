import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export default function MessageModal({ isOpen, onClose, title, message, type = 'info' }: MessageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            type === 'success' ? 'bg-emerald-500/10' : 
            type === 'error' ? 'bg-red-500/10' : 
            'bg-indigo-500/10'
          }`}>
            {type === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : type === 'error' ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-400 mb-8">{message}</p>
          
          <button 
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition ${
              type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 
              type === 'error' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 
              'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
