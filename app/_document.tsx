// app/_document.tsx (or pages/_document.tsx)
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Paystack inline JS */}
        <script src="https://js.paystack.co/v1/inline.js"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
