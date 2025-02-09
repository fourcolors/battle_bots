import { MetaFunction, json, type LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useDisconnect } from 'wagmi';

export const meta: MetaFunction = () => {
  return [{ title: "Battle Bots · Connect Wallet" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({});
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8">
          Battle Bots
        </h1>
        <p className="text-gray-400 mb-8">
          {address 
            ? "Your wallet is connected. Ready to build some agentic blockchain bots?" 
            : "Connect your wallet to start building and battling agentic blockchain bots"
          }
        </p>
        
        <div className="space-y-4">
          {/* Wallet Status */}
          {address && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Connected Wallet</p>
              <p className="font-mono text-green-400 mb-2">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </p>
              <button
                onClick={() => disconnect()}
                className="text-red-400 text-sm hover:text-red-300"
              >
                Disconnect Wallet
              </button>
            </div>
          )}

          {/* Wallet Connection */}
          <div className="bg-gray-900 p-6 rounded-lg flex justify-center items-center">
            <ConnectWallet />
          </div>

          {/* Enter Button */}
          {address && (
            <button
              onClick={() => navigate("/battle-bot-builder")}
              className="w-full bg-yellow-500 text-black px-6 py-4 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              Enter Battle Bots →
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
