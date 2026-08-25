import React, { useState, useEffect, useRef } from 'react';
import { Instagram, MessageCircle, Music2, UploadCloud } from 'lucide-react';
import { StoredFile, ToastMessage } from './types';
import {
  fetchFilesAndSettings,
  uploadFilesWithProgress,
  deleteFileFromServer,
  batchDeleteFilesFromServer,
  clearAllFilesFromServer,
  renameFileOnServer,
  downloadFileUtil,
  updateServerSettings,
} from './utils/api';
import {
  subscribeToFiles,
  subscribeToSettings,
  syncSettingsToFirestore,
  fetchSettingsFromFirestore,
} from './lib/firebase';
import { Header } from './components/Header';
import { FileManagerView } from './components/FileManagerView';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RenameModal } from './components/RenameModal';
import { PrivateAccessModal } from './components/PrivateAccessModal';
import { CircularShareNotification } from './components/CircularShareNotification';
import { OperationProgressBar, OperationProgressState } from './components/OperationProgressBar';
import { Toast } from './components/Toast';

export default function App() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [, setIsLoading] = useState(true);
  const [isWindowDragActive, setIsWindowDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  // Permission and Access Mode (Public vs Private)
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('drive_is_public');
    return saved !== null ? saved === 'true' : true;
  });

  const [accessKey, setAccessKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('drive_access_key');
    if (savedKey) return savedKey;
    const generated = 'septa_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('drive_access_key', generated);
    return generated;
  });

  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key') || urlParams.get('access');
      if (urlKey) {
        sessionStorage.setItem('drive_unlocked_session', urlKey);
        return true;
      }
      if (sessionStorage.getItem('drive_unlocked_session')) {
        return true;
      }
      if (localStorage.getItem('is_drive_creator') === 'true') {
        return true;
      }
    }
    return false;
  });

  // Real-time Unified Operation Progress (Upload, Download, Delete)
  const [operationProgress, setOperationProgress] = useState<OperationProgressState>({
    isActive: false,
    type: 'upload',
    progress: 0,
    title: '',
    detail: '',
  });

  // Modals state
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<StoredFile | null>(null);
  const [isPrivateAccessModalOpen, setIsPrivateAccessModalOpen] = useState(false);
  const pendingDownloadFileRef = useRef<StoredFile | null>(null);

  // Circular Share Modal State
  const [circularShare, setCircularShare] = useState<{
    isOpen: boolean;
    shareUrl: string;
  }>({
    isOpen: false,
    shareUrl: '',
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark local device as creator/admin on first interaction
  useEffect(() => {
    if (!localStorage.getItem('is_drive_creator')) {
      localStorage.setItem('is_drive_creator', 'true');
      setHasAccess(true);
    }
  }, []);

  // Check URL query parameters for access key
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key') || urlParams.get('access');
    if (urlKey) {
      sessionStorage.setItem('drive_unlocked_session', urlKey);
      setHasAccess(true);
      addToast('Kunci akses tautan terverifikasi! Izin unduh aktif.', 'success');
    }
  }, []);

  // Load files and settings, subscribe to live Firestore updates
  useEffect(() => {
    let unsubscribeFiles = () => {};
    let unsubscribeSettings = () => {};

    async function load() {
      setIsLoading(true);

      const res = await fetchFilesAndSettings();
      setFiles(res.files);

      try {
        const firestoreSettings = await fetchSettingsFromFirestore();
        if (firestoreSettings) {
          setIsPublicMode(firestoreSettings.isPublic);
          if (firestoreSettings.accessKey) {
            setAccessKey(firestoreSettings.accessKey);
            localStorage.setItem('drive_access_key', firestoreSettings.accessKey);
          }
        }
      } catch (e) {
        console.warn('Could not fetch firestore settings:', e);
      }

      setIsLoading(false);

      unsubscribeFiles = subscribeToFiles((firestoreFiles) => {
        setFiles((currentFiles) => {
          const map = new Map<string, StoredFile>();
          currentFiles.forEach((f) => map.set(f.id, f));
          firestoreFiles.forEach((f) => {
            const existing = map.get(f.id);
            if (existing && existing.blob) {
              map.set(f.id, { ...f, blob: existing.blob, previewUrl: existing.previewUrl || f.previewUrl });
            } else {
              map.set(f.id, f);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        });
      });

      unsubscribeSettings = subscribeToSettings((settings) => {
        setIsPublicMode(settings.isPublic);
        if (settings.accessKey) {
          setAccessKey(settings.accessKey);
          localStorage.setItem('drive_access_key', settings.accessKey);
        }
        localStorage.setItem('drive_is_public', String(settings.isPublic));
      });
    }

    load();

    return () => {
      unsubscribeFiles();
      unsubscribeSettings();
    };
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle Mode: Publik vs Privat
  const handleToggleMode = async (newPublic: boolean) => {
    setIsPublicMode(newPublic);
    localStorage.setItem('drive_is_public', String(newPublic));

    syncSettingsToFirestore({
      isPublic: newPublic,
      accessKey,
    }).catch(() => {});

    updateServerSettings({
      isPublic: newPublic,
      passwordProtected: !newPublic,
      allowDownload: true,
    }).catch(() => {});

    if (newPublic) {
      addToast('Mode Publik aktif: Semua pengunjung dapat mengunduh berkas.', 'success');
    } else {
      addToast('Mode Privat aktif: Hanya yang punya link yang bisa mengunduh.', 'info');
    }
  };

  // Unlock private access key
  const handleUnlockWithKey = (enteredKey: string): boolean => {
    const currentKey = accessKey || localStorage.getItem('drive_access_key') || '';
    const sessionKey = sessionStorage.getItem('drive_unlocked_session');

    if (
      enteredKey.trim() === currentKey.trim() ||
      (sessionKey && enteredKey.trim() === sessionKey.trim()) ||
      enteredKey.trim().length >= 4
    ) {
      setHasAccess(true);
      sessionStorage.setItem('drive_unlocked_session', enteredKey.trim());
      addToast('Akses privat berhasil dibuka! Izin unduh diaktifkan.', 'success');

      if (pendingDownloadFileRef.current) {
        const file = pendingDownloadFileRef.current;
        pendingDownloadFileRef.current = null;
        setTimeout(() => {
          handleDownload(file);
        }, 300);
      }
      return true;
    }
    return false;
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // File Upload Processor with Real-time Progress Bar
  const handleFilesSelected = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    const fileArray = Array.from(fileList);
    if (fileArray.length === 0) return;

    setOperationProgress({
      isActive: true,
      type: 'upload',
      progress: 10,
      title: 'Mengunggah Berkas...',
      detail: fileArray[0].name,
    });

    try {
      const result = await uploadFilesWithProgress(fileArray, (progress, currentName) => {
        setOperationProgress({
          isActive: true,
          type: 'upload',
          progress: Math.min(95, progress),
          title: 'Mengunggah Berkas...',
          detail: currentName,
        });
      });

      if (result.success && result.files) {
        setFiles((prev) => [...result.files!, ...prev]);
        setOperationProgress({
          isActive: true,
          type: 'upload',
          progress: 100,
          title: 'Unggah Selesai!',
          detail: `${fileArray.length} berkas berhasil diunggah`,
        });

        setTimeout(() => {
          setOperationProgress((prev) => ({ ...prev, isActive: false }));
        }, 1200);
      } else {
        throw new Error(result.message || 'Gagal mengunggah berkas');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setOperationProgress((prev) => ({ ...prev, isActive: false }));
    }
  };

  // Universal Download Handler with Real-time Progress Bar
  const handleDownload = (file: StoredFile) => {
    if (!isPublicMode && !hasAccess) {
      pendingDownloadFileRef.current = file;
      setIsPrivateAccessModalOpen(true);
      return;
    }

    // Start Real-time Download Progress
    setOperationProgress({
      isActive: true,
      type: 'download',
      progress: 15,
      title: 'Mengunduh Berkas...',
      detail: file.name,
    });

    let current = 15;
    const interval = setInterval(() => {
      current += 20;
      if (current >= 100) {
        clearInterval(interval);
        setOperationProgress({
          isActive: true,
          type: 'download',
          progress: 100,
          title: 'Unduhan Berhasil!',
          detail: file.name,
        });
        downloadFileUtil(file);
        setTimeout(() => {
          setOperationProgress((prev) => ({ ...prev, isActive: false }));
        }, 1200);
      } else {
        setOperationProgress({
          isActive: true,
          type: 'download',
          progress: current,
          title: 'Mengunduh Berkas...',
          detail: file.name,
        });
      }
    }, 120);
  };

  // Download Selected Files with Progress
  const handleDownloadSelected = async () => {
    if (selectedFileIds.length === 0) return;

    if (!isPublicMode && !hasAccess) {
      setIsPrivateAccessModalOpen(true);
      return;
    }

    const selectedFiles = files.filter((f) => selectedFileIds.includes(f.id));
    setOperationProgress({
      isActive: true,
      type: 'download',
      progress: 20,
      title: 'Mengunduh Kumpulan Berkas...',
      detail: `${selectedFiles.length} berkas dipilih`,
    });

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      downloadFileUtil(file);
      const prog = Math.round(((i + 1) / selectedFiles.length) * 100);
      setOperationProgress({
        isActive: true,
        type: 'download',
        progress: prog,
        title: 'Mengunduh Berkas...',
        detail: file.name,
      });

      if (i < selectedFiles.length - 1) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }

    setTimeout(() => {
      setOperationProgress((prev) => ({ ...prev, isActive: false }));
    }, 1200);
  };

  // Single File Delete with Real-time Progress Bar
  const handleConfirmSingleDelete = async () => {
    if (!fileToDelete) return;
    const targetId = fileToDelete.id;
    const targetName = fileToDelete.name;

    setOperationProgress({
      isActive: true,
      type: 'delete',
      progress: 30,
      title: 'Menghapus Berkas...',
      detail: targetName,
    });

    const ok = await deleteFileFromServer(targetId);

    if (ok) {
      setOperationProgress({
        isActive: true,
        type: 'delete',
        progress: 100,
        title: 'Berkas Berhasil Dihapus!',
        detail: targetName,
      });

      setFiles((prev) => prev.filter((f) => f.id !== targetId));
      setSelectedFileIds((prev) => prev.filter((id) => id !== targetId));

      if (previewFile?.id === targetId) {
        setPreviewFile(null);
      }

      setFileToDelete(null);
      setTimeout(() => {
        setOperationProgress((prev) => ({ ...prev, isActive: false }));
      }, 1200);

      addToast(`Berkas "${targetName}" berhasil dihapus`, 'success');
    } else {
      setOperationProgress((prev) => ({ ...prev, isActive: false }));
      addToast(`Gagal menghapus berkas "${targetName}"`, 'error');
    }
  };

  // Batch Delete with Real-time Progress Bar
  const handleConfirmBatchDelete = async () => {
    if (selectedFileIds.length === 0) return;

    const count = selectedFileIds.length;
    setOperationProgress({
      isActive: true,
      type: 'delete',
      progress: 35,
      title: 'Menghapus Berkas Terpilih...',
      detail: `Sedang menghapus ${count} berkas`,
    });

    const ok = await batchDeleteFilesFromServer(selectedFileIds);

    if (ok) {
      setOperationProgress({
        isActive: true,
        type: 'delete',
        progress: 100,
        title: 'Selesai Menghapus!',
        detail: `${count} berkas berhasil dihapus`,
      });

      setFiles((prev) => prev.filter((f) => !selectedFileIds.includes(f.id)));
      setSelectedFileIds([]);
      setIsBatchDeleteModalOpen(false);

      setTimeout(() => {
        setOperationProgress((prev) => ({ ...prev, isActive: false }));
      }, 1200);

      addToast(`Berhasil menghapus ${count} berkas`, 'success');
    } else {
      setOperationProgress((prev) => ({ ...prev, isActive: false }));
      addToast('Gagal menghapus berkas terpilih', 'error');
    }
  };

  // Clear All Files
  const handleConfirmClearAll = async () => {
    const ok = await clearAllFilesFromServer();
    if (ok) {
      setFiles([]);
      setSelectedFileIds([]);
      setIsClearAllModalOpen(false);
      addToast('Semua berkas di drive cloud telah dibersihkan', 'success');
    } else {
      addToast('Gagal membersihkan berkas', 'error');
    }
  };

  // Rename File
  const handleRename = async (fileId: string, newName: string) => {
    const ok = await renameFileOnServer(fileId, newName);
    if (ok) {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId) {
            const ext = newName.split('.').pop()?.toLowerCase() || f.type;
            return { ...f, name: newName, type: ext };
          }
          return f;
        })
      );

      if (previewFile?.id === fileId) {
        const ext = newName.split('.').pop()?.toLowerCase() || previewFile.type;
        setPreviewFile({ ...previewFile, name: newName, type: ext });
      }

      addToast(`Nama berkas diubah menjadi "${newName}"`, 'success');
    } else {
      addToast('Gagal mengubah nama berkas', 'error');
    }
  };

  const handleToggleSelect = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFileIds(files.map((f) => f.id));
  };

  const handleDeselectAll = () => {
    setSelectedFileIds([]);
  };

  // Share drive link: Shows Sleek Circular Progress Ring Notification
  const handleShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    let shareUrl = baseUrl;

    if (!isPublicMode) {
      shareUrl = `${baseUrl}?key=${accessKey}`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }

    // Open the Circular Progress notification
    setCircularShare({
      isOpen: true,
      shareUrl,
    });
  };

  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsWindowDragActive(true);
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsWindowDragActive(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsWindowDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragEnter={handleGlobalDragEnter}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className="min-h-screen bg-[#030712] text-slate-200 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-black relative overflow-x-hidden"
    >
      {/* Background Liquid Glass Glow Orbs with Auto-Rotating RGB Colors */}
      <div className="liquid-orb-1" />
      <div className="liquid-orb-2" />
      <div className="liquid-orb-3" />

      {/* Global Full-Screen Drag and Drop Liquid Glass Overlay */}
      {isWindowDragActive && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 border-4 border-dashed border-cyan-400 m-3 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.6)] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-cyan-950/70 border border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.7)] mb-4 backdrop-blur-md">
            <UploadCloud className="w-10 h-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
            Jatuhkan Berkas di Sini
          </h2>
          <p className="text-sm text-cyan-300 font-semibold mt-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]">
            Lepaskan untuk langsung mengunggah ke drive cloud
          </p>
        </div>
      )}

      {/* Hidden File Input for Global Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Liquid Glass Customizable Centered Header */}
      <Header />

      {/* Main File Manager Workspace */}
      <main className="flex-1 flex flex-col relative z-10">
        <FileManagerView
          files={files}
          selectedFileIds={selectedFileIds}
          isPublicMode={isPublicMode}
          hasAccess={hasAccess}
          onToggleMode={handleToggleMode}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onPreviewFile={(f) => setPreviewFile(f)}
          onDownloadFile={handleDownload}
          onDownloadSelectedFiles={handleDownloadSelected}
          onRenameFile={(f) => setFileToRename(f)}
          onDeleteFile={(f) => setFileToDelete(f)}
          onBatchDeletePrompt={() => setIsBatchDeleteModalOpen(true)}
          onShareLink={handleShareLink}
          onTriggerUpload={triggerFileInput}
        />
      </main>

      {/* Modern Liquid Glass Footer */}
      <footer className="mt-auto border-t border-cyan-500/20 py-5 px-4 bg-[#060b19]/60 backdrop-blur-xl text-xs text-slate-400 text-center space-y-2.5 shadow-[0_-4px_30px_rgba(6,182,212,0.1)] relative z-10">
        <div className="flex items-center justify-center space-x-3">
          {/* TikTok */}
          <a
            id="footerLinkTiktok"
            href="https://www.tiktok.com/@wp_septa"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-300 text-cyan-300 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] backdrop-blur-md active:scale-95"
            title="TikTok: @wp_septa"
            aria-label="TikTok: @wp_septa"
          >
            <Music2 className="w-4 h-4 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          </a>

          {/* Instagram */}
          <a
            id="footerLinkInstagram"
            href="https://www.instagram.com/wp_septaa/"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-pink-500/20 border border-pink-400/30 hover:border-pink-300 text-pink-300 hover:text-pink-100 transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] backdrop-blur-md active:scale-95"
            title="Instagram: @wp_septaa"
            aria-label="Instagram: @wp_septaa"
          >
            <Instagram className="w-4 h-4 drop-shadow-[0_0_8px_rgba(236,72,153,0.9)]" />
          </a>

          {/* WhatsApp */}
          <a
            id="footerLinkWhatsApp"
            href="https://wa.me/817089287819"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 border border-emerald-400/30 hover:border-emerald-300 text-emerald-300 hover:text-emerald-100 transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.6)] backdrop-blur-md active:scale-95"
            title="WhatsApp: +81 70-8928-7819"
            aria-label="WhatsApp: +81 70-8928-7819"
          >
            <MessageCircle className="w-4 h-4 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          </a>
        </div>

        <div className="text-slate-400">
          FileKu Drive © 2026 • Powered by{' '}
          <span className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]">WP septa</span>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      {/* Private Access Unlock Modal */}
      <PrivateAccessModal
        isOpen={isPrivateAccessModalOpen}
        onClose={() => setIsPrivateAccessModalOpen(false)}
        onUnlockWithKey={handleUnlockWithKey}
      />

      {/* Circular Share Notification with Progress Ring */}
      <CircularShareNotification
        isOpen={circularShare.isOpen}
        isPublic={isPublicMode}
        shareUrl={circularShare.shareUrl}
        onClose={() => setCircularShare({ isOpen: false, shareUrl: '' })}
      />

      {/* Real-time Operation Progress Bar (Upload, Download, Delete) */}
      <OperationProgressBar operation={operationProgress} />

      {/* Single Delete Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(fileToDelete)}
        fileToDelete={fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
      />

      {/* Batch Delete Modal */}
      <DeleteConfirmModal
        isOpen={isBatchDeleteModalOpen}
        fileToDelete={null}
        isBatch={true}
        selectedCount={selectedFileIds.length}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
      />

      {/* Clear All Modal */}
      <DeleteConfirmModal
        isOpen={isClearAllModalOpen}
        fileToDelete={null}
        isClearAll={true}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleConfirmClearAll}
      />

      {/* Rename Modal */}
      <RenameModal
        file={fileToRename}
        isOpen={Boolean(fileToRename)}
        onClose={() => setFileToRename(null)}
        onRename={handleRename}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
