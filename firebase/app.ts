import { getApps, initializeApp } from "firebase/app";

const config = {
  projectId: 'glasto-io',
  authDomain: "glasto-io.firebaseapp.com",
  apiKey: 'AIzaSyC01tM71IqRQ1xK324PH8bWLRJcmYiEdzQ'
}

const apps = getApps();

const app = apps[0] ?? initializeApp(config);

export default app;
