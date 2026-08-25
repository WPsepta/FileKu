import React, { useState, useEffect } from 'react';
import { Edit2, X, Check } from 'lucide-react';
import { StoredFile } from '../types';

interface RenameModalProps {
  file: StoredFile | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (fileId: string, newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  file,
  isOpen,
  onClose,
  onRename,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (file) {
      setName(file.name);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== file.name) {
      onRename(file.id, name.trim());
    }
    onClose();
  };

  return (
    <div
      id="renameModalBackdrop"
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div
        id="renameModalCard"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1222] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Ubah Nama Berkas</h3>
            <p className="text-xs text-slate-400">Masukkan nama baru untuk berkas ini</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="inputRenameFile"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              placeholder="Nama berkas..."
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btnSubmitRename"
              disabled={!name.trim() || name.trim() === file.name}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
