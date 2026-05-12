
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, DocumentReference, Firestore } from 'firebase/firestore';
import { useFirebase } from '../provider';

export function useDoc<T = any>(path: string | null) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !path) {
      setLoading(false);
      return;
    }

    const docRef = doc(firestore, path);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.exists() ? (snapshot.data() as T) : null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firestore, path]);

  return { data, loading, error };
}
