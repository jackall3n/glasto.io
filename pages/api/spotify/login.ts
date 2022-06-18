import { NextApiRequest, NextApiResponse } from "next";
import querystring from "qs";

export default async function login(request: NextApiRequest, response: NextApiResponse) {

  const query = querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: 'user-read-private user-read-email playlist-read-private playlist-read-collaborative',
    redirect_uri: `${process.env.SPOTIFY_REDIRECT ?? process.env.VERCEL_URL}/spotify/redirect`,
    state: request.query.redirect
  })

  response.redirect('https://accounts.spotify.com/authorize?' + query)
}
