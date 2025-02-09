import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Toaster } from "sonner";
import { base, hardhat } from "viem/chains";
import { Navigation } from "./components/Navigation";
import { toastConfig } from "./utils/toast";

import "./tailwind.css";

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

// Default values for environment variables
const DEFAULT_GAME_SERVER = "http://localhost:3000";

export const loader = () => {
  // Validate and provide defaults for required environment variables
  const GAME_SERVER_URL = process.env.GAME_SERVER_URL || DEFAULT_GAME_SERVER;
  const ONCHAINKIT_API_KEY = process.env.ONCHAINKIT_API_KEY;
  const CHAIN = process.env.CHAIN || "hardhat";
  const BOT_CONTRACT_ADDRESS = process.env.BOT_CONTRACT_ADDRESS;

  if (!ONCHAINKIT_API_KEY) {
    throw new Error("ONCHAINKIT_API_KEY is required");
  }

  if (!BOT_CONTRACT_ADDRESS) {
    throw new Error("BOT_CONTRACT_ADDRESS is required");
  }

  return {
    ENV: {
      GAME_SERVER_URL,
      ONCHAINKIT_API_KEY,
      CHAIN,
      BOT_CONTRACT_ADDRESS,
    },
  };
};

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();

  // Select chain based on environment
  const chain = ENV.CHAIN === "hardhat" ? hardhat : base;

  return (
    <html lang="en" className="bg-black">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-black">
        <OnchainKitProvider
          apiKey={ENV.ONCHAINKIT_API_KEY}
          chain={chain}
          config={{
            appearance: {
              name: "Battle Bots",
              mode: "dark",
              theme: "cyberpunk",
            },
          }}
        >
          <Navigation />
          <main className="pt-14">
            <Outlet />
          </main>
        </OnchainKitProvider>
        <Toaster {...toastConfig} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
