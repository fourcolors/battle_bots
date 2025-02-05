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
  }
  
  export interface GameState {
    isActive: boolean;
    turnCount: number;
    bots: BotState[];
    // track who has AP left, etc. 
    // Or you can track it in the logic function.
  }
  
  export const games: Record<string, GameState> = {};
  