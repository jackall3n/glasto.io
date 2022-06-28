import { useEffect, useMemo, useState } from "react";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  onSnapshot,
  query,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { pullAt } from "lodash";
import { db } from "../firebase/firestore";
import { QueryConstraint } from "@firebase/firestore";

type Base<T> = {
  id: string;
  ref: DocumentReference<T>
}
export type TDecorated<T> = T & Base<T>;

export function useCollection<T>(name: string | Array<any>, where?: QueryConstraint, map?: (data: any) => T) {
  const [data, setData] = useState<TDecorated<T>[]>([]);

  const path = (Array.isArray(name) ? name : [name]).join('/');
  const invalid = !name || (Array.isArray(name) && name.some(path => !Boolean(path)));

  const reference = useMemo(() => {
    if (invalid) {
      return undefined;
    }

    return collection(db, path) as CollectionReference<T>
  }, [path, invalid]);

  useEffect(() => {
    if (!reference) {
      return;
    }

    const q = where ? query(reference, where) : query(reference);

    return onSnapshot(q, snapshot => {
      setData(data => {
        const updated = [...data];

        for (const change of snapshot.docChanges()) {
          const index = updated.findIndex(({ id }) => id === change.doc.id);

          switch (change.type) {
            case "modified":
            case "added": {
              const data = change.doc.data();

              const datum = {
                id: change.doc.id,
                ref: change.doc.ref,
                ...(map ? map(data) : data)
              }

              if (index === -1) {
                updated.push(datum);
              } else {
                updated[index] = datum;
              }

              break;
            }
            case "removed": {
              pullAt(updated, index);
            }
          }
        }

        console.log(path, updated.length);

        return updated;
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, where, path])

  const helpers = {
    async add(id: string | number, data?: T) {
      const ref = doc<T>(reference, String(id))
      await setDoc(ref, data)
    }
  }

  return [data, reference, helpers] as const;
}
