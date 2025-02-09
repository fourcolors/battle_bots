import { NFTCardDefault } from "@coinbase/onchainkit/nft";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";
import BattleBotABI from "../../../contract/artifacts/contracts/BattleBot.sol/BattleBot.json";
import { toast } from "../utils/toast";

// Create a public client for contract interaction
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Contract address on Base Sepolia
const CONTRACT_ADDRESS = "0x87985Cf1763E852337e7bf1D27459334e690Fbed" as const;

// Base Sepolia Explorer URL
const EXPLORER_URL = "https://sepolia.basescan.org";

export default function Inventory() {
  const { address, isConnected } = useAccount();
  const [tokenIds, setTokenIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Check for transaction hash in URL params and show toast with explorer link
  useEffect(() => {
    const txHash = searchParams.get('tx');
    if (txHash) {
      const explorerUrl = `${EXPLORER_URL}/tx/${txHash}`;
      toast.success("Battle Bot minted successfully! 🎉");
      // Open explorer in new tab
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  }, [searchParams]);

  // Fetch user's bot token IDs
  useEffect(() => {
    async function fetchTokenIds() {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      try {
        const balance = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BattleBotABI.abi,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint;

        const ids = await Promise.all(
          Array.from({ length: Number(balance) }, async (_, index) => {
            const tokenId = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: BattleBotABI.abi,
              functionName: 'tokenOfOwnerByIndex',
              args: [address, BigInt(index)]
            }) as bigint;
            return Number(tokenId);
          })
        );

        setTokenIds(ids);
      } catch (error) {
        console.error('Error fetching token IDs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokenIds();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full bg-black text-white font-mono p-4 flex items-center justify-center">
        <ConnectWallet />
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenIds.map((tokenId) => (
          <NFTCardDefault
            key={tokenId}
            contractAddress={CONTRACT_ADDRESS}
            tokenId={tokenId.toString()}
          />
        ))}
      </div>
    </div>
  );
} 