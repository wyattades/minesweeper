import React from "react";
import Script from "next/script";
import Head from "next/head";

import "styles/global.scss";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Minesweeper Online</title>
      </Head>

      {process.env.NODE_ENV === "production" ? (
        <Script
          data-website-id="fc60dcb4-ed21-4f00-8964-f078eebcaa2b"
          src="https://sip-umami.vercel.app/umami.js"
        />
      ) : null}

      <Component {...pageProps} />
    </>
  );
}
