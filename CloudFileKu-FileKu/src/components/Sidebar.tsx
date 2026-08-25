import React from 'react';
import userAvatarImg from '../assets/images/user_avatar_1786938769639.jpg';
import {
  X,
  HardDrive,
  Files,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  AppWindow,
  Trash2,
  Instagram,
  MessageCircle,
  Music2,
  Cloud,
  Share2,
  Sparkles,
} from 'lucide-react';
import { FileCategory } from '../types';
import { formatBytes } from '../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: FileCategory;
  onSelectCategory: (cat: FileCategory) => void;
  totalFiles: number;
  totalSize: number;
  onClearAllPrompt?: () => void;
  onShareLink?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  totalFiles,
  totalSize,
  onClearAllPrompt,
  onShareLink,
}) => {
  const maxStorageBytes = 15 * 1024 * 1024 * 1024; // 15GB Cloud Storage
  const usagePercentage = Math.min(100, Math.max(totalSize > 0 ? 1 : 0, Math.round((totalSize / maxStorageBytes) * 100)));

  const categories: { id: FileCategory; label: string; icon: React.ReactNode; colorClass: string; glowClass: string }[] = [
    {
      id: 'all',
      label: 'Semua Berkas',
      icon: <Files className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />,
      colorClass: 'text-cyan-300',
      glowClass: 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.35)]',
    },
    {
      id: 'document',
      label: 'Dokumen & PDF',
      icon: <FileText className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />,
      colorClass: 'text-emerald-300',
      glowClass: 'bg-emerald-500/15 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.35)]',
    },
    {
      id: 'image',
      label: 'Foto & Gambar',
      icon: <ImageIcon className="w-4 h-4 text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" />,
      colorClass: 'text-pink-300',
      glowClass: 'bg-pink-500/15 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.35)]',
    },
    {
      id: 'video',
      label: 'Video & Film',
      icon: <Film className="w-4 h-4 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" />,
      colorClass: 'text-fuchsia-300',
      glowClass: 'bg-fuchsia-500/15 border-fuchsia-400/50 shadow-[0_0_15px_rgba(217,70,239,0.35)]',
    },
    {
      id: 'audio',
      label: 'Musik & Audio',
      icon: <Music className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />,
      colorClass: 'text-amber-300',
      glowClass: 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    },
    {
      id: 'archive',
      label: 'Arsip & ZIP',
      icon: <Archive className="w-4 h-4 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />,
      colorClass: 'text-orange-300',
      glowClass: 'bg-orange-500/15 border-orange-400/50 shadow-[0_0_15px_rgba(249,115,22,0.35)]',
    },
    {
      id: 'app',
      label: 'Aplikasi & Script',
      icon: <AppWindow className="w-4 h-4 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />,
      colorClass: 'text-blue-300',
      glowClass: 'bg-blue-500/15 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.35)]',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        id="sidebarBackdrop"
        onClick={onClose}
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        id="sidebarDrawer"
        className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-[#060b19] border-r border-cyan-500/30 z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between p-5 shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          {/* Top Brand & Close */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                <Cloud className="w-4 h-4 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              </div>
              <span className="font-black text-lg text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                FileKu Drive
              </span>
            </div>
            <button
              id="btnCloseSidebar"
              onClick={onClose}
              className="text-cyan-400 hover:text-white p-1.5 rounded-lg hover:bg-cyan-950/60 border border-transparent hover:border-cyan-500/40 transition cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Card Neon */}
          <div className="bg-[#0a1226] border border-pink-500/30 p-3.5 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(236,72,153,0.15)]">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-11 h-11 rounded-full border-2 border-pink-400 p-0.5 shrink-0 relative shadow-[0_0_15px_rgba(236,72,153,0.6)] overflow-visible">
                <img
                  src={userAvatarImg}
                  alt="Profile Avatar"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0a1226] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.9)]"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                  WP septa
                </p>
                <p className="text-xs text-pink-400/80 truncate font-mono">rikasma009@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Category Filter Navigation */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400/80 px-3 pb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Kategori Berkas
            </p>
            <nav className="space-y-1.5">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`sidebarCat_${cat.id}`}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isActive
                        ? `${cat.glowClass} ${cat.colorClass}`
                        : 'text-slate-300 hover:bg-[#0a1226] hover:text-white border-transparent hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {cat.icon}
                      <span className={isActive ? 'font-bold' : ''}>{cat.label}</span>
                    </div>
                    {cat.id === 'all' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                        {totalFiles}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Storage Meter Widget Neon */}
          <div className="bg-[#0a1226] border border-cyan-500/30 p-4 rounded-2xl space-y-3 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                Kapasitas Cloud
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">
                {usagePercentage}%
              </span>
            </div>

            <div className="w-full bg-[#060b19] rounded-full h-2.5 overflow-hidden border border-cyan-500/30 p-[1px]">
              <div
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.max(5, usagePercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-cyan-300/90 font-mono">Terpakai: {formatBytes(totalSize, 1)}</span>
              <span className="font-mono">Total: 15 GB</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            {onShareLink && (
              <button
                id="sidebarShareBtn"
                onClick={() => {
                  onShareLink();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-cyan-300 bg-[#0a1226] hover:bg-cyan-950/60 hover:text-white transition cursor-pointer border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <Share2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span>Bagikan Tautan Web</span>
              </button>
            )}

            {totalFiles > 0 && onClearAllPrompt && (
              <button
                id="sidebarClearAllBtn"
                onClick={() => {
                  onClearAllPrompt();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/20 hover:bg-rose-950/50 hover:text-rose-200 transition cursor-pointer border border-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                <Trash2 className="w-4 h-4 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                <span>Kosongkan Semua Berkas</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer with Social Contacts */}
        <div className="pt-4 mt-6 border-t border-cyan-500/20 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
              WP septa
            </span>
            <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.4)] font-semibold">
              Online
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* TikTok Icon */}
            <a
              id="sidebarLinkTikTok"
              href="https://www.tiktok.com/@wp_septa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-2 rounded-xl bg-[#0a1226] hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white flex items-center justify-center transition hover:shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              title="TikTok: @wp_septa"
              aria-label="TikTok: @wp_septa"
            >
              <Music2 className="w-4 h-4 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            </a>

            {/* Instagram Icon */}
            <a
              id="sidebarLinkInstagram"
              href="https://www.instagram.com/wp_septa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-2 rounded-xl bg-[#0a1226] hover:bg-pink-950/60 border border-pink-500/30 hover:border-pink-400 text-pink-400 hover:text-pink-200 flex items-center justify-center transition hover:shadow-[0_0_12px_rgba(236,72,153,0.5)]"
              title="Instagram: @wp_septa"
              aria-label="Instagram: @wp_septa"
            >
              <Instagram className="w-4 h-4 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
            </a>

            {/* WhatsApp Icon */}
            <a
              id="sidebarLinkWhatsApp"
              href="https://wa.me/817089287819"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-2 rounded-xl bg-[#0a1226] hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 hover:text-emerald-200 flex items-center justify-center transition hover:shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              title="WhatsApp: +81 70-8928-7819"
              aria-label="WhatsApp: +81 70-8928-7819"
            >
              <MessageCircle className="w-4 h-4 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
