import { AppState } from './types.ts';

const DB_NAME = 'StudyGuruDB';
const DB_VERSION = 1;
const STORE_STATE = 'app_state';
const STORE_FILES = 'material_files';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject('Error opening DB');
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
    };
  });
};

export const saveState = async (state: AppState) => {
  const db = await initDB();
  const tx = db.transaction(STORE_STATE, 'readwrite');
  tx.objectStore(STORE_STATE).put(state, 'current');
  return new Promise((resolve) => (tx.oncomplete = resolve));
};

export const loadState = async (): Promise<AppState | null> => {
  const db = await initDB();
  const tx = db.transaction(STORE_STATE, 'readonly');
  const request = tx.objectStore(STORE_STATE).get('current');
  return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
};

export const saveFile = async (key: string, blob: Blob) => {
  const db = await initDB();
  const tx = db.transaction(STORE_FILES, 'readwrite');
  tx.objectStore(STORE_FILES).put(blob, key);
  return new Promise((resolve) => (tx.oncomplete = resolve));
};

export const getFile = async (key: string): Promise<Blob | null> => {
  const db = await initDB();
  const tx = db.transaction(STORE_FILES, 'readonly');
  const request = tx.objectStore(STORE_FILES).get(key);
  return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
};

export const deleteFile = async (key: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_FILES, 'readwrite');
  tx.objectStore(STORE_FILES).delete(key);
  return new Promise((resolve) => (tx.oncomplete = resolve));
};