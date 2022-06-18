import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Redirect() {
  const { query, push } = useRouter();

  const { code, state } = query;

  async function link() {
    const { data } = await
      axios.get('/api/spotify/redirect', { params: { code, state } })

    await push(data.redirect)
  }

  useEffect(() => {
    if (!code || !state) {
      return;
    }

    link().then();
  }, [code, state])

  return null
}

