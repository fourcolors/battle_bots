/**
 * memoryState.ts
 * We'll store ephemeral states for each game and each bot in memory.
 * For real usage, you'd use a DB or something more persistent.
 */
export interface BotState {
    x: number;
    y: number;
    orientation: number; // 0..359
    HP: number;
    Attack: number;
    Defense: number;
    Speed: number;
    Fuel: number;
    damageDealt: number;
    weaponChoice: number; // 0..4
    apConsumed: number;  // AP consumed in the current turn (0 to 2)
    // Off-chain additions:
    prompt?: string;
    verified?: boolean;
  }
  
  export interface GameState {
    isActive: boolean;
    turnCount: number;
    bots: BotState[];
    currentBotIndex: number; // which bot's turn it is now (round-robin order)
  }
  
  export const games: Record<string, GameState> = {};
  