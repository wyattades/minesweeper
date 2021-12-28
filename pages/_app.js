import React from "react";
import Script from "next/script";

import "styles/global.scss";

export default function App({ Component, pageProps }) {
  return (
    <>
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
