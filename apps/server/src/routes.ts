import { Router } from "express";
import { IContractWrapper } from "./contract/IContractWrapper";
import { getContractWrapper } from "./contract/getContractWrapper";
import {
    performAttack,
    performMove,
    performRotate
} from "./gameLogic";
import { games, GameState } from "./memoryState";
import { WeaponService } from "./weapons/service";

const router = Router();
const contractWrapper: IContractWrapper = getContractWrapper(); // Dependency Injection


// Just for example, we store an incrementing local ID for "bot actions"
let actionIdCounter = 0;

// --- Endpoint 1: Create Game ---
// Users must provide a betAmount (in USDC, as defined by our smart contract).
router.post("/createGame", async (req, res) => {
  try {
    const { betAmount } = req.body;
    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({ error: "betAmount is required and must be greater than zero" });
    }

    // Call smart contract to create a new game with a fixed bet amount
    const gameId = (await contractWrapper.createGame(betAmount)).toString();

    // Initialize off-chain game state
    games[gameId] = {
      isActive: true,
      turnCount: 0,
      currentBotIndex: 0,
      bots: [],
      betAmount, // Store betAmount for validation
    };

    console.log(`Game ${gameId} created with betAmount ${betAmount}.`);
    return res.json({ ok: true, gameId, betAmount });
  } catch (err: any) {
    console.error("Error in createGame:", err);
    return res.status(500).json({ error: err.message });
  }
});


// --- Endpoint 2: Register Bot ---
// NOTE: The user has already called registerBot on-chain (which locks in the USDC bet)
// We now record the bot off-chain along with its initial AI prompt.
// For now, we mark each bot as unverified; verification can be added as a separate task.
router.post("/registerBot", async (req, res) => {
  try {
    const { gameId, bot } = req.body;
    if (!games[gameId]) {
      return res.status(400).json({ error: "Game not found" });
    }

    const game = games[gameId];
    const botIndex = game.bots.length; // Assign bot index dynamically

    // Store bot with assigned botIndex
    const storedBot = { ...bot, botIndex, apConsumed: 0, verified: false };
    game.bots.push(storedBot);

    console.log(`Bot ${botIndex} registered for game ${gameId} off-chain.`);
    return res.json({ ok: true, gameId, botIndex, bot: storedBot });
  } catch (err: any) {
    console.error("Error in registerBot:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Endpoint 3: Process a Turn & Auto-Finish if Game Over ---
// Processes the current bot's turn, and automatically skips over dead bots.
router.post("/turn", async (req, res) => {
  const { gameId, botIndex, actions } = req.body;
  console.log("Turn with body:", JSON.stringify(req.body, null, 2));
  console.log("gameId type:", typeof req.body.gameId, "Value:", req.body.gameId);

  const game = games[gameId];
  if (!game || !game.isActive) {
    return res.status(400).json({ error: "Game not active or doesn't exist" });
  }
  
  // Enforce round-robin: only the current bot may act.
  if (botIndex !== game.currentBotIndex) {
    console.warn(`Bot ${botIndex} tried to act out-of-turn. Current bot: ${game.currentBotIndex}`);
    return res.status(400).json({ error: `It is not bot ${botIndex}'s turn. It is bot ${game.currentBotIndex}'s turn.` });
  }

  let currentBot = game.bots[game.currentBotIndex];
  let successLog: string[] = [];

  // *** Skip dead bots immediately.
  if (currentBot.HP <= 0) {
    console.log(`Bot ${game.currentBotIndex} is already dead. Skipping its turn.`);
    successLog.push("Bot is dead. Skipping turn.");
    game.currentBotIndex = getNextAliveBotIndex(game);
    return res.json({
      successLog,
      botState: currentBot,
      currentBotIndex: game.currentBotIndex,
      turnCount: game.turnCount
    });
  }
  
  console.log(`Game ${gameId} Bot ${botIndex} starting turn. Global turnCount=${game.turnCount}`);

  // Process each action sequentially until 2 AP are consumed.
  for (const act of actions) {
    if (currentBot.apConsumed >= 2) {
      successLog.push("No AP left; ignoring further actions.");
      break;
    }
    // If bot dies mid-turn, break out.
    if (currentBot.HP <= 0) {
      successLog.push("Bot died during its turn.");
      break;
    }
    if (act.type === "move") {
      const result = performMove(currentBot, act.x, act.y);
      if (result === "OK") {
        successLog.push(`Move success: new position (${currentBot.x}, ${currentBot.y}).`);
        console.log(`Bot ${botIndex} moved to (${currentBot.x}, ${currentBot.y}).`);
        currentBot.apConsumed++;
      } else {
        successLog.push(`Move failed: ${result}.`);
        console.log(`Bot ${botIndex} move failed: ${result}.`);
      }
    } else if (act.type === "rotate") {
      const result = performRotate(currentBot, act.newOrientation);
      if (result === "OK") {
        successLog.push(`Rotate success: now facing ${currentBot.orientation}°.`);
        console.log(`Bot ${botIndex} rotated to ${currentBot.orientation}°.`);
        currentBot.apConsumed++;
      } else {
        successLog.push(`Rotate failed: ${result}.`);
        console.log(`Bot ${botIndex} rotate failed: ${result}.`);
      }
    } else if (act.type === "attack") {
      // Attack always consumes 1 AP.
      currentBot.apConsumed++;
      const target = game.bots[act.targetIndex];
      if (!target) {
        successLog.push("Attack failed: Invalid target index.");
        console.log(`Bot ${botIndex} attack failed: invalid target ${act.targetIndex}.`);
        continue;
      }
      const { finalDamage, isHit } = performAttack(currentBot, target);
      if (isHit) {
        successLog.push(`Attack success: target #${act.targetIndex} took ${finalDamage} damage.`);
        console.log(`Bot ${botIndex} attacked bot ${act.targetIndex} for ${finalDamage} damage.`);
      } else {
        successLog.push("Attack failed: target out of range or missed.");
        console.log(`Bot ${botIndex} attack missed or target out of range.`);
      }
    } else {
      successLog.push(`Unknown action type: ${act.type}.`);
      console.log(`Bot ${botIndex} received unknown action type: ${act.type}.`);
    }
  }

  // Update turn order if AP is fully consumed or the bot died mid-turn.
  if (currentBot.apConsumed >= 2 || currentBot.HP <= 0) {
    console.log(`Bot ${botIndex} finished its turn (AP consumed or bot dead). Resetting AP and updating turn order.`);
    currentBot.apConsumed = 0;
    game.currentBotIndex = getNextAliveBotIndex(game);
  } else {
    console.log(`Bot ${botIndex} ended turn with ${currentBot.apConsumed} AP (turn incomplete).`);
  }

  // Auto-finish logic: if only one bot remains alive, settle the game.
  const aliveBots = game.bots.filter(b => b.HP > 0);
  if (aliveBots.length === 1) {
    const winningBotIndex = aliveBots[0].botIndex;
    try {
      console.log("gameId " + gameId.toString())
      console.log("winningBotIndex " + winningBotIndex)
      await contractWrapper.finishGame(gameId, winningBotIndex);
      game.isActive = false;
      console.log(`Game ${gameId} auto-finished. Winning bot: ${winningBotIndex}`);
      return res.json({
        successLog: [...successLog, `Game auto-finished. Bot ${winningBotIndex} wins.`],
        winner: winningBotIndex,
        turnCount: game.turnCount
      });
    } catch (err: any) {
      console.error("Error auto-finishing game:", err);
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.json({
    successLog,
    botState: currentBot,
    currentBotIndex: game.currentBotIndex,
    turnCount: game.turnCount
  });
});

// Helper: Returns the index of the next alive bot (HP > 0) in the game.
// If all bots are dead (which shouldn't happen due to auto-finish logic), returns the current index.
function getNextAliveBotIndex(game: GameState): number {
  const totalBots = game.bots.length;
  let nextIndex = (game.currentBotIndex + 1) % totalBots;
  let iterations = 0;
  // Loop until we find a bot with HP > 0 or have checked all bots.
  while (game.bots[nextIndex].HP <= 0 && iterations < totalBots) {
    nextIndex = (nextIndex + 1) % totalBots;
    // If we loop back to 0, increment the turn count.
    if (nextIndex === 0) {
      game.turnCount++;
      console.log(`All bots have acted. Global turn count is now ${game.turnCount}.`);
    }
    iterations++;
  }
  return nextIndex;
}

// --- Endpoint 4: Get Game State ---
// Returns current off-chain game state including bot parameters, prompt, and verification status.
router.get("/getGameState/:gameId", (req, res) => {
  const { gameId } = req.params;
  const game = games[gameId];
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  return res.json({
    gameId: gameId,
    isActive: game.isActive,
    turnCount: game.turnCount,
    currentBotIndex: game.currentBotIndex,
    betAmount: game.betAmount,
    bots: game.bots.map((bot, index) => ({
      botIndex: index,
      x: bot.x,
      y: bot.y,
      orientation: bot.orientation,
      HP: bot.HP,
      Attack: bot.Attack,
      Defense: bot.Defense,
      Speed: bot.Speed,
      Fuel: bot.Fuel,
      damageDealt: bot.damageDealt,
      weaponChoice: bot.weaponChoice,
      prompt: bot.prompt || "",
      verified: bot.verified || false
    }))
  });
});

// --- Endpoint 5: Sync On-Chain ---
// Skip for the MVP
// In production, this might be done at defined checkpoints.
router.post("/syncOnChain", async (req, res) => {
  const { gameId } = req.body;
  const game = games[gameId];
  if (!game) {
    return res.status(400).json({ error: "Game not found" });
  }
  try {
    for (let i = 0; i < game.bots.length; i++) {
      const b = game.bots[i];
      await contractWrapper.updateBotState(
        gameId,
        i,
        Math.floor(b.x),
        Math.floor(b.y),
        Math.floor(b.orientation),
        b.HP,
        b.Fuel,
        b.damageDealt
      );
    }
    console.log(`Game ${gameId} state synced on-chain.`);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Error syncing on-chain:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Endpoint 6: Finish Game & Settle Bets ---
// Once the winner is determined off-chain, we call finishGame on-chain to settle bets.
// The smart contract then deducts a 10% fee and transfers the remaining prize pool to the winner.
router.post("/finishGame", async (req, res) => {
  const { gameId } = req.body;
  const game = games[gameId];
  if (!game) {
    return res.status(400).json({ error: "Game not found" });
  }
  
  // Determine the winning bot (using highest HP, tie-break with damageDealt)
  let bestHp = -1;
  let bestDamage = -1;
  let winningBotIndex = 0;
  game.bots.forEach((b, i) => {
    if (b.HP > bestHp) {
      bestHp = b.HP;
      bestDamage = b.damageDealt;
      winningBotIndex = i;
    } else if (b.HP === bestHp && b.damageDealt > bestDamage) {
      bestDamage = b.damageDealt;
      winningBotIndex = i;
    }
  });

  try {
    await contractWrapper.finishGame(gameId, winningBotIndex);
    game.isActive = false;
    console.log(`Game ${gameId} finished. Winning bot: ${winningBotIndex}`);
    return res.json({ ok: true, winningBotIndex });
  } catch (err: any) {
    console.error("Error finishing game:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Endpoint: Get Available Weapons ---
router.get("/weapons", (req, res) => {
  try {
    const weapons = WeaponService.getAllWeapons();
    return res.json({ weapons });
  } catch (err: any) {
    console.error("Error fetching weapons:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Endpoint: Get Weapon Details ---
router.get("/weapons/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const weapon = WeaponService.getWeaponById(id);
    
    if (!weapon) {
      return res.status(404).json({ error: "Weapon not found" });
    }

    return res.json({ weapon });
  } catch (err: any) {
    console.error("Error fetching weapon:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;