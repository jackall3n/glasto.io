import { AppProps } from 'next/app';
import Head from 'next/head';

import './styles.css';
import AuthProvider from "../providers/AuthProvider";

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Home | glasto.io</title>
      </Head>
      <main className="app">
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}

export default CustomApp;
