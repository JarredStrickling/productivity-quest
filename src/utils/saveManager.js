import { doc, collection, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Saves a full playerStats object to Firestore for the given user + slot.
 * Fire-and-forget: callers should NOT await this — it hangs offline.
 * Pass to saveWithRetry for error handling, or attach .catch() directly.
 *
 * @param {string} uid - Firebase user UID
 * @param {number|string} slotId - Save slot (1 or 2)
 * @param {Object} stats - Full playerStats object to persist
 * @returns {Promise<void>}
 */
export function saveCharacter(uid, slotId, stats) {
  const ref = doc(db, 'users', uid, 'characters', String(slotId));
  return setDoc(ref, { ...stats, savedAt: serverTimestamp() });
}

/**
 * Loads all character slots for a user from Firestore.
 * Returns an object keyed by slot number (1 and 2), with null for empty slots.
 *
 * @param {string} uid - Firebase user UID
 * @returns {Promise<{ 1: Object|null, 2: Object|null }>}
 */
export async function loadCharacterSlots(uid) {
  const slots = { 1: null, 2: null };
  const snapshot = await getDocs(collection(db, 'users', uid, 'characters'));
  snapshot.forEach((docSnap) => {
    const slotId = Number(docSnap.id);
    if (slotId === 1 || slotId === 2) {
      slots[slotId] = docSnap.data();
    }
  });
  return slots;
}

/**
 * Deletes a character slot document from Firestore and cleans up legacy localStorage.
 *
 * @param {string} uid - Firebase user UID
 * @param {number|string} slotId - Save slot to delete (1 or 2)
 * @returns {Promise<void>}
 */
export async function deleteCharacterSlot(uid, slotId) {
  await deleteDoc(doc(db, 'users', uid, 'characters', String(slotId)));
  localStorage.removeItem('saveSlot' + slotId);
}

/**
 * Wraps saveCharacter with exponential backoff retry (up to 3 attempts).
 *
 * On success: calls onWarning(false) to clear any active "cloud save unavailable" warning.
 * On all 3 failures: calls onWarning(true) to show the warning.
 *
 * Retry delays: 1s (attempt 0), 2s (attempt 1), 4s (attempt 2).
 * Uses setTimeout — not async/await — to avoid blocking callers.
 *
 * @param {string} uid - Firebase user UID
 * @param {number|string} slotId - Save slot (1 or 2)
 * @param {Object} stats - Full playerStats object to persist
 * @param {Function} onWarning - Callback: onWarning(true) shows warning, onWarning(false) clears it
 * @param {number} [attempt=0] - Current attempt index (0-based, used for recursion)
 */
export function saveWithRetry(uid, slotId, stats, onWarning, attempt = 0) {
  saveCharacter(uid, slotId, stats)
    .then(() => {
      onWarning(false);
    })
    .catch(() => {
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => {
          saveWithRetry(uid, slotId, stats, onWarning, attempt + 1);
        }, delay);
      } else {
        onWarning(true);
      }
    });
}
