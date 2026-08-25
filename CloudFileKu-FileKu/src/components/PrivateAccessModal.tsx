import React, { useState } from 'react';
import { Lock, Key, X, CheckCircle, ShieldAlert } from 'lucide-react';

interface PrivateAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockWithKey: (key: string) => boolean;
}

export const PrivateAccessModal: React.FC<PrivateAccessModalProps> = ({
  isOpen,
  onClose,
  onUnlockWithKey,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setErrorMsg('Harap masukkan kunci akses tautan.');
      return;
    }

    const success = onUnlockWithKey(inputKey.trim());
    if (success) {
      setErrorMsg('');
      setInputKey('');
      onClose();
    } else {
      setErrorMsg('Kunci akses tautan salah. Silakan periksa kembali tautan yang Anda terima.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="privateAccessModal"
        className="liquid-glass rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <Lock className="w-6 h-6 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Mode Privat Aktif
            </h3>
            <p className="text-xs text-amber-300 font-semibold drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
              Hanya yang punya link yang bisa mengunduh
            </p>
          </div>
        </div>

        {/* Explanatory text */}
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Drive ini diatur ke <strong>Mode Privat</strong>. Anda harus membuka web melalui <strong>Tautan Resmi</strong> yang dibagikan pemilik, atau masukkan Kunci Akses di bawah:
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleUnlock} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kunci Akses / Token Tautan:
            </label>
            <div className="relative">
              <input
                id="inputPrivateAccessKey"
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan kode akses (cth: access_...)"
                className="w-full bg-[#060b19]/90 border border-amber-500/40 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition"
              />
              <Key className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold mt-1.5">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btnSubmitPrivateAccessKey"
              className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] transition cursor-pointer border border-amber-300/40"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Buka Akses Unduh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
