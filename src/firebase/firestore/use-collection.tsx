
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query, Firestore } from 'firebase/firestore';
import { useFirebase } from '../provider';

export function useCollection<T = any>(path: string | null) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !path) {
      setLoading(false);
      return;
    }

    const colRef = collection(firestore, path);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
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
