import { StoredFile } from '../types';
import { formatDate } from './formatters';

const DB_NAME = 'FileKuDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Initial default demo files if fresh storage
const DEFAULT_FILES: Omit<StoredFile, 'blob'>[] = [
  {
    id: 'file_demo_1',
    name: 'setup-cloud-env.ps1',
    size: 2450,
    type: 'ps1',
    date: formatDate(new Date(Date.now() - 3600000 * 5)),
    timestamp: Date.now() - 3600000 * 5,
    isPublic: true,
    contentSnippet: '# FileKu Cloud Storage Automated Config\nWrite-Host "Initializing cloud storage sync..." -ForegroundColor Cyan\nSet-Location -Path "$HOME/FileKuDrive"\nWrite-Host "Environment configured successfully!" -ForegroundColor Green'
  },
  {
    id: 'file_demo_2',
    name: 'catatan-proyek-fileku.txt',
    size: 890,
    type: 'txt',
    date: formatDate(new Date(Date.now() - 3600000 * 12)),
    timestamp: Date.now() - 3600000 * 12,
    isPublic: true,
    contentSnippet: 'Dokumentasi FileKu Cloud Storage\n- Unggah berkas cepat dengan drag and drop\n- Hapus berkas dengan satu klik atau sekaligus (batch delete)\n- Pratinjau langsung untuk gambar & kode teks\n- Unduh kembali berkas asli kapan saja'
  },
  {
    id: 'file_demo_3',
    name: 'backup-database-script.bat',
    size: 1420,
    type: 'bat',
    date: formatDate(new Date(Date.now() - 3600000 * 24)),
    timestamp: Date.now() - 3600000 * 24,
    isPublic: true,
    contentSnippet: '@echo off\n:: FileKu Automatic Local Backup\necho Starting FileKu Storage Backup...\nmkdir backup_data 2>nul\necho Backup completed at %date% %time%.\npause'
  }
];

export async function getAllFiles(): Promise<StoredFile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        let results: StoredFile[] = request.result || [];
        
        // If first time and no files, seed default demo files
        const hasInitialized = localStorage.getItem('fileku_initialized');
        if (results.length === 0 && !hasInitialized) {
          localStorage.setItem('fileku_initialized', 'true');
          const seededFiles: StoredFile[] = [];
          for (const item of DEFAULT_FILES) {
            const blob = new Blob([item.contentSnippet || ''], { type: 'text/plain' });
            const seededFile: StoredFile = {
              ...item,
              blob,
              previewUrl: URL.createObjectURL(blob)
            };
            await saveFile(seededFile);
            seededFiles.push(seededFile);
          }
          resolve(seededFiles);
          return;
        }

        // Attach preview URLs for blob items
        const prepared = results.map(f => {
          if (f.blob) {
            try {
              f.previewUrl = URL.createObjectURL(f.blob);
            } catch (e) {
              console.error('Failed to create preview url', e);
            }
          }
          return f;
        });

        // Sort descending by timestamp
        prepared.sort((a, b) => b.timestamp - a.timestamp);
        resolve(prepared);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Falling back from IndexedDB:', err);
    return [];
  }
}

export async function saveFile(file: StoredFile): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Store file with blob
      const fileToSave = {
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        date: file.date,
        timestamp: file.timestamp,
        isPublic: file.isPublic,
        blob: file.blob,
        contentSnippet: file.contentSnippet
      };

      const request = store.put(fileToSave);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Error saving file:', err);
    return false;
  }
}

export async function saveMultipleFiles(files: StoredFile[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      files.forEach((file) => {
        const fileToSave = {
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          date: file.date,
          timestamp: file.timestamp,
          isPublic: file.isPublic,
          blob: file.blob,
          contentSnippet: file.contentSnippet
        };
        store.put(fileToSave);
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Error saving multiple files:', err);
    return false;
  }
}

export async function deleteFileFromStorage(fileId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(fileId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    return false;
  }
}

export async function deleteMultipleFilesFromStorage(fileIds: string[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      fileIds.forEach((id) => {
        store.delete(id);
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Error batch deleting files:', err);
    return false;
  }
}

export async function updateFileNameInStorage(fileId: string, newName: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(fileId);
      
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) {
          resolve(false);
          return;
        }
        item.name = newName;
        const ext = newName.split('.').pop()?.toLowerCase() || item.type;
        item.type = ext;
        store.put(item);
      };
      
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Error updating file name:', err);
    return false;
  }
}
