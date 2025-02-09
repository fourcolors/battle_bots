import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import type { LinksFunction } from "@remix-run/node";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useNavigate,
} from "@remix-run/react";
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { toastConfig } from './utils/toast';
import type { LinksFunction } from "@remix-run/node";
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';
import '@coinbase/onchainkit/styles.css';

import "./tailwind.css";

// Use Robohash URL for the logo
const LOGO_URL = "https://robohash.org/battlebot?set=set1&size=256x256";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader = () => {
  return {
    ENV: {
      ONCHAINKIT_API_KEY: "liSnUM_Ngr62kqupe50h6QDZPje8i1zg"
    }
  };
};

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <OnchainKitProvider apiKey={ENV.ONCHAINKIT_API_KEY} chain={base}>
          <Outlet />
        </OnchainKitProvider>
        <Toaster {...toastConfig} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
