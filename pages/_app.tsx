import { AppProps } from 'next/app';
import Head from 'next/head';

import './styles.css';
import AuthProvider from "../providers/AuthProvider";

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Home | glasto.io</title>
        <link
      href="https://api.mapbox.com/mapbox-gl-js/v1.10.1/mapbox-gl.css"
      rel="stylesheet"
    />
      </Head>
      <main className="app">
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}

export default CustomApp;
