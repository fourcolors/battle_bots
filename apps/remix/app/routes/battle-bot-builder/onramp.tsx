import { Avatar } from "@coinbase/onchainkit/identity";
import { TokenRow } from "@coinbase/onchainkit/token";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function BattleBotBuilder() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected, navigate]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Battle Bot Builder</h1>

      <div className="space-y-6">
        {/* Bot Identity */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">
            Bot Identity
          </h2>
          <Avatar address="0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9" />
        </div>

        {/* Token Display */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">
            Bot Token
          </h2>
          <TokenRow
            token={{
              address: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
              chainId: 8453,
              decimals: 18,
              name: "BattleBot Token",
              symbol: "BBT",
              image: "https://makerdao.com/images/logo.svg",
            }}
          />
        </div>
      </div>
    </div>
  );
}
