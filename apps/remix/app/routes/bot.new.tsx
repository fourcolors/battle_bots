import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { type z } from "zod";
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

type ActionData = { error: string; details?: z.ZodIssue[] } | undefined;

export const action = async ({ request }: ActionFunctionArgs) => {
  const BOT_CONTRACT_ADDRESS = process.env.BOT_CONTRACT_ADDRESS;

  if (!BOT_CONTRACT_ADDRESS) {
    return { error: "Bot contract address not configured" };
  }

  const formData = await request.formData();
  // Get form values
  const formValues = {
    name: formData.get("name")?.toString() || "",
    battlePrompt: formData.get("battlePrompt")?.toString() || "",
    attributes: {
      attack: Math.round(Number(formData.get("attack"))),
      defense: Math.round(Number(formData.get("defense"))),
      speed: Math.round(Number(formData.get("speed"))),
      mainWeapon: Number(formData.get("selectedWeapon")),
    },
  };

  // Validate required fields
  if (!formValues.name.trim()) {
    return {
      error: "Bot name is required",
    };
  }

  if (!formValues.battlePrompt.trim()) {
    return { error: "Battle prompt is required" };
  }

  // Validate total points
  const { attack, defense, speed } = formValues.attributes;
  const totalPoints = attack + defense + speed;
  if (Math.abs(totalPoints - MAX_POINTS) > 0.1) {
    return {
      error: `You must use exactly ${MAX_POINTS} points. Currently using: ${totalPoints.toFixed(
        1
      )}`,
    };
  }

  // Validate with Zod schema
  const result = BattleBotFormSchema.safeParse(formValues);
  if (!result.success) {
    console.error("Validation errors:", result.error.issues);
    return {
      error: result.error.issues[0].message,
      details: result.error.issues,
    };
  }

  try {
    const metadata: BattleBotMetadataSchemaType = {
      version: 1,
      ...result.data,
      image:
        "ipfs://bafkreid6dtqhlpdvkozefzfi6nor6hite22dvcuafjzbasxwoajvckfdli",
    };

    const metadataUri = await uploadToIPFS(metadata);
    console.log("Metadata uploaded to IPFS:", metadataUri);

    // Redirect to confirmation page
    return redirect(`/bot/confirm/${encodeURIComponent(metadataUri)}`);
  } catch (error) {
    console.error("Error creating bot:", error);
    return {
      error: "Failed to create bot metadata",
    };
  }
};

export default function NewBot() {
  const { weapons, error } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as {
    ENV: { BOT_CONTRACT_ADDRESS: string };
  };
  const actionData = useActionData<ActionData>();
  const [name, setName] = useState("");
  const [battlePrompt, setBattlePrompt] = useState("");
  const [attack, setAttack] = useState(2);
  const [defense, setDefense] = useState(2);
  const [speed, setSpeed] = useState(2);
  const [selectedWeapon, setSelectedWeapon] = useState<number>(1);

  // Show errors in toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (actionData?.error) {
      toast.error(actionData.error);
      // Show additional validation details if available
      if (actionData.details) {
        actionData.details.forEach((issue: z.ZodIssue) => {
          toast.error(`${issue.path.join(".")}: ${issue.message}`);
        });
      }
    }
  }, [error, actionData]);

  // Add contract address validation
  useEffect(() => {
    if (!rootData?.ENV?.BOT_CONTRACT_ADDRESS) {
      toast.error("Contract address not configured");
    }
  }, [rootData]);

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

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono p-4 overflow-auto">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-400 pixelated">
            Battle Bot Builder
          </h1>
        </div>

        <Form method="post" className="space-y-8">
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
                  className={`text-lg font-bold mt-2 ${
                    Number(remainingPoints) < 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
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
              className="w-full py-4 text-xl font-bold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors duration-200"
            >
              CONFIRM BOT
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
