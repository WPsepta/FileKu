import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Sparkles } from 'lucide-react';

interface HeaderProps {
  initialTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ initialTitle = 'WP septa' }) => {
  const [title, setTitle] = useState<string>(() => {
    return localStorage.getItem('custom_header_title') || initialTitle;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim() || 'WP septa';
    setTitle(trimmed);
    localStorage.setItem('custom_header_title', trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <header className="h-16 liquid-glass-header px-4 sm:px-8 flex items-center justify-center sticky top-0 z-30 transition-all">
      {isEditing ? (
        <div className="flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative">
            <input
              ref={inputRef}
              id="inputCustomHeaderTitle"
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={40}
              className="bg-[#0a142c]/90 text-cyan-300 font-extrabold text-lg sm:text-2xl px-4 py-1.5 rounded-2xl border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.5)] text-center backdrop-blur-md"
              placeholder="Tulis nama kustom..."
            />
          </div>
          <button
            id="btnSaveHeaderTitle"
            onClick={handleSave}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.6)] active:scale-95 cursor-pointer border border-cyan-300/40"
            title="Simpan Nama"
            aria-label="Simpan Nama"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            id="btnCancelHeaderTitle"
            onClick={handleCancel}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
            title="Batal"
            aria-label="Batal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          id="headerCustomTitleContainer"
          onClick={() => {
            setEditValue(title);
            setIsEditing(true);
          }}
          className="group flex items-center justify-center space-x-2.5 cursor-pointer py-1.5 px-4 rounded-2xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] active:scale-98 select-none"
          title="Klik untuk mengubah teks header"
        >
          <Sparkles className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse" />
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.7)] tracking-wide transition-all group-hover:scale-105">
            {title}
          </h1>
        </div>
      )}
    </header>
  );
};
