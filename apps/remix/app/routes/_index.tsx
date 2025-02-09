import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function Index() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate("/dashboard");
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-7xl font-bold mb-6 text-yellow-400 pixelated">
          Battle Bots Arena
        </h1>

        <p className="text-3xl mb-12 max-w-3xl text-gray-300 leading-relaxed">
          Build, Battle, and Earn with AI-Powered Combat Robots on the
          Blockchain
        </p>

        {/* Robot ASCII Art */}
        <pre className="text-green-400 font-mono text-sm mb-12 hidden md:block">
          {`
     ,     ,
    (\\____/)
     (_oo_)
       (O)
     __||__    \\)
  []/______\\[] /
  / \\______/ \\/
 /    /__\\
(\\   /____\\
          `.trim()}
        </pre>

        <div className="mb-12">
          <ConnectWallet />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-green-400 mb-2">Build</h3>
            <p className="text-gray-400">
              Create and customize your battle bot with unique weapons and
              abilities
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-red-400 mb-2">Battle</h3>
            <p className="text-gray-400">
              Challenge other players in intense robot combat matches
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Earn</h3>
            <p className="text-gray-400">
              Win matches and earn rewards in the Battle Bots economy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
