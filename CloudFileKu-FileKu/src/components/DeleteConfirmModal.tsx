import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { StoredFile } from '../types';
import { formatBytes } from '../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  fileToDelete: StoredFile | null;
  selectedCount?: number;
  isBatch?: boolean;
  isClearAll?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  fileToDelete,
  selectedCount = 0,
  isBatch = false,
  isClearAll = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="deleteModalBackdrop"
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div
        id="deleteModalCard"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1222] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative"
      >
        {/* Close button */}
        <button
          id="btnCloseDeleteModal"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {isClearAll
                ? 'Hapus Semua Berkas?'
                : isBatch
                ? `Hapus ${selectedCount} Berkas Terpilih?`
                : 'Hapus Berkas Ini?'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>

        {/* Detail info box */}
        {!isClearAll && !isBatch && fileToDelete && (
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-sm font-semibold text-slate-200 truncate">{fileToDelete.name}</p>
            <p className="text-xs text-slate-400 font-mono">{formatBytes(fileToDelete.size)}</p>
          </div>
        )}

        {isBatch && (
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
            <p className="text-xs text-slate-300">
              Anda akan menghapus <span className="font-bold text-rose-400">{selectedCount} berkas</span> yang sedang dipilih dari penyimpanan cloud.
            </p>
          </div>
        )}

        {isClearAll && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>Seluruh berkas yang tersimpan di cloud drive akan dihapus secara permanen.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            id="btnConfirmDelete"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer"
          >
            {isClearAll ? 'Ya, Hapus Semua' : 'Ya, Hapus Berkas'}
          </button>
        </div>
      </div>
    </div>
  );
};
