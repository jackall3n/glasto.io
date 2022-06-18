import { useEffect, useMemo, useState } from "react";
import { collection, CollectionReference, DocumentReference, onSnapshot, query } from "firebase/firestore";
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

  const col = useMemo(() => {
    if (invalid) {
      return undefined;
    }

    return collection(db, path) as CollectionReference<T>
  }, [path, invalid]);

  useEffect(() => {
    if (!col) {
      return;
    }

    const q = where ? query(col, where) : query(col);

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
  }, [col, where, path])

  return [data, col] as const;
}
