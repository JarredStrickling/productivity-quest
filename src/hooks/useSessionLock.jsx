import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const deviceId = crypto.randomUUID();

export function useSessionLock(uid) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isCheckingLock, setIsCheckingLock] = useState(true);
  const heartbeatRef = useRef(null);

  const clearHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const startHeartbeat = (lockUid) => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(async () => {
      try {
        await setDoc(doc(db, 'sessions', lockUid), {
          deviceId,
          lockedAt: serverTimestamp(),
        });
      } catch (err) {
        // Silently ignore heartbeat failures — session will expire naturally
        console.warn('[useSessionLock] Heartbeat failed:', err);
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  const acquireLock = async (lockUid) => {
    setIsCheckingLock(true);
    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', lockUid));
      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        const lockedAt = data.lockedAt?.toDate?.() ?? new Date(0);
        const age = Date.now() - lockedAt.getTime();
        if (age < SESSION_TIMEOUT_MS && data.deviceId !== deviceId) {
          setIsBlocked(true);
          setIsCheckingLock(false);
          return;
        }
      }
      await setDoc(doc(db, 'sessions', lockUid), {
        deviceId,
        lockedAt: serverTimestamp(),
      });
      setIsBlocked(false);
      setIsCheckingLock(false);
      startHeartbeat(lockUid);
    } catch (err) {
      console.error('[useSessionLock] acquireLock failed:', err);
      setIsCheckingLock(false);
    }
  };

  const releaseLock = async (lockUid) => {
    clearHeartbeat();
    if (!lockUid) return;
    try {
      await deleteDoc(doc(db, 'sessions', lockUid));
    } catch (err) {
      console.warn('[useSessionLock] releaseLock failed:', err);
    }
  };

  useEffect(() => {
    if (!uid) {
      // User logged out — release lock for the previous uid is handled by caller
      setIsCheckingLock(false);
      setIsBlocked(false);
      return;
    }

    acquireLock(uid);

    return () => {
      // On unmount or uid change — release the lock
      releaseLock(uid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return { isBlocked, isCheckingLock, acquireLock: () => acquireLock(uid), releaseLock: () => releaseLock(uid) };
}
