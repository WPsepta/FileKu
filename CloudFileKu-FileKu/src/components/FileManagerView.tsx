import React, { useMemo } from 'react';
import {
  UploadCloud,
  Share2,
  CheckSquare,
  Square,
  Trash2,
  Download,
  HardDrive,
  Cloud,
  Globe,
  Lock,
} from 'lucide-react';
import { StoredFile } from '../types';
import { formatBytes } from '../utils/formatters';
import { FileItemRow } from './FileItemRow';

interface FileManagerViewProps {
  files: StoredFile[];
  selectedFileIds: string[];
  isPublicMode: boolean;
  hasAccess: boolean;
  onToggleMode: (isPublic: boolean) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onPreviewFile: (file: StoredFile) => void;
  onDownloadFile: (file: StoredFile) => void;
  onDownloadSelectedFiles: () => void;
  onRenameFile: (file: StoredFile) => void;
  onDeleteFile: (file: StoredFile) => void;
  onBatchDeletePrompt: () => void;
  onShareLink: () => void;
  onTriggerUpload: () => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  files,
  selectedFileIds,
  isPublicMode,
  onToggleMode,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onPreviewFile,
  onDownloadFile,
  onDownloadSelectedFiles,
  onRenameFile,
  onDeleteFile,
  onBatchDeletePrompt,
  onShareLink,
  onTriggerUpload,
}) => {
  const totalSize = useMemo(() => {
    return files.reduce((acc, curr) => acc + curr.size, 0);
  }, [files]);

  const isAllSelected =
    files.length > 0 &&
    files.every((f) => selectedFileIds.includes(f.id));

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1 flex flex-col relative z-10">
      {/* 1. Main Action Box with Liquid Glass & Moving RGB Highlights */}
      <div
        id="mainActionCard"
        className="liquid-glass rounded-3xl p-5 sm:p-7 space-y-4 rgb-active-card shadow-[0_0_40px_rgba(6,182,212,0.18)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Storage & file count stats */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0 backdrop-blur-md">
              <HardDrive className="w-6 h-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <span className="font-extrabold text-white text-base sm:text-xl tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  {files.length} Berkas
                </span>
                <span className="text-cyan-400/50">•</span>
                <span className="text-xs sm:text-sm font-semibold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                  {formatBytes(totalSize, 1)}
                </span>
                <span className="text-cyan-400/50">•</span>
                {/* Access mode badge */}
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                    isPublicMode
                      ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-amber-950/60 border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  {isPublicMode ? (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>Publik</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Privat</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mt-0.5">
                {isPublicMode
                  ? 'Penyimpanan terbuka — siapa saja dapat melihat & mengunduh berkas'
                  : 'Penyimpanan privat — hanya penerima tautan yang diizinkan mengunduh berkas'}
              </p>
            </div>
          </div>

          {/* Action buttons: Share Link & Upload File */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Share Link Button with animated glow */}
            <button
              id="btnActionShareLink"
              onClick={onShareLink}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 border border-cyan-400/40 hover:border-cyan-300 text-cyan-300 hover:text-white text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <Share2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              <span>Share Link</span>
            </button>

            {/* Upload File Button with RGB flow gradient */}
            <button
              id="btnActionUploadFile"
              onClick={onTriggerUpload}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl rgb-glow-bar hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition active:scale-95 cursor-pointer border border-cyan-200/50"
            >
              <UploadCloud className="w-4 h-4 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              <span>Unggah File</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar: Sejajar Sempurna: Pilih Semua & Publik / Privat & Batch Actions */}
      <div className="liquid-glass-card rounded-2xl p-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Inline flex row with permanent pair (Pilih Semua + Publik/Privat) and Batch Actions */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Permanent Group: Always side-by-side without shifting */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Pilih Semua Button */}
            <button
              id="btnToggleSelectAll"
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              disabled={files.length === 0}
              className="h-9 flex items-center space-x-2 px-3.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:shadow-[0_0_12px_rgba(6,182,212,0.35)] backdrop-blur-md shrink-0"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              ) : (
                <Square className="w-4 h-4 text-cyan-400" />
              )}
              <span>{isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
            </button>

            {/* Publik & Privat Selector Sejajar Tepat di Samping Pilih Semua */}
            <div
              id="containerModeSelector"
              className="h-9 flex items-center bg-[#060b19]/90 border border-cyan-500/30 rounded-xl p-1 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0"
            >
              {/* Publik Button */}
              <button
                type="button"
                id="btnModePublik"
                onClick={() => onToggleMode(true)}
                className={`h-full flex items-center space-x-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  isPublicMode
                    ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                title="Mode Publik: Siapa pun bebas mengunduh berkas"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Publik</span>
              </button>

              {/* Privat Button */}
              <button
                type="button"
                id="btnModePrivat"
                onClick={() => onToggleMode(false)}
                className={`h-full flex items-center space-x-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  !isPublicMode
                    ? 'bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                title="Mode Privat: Hanya yang punya link yang bisa mengunduh"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Privat</span>
              </button>
            </div>
          </div>

          {/* Batch Actions if any item selected */}
          {selectedFileIds.length > 0 && (
            <div className="flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150 shrink-0">
              {/* Batch Download */}
              <button
                id="btnBatchDownload"
                onClick={onDownloadSelectedFiles}
                className="h-9 flex items-center space-x-1.5 px-3.5 rounded-xl text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.5)] transition active:scale-95 cursor-pointer border border-emerald-400/50 backdrop-blur-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh ({selectedFileIds.length})</span>
              </button>

              {/* Batch Delete */}
              <button
                id="btnBatchDelete"
                onClick={onBatchDeletePrompt}
                className="h-9 flex items-center space-x-1.5 px-3.5 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.5)] transition active:scale-95 cursor-pointer border border-rose-400/50 backdrop-blur-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedFileIds.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className="text-xs text-slate-400 font-medium hidden md:flex items-center space-x-2 shrink-0">
          <span>{files.length} Berkas</span>
          {!isPublicMode && (
            <>
              <span>•</span>
              <span className="text-amber-300 font-semibold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Akses Privat</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Files List in Row / Berbaris Mode (No overflow-hidden to prevent 3-dot dropdown cutoff) */}
      <div className="flex-1 relative">
        {files.length === 0 ? (
          /* Empty State Liquid Glass */
          <div className="liquid-glass rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md">
              <Cloud className="w-8 h-8 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                Penyimpanan drive cloud Anda masih kosong
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto">
                Unggah berkas sekarang atau seret berkas ke mana saja pada layar ini untuk menyimpannya ke drive cloud.
              </p>
            </div>

            <button
              id="btnUploadInEmptyState"
              onClick={onTriggerUpload}
              className="mt-2 flex items-center space-x-2 rgb-glow-bar hover:brightness-110 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition active:scale-95 cursor-pointer border border-cyan-200/50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Berkas Pertama</span>
            </button>
          </div>
        ) : (
          /* All files strictly in row / list mode with liquid glass - overflow-visible allows dropdowns to expand cleanly */
          <div className="liquid-glass rounded-3xl divide-y divide-cyan-500/15 relative">
            {files.map((file) => (
              <FileItemRow
                key={file.id}
                file={file}
                isSelected={selectedFileIds.includes(file.id)}
                onToggleSelect={onToggleSelect}
                onPreview={onPreviewFile}
                onDownload={onDownloadFile}
                onRename={onRenameFile}
                onDelete={onDeleteFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
