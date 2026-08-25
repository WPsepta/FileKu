import React from 'react';
import {
  Download,
  Trash2,
  Eye,
  Edit2,
  Calendar,
} from 'lucide-react';
import { StoredFile } from '../types';
import { formatBytes, formatDate, getDetailedFileInfo } from '../utils/formatters';
import { FileFormatIcon } from './FileFormatIcon';

interface FileGridCardProps {
  file: StoredFile;
  isSelected: boolean;
  onToggleSelect: (fileId: string) => void;
  onPreview: (file: StoredFile) => void;
  onDownload: (file: StoredFile) => void;
  onRename: (file: StoredFile) => void;
  onDelete: (file: StoredFile) => void;
}

export const FileGridCard: React.FC<FileGridCardProps> = ({
  file,
  isSelected,
  onToggleSelect,
  onPreview,
  onDownload,
  onRename,
  onDelete,
}) => {
  const fileInfo = getDetailedFileInfo(file.name);
  const dateDisplay = file.timestamp
    ? formatDate(new Date(file.timestamp))
    : file.date || formatDate(new Date());

  return (
    <div
      id={`file-card-${file.id}`}
      className={`relative group bg-[#091124]/90 hover:bg-[#0c1833] border transition-all duration-200 rounded-2xl p-4 flex flex-col justify-between ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
          : 'border-slate-800/90 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.18)] shadow-lg'
      }`}
    >
      {/* Top row: Checkbox & Neon Type Badge */}
      <div className="flex items-center justify-between mb-3">
        {/* Select checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(file.id);
          }}
          className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
            isSelected
              ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.8)]'
              : 'bg-[#060b19] border-slate-700 hover:border-cyan-400'
          }`}
          aria-label={`Pilih ${file.name}`}
        >
          {isSelected && (
            <div className="w-2 h-2 rounded-[2px] bg-white shadow-sm" />
          )}
        </button>

        {/* Format Badge with Neon border */}
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 shadow-sm ${fileInfo.badgeStyle}`}
        >
          {fileInfo.badgeText}
        </span>
      </div>

      {/* Main Content: Clickable preview area */}
      <div
        onClick={() => onPreview(file)}
        className="cursor-pointer space-y-3 pb-3"
        title="Klik untuk pratinjau berkas"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#060b19] border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
            <FileFormatIcon filename={file.name} size="lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-slate-100 text-xs sm:text-sm truncate group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] transition"
              title={file.name}
            >
              {file.name}
            </h3>
            <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
              {formatBytes(file.size)}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row: Date & Action buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="inline-flex items-center space-x-1 text-slate-400 text-[11px]">
          <Calendar className="w-3 h-3 text-cyan-500/70 shrink-0" />
          <span className="truncate max-w-[110px]">{dateDisplay}</span>
        </span>

        {/* Action icons with Neon glows */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file);
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded-lg transition cursor-pointer hover:shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            title="Pratinjau"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-lg transition cursor-pointer hover:shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            title="Unduh"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename(file);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-950/60 rounded-lg transition cursor-pointer hover:shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            title="Ganti Nama"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition cursor-pointer hover:shadow-[0_0_8px_rgba(244,63,94,0.5)]"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
