// server/src/interfaces/IContractWrapper.ts
export interface IContractWrapper {
    createGame(): Promise<string>;
  
    registerBot(
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
    ): Promise<void>;
  
    updateBotState(
      gameId: number,
      botId: number,
      x: number,
      y: number,
      orientation: number,
      hp: number,
      fuel: number,
      damageDealt: number
    ): Promise<void>;
  
    finishGame(gameId: number, winningBotId: number): Promise<void>;
  }
  