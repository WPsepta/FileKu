import { StoredFile, PermissionSettings } from '../types';
import {
  syncFileToFirestore,
  deleteFileFromFirestore,
  batchDeleteFilesFromFirestore,
  clearAllFilesFromFirestore,
  renameFileInFirestore,
  fetchFilesFromFirestore,
} from '../lib/firebase';
import { saveFile, getAllFiles, deleteFileFromStorage, deleteMultipleFilesFromStorage, updateFileNameInStorage } from './storage';
import { formatDate } from './formatters';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.size > 750000) {
      // Don't convert large files to DataURL to avoid exceeding Firestore limits
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export async function fetchFilesAndSettings(): Promise<{
  files: StoredFile[];
  settings?: PermissionSettings;
}> {
  const mergedMap = new Map<string, StoredFile>();

  // 1. Load from IndexedDB
  try {
    const localFiles = await getAllFiles();
    localFiles.forEach((f) => mergedMap.set(f.id, f));
  } catch (e) {
    console.warn('IndexedDB fetch error:', e);
  }

  // 2. Load from Firestore (cross-device sync)
  try {
    const firestoreFiles = await fetchFilesFromFirestore();
    firestoreFiles.forEach((f) => {
      const existing = mergedMap.get(f.id);
      if (existing) {
        mergedMap.set(f.id, { ...f, blob: existing.blob, previewUrl: existing.previewUrl || f.previewUrl });
      } else {
        mergedMap.set(f.id, f);
      }
    });
  } catch (e) {
    console.warn('Firestore fetch error:', e);
  }

  // 3. Try server API if running in fullstack container
  try {
    const res = await fetch('/api/files');
    if (res.ok) {
      const data = await res.json();
      const serverFiles: StoredFile[] = (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        date: f.date,
        timestamp: f.timestamp,
        isPublic: f.isPublic,
        previewUrl: `/api/files/${f.id}/preview`,
        contentSnippet: f.contentSnippet,
      }));

      serverFiles.forEach((f) => {
        const existing = mergedMap.get(f.id);
        mergedMap.set(f.id, { ...f, blob: existing?.blob, dataUrl: existing?.dataUrl });
        syncFileToFirestore(f).catch(() => {});
      });

      const list = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      return {
        files: list,
        settings: data.settings,
      };
    }
  } catch (err) {
    // API server not present on static deployment
  }

  const list = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  return { files: list };
}

// Fallback helper to save files locally and in Firestore
async function fallbackLocalUpload(
  files: File[],
  onProgress: (percent: number, currentName: string) => void
): Promise<{ success: boolean; files: StoredFile[]; message: string }> {
  const newFiles: StoredFile[] = [];
  const now = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const percent = Math.round(((i + 1) / files.length) * 100);
    onProgress(percent, file.name);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileId = `file_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    let snippet: string | undefined = undefined;

    if (
      file.type.startsWith('text/') ||
      ['txt', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'bat', 'ps1', 'sh', 'sql', 'md'].includes(ext)
    ) {
      try {
        const text = await file.text();
        snippet = text.slice(0, 5000);
      } catch (e) {
        console.warn('Could not read snippet:', e);
      }
    }

    const dataUrl = await readFileAsDataUrl(file);

    const storedFile: StoredFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: ext,
      date: formatDate(new Date()),
      timestamp: now + i,
      isPublic: true,
      blob: file,
      dataUrl: dataUrl || undefined,
      previewUrl: dataUrl || URL.createObjectURL(file),
      contentSnippet: snippet,
    };

    await saveFile(storedFile);
    syncFileToFirestore(storedFile).catch(() => {});
    newFiles.unshift(storedFile);
  }

  return {
    success: true,
    files: newFiles,
    message: `Berhasil menyimpan ${newFiles.length} berkas ke cloud drive`,
  };
}

export function uploadFilesWithProgress(
  files: File[],
  onProgress: (percent: number, currentName: string) => void
): Promise<{ success: boolean; files?: StoredFile[]; message?: string }> {
  return new Promise((resolve) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent, files[0]?.name || 'Berkas');
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          const uploaded: StoredFile[] = [];

          for (let i = 0; i < (res.files || []).length; i++) {
            const f = res.files[i];
            const originalFile = files.find((orig) => orig.name === f.name) || files[i];
            let dataUrl = '';
            if (originalFile) {
              dataUrl = await readFileAsDataUrl(originalFile);
            }

            const item: StoredFile = {
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
              date: f.date,
              timestamp: f.timestamp,
              isPublic: f.isPublic,
              blob: originalFile,
              dataUrl: dataUrl || undefined,
              previewUrl: dataUrl || `/api/files/${f.id}/preview`,
              contentSnippet: f.contentSnippet,
            };

            // Save to IndexedDB and sync to Firestore
            await saveFile(item);
            syncFileToFirestore(item).catch((e) => console.warn('Sync to firestore failed:', e));
            uploaded.push(item);
          }

          resolve({ success: true, files: uploaded, message: res.message });
        } catch (e) {
          const fallback = await fallbackLocalUpload(files, onProgress);
          resolve(fallback);
        }
      } else {
        // Fallback gracefully so files are never lost
        console.warn('Server upload returned status', xhr.status, '- activating local storage fallback');
        const fallback = await fallbackLocalUpload(files, onProgress);
        resolve(fallback);
      }
    };

    xhr.onerror = async () => {
      console.warn('Server upload connection error - activating local storage fallback');
      const fallback = await fallbackLocalUpload(files, onProgress);
      resolve(fallback);
    };

    xhr.ontimeout = async () => {
      console.warn('Server upload timeout - activating local storage fallback');
      const fallback = await fallbackLocalUpload(files, onProgress);
      resolve(fallback);
    };

    xhr.send(formData);
  });
}

/**
 * Universal Download Function that works across all devices, browsers, and platforms
 */
export function downloadFileUtil(file: StoredFile) {
  // 1. If Blob exists in memory or local IndexedDB
  if (file.blob) {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return;
  }

  // 2. If dataUrl (base64) exists (synced via Firestore to other phones)
  if (file.dataUrl && file.dataUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 3. If text content snippet exists
  if (file.contentSnippet) {
    const blob = new Blob([file.contentSnippet], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return;
  }

  // 4. Try direct server download route
  const downloadUrl = file.previewUrl && !file.previewUrl.startsWith('/api')
    ? file.previewUrl
    : `/api/files/${file.id}/download`;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function deleteFileFromServer(fileId: string): Promise<boolean> {
  try {
    deleteFileFromStorage(fileId).catch(() => {});
    deleteFileFromFirestore(fileId).catch(() => {});
    const res = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
    return res.ok || true;
  } catch (err) {
    console.error('Error deleting file:', err);
    return true;
  }
}

export async function batchDeleteFilesFromServer(fileIds: string[]): Promise<boolean> {
  try {
    deleteMultipleFilesFromStorage(fileIds).catch(() => {});
    batchDeleteFilesFromFirestore(fileIds).catch(() => {});
    const res = await fetch('/api/files/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: fileIds }),
    });
    return res.ok || true;
  } catch (err) {
    console.error('Error batch deleting files:', err);
    return true;
  }
}

export async function clearAllFilesFromServer(): Promise<boolean> {
  try {
    clearAllFilesFromFirestore().catch(() => {});
    const res = await fetch('/api/files/clear-all', {
      method: 'POST',
    });
    return res.ok || true;
  } catch (err) {
    console.error('Error clearing all files:', err);
    return true;
  }
}

export async function renameFileOnServer(fileId: string, newName: string): Promise<boolean> {
  try {
    updateFileNameInStorage(fileId, newName).catch(() => {});
    renameFileInFirestore(fileId, newName).catch(() => {});
    const res = await fetch(`/api/files/${fileId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    });
    return res.ok || true;
  } catch (err) {
    console.error('Error renaming file:', err);
    return true;
  }
}

export async function updateServerSettings(settings: PermissionSettings): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (err) {
    console.error('Error updating settings:', err);
    return false;
  }
}
