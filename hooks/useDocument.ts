import { useEffect, useMemo, useState } from "react";
import { doc, DocumentReference, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firestore";

type Base<T> = {
  id: string;
  exists: boolean;
}

type TDecorated<T> = T & Base<T>;

export function useDocument<T>(collection: string, id: string) {
  const ref = useMemo(() => {
    if (!id) {
      return undefined;
    }

    return doc(db, collection, id) as DocumentReference<T>;
  }, [collection, id]);

  const [isValidating, setIsValidating] = useState(true);
  const [data, setData] = useState<TDecorated<T>>();

  useEffect(() => {
    if (!id) {
      return;
    }

    if (!ref) {
      return;
    }

    return onSnapshot(ref, doc => {
      setData(() => {
        setIsValidating(false);

        if (!doc.exists()) {
          return undefined;
        }

        return {
          id,
          ref,
          exists: true,
          ...doc.data()
        }
      })
    })
  }, [id, ref])

  async function update(update?: Partial<T>) {
    if (!ref) {
      console.warn("Ref is not yet set")
      return;
    }

    if (data) {
      return await updateDoc<T>(ref, update as any)
    }

    return setDoc(ref, update, { merge: true })
  }

  return [data, isValidating, ref, update] as const;
}
