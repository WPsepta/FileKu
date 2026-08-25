import React, { useEffect, useState } from 'react';
import { Check, Copy, Globe, Lock, Share2, Sparkles, X } from 'lucide-react';

interface CircularShareNotificationProps {
  isOpen: boolean;
  isPublic: boolean;
  shareUrl: string;
  onClose: () => void;
}

export const CircularShareNotification: React.FC<CircularShareNotificationProps> = ({
  isOpen,
  isPublic,
  shareUrl,
  onClose,
}) => {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setCopied(true);

      const startTime = Date.now();
      const duration = 2400;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(100, Math.round((elapsed / duration) * 100));
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 40);

      // Auto close after 2.8 seconds
      const timeout = setTimeout(() => {
        onClose();
      }, 2800);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // SVG Circular Progress calculation
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleCopyAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <aside
      aria-label="Notifikasi Berbagi Tautan"
      id="circularTopShareBar"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-[#060b19]/95 border border-cyan-400/50 rounded-full px-4 py-2 shadow-[0_0_35px_rgba(6,182,212,0.4)] backdrop-blur-xl flex items-center space-x-3 text-xs text-white rgb-moving-border">
        
        {/* Sleek Top Circular Progress Ring */}
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            {/* Background Circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Gradient Circular Progress Stroke */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="url(#topShareGradient)"
              fill="transparent"
              className="transition-all duration-75 ease-out"
            />
            <defs>
              <linearGradient id="topShareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Checkmark / Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {progress >= 100 ? (
              <Check className="w-4 h-4 text-emerald-400 stroke-[3] animate-in zoom-in-75 duration-150" />
            ) : (
              <span className="text-[9px] font-mono font-bold text-cyan-300">
                {progress}%
              </span>
            )}
          </div>
        </div>

        {/* Status Text & Mode Badge */}
        <div className="flex items-center space-x-2 truncate">
          <div className="truncate">
            <div className="flex items-center space-x-1.5 font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
              <span className="truncate">Tautan Berhasil Disalin!</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {isPublic ? 'Mode Publik • Siap dibagikan' : 'Mode Privat • Akses terkunci'}
            </p>
          </div>
        </div>

        {/* Copy Again Quick Button */}
        <button
          onClick={handleCopyAgain}
          className="px-2.5 py-1 rounded-full bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center space-x-1 transition cursor-pointer shrink-0 active:scale-95"
          title="Salin tautan lagi"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-300">Disalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px] font-bold">Salin</span>
            </>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.1] transition cursor-pointer shrink-0"
          aria-label="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
