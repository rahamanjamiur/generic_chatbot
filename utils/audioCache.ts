
/**
 * IndexedDB-based audio cache utility.
 * Replaces the previous localStorage implementation to support larger audio
 * blobs and string-keyed entries (e.g. fixed messages like the error prompt).
 */

const DB_NAME = 'chatbot_audio_cache';
const STORE_NAME = 'audio';
const DB_VERSION = 1;

// Fixed cache key for the error fallback message audio
export const ERROR_MESSAGE_CACHE_KEY = '__error_message__';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME); // key-path is the key parameter
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
      dbPromise = null; // Allow retry on next call
    };
  });

  return dbPromise;
};

type CacheKey = number | string;

const toKey = (key: CacheKey): string =>
  typeof key === 'number' ? `msg_${key}` : key;

export const saveAudioToPersistentCache = async (
  key: CacheKey,
  audioData: string,
): Promise<void> => {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(audioData, toKey(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Failed to save audio to IndexedDB:', error);
  }
};

export const getAudioFromPersistentCache = async (
  key: CacheKey,
): Promise<string | null> => {
  try {
    const db = await getDB();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(toKey(key));
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Failed to read audio from IndexedDB:', error);
    return null;
  }
};

export const clearAudioFromPersistentCache = async (
  key: CacheKey,
): Promise<void> => {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(toKey(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Failed to clear audio from IndexedDB:', error);
  }
};
