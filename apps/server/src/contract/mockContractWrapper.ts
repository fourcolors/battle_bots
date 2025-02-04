// server/src/mockContractWrapper.ts
import { IContractWrapper } from "./IContractWrapper";

export class MockContractWrapper implements IContractWrapper {
  private mockGames: Record<number, any> = {};
  private mockGameCounter = 0;

  constructor() {
    console.log("[MockContractWrapper] Running in DEBUG mode (mock contract)");
  }

  async createGame(): Promise<string> {
    this.mockGameCounter += 1;
    this.mockGames[this.mockGameCounter] = { active: true, bots: [] };
    console.log(`[DEBUG] Created mock game with ID: ${this.mockGameCounter}`);
    return this.mockGameCounter.toString();
  }

  async registerBot(gameId: number, x: number, y: number, orientation: number, hp: number, attack: number, defense: number, speed: number, fuel: number, weaponChoice: number): Promise<void> {
    if (!this.mockGames[gameId]) throw new Error(`[DEBUG] Game ID ${gameId} does not exist`);
    const botId = (this.mockGames[gameId].bots.length || 0);
    const bot = { botId, x, y, orientation, hp, attack, defense, speed, fuel, weaponChoice, damageDealt: 0 };
    this.mockGames[gameId].bots.push(bot);
    console.log(`[DEBUG] Registered bot ${botId} in game ${gameId}`);
  }

  async updateBotState(gameId: number, botId: number, x: number, y: number, orientation: number, hp: number, fuel: number, damageDealt: number): Promise<void> {
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
