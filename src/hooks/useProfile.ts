import { useState } from 'react';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDisplayName = async (firstName: string, lastName: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName, firstName, lastName });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string | undefined> => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          try {
            const base64String = reader.result as string;
            
            // Note: Very large images may exceed Firestore's 1MB document limit,
            // but for a profile picture, it usually works if the file isn't huge.
            // We DO NOT update Auth profile photoURL because it enforces a strict URL length limit and will crash with base64.
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { photoURL: base64String });
            
            setLoading(false);
            resolve(base64String);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (e: any) {
            setError(e.message);
            setLoading(false);
            reject(e);
          }
        };
        reader.onerror = () => {
          const errMsg = "Failed to convert image to base64";
          setError(errMsg);
          setLoading(false);
          reject(new Error(errMsg));
        };
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const deleteProfilePicture = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: deleteField() });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
      // Sign user out — auth state listener will redirect to login
      await signOut(auth);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelAccountDeletion = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isDeleted: false,
        deletedAt: null,
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateDisplayName,
    uploadProfilePicture,
    deleteProfilePicture,
    deleteAccount,
    cancelAccountDeletion,
    loading,
    error,
  };
}
