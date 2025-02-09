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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const loader = () => {
  return {
    ENV: {
      PRIVY_APP_ID: process.env.PRIVY_APP_ID
    }
  };
};

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    
    if (authenticated) {
      navigate('/bot/new');
    } else {
      navigate('/');
    }
  }, [ready, authenticated, navigate]);

  // Show loading state while Privy is initializing
  if (!ready) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  
  return (
    <PrivyProvider
      appId={ENV.PRIVY_APP_ID || "cm6tjsr3g0037bdcuszt7wjhj"}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: LOGO_URL,
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['wallet'],
      }}
    >
      <AuthWrapper>
        <Outlet />
      </AuthWrapper>
    </PrivyProvider>
  );
}
