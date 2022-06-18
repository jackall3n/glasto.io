import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import qs from "qs";

import { parseCookies } from "nookies";
import admin from "../../../firebase/admin";

export default async function redirect(request: NextApiRequest, response: NextApiResponse) {
  try {
    const { code, state = '/' } = request.query;

    console.log({ code, state })

    const { GLASTO_AUTH_TOKEN } = parseCookies({ req: request }) ?? {};

    const user = await admin.auth().verifyIdToken(GLASTO_AUTH_TOKEN)

    if (!user) {
      return response.json({ redirect: '/spotify/failed' })
    }

    const { data } = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      code,
      redirect_uri: `${process.env.VERCEL_URL}/spotify/redirect`,
      grant_type: 'authorization_code'
    }), {
      auth: {
        username: process.env.SPOTIFY_CLIENT_ID,
        password: process.env.SPOTIFY_CLIENT_SECRET,
      }
    })

    const ref = admin.firestore().doc(`users/${user.uid}/integrations/spotify`);

    await ref.set({ ...data, updated: new Date() });
    await admin.firestore().doc(`users/${user.uid}`).set({ spotify: ref }, { merge: true })

    download(user.uid);

    response.json({ redirect: state })
  } catch (e) {
    console.error(e);

    response.json({ redirect: '/spotify/failed' })
  }
}

async function download(uid: string) {
  const ref = admin.firestore().doc(`users/${uid}/integrations/spotify`);
  const doc = await ref.get()
  const spotify = doc.data();

  console.log(spotify);
}
