import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from '@firebase/firestore';

const apps = getApps();

if (!apps.length) {
  initializeApp({
    projectId: 'glasto-io', authDomain: "glasto-io.firebaseapp.com",
    apiKey: 'AIzaSyC01tM71IqRQ1xK324PH8bWLRJcmYiEdzQ'
  });
}

export const db = getFirestore();
