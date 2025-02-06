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

/**
 * Start a new game: calls createGame() on chain, then store ephemeral data
 */
router.post("/createGame", async (req, res) => {
  try {
    const gameId = (await contractWrapper.createGame()).toString();
    games[gameId] = {
      isActive: true,
      turnCount: 0,
      bots: []
    };
    return res.json({ ok: true, gameId });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Register a set of bots (like 2 or 4). For each bot,
 * we also call contract.registerBot, and store ephemeral state.
 */
router.post("/registerBots", async (req, res) => {
  const { gameId, bots } = req.body;
  // bots = array of { x, y, orientation, stats...}
  // Example:
  //  bots: [
  //    { x:1, y:1, orientation:0, HP:10, Attack:2, Defense:3, Speed:2, Fuel:10, damageDealt:0, weaponChoice:1 }
  //    ...
  //  ]
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
      // ephemeral
      games[gameId].bots.push({ ...b });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Example "turn" endpoint: a single bot's actions:
 * body = {
 *   gameId,
 *   botIndex,  // which bot
 *   actions: [
 *      { type: "move", x:..., y:... },
 *      { type: "rotate", newOrientation: 120 },
 *      { type: "attack", targetIndex: 1 }
 *   ]
 * }
 * We'll do 2 AP total. This is super naive, no checks for AP usage or turn ordering.
 */
router.post("/turn", (req, res) => {
  const { gameId, botIndex, actions } = req.body;
  const game = games[gameId];
  if (!game || !game.isActive) {
    return res.status(400).json({ error: "Game not active or doesn't exist" });
  }
  const bot = game.bots[botIndex];
  if (!bot) {
    return res.status(404).json({ error: "Bot not found" });
  }
  // if bot has 0 fuel, can't move. But can rotate/attack
  // if HP=0 => skip ?

  let successLog: any[] = [];
  let usedAP = 0;

  for (const act of actions) {
    if (usedAP >= 2) {
      successLog.push("No AP left; ignoring further actions");
      break;
    }
    if (act.type === "move") {
      // check if bot has HP>0
      if (bot.HP <= 0) {
        successLog.push("Bot is destroyed, cannot move");
        break;
      }
      const result = performMove(bot, act.x, act.y);
      if (result !== "OK") {
        successLog.push(`Move failed: ${result}`);
      } else {
        successLog.push(`Move success to (${bot.x}, ${bot.y})`);
      }
      usedAP++;
    } else if (act.type === "rotate") {
      if (bot.HP <= 0) {
        successLog.push("Bot is destroyed, cannot rotate");
        break;
      }
      const result = performRotate(bot, act.newOrientation);
      if (result !== "OK") {
        successLog.push(`Rotate failed: ${result}`);
      } else {
        successLog.push(`Rotate success: now facing ${bot.orientation}°`);
      }
      usedAP++;
    } else if (act.type === "attack") {
      if (bot.HP <= 0) {
        successLog.push("Bot is destroyed, cannot attack");
        break;
      }
      const target = game.bots[act.targetIndex];
      if (!target) {
        successLog.push("Invalid target index");
        continue;
      }
      // do the weapon logic
      const { finalDamage, isHit } = performAttack(bot, target);
      if (isHit) {
        successLog.push(`Attacked target #${act.targetIndex} for ${finalDamage} dmg`);
      } else {
        successLog.push("Attack missed or out of range");
      }
      usedAP++;
    } else {
      successLog.push(`Unknown action type: ${act.type}`);
    }
  }

  // optionally increment turnCount if this is a new player's turn
  // (we’re skipping round-robin logic in this MVP)

  return res.json({ successLog, botState: bot });
});

router.get("/getGameState/:gameId", (req, res) => {
  const { gameId } = req.params;
  const game = games[gameId];

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  // Return full game state (active status, bots, turn count, etc.)
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


/**
 * Optionally, sync ephemeral states on-chain using updateBotState
 * so watchers can see partial states.
 * In a real scenario, you'd do this after each round or at some intervals.
 */
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
    return res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * End the game and decide a winner using the rules:
 * 1) Highest HP
 * 2) Tiebreak => highest damageDealt
 * 3) If still tie => next successful hit => sudden death 
 *    (for MVP we'll skip the sudden death or handle in a simpler way)
 */
router.post("/finishGame", async (req, res) => {
  const { gameId } = req.body;
  const game = games[gameId];
  if (!game) {
    return res.status(400).json({ error: "Game not found" });
  }
  // let's do the HP check
  let bestHp = -1;
  let bestDamage = -1;
  let winningBotIndex = 0;

  game.bots.forEach((b, i) => {
    if (b.HP > bestHp) {
      bestHp = b.HP;
      bestDamage = b.damageDealt;
      winningBotIndex = i;
    } else if (b.HP === bestHp) {
      // check damage
      if (b.damageDealt > bestDamage) {
        bestDamage = b.damageDealt;
        winningBotIndex = i;
      }
    }
  });

  // call contract to finalize
  try {
    await contractWrapper.finishGame(gameId, winningBotIndex);
    // mark local
    game.isActive = false;
    return res.json({ ok: true, winningBotIndex });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
