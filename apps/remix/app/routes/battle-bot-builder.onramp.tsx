import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Battle Bots · Get USDC" }];
};

export const loader = async () => {
  return {};
};

export default function OnrampPage() {
  const { address } = useAccount();
  
  const handleBuyUsdc = () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    const params = new URLSearchParams({
      appId: 'ec907d79-07fa-47d3-824c-ad32c858b091',
      addresses: JSON.stringify({ 
        [address]: ["base"]  // Send to user's connected wallet
      }),
      assets: JSON.stringify(["USDC"]),
      defaultNetwork: "base",
      defaultAsset: "USDC",
      defaultExperience: "buy"
    });

    const url = `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to=".."
            className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-4xl font-bold text-blue-400">Get USDC</h1>
        </div>
        
        <div className="grid gap-8">
          {/* Wallet Connection */}
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-blue-500/20">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Connect Wallet</h2>
            <ConnectWallet />
          </div>

          {/* USDC Balance */}
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-green-500/20">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Your Balance</h2>
            <p className="text-2xl font-bold">0 USDC</p>
            <p className="text-sm text-gray-400 mt-2">
              Connected Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
            </p>
          </div>

          {/* Get USDC Section */}
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-yellow-500/20">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Buy USDC</h2>
            <p className="text-gray-400 mb-6">
              You'll need USDC to create and battle with your bots. Purchase USDC directly with your credit card or bank account.
            </p>
            <div className="space-y-4">
              <button 
                className="w-full bg-yellow-500 text-black px-6 py-4 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBuyUsdc}
                disabled={!address}
              >
                {address ? 'Buy USDC with Coinbase Pay' : 'Connect Wallet to Buy USDC'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Powered by Coinbase Pay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
