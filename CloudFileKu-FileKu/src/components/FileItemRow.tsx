import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Edit2,
  Check,
} from 'lucide-react';
import { StoredFile } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { FileFormatIcon } from './FileFormatIcon';

interface FileItemRowProps {
  file: StoredFile;
  isSelected: boolean;
  onToggleSelect: (fileId: string) => void;
  onPreview: (file: StoredFile) => void;
  onDownload: (file: StoredFile) => void;
  onRename: (file: StoredFile) => void;
  onDelete: (file: StoredFile) => void;
}

export const FileItemRow: React.FC<FileItemRowProps> = ({
  file,
  isSelected,
  onToggleSelect,
  onPreview,
  onDownload,
  onRename,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Smart position detection: open upward if near screen bottom or card bottom
  const handleToggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // If within 230px of bottom, open upward
      if (rect.bottom + 230 > windowHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    setIsMenuOpen((prev) => !prev);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const dateDisplay = file.timestamp
    ? formatDate(new Date(file.timestamp))
    : file.date || formatDate(new Date());

  return (
    <div
      id={`file-row-${file.id}`}
      className={`group relative flex items-center justify-between px-3.5 sm:px-4 py-3 sm:py-3.5 transition-all ${
        isMenuOpen ? 'z-30' : 'z-10'
      } ${
        isSelected
          ? 'bg-cyan-950/40 border-l-2 border-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]'
          : 'hover:bg-cyan-950/20 bg-transparent'
      }`}
    >
      {/* Left side: Checkbox + Format-specific Icon + File Information */}
      <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 flex-1 pr-2">
        {/* Custom Rounded Checkbox Neon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(file.id);
          }}
          className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            isSelected
              ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.8)]'
              : 'border-slate-700 hover:border-cyan-400 bg-[#060b19]'
          }`}
          aria-label={`Pilih ${file.name}`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </button>

        {/* Distinct format icon */}
        <div
          onClick={() => onPreview(file)}
          className="w-9 h-9 rounded-xl bg-[#060b19] border border-cyan-500/30 flex items-center justify-center shrink-0 cursor-pointer select-none group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition"
          title={`Pratinjau ${file.name}`}
        >
          <FileFormatIcon filename={file.name} size="sm" />
        </div>

        {/* Text Metadata */}
        <div className="min-w-0 flex-1">
          <p
            onClick={() => onPreview(file)}
            className="font-semibold text-xs sm:text-sm text-slate-100 truncate hover:text-cyan-300 hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] cursor-pointer transition tracking-tight"
            title={file.name}
          >
            {file.name}
          </p>

          <div className="flex items-center space-x-2.5 text-[11px] text-slate-400 mt-0.5">
            <span className="flex items-center space-x-1 shrink-0">
              <Calendar className="w-3 h-3 text-cyan-500/70 shrink-0" />
              <span className="whitespace-nowrap">{dateDisplay}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-cyan-400/80 whitespace-nowrap shrink-0">
              {formatBytes(file.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Quick Download Button + 3-dots Menu Button */}
      <div className="flex items-center space-x-1 shrink-0">
        {/* Direct Download Button */}
        <button
          id={`btn-download-${file.id}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(file);
          }}
          className="hidden sm:inline-flex p-2 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-xl transition cursor-pointer hover:shadow-[0_0_10px_rgba(52,211,153,0.4)]"
          title={`Unduh ${file.name}`}
          aria-label={`Unduh ${file.name}`}
        >
          <Download className="w-4 h-4" />
        </button>

        {/* 3-dots Menu Button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            ref={buttonRef}
            id={`btn-menu-${file.id}`}
            type="button"
            onClick={handleToggleMenu}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isMenuOpen
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Opsi Berkas"
            aria-label="Opsi Berkas"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Popup Menu Neon with smart Upward/Downward flip and high z-index */}
          {isMenuOpen && (
            <div
              id={`dropdown-menu-${file.id}`}
              onClick={(e) => e.stopPropagation()}
              className={`absolute right-0 w-48 bg-[#060b19]/95 backdrop-blur-xl border border-cyan-400/50 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.35)] py-1.5 z-50 ring-1 ring-cyan-500/20 animate-in fade-in zoom-in-95 duration-100 ${
                openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}
            >
              {/* Pratinjau */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onPreview(file);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-cyan-950/70 hover:text-cyan-300 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span>Pratinjau Berkas</span>
              </button>

              {/* Unduh */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDownload(file);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-emerald-950/70 hover:text-emerald-300 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span>Unduh Sekarang</span>
              </button>

              {/* Ganti Nama */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onRename(file);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-amber-950/70 hover:text-amber-300 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                <span>Ganti Nama</span>
              </button>

              <div className="my-1 border-t border-cyan-500/20" />

              {/* Hapus */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDelete(file);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-950/70 hover:text-rose-300 flex items-center space-x-2.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                <span>Hapus Berkas</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
