import { useEffect, useMemo, useState } from "react";
import { collection, CollectionReference, DocumentReference, onSnapshot, query } from "firebase/firestore";
import { pullAt } from "lodash";
import { db } from "../firebase/firestore";

type Base<T> = {
  id: string;
  ref: DocumentReference<T>
}
type TDecorated<T> = T & Base<T>;

export function useCollection<T>(name: string) {
  const [data, setData] = useState<TDecorated<T>[]>([]);

  const col = useMemo(() => collection(db, name) as CollectionReference<T>, [name]);

  useEffect(() => {
    return onSnapshot(query(col), snapshot => {
      setData(data => {
        const updated = [...data];

        for (const change of snapshot.docChanges()) {
          const index = updated.findIndex(({ id }) => id === change.doc.id);

          switch (change.type) {
            case "modified":
            case "added": {
              const datum = {
                id: change.doc.id,
                ref: change.doc.ref,
                ...change.doc.data()
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

        return updated;
      })
    })
  }, [col])

  return [data, col] as const;
}
