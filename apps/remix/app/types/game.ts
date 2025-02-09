export interface Position {
  x: number;
  y: number;
}

export interface Bot {
  id: string;
  position: Position;
  health: number;
  energy: number;
  name: string;
  owner: string;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  turn: number;
  currentPlayer: string;
  bots: Bot[];
  lastUpdate: number;
  winner?: string;
}

export interface GameCommand {
  type: 'MOVE' | 'ATTACK' | 'DEFEND' | 'CHARGE';
  botId: string;
  payload: {
    position?: Position;
    target?: string;
    amount?: number;
  };
} 