import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const AuthContext = createContext(null);

// Human-readable error messages — straightforward tone (no RPG flavoring)
const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Incorrect username or password.',
  'auth/invalid-login-credentials': 'Incorrect username or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'No internet connection — check your connection and try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'USERNAME_TAKEN': 'Username already taken.',
  'INVALID_CREDENTIALS': 'Incorrect username or password.',
  'REGISTRATION_FAILED': 'Registration failed. Please try again.',
};

export function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error.code || error.message] || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthResolved(true);

      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserProfile(userDoc.exists() ? userDoc.data() : null);
      } else {
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  // Register with username uniqueness check and atomic Firestore batch write.
  // Cleans up orphaned auth account if the Firestore write fails (Pitfall 4).
  // Manually sets userProfile after success to avoid race condition where
  // onAuthStateChanged fires before Firestore write completes (Pitfall 5).
  async function register(username, email, password) {
    const usernameLower = username.toLowerCase();

    // Validate username format: 3-20 chars, letters/numbers/underscores only
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw { code: 'auth/invalid-username', message: 'Username must be 3-20 characters (letters, numbers, underscores only).' };
    }

    // Check username availability
    const usernameDoc = await getDoc(doc(db, 'usernames', usernameLower));
    if (usernameDoc.exists()) {
      throw { code: 'USERNAME_TAKEN' };
    }

    // Create Firebase Auth account
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Atomic Firestore batch write: username reservation + user profile
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames', usernameLower), { uid: cred.user.uid });
    batch.set(doc(db, 'users', cred.user.uid), {
      username,
      usernameLower,
      email,
      createdAt: new Date(),
    });

    try {
      await batch.commit();
    } catch {
      // Clean up orphaned auth account if Firestore write fails
      await cred.user.delete();
      throw { code: 'REGISTRATION_FAILED' };
    }

    // Manually set userProfile to avoid onAuthStateChanged race condition
    const profileData = { username, usernameLower, email, createdAt: new Date() };
    setUserProfile(profileData);

    return cred;
  }

  // Login via username — looks up email from Firestore, then signs in.
  // Throws INVALID_CREDENTIALS if username not found (does not reveal whether
  // username exists or whether the password was wrong — email enumeration protection).
  async function login(username, password) {
    const usernameLower = username.toLowerCase();

    const usernameDoc = await getDoc(doc(db, 'usernames', usernameLower));
    if (!usernameDoc.exists()) {
      throw { code: 'INVALID_CREDENTIALS' };
    }

    const { uid } = usernameDoc.data();
    const userDoc = await getDoc(doc(db, 'users', uid));
    const { email } = userDoc.data();

    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout and clear localStorage save slots to prevent data leakage on shared devices.
  async function logout() {
    await signOut(auth);
    localStorage.removeItem('saveSlot1');
    localStorage.removeItem('saveSlot2');
    localStorage.removeItem('saveSlot3');
    setUserProfile(null);
  }

  // Send password reset email. Does not confirm whether the email exists
  // (email enumeration protection).
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  const value = {
    currentUser,
    authResolved,
    userProfile,
    register,
    login,
    logout,
    resetPassword,
    getAuthErrorMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
