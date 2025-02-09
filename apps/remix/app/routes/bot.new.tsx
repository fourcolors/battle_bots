import {
  Transaction,
  TransactionButton,
} from "@coinbase/onchainkit/transaction";
import { type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { encodeFunctionData, type Hex } from "viem";
import { hardhat } from "viem/chains";
import BattleBotABI from "../../../contract/artifacts/contracts/BattleBot.sol/BattleBot.json";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Textarea } from "../components/ui/textarea";
import {
  BattleBotFormSchema,
  type BattleBotMetadataSchemaType,
} from "../schemas";
import type { Weapon } from "../types/weapons";
import { uploadToIPFS } from "../utils/ipfs.server";
import { toast } from "../utils/toast";

// Default to localhost:3000 if GAME_SERVER_URL is not set
const DEFAULT_GAME_SERVER = "http://localhost:3000";

export async function loader() {
  const GAME_SERVER_URL = process.env.GAME_SERVER_URL || DEFAULT_GAME_SERVER;
  console.log("Fetching weapons from:", GAME_SERVER_URL); // Debug log

  try {
    const response = await fetch(`${GAME_SERVER_URL}/weapons`);
    if (!response.ok) {
      console.error(
        "Server response not ok:",
        response.status,
        response.statusText
      );
      throw new Error(`Failed to fetch weapons: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.weapons) {
      console.error("No weapons data in response:", data);
      return { weapons: [] };
    }
    console.log("Weapons loaded successfully:", data.weapons.length); // Debug log
    return { weapons: data.weapons };
  } catch (error) {
    console.error("Error loading weapons:", error);
    // Return empty array but also include error message for UI
    return {
      weapons: [],
      error: error instanceof Error ? error.message : "Failed to fetch weapons",
    };
  }
}

const MAX_POINTS = 10;

export const action = async ({ request }: ActionFunctionArgs) => {
  const BOT_CONTRACT_ADDRESS = process.env.BOT_CONTRACT_ADDRESS;

  if (!BOT_CONTRACT_ADDRESS) {
    return new Response(
      JSON.stringify({ error: "Bot contract address not configured" }),
      { status: 500 }
    );
  }

  const formData = await request.formData();

  // Get form values
  const formValues = {
    name: formData.get("name")?.toString() || "",
    battlePrompt: formData.get("battlePrompt")?.toString() || "",
    attributes: {
      attack: Number(formData.get("attack")),
      defense: Number(formData.get("defense")),
      speed: Number(formData.get("speed")),
      mainWeapon: Number(formData.get("selectedWeapon")),
    },
  };

  // Validate with Zod schema
  const result = BattleBotFormSchema.safeParse(formValues);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.issues[0].message }),
      { status: 400 }
    );
  }

  // Validate total points used
  const { attack, defense, speed } = result.data.attributes;
  const totalPoints = attack + defense + speed;
  if (Math.abs(totalPoints - MAX_POINTS) > 0.1) {
    return new Response(
      JSON.stringify({
        error: `You must use exactly ${MAX_POINTS} points. Currently using: ${totalPoints.toFixed(1)}`,
      }),
      { status: 400 }
    );
  }

  try {
    // Prepare metadata for IPFS
    const metadata: BattleBotMetadataSchemaType = {
      version: 1,
      ...result.data,
      image:
        "ipfs://bafkreid6dtqhlpdvkozefzfi6nor6hite22dvcuafjzbasxwoajvckfdli", // Updated with actual image CID from IPFS
    };

    const metadataUri = await uploadToIPFS(metadata);
    console.log("Metadata uploaded to IPFS:", metadataUri);

    return new Response(
      JSON.stringify({
        success: true,
        metadataUri, // Include the URI in the response
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating bot:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create bot metadata" }),
      {
        status: 500,
      }
    );
  }
};

export default function NewBot() {
  const { weapons, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [battlePrompt, setBattlePrompt] = useState("");
  const [attack, setAttack] = useState(2);
  const [defense, setDefense] = useState(2);
  const [speed, setSpeed] = useState(2);
  const [selectedWeapon, setSelectedWeapon] = useState<number>(1);
  const [metadataUri, setMetadataUri] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);

  // Show loader error in toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Show action data errors/success in toast
  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
    if (actionData?.success) {
      toast.success("Bot created successfully!");
      // Set the metadata URI for minting
      setMetadataUri(actionData.metadataUri);
    }
  }, [actionData]);

  const totalPoints = attack + defense + speed;
  const remainingPoints = Number(MAX_POINTS - totalPoints).toFixed(1);
  const isMaxedOut = totalPoints >= MAX_POINTS;

  const handleStatChange = (
    value: number,
    setter: (value: number) => void,
    currentValue: number
  ) => {
    const otherStats = totalPoints - currentValue;
    if (otherStats + value <= MAX_POINTS) {
      setter(Number(value.toFixed(1)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      toast.error("Bot name is required");
      return;
    }

    // Validate battle prompt
    if (!battlePrompt.trim()) {
      toast.error("Battle prompt is required");
      return;
    }

    // Validate points allocation
    if (Math.abs(totalPoints - MAX_POINTS) > 0.1) {
      toast.error(
        `You must use exactly ${MAX_POINTS} points. Currently using: ${totalPoints.toFixed(1)}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      await form.submit();
    } catch (error) {
      toast.error("Failed to create bot");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono p-4 overflow-auto">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center text-yellow-400 pixelated">
          Battle Bot Builder
        </h1>

        <Form method="post" className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-900 p-6 rounded-lg pixelated-border">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-xl text-blue-400">
                  Bot Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your bot's name..."
                  className="w-full text-lg p-4 bg-gray-800 border-gray-700 text-blue-400"
                />
              </div>
              <div className="relative w-full h-96 border-4 border-gray-700 rounded-lg flex items-center justify-center bg-gray-800 pixelated-border">
                <img
                  src="https://robohash.org/battlebot?set=set1&size=256x256"
                  alt="Base Robot"
                  width={256}
                  height={256}
                  className="pixelated"
                />
              </div>
            </div>

            <div className="space-y-6 bg-gray-800 p-4 rounded-lg pixelated-border">
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-400">Points System</p>
                <p className="text-xs text-gray-500 mt-1">
                  Allocate up to {MAX_POINTS} points across Attack, Defense, and
                  Speed
                </p>
                <p
                  className={`text-lg font-bold mt-2 ${Number(remainingPoints) < 0 ? "text-red-400" : "text-green-400"}`}
                >
                  {remainingPoints} points remaining
                </p>
              </div>

              <input type="hidden" name="attack" value={attack} />
              <input type="hidden" name="defense" value={defense} />
              <input type="hidden" name="speed" value={speed} />
              <input
                type="hidden"
                name="selectedWeapon"
                value={selectedWeapon}
              />

              <div>
                <Label className="text-lg text-blue-400">Attack</Label>
                <Slider
                  min={2}
                  max={4}
                  step={0.1}
                  value={[attack]}
                  onValueChange={(value) =>
                    handleStatChange(value[0], setAttack, attack)
                  }
                  className="my-2"
                  disabled={isMaxedOut && attack <= 2}
                />
                <span className="text-lg font-semibold text-blue-400">
                  {attack.toFixed(1)}
                </span>
              </div>

              <div>
                <Label className="text-lg text-yellow-400">Defense</Label>
                <Slider
                  min={2}
                  max={4}
                  step={0.1}
                  value={[defense]}
                  onValueChange={(value) =>
                    handleStatChange(value[0], setDefense, defense)
                  }
                  className="my-2"
                  disabled={isMaxedOut && defense <= 2}
                />
                <span className="text-lg font-semibold text-yellow-400">
                  {defense.toFixed(1)}
                </span>
              </div>

              <div>
                <Label className="text-lg text-green-400">Speed</Label>
                <Slider
                  min={2}
                  max={4}
                  step={0.1}
                  value={[speed]}
                  onValueChange={(value) =>
                    handleStatChange(value[0], setSpeed, speed)
                  }
                  className="my-2"
                  disabled={isMaxedOut && speed <= 2}
                />
                <span className="text-lg font-semibold text-green-400">
                  {speed.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg pixelated-border mb-8 min-h-[200px]">
            <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-400">
              Weapons
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {weapons.map((weapon: Weapon) => (
                <button
                  key={weapon.id}
                  type="button"
                  onClick={() => setSelectedWeapon(weapon.id)}
                  className={`cursor-pointer transition-all p-2 rounded-lg ${
                    selectedWeapon === weapon.id
                      ? "scale-110 bg-yellow-400/20 border-2 border-yellow-400"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <img
                    src={weapon.src}
                    alt={weapon.name}
                    width={32}
                    height={32}
                    className="pixelated mx-auto"
                  />
                  <p className="text-center text-xs mt-1 text-white">
                    {weapon.name}
                  </p>
                </button>
              ))}
            </div>
            <div className="bg-gray-800 p-4 rounded-lg pixelated-border">
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">
                {weapons.find((w: Weapon) => w.id === selectedWeapon)?.name}
              </h3>
              <p className="text-sm text-white">
                {
                  weapons.find((w: Weapon) => w.id === selectedWeapon)
                    ?.description
                }
              </p>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg pixelated-border">
            <Label
              htmlFor="battle-prompt"
              className="text-xl text-purple-400 mb-2 block"
            >
              Battle Prompt
            </Label>
            <Textarea
              id="battle-prompt"
              name="battlePrompt"
              value={battlePrompt}
              onChange={(e) => setBattlePrompt(e.target.value)}
              placeholder="Enter your epic battle prompt here..."
              className="w-full h-48 text-lg p-4 bg-gray-800 border-gray-700 text-purple-400 mb-4"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-xl font-bold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors duration-200"
            >
              {isSubmitting ? "CREATING BATTLE BOT..." : "CREATE BATTLE BOT"}
            </Button>
          </div>
        </Form>

        {metadataUri && (
          <div className="mt-8 bg-gray-900 p-6 rounded-lg pixelated-border">
            <Transaction
              chainId={hardhat.id}
              calls={[
                {
                  to: process.env.BOT_CONTRACT_ADDRESS as Hex,
                  data: encodeFunctionData({
                    abi: BattleBotABI.abi,
                    functionName: "mintBot",
                    args: [metadataUri],
                  }),
                },
              ]}
              onSuccess={(receipts) => {
                setIsMinting(false);
                toast.success("Bot minted successfully!");
                setMetadataUri(""); // Reset after successful mint
                console.log("Transaction receipts:", receipts);
              }}
              onError={(error) => {
                setIsMinting(false);
                toast.error("Failed to mint bot: " + error.message);
              }}
              onStatus={(status) => {
                console.log("Transaction status:", status);
                switch (status.statusName) {
                  case "init":
                  case "buildingTransaction":
                  case "transactionPending":
                    setIsMinting(true);
                    break;
                  case "success":
                  case "error":
                    setIsMinting(false);
                    break;
                }
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <img
                  src="https://robohash.org/battlebot?set=set1&size=256x256"
                  alt="Battle Bot Preview"
                  className="w-32 h-32 pixelated"
                />
                <h3 className="text-xl font-bold text-yellow-400">
                  {isMinting
                    ? "Minting Your Battle Bot..."
                    : "Mint Your Battle Bot"}
                </h3>
                <TransactionButton
                  text={isMinting ? "Minting..." : "Mint Battle Bot"}
                  className="w-full py-4 text-xl font-bold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors duration-200 rounded-lg"
                />
                {isMinting && (
                  <div className="animate-pulse text-sm text-gray-400">
                    Please confirm the transaction in your wallet
                  </div>
                )}
              </div>
            </Transaction>
          </div>
        )}
      </div>
    </div>
  );
}
