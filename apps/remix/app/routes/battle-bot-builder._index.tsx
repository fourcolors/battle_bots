import { Link } from "@remix-run/react";
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { Avatar } from '@coinbase/onchainkit/identity';
import { TokenRow } from '@coinbase/onchainkit/token';

export default function BattleBotBuilderIndex() {
  const { address } = useAccount();

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Wallet */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              Welcome, Commander {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </h1>
            <p className="text-gray-400">
              Your battle bot command center awaits. What would you like to do?
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <ConnectWallet />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link 
            to="bot/new"
            className="bg-gray-900 p-6 rounded-lg border-2 border-green-500/20 hover:border-green-500/40 transition-all"
          >
            <h2 className="text-2xl font-bold text-green-400 mb-2">Create New Bot</h2>
            <p className="text-gray-400">Design and deploy a new battle bot</p>
          </Link>

          <Link 
            to="battle"
            className="bg-gray-900 p-6 rounded-lg border-2 border-red-500/20 hover:border-red-500/40 transition-all"
          >
            <h2 className="text-2xl font-bold text-red-400 mb-2">Enter Battle</h2>
            <p className="text-gray-400">Challenge others to bot combat</p>
          </Link>

          <Link 
            to="onramp"
            className="bg-gray-900 p-6 rounded-lg border-2 border-blue-500/20 hover:border-blue-500/40 transition-all"
          >
            <h2 className="text-2xl font-bold text-blue-400 mb-2">Get USDC</h2>
            <p className="text-gray-400">Fund your battle bot operations</p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="bg-gray-900 p-6 rounded-lg border-2 border-yellow-500/20">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Battle Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-purple-400 mb-1">Total Bots</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-green-400 mb-1">Victories</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-red-400 mb-1">Defeats</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-yellow-400 mb-1">Balance</h3>
              <p className="text-2xl font-bold">0 USDC</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg border-2 border-purple-500/20">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Recent Activity</h2>
          <div className="text-gray-400 text-center py-8">
            No recent activity. Create a bot to get started!
          </div>
        </div>
      </div>
    </div>
  );
} 