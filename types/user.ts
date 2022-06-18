import { DocumentReference, Timestamp } from "firebase/firestore";

export interface IUser {
  id: string;
  choices?: string[];
  photoURL: string | null;
  displayName: string | null;
  groups?: string[]
  spotify?: DocumentReference;
}

export interface IGroup {
  id: string;
  lastSeen?: Timestamp;
  created?: Timestamp;
  createdBy?: {
    id?: string;
    name: string;
  };
}
