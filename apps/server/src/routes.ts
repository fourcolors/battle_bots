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

// Create a new game endpoint
router.post("/createGame", async (req, res) => {
  try {
    const gameId = (await contractWrapper.createGame()).toString();
    games[gameId] = {
      isActive: true,
      turnCount: 0,
      currentBotIndex: 0,
      bots: []
    };
    console.log(`Game ${gameId} created. Starting with bot index 0.`);
    return res.json({ ok: true, gameId });
  } catch (err: any) {
    console.error("Error in createGame:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Register bots and initialize their AP counters
router.post("/registerBots", async (req, res) => {
  const { gameId, bots } = req.body;
  try {
    if (!games[gameId]) {
      return res.status(400).json({ error: "Game not found" });
    }
    for (let i = 0; i < bots.length; i++) {
      const b = bots[i];
      await contractWrapper.registerBot(
        gameId,
        b.x,
        b.y,
        b.orientation,
        b.HP,
        b.Attack,
        b.Defense,
        b.Speed,
        b.Fuel,
        b.weaponChoice
      );
      // Add extra field: apConsumed starts at 0.
      games[gameId].bots.push({ ...b, apConsumed: 0 });
      console.log(`Registered bot ${i} for game ${gameId}.`);
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Error in registerBots:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/turn", (req, res) => {
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
        bot.apConsumed++;  // Consume AP if move was successful.
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
      // Attack consumes AP regardless.
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

  // When the bot has consumed 2 AP, its turn is complete.
  if (bot.apConsumed >= 2) {
    console.log(`Bot ${botIndex} finished its turn (consumed 2 AP). Resetting AP and updating turn order.`);
    // Reset AP for this bot (if needed for future rounds)
    bot.apConsumed = 0;
    
    // Update the global turn order.
    // Move to the next bot in the list.
    game.currentBotIndex = (game.currentBotIndex + 1) % game.bots.length;
    // If we've wrapped back to index 0, increment the global turn counter.
    if (game.currentBotIndex === 0) {
      game.turnCount++;
      console.log(`All bots have acted. Incrementing global turn count to ${game.turnCount}.`);
    }
  } else {
    console.log(`Bot ${botIndex} ended turn with ${bot.apConsumed} AP consumed (turn not complete).`);
  }
  
  return res.json({ successLog, botState: bot, currentBotIndex: game.currentBotIndex, turnCount: game.turnCount });
});

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
      weaponChoice: bot.weaponChoice
    }))
  });
});

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

router.post("/finishGame", async (req, res) => {
  const { gameId } = req.body;
  const game = games[gameId];
  if (!game) {
    return res.status(400).json({ error: "Game not found" });
  }
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