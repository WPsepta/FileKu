import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StoredFile } from '../types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const FILES_COLLECTION = 'files';

/**
 * Save / update file metadata and data in Firestore
 */
export async function syncFileToFirestore(file: StoredFile): Promise<void> {
  try {
    const docRef = doc(db, FILES_COLLECTION, file.id);
    const payload: Record<string, any> = {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      date: file.date,
      timestamp: file.timestamp,
      isPublic: file.isPublic ?? true,
      contentSnippet: file.contentSnippet || '',
    };

    // Store dataUrl if it's within Firestore's 1MB document limit
    if (file.dataUrl && file.dataUrl.length < 800000) {
      payload.dataUrl = file.dataUrl;
    }

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }
}

/**
 * Delete a file record from Firestore
 */
export async function deleteFileFromFirestore(fileId: string): Promise<void> {
  try {
    const docRef = doc(db, FILES_COLLECTION, fileId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}

/**
 * Batch delete files from Firestore
 */
export async function batchDeleteFilesFromFirestore(fileIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    fileIds.forEach((id) => {
      const docRef = doc(db, FILES_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch delete error:', err);
  }
}

/**
 * Clear all files in Firestore collection
 */
export async function clearAllFilesFromFirestore(): Promise<void> {
  try {
    const q = query(collection(db, FILES_COLLECTION));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore clear all error:', err);
  }
}

/**
 * Rename a file in Firestore
 */
export async function renameFileInFirestore(fileId: string, newName: string): Promise<void> {
  try {
    const ext = newName.split('.').pop()?.toLowerCase() || '';
    const docRef = doc(db, FILES_COLLECTION, fileId);
    await updateDoc(docRef, {
      name: newName,
      type: ext,
    });
  } catch (err) {
    console.warn('Firestore rename error:', err);
  }
}

/**
 * Subscribe to real-time changes in Firestore files collection
 */
export function subscribeToFiles(onUpdate: (files: StoredFile[]) => void) {
  try {
    const q = query(collection(db, FILES_COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const firestoreFiles: StoredFile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const previewUrl = data.dataUrl || `/api/files/${data.id || docSnap.id}/preview`;
          firestoreFiles.push({
            id: data.id || docSnap.id,
            name: data.name || 'Untitled',
            size: data.size || 0,
            type: data.type || 'bin',
            date: data.date || '',
            timestamp: data.timestamp || Date.now(),
            isPublic: data.isPublic ?? true,
            dataUrl: data.dataUrl || undefined,
            previewUrl: previewUrl,
            contentSnippet: data.contentSnippet || '',
          });
        });
        onUpdate(firestoreFiles);
      },
      (err) => {
        console.warn('Firestore subscription error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to Firestore:', err);
    return () => {};
  }
}

/**
 * Fetch all files directly from Firestore
 */
export async function fetchFilesFromFirestore(): Promise<StoredFile[]> {
  try {
    const q = query(collection(db, FILES_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const files: StoredFile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const previewUrl = data.dataUrl || `/api/files/${data.id || docSnap.id}/preview`;
      files.push({
        id: data.id || docSnap.id,
        name: data.name || 'Untitled',
        size: data.size || 0,
        type: data.type || 'bin',
        date: data.date || '',
        timestamp: data.timestamp || Date.now(),
        isPublic: data.isPublic ?? true,
        dataUrl: data.dataUrl || undefined,
        previewUrl: previewUrl,
        contentSnippet: data.contentSnippet || '',
      });
    });
    return files;
  } catch (err) {
    console.warn('Firestore fetch error:', err);
    return [];
  }
}

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'drive_permissions';

/**
 * Sync drive permission settings (Public / Private mode & accessKey) to Firestore
 */
export async function syncSettingsToFirestore(settings: {
  isPublic: boolean;
  accessKey: string;
}): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Firestore sync settings error:', err);
  }
}

/**
 * Fetch settings from Firestore
 */
export async function fetchSettingsFromFirestore(): Promise<{
  isPublic: boolean;
  accessKey: string;
} | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const q = query(collection(db, SETTINGS_COLLECTION));
    const snapshot = await getDocs(q);
    let result: { isPublic: boolean; accessKey: string } | null = null;
    snapshot.forEach((d) => {
      if (d.id === SETTINGS_DOC_ID) {
        const data = d.data();
        result = {
          isPublic: data.isPublic ?? true,
          accessKey: data.accessKey || '',
        };
      }
    });
    return result;
  } catch (err) {
    console.warn('Firestore fetch settings error:', err);
    return null;
  }
}

/**
 * Subscribe to real-time drive permission settings from Firestore
 */
export function subscribeToSettings(
  onUpdate: (settings: { isPublic: boolean; accessKey: string }) => void
) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate({
            isPublic: data.isPublic ?? true,
            accessKey: data.accessKey || '',
          });
        }
      },
      (err) => {
        console.warn('Firestore settings subscription error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to Firestore settings:', err);
    return () => {};
  }
}

