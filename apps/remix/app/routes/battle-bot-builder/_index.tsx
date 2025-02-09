import { usePrivy } from "@privy-io/react-auth";
import { Link } from "@remix-run/react";

export default function BattleBotBuilderIndex() {
  const { user } = usePrivy();

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">
            Welcome, Commander {user?.email?.address || 'Anonymous'}
          </h1>
          <p className="text-gray-400">
            Your battle bot command center awaits. What would you like to do?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link 
            to="bot/new"
            className="bg-gray-900 p-6 rounded-lg pixelated-border hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-bold text-green-400 mb-2">Create New Bot</h2>
            <p className="text-gray-400">Design and deploy a new battle bot</p>
          </Link>

          <Link 
            to="inventory"
            className="bg-gray-900 p-6 rounded-lg pixelated-border hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-bold text-blue-400 mb-2">Bot Inventory</h2>
            <p className="text-gray-400">Manage your existing battle bots</p>
          </Link>

          <Link 
            to="battle"
            className="bg-gray-900 p-6 rounded-lg pixelated-border hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-bold text-red-400 mb-2">Enter Battle</h2>
            <p className="text-gray-400">Challenge others to bot combat</p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="bg-gray-900 p-6 rounded-lg pixelated-border">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Battle Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-purple-400">Total Bots</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-green-400">Victories</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-red-400">Defeats</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-yellow-400">Earnings</h3>
              <p className="text-2xl font-bold">0 USDC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
