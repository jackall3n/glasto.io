import { enableIndexedDbPersistence, getFirestore } from "@firebase/firestore";
import app from "./app";

export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(error => {
    console.log(error);
  })
}
