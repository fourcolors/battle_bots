import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams, useRouteLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";
import BattleBotABI from "../../../contract/artifacts/contracts/BattleBot.sol/BattleBot.json";
import { Button } from "../components/ui/button";
import type { BattleBotMetadataSchemaType } from "../schemas";
import { toast } from "../utils/toast";

// Create a public client for transaction confirmation
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function loader({ params }: LoaderFunctionArgs) {
  const { metadataUri } = params;
  if (!metadataUri) {
    throw new Error("No metadata URI provided");
  }

  try {
    // Fetch metadata from IPFS
    const response = await fetch(metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
    const metadata: BattleBotMetadataSchemaType = await response.json();
    
    return json({ metadata });
  } catch (error) {
    throw new Error("Failed to fetch bot metadata");
  }
}

export default function BotConfirm() {
  const { metadata } = useLoaderData<typeof loader>();
  const { metadataUri } = useParams();
  const rootData = useRouteLoaderData("root") as {
    ENV: { BOT_CONTRACT_ADDRESS: string };
  };
  const { isConnected } = useAccount();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (!rootData?.ENV?.BOT_CONTRACT_ADDRESS) {
      toast.error("Contract address not configured");
    }
  }, [rootData]);

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-gray-900 p-8 rounded-lg pixelated-border">
          <h1 className="text-4xl font-bold text-yellow-400 text-center mb-2 pixelated">
            {metadata.name}
          </h1>
          <p className="text-center text-gray-400 mb-8">Battle Bot Stats</p>

          <div className="flex flex-col items-center space-y-8">
            <img
              src="https://robohash.org/battlebot?set=set1&size=256x256"
              alt={metadata.name}
              className="w-64 h-64 pixelated"
            />

            <div className="w-full space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-blue-400">Attack</p>
                  <p className="text-2xl font-bold">{metadata.attributes.attack}</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400">Defense</p>
                  <p className="text-2xl font-bold">{metadata.attributes.defense}</p>
                </div>
                <div className="text-center">
                  <p className="text-green-400">Speed</p>
                  <p className="text-2xl font-bold">{metadata.attributes.speed}</p>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-purple-400 mb-2">Battle Prompt</h3>
                <p className="text-gray-300">{metadata.battlePrompt}</p>
              </div>
            </div>

            {!isSuccess && (
              <div className="w-full">
                {isConnected ? (
                  <Transaction
                    chainId={baseSepolia.id}
                    calls={[
                      {
                        to: rootData.ENV.BOT_CONTRACT_ADDRESS as `0x${string}`,
                        data: encodeFunctionData({
                          abi: BattleBotABI.abi,
                          functionName: "mintBot",
                          args: [metadataUri],
                        }),
                      },
                    ]}
                    onSuccess={async (data) => {
                      try {
                        setIsMinting(true);
                        // Wait for transaction to be confirmed
                        toast.loading("Waiting for transaction confirmation...");
                        const receipt = await publicClient.waitForTransactionReceipt({
                          hash: data.transactionReceipts[0].transactionHash,
                        });

                        // Add a small delay to allow for indexing
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        toast.success("Battle Bot minted successfully!");
                        setIsSuccess(true);
                        
                        // Redirect with both transaction hash and a refresh flag
                        window.location.href = `/inventory?tx=${receipt.transactionHash}&refresh=true`;
                      } catch (error) {
                        console.error("Error confirming transaction:", error);
                        toast.error("Error confirming transaction. Please check the explorer.");
                        // Still redirect but indicate there might be an issue
                        window.location.href = `/inventory?tx=${data.transactionReceipts[0].transactionHash}&status=pending`;
                      } finally {
                        setIsMinting(false);
                      }
                    }}
                    onError={(error) => {
                      toast.error("Failed to mint bot: " + error.message);
                      console.error("Minting error:", error);
                    }}
                  >
                    <TransactionButton
                      text={isMinting ? "Confirming..." : "Build Battle Bot"}
                      disabled={isMinting}
                      className="w-full py-4 text-xl font-bold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors duration-200 rounded-lg disabled:opacity-50"
                    />
                    <TransactionStatus>
                      <TransactionStatusLabel className="text-center text-sm text-gray-400 mt-2" />
                    </TransactionStatus>
                  </Transaction>
                ) : (
                  <div className="text-center">
                    <p className="text-yellow-400 mb-4">
                      Connect your wallet to deploy your Battle Bot
                    </p>
                    <ConnectWallet />
                  </div>
                )}
              </div>
            )}

            {isSuccess && (
              <Button
                onClick={() => window.location.href = '/bot/new'}
                className="w-full py-4 text-xl font-bold bg-green-400 hover:bg-green-500 text-black transition-colors duration-200 rounded-lg"
              >
                Create Another Bot
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 