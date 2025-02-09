import { NFTCardDefault } from "@coinbase/onchainkit/nft";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";
import BattleBotABI from "../../../contract/artifacts/contracts/BattleBot.sol/BattleBot.json";
import { Button } from "../components/ui/button";
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
  const [retryCount, setRetryCount] = useState(0);

  // Check for transaction hash in URL params and show toast with explorer link
  useEffect(() => {
    const txHash = searchParams.get('tx');
    const status = searchParams.get('status');
    const shouldRefresh = searchParams.get('refresh') === 'true';

    if (txHash) {
      const explorerUrl = `${EXPLORER_URL}/tx/${txHash}`;
      
      if (status === 'pending') {
        toast.warning("Transaction sent! Check the explorer for details.");
        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.success("Battle Bot minted successfully! 🎉");
        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
      }

      // If refresh flag is set, we'll retry loading NFTs a few times
      if (shouldRefresh) {
        setRetryCount(3); // Will trigger retries through useEffect
      }
    }
  }, [searchParams]);

  // Fetch user's bot token IDs with retry logic
  useEffect(() => {
    async function fetchTokenIds() {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
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
        if (retryCount > 0) {
          toast.success(`Found ${ids.length} Battle Bots!`);
        }
      } catch (error) {
        console.error('Error fetching token IDs:', error);
        if (retryCount > 0) {
          toast.info(`Retrying... (${retryCount} attempts left)`);
          // Wait 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          setRetryCount(prev => prev - 1);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokenIds();
  }, [address, isConnected, retryCount]);

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full bg-black text-white font-mono p-4 flex items-center justify-center">
        <ConnectWallet />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-black text-white font-mono p-4 flex flex-col items-center justify-center">
        <div className="animate-pulse text-xl mb-4">Loading your Battle Bots...</div>
        {retryCount > 0 && (
          <div className="text-sm text-gray-400">
            Checking for new Battle Bots ({retryCount} attempts remaining)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-yellow-400 pixelated">
          Your Battle Bot Arsenal
        </h1>
        <Button
          onClick={() => window.location.href = '/bot/new'}
          className="px-6 py-3 text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors duration-200 rounded-lg"
        >
          Create New Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenIds.map((tokenId) => (
          <NFTCardDefault
            key={tokenId}
            contractAddress={CONTRACT_ADDRESS}
            tokenId={tokenId.toString()}
          />
        ))}
      </div>

      {tokenIds.length === 0 && (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-400 mb-4">No Battle Bots Found</h2>
          <p className="text-gray-500 mb-6">Time to build your first Battle Bot!</p>
          <Button
            onClick={() => window.location.href = '/bot/new'}
            className="px-6 py-3 text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors duration-200 rounded-lg"
          >
            Create Battle Bot
          </Button>
        </div>
      )}
    </div>
  );
} 