import { getApps, initializeApp } from "firebase/app";

const config = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
}

const apps = getApps();

const app = apps[0] ?? initializeApp(config);

export default app;
