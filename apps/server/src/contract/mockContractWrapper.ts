import { IContractWrapper } from "./IContractWrapper";

export class MockContractWrapper implements IContractWrapper {
  private mockGames: Record<number, any> = {};
  private mockGameCounter = 0;

  constructor() {
    console.log("[MockContractWrapper] Running in DEBUG mode (mock contract)");
  }

  async createGame(betAmount: number): Promise<string> {
    this.mockGameCounter += 1;
    // Store betAmount as part of game state.
    this.mockGames[this.mockGameCounter] = { active: true, bots: [], betAmount, prizePool: 0 };
    console.log(`[DEBUG] Created mock game with ID: ${this.mockGameCounter}, betAmount: ${betAmount}`);
    return this.mockGameCounter.toString();
  }

  async registerBot(
    gameId: number,
    x: number,
    y: number,
    orientation: number,
    hp: number,
    attack: number,
    defense: number,
    speed: number,
    fuel: number,
    weaponChoice: number
  ): Promise<void> {
    if (!this.mockGames[gameId]) throw new Error(`[DEBUG] Game ID ${gameId} does not exist`);
    const botId = (this.mockGames[gameId].bots.length || 0);
    const bot = { botId, x, y, orientation, hp, attack, defense, speed, fuel, weaponChoice, damageDealt: 0 };
    this.mockGames[gameId].bots.push(bot);
    // Mimic contract behavior: add betAmount to the prize pool.
    this.mockGames[gameId].prizePool += this.mockGames[gameId].betAmount;
    console.log(`[DEBUG] Registered bot ${botId} in game ${gameId}. Updated prizePool: ${this.mockGames[gameId].prizePool}`);
  }

  async updateBotState(
    gameId: number,
    botId: number,
    x: number,
    y: number,
    orientation: number,
    hp: number,
    fuel: number,
    damageDealt: number
  ): Promise<void> {
    if (!this.mockGames[gameId]) throw new Error(`[DEBUG] Game ID ${gameId} does not exist`);
    if (!this.mockGames[gameId].bots[botId]) throw new Error(`[DEBUG] Bot ID ${botId} does not exist`);

    const bot = this.mockGames[gameId].bots[botId];
    Object.assign(bot, { x, y, orientation, hp, fuel, damageDealt });
    console.log(`[DEBUG] Updated bot ${botId} in game ${gameId}`);
  }

  async finishGame(gameId: number, winningBotId: number): Promise<void> {
    if (!this.mockGames[gameId]) throw new Error(`[DEBUG] Game ID ${gameId} does not exist`);
    this.mockGames[gameId].active = false;
    console.log(`[DEBUG] Finished game ${gameId}, winner: Bot ${winningBotId}`);
  }
}
