import { NextApiRequest, NextApiResponse } from "next";
import admin from "../../../firebase/admin";
import { addMinutes } from "date-fns";
import axios, { AxiosInstance } from "axios";
import { chunk } from "lodash";

export default async function update(request: NextApiRequest, response: NextApiResponse) {
  const ref = admin.firestore().doc(`users/${request.query.id}/integrations/spotify`);
  const doc = await ref.get()

  if (!doc.exists) {
    console.log("NOT_LINKED TRACKS")
    return response.json({ status: 'NOT_LINKED' })
  }

  return response.json({ status: 'NOT_ACTIVE' })

  const spotify = doc.data();

  if (spotify.lastUpdateStarted?.toDate() > addMinutes(new Date(), -5)) {
    console.log("USING_CACHED TRACKS")
    return response.json({ status: 'USING_CACHED' })
  }

  const version = (spotify.version ?? 0) + 1;

  console.log("UPDATING TRACKS")
  response.json({ status: "UPDATING" })

  try {
    await ref.set({ lastUpdateStarted: new Date(), version }, { merge: true })

    const api = new Spotify(spotify.access_token);

    const playlists = await api.getPlaylists();

    const filtered = playlists.filter(playlist => playlist.id)

    const chunked = chunk(filtered, 400);

    console.log(playlists.length, filtered.length)
    console.log(playlists[0])

    const doc = await admin.firestore().collection('artists').get();
    const spotifyIds = doc.docs.map(d => d.data().spotifyId).filter(Boolean);

    for (const playlists of chunked) {
      const batch = admin.firestore().batch();

      for (const playlist of playlists) {
        const tracks = await api.getPlaylistTracks(playlist.id);

        const artists = [];

        const chunked = chunk(tracks, 400);

        for (const tracks of chunked) {
          console.log('chunk size', tracks.length);

          for (const { track } of tracks) {
            if (!track) {
              continue;
            }

            for (const artist of track.album.artists.filter(artist => spotifyIds.includes(artist.id))) {
              artists.push({
                ...artist,
                album: {
                  id: track.album.id,
                  image: track.album.images[0],
                },
              })
            }
          }
        }

        if (artists.length) {
          batch.set(ref.collection('playlists').doc(playlist.id), {
            ...playlist,
            artists,
            version
          })
        }
      }

      await batch.commit();
    }

    const { docs } = await ref.collection('playlists')
      .where('version', '!=', version)
      .get()

    console.log('Found', docs.length, 'playlists to delete');

    for (const _docs of chunk(docs, 100)) {
      const batch = admin.firestore().batch();

      for (const doc of _docs) {
        batch.delete(doc.ref);
      }

      await batch.commit();
    }

    // ref.collection('playlists').


  } catch (e) {
    console.error(e);
  }
}

class Spotify {
  http: AxiosInstance;

  constructor(accessToken: string) {
    this.http = axios.create({
      baseURL: `https://api.spotify.com/v1`,
      headers: {

        Authorization: `Bearer ${accessToken}`
      }
    })
  }

  async getPlaylists() {

    const playlists = [];

    let next = '/me/playlists'

    do {
      const result = await this.get(next)

      playlists.push(...result.items);
      next = result.next;
    }
    while (next)

    return playlists;
  }

  async getPlaylistTracks(id: string) {

    const tracks = [];

    let next = `/playlists/${id}/tracks`

    do {
      const result = await this.get(next)

      tracks.push(...result.items);
      next = result.next;
    }
    while (next)

    return tracks;
  }

  async get(url: string) {
    console.log('GET', url);

    const { data } = await this.http.get(url);
    return data;
  }
}
