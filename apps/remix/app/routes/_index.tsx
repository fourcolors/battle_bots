import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="min-h-screen w-full bg-black text-white font-mono p-4">
      <div className="container mx-auto text-center">
        <h1 className="text-6xl font-bold mb-8 text-yellow-400 pixelated">
          Battle Bots Arena
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            to="/bot/new"
            className="block p-8 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors pixelated-border"
          >
            <h2 className="text-3xl font-bold mb-4 text-yellow-400">
              Create Bot
            </h2>
            <p className="text-gray-400">
              Build and customize your battle bot with unique weapons and
              abilities
            </p>
          </Link>

          <Link
            to="/game/new"
            className="block p-8 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors pixelated-border"
          >
            <h2 className="text-3xl font-bold mb-4 text-yellow-400">
              New Game
            </h2>
            <p className="text-gray-400">
              Start a new battle and put your bot to the test
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
