import { Router } from "express";
import { ContractWrapper } from "./contract/contractWrapper";
import { games, GameState, BotState } from "./memoryState";
import {
  performAttack,
  performMove,
  performRotate
} from "./gameLogic";
import { IContractWrapper } from "./contract/IContractWrapper";
import { getContractWrapper } from "./contract/getContractWrapper";

const router = Router();
const contractWrapper: IContractWrapper = getContractWrapper(); // Dependency Injection


// Just for example, we store an incrementing local ID for "bot actions"
let actionIdCounter = 0;

// --- Endpoint 1: Create Game ---
// Users must provide a betAmount (in USDC, as defined by our smart contract).
router.post("/createGame", async (req, res) => {
  try {
    const { betAmount } = req.body;
    if (!betAmount) {
      return res.status(400).json({ error: "betAmount is required" });
    }
    // Call smart contract to create a new game with the fixed bet amount.
    const gameId = (await contractWrapper.createGame(betAmount)).toString();
    // Initialize off-chain game state.
    games[gameId] = {
      isActive: true,
      turnCount: 0,
      currentBotIndex: 0,
      bots: []
    };
    console.log(`Game ${gameId} created with betAmount ${betAmount}. Starting with bot index 0.`);
    return res.json({ ok: true, gameId });
  } catch (err: any) {
    console.error("Error in createGame:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Endpoint 2: Register Bots ---
// NOTE: The user has already called registerBot on-chain (which locks in the USDC bet)
// We now record the bot off-chain along with its initial AI prompt.
// For now, we mark each bot as unverified; verification can be added as a separate task.
router.post("/registerBots", async (req, res) => {
  const { gameId, bots } = req.body; // bots should include fields like x, y, orientation, HP, etc. and an optional "prompt"
  try {
    if (!games[gameId]) {
      return res.status(400).json({ error: "Game not found" });
    }
    for (let i = 0; i < bots.length; i++) {
      const b = bots[i];
      // todo: sync with on-chain here
      // Save the bot off-chain along with its AI prompt and unverified flag.
      games[gameId].bots.push({ ...b, apConsumed: 0, verified: false });
      console.log(`Registered bot ${i} for game ${gameId} off-chain. (Unverified)`);
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Error in registerBots:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Endpoint 3: Process a Turn & Auto-Finish if Game Over ---
// Processes the current bot’s turn and, if only one bot remains alive, automatically settles the game.
router.post("/turn", async (req, res) => {
  const { gameId, botIndex, actions } = req.body;
  const game = games[gameId];
  if (!game || !game.isActive) {
    return res.status(400).json({ error: "Game not active or doesn't exist" });
  }
  
  // Enforce round-robin: only the current bot may act.
  if (botIndex !== game.currentBotIndex) {
    console.warn(`Bot ${botIndex} tried to act out-of-turn. Current bot: ${game.currentBotIndex}`);
    return res.status(400).json({ error: `It is not bot ${botIndex}'s turn. It is bot ${game.currentBotIndex}'s turn.` });
  }

  const bot = game.bots[botIndex];
  if (!bot) {
    return res.status(404).json({ error: "Bot not found" });
  }
  
  console.log(`Game ${gameId} Bot ${botIndex} starting turn. Global turnCount=${game.turnCount}`);
  let successLog: string[] = [];
  
  // Process each action sequentially until 2 AP are consumed.
  for (const act of actions) {
    if (bot.apConsumed >= 2) {
      successLog.push("No AP left; ignoring further actions.");
      break;
    }
    if (bot.HP <= 0) {
      successLog.push("Bot is destroyed, cannot perform further actions.");
      break;
    }
    if (act.type === "move") {
      const result = performMove(bot, act.x, act.y);
      if (result === "OK") {
        successLog.push(`Move success: new position (${bot.x}, ${bot.y}).`);
        console.log(`Bot ${botIndex} moved to (${bot.x}, ${bot.y}).`);
        bot.apConsumed++;
      } else {
        successLog.push(`Move failed: ${result}.`);
        console.log(`Bot ${botIndex} move failed: ${result}.`);
      }
    } else if (act.type === "rotate") {
      const result = performRotate(bot, act.newOrientation);
      if (result === "OK") {
        successLog.push(`Rotate success: now facing ${bot.orientation}°.`);
        console.log(`Bot ${botIndex} rotated to ${bot.orientation}°.`);
        bot.apConsumed++;
      } else {
        successLog.push(`Rotate failed: ${result}.`);
        console.log(`Bot ${botIndex} rotate failed: ${result}.`);
      }
    } else if (act.type === "attack") {
      // Attack always consumes 1 AP.
      bot.apConsumed++;
      const target = game.bots[act.targetIndex];
      if (!target) {
        successLog.push("Attack failed: Invalid target index.");
        console.log(`Bot ${botIndex} attack failed: invalid target ${act.targetIndex}.`);
        continue;
      }
      const { finalDamage, isHit } = performAttack(bot, target);
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

  // Check if the bot has consumed its 2 AP; if so, update turn order.
  if (bot.apConsumed >= 2) {
    console.log(`Bot ${botIndex} finished its turn (2 AP consumed). Resetting AP and updating turn order.`);
    bot.apConsumed = 0;
    game.currentBotIndex = (game.currentBotIndex + 1) % game.bots.length;
    if (game.currentBotIndex === 0) {
      game.turnCount++;
      console.log(`All bots have acted. Global turn count is now ${game.turnCount}.`);
    }
  } else {
    console.log(`Bot ${botIndex} ended turn with ${bot.apConsumed} AP (turn incomplete).`);
  }

  // *** Auto-Finish Logic ***  
  // Count alive bots (HP > 0). If only one remains, end the game.
  const aliveBots = game.bots.filter(b => b.HP > 0);
  if (aliveBots.length === 1) {
    // Identify the winning bot index.
    const winningBotIndex = game.bots.findIndex(b => b.HP > 0);
    try {
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
    botState: bot,
    currentBotIndex: game.currentBotIndex,
    turnCount: game.turnCount
  });
});

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
    bots: game.bots.map((bot, index) => ({
      botId: index,
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


export default router;