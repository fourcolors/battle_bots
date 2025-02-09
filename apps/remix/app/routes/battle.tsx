import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import { commandQueueAtom, gameErrorAtom, gameStateAtom, isCurrentTurnAtom, isLoadingAtom, selectedBotAtom } from "../atoms/game";
import type { Bot, GameCommand, GameState, Position } from "../types/game";

// Command pattern implementations
class GameBoard {
  private app: Application;
  private gameObjects: Map<string, Container>;
  private gridSize = 50;
  private botSize = 40;
  private onBotClick: (botId: string) => void;

  constructor(canvas: HTMLCanvasElement, onBotClick: (botId: string) => void) {
    this.app = new Application({
      view: canvas,
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a1a,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });
    
    this.gameObjects = new Map();
    this.onBotClick = onBotClick;
    this.createGrid();
  }

  private createGrid() {
    const grid = new Graphics();
    grid.lineStyle(1, 0x333333);
    
    // Draw vertical lines
    for (let x = 0; x <= 800; x += this.gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, 600);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= 600; y += this.gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(800, y);
    }
    
    this.app.stage.addChild(grid);
  }

  public addBot(id: string, x: number, y: number, health: number, energy: number, isSelected: boolean = false) {
    const container = new Container();
    
    // Bot body
    const bot = new Graphics();
    bot.beginFill(isSelected ? 0x00ff00 : 0xff0000);
    bot.drawCircle(0, 0, this.botSize / 2);
    bot.endFill();
    
    // Health bar background
    const healthBarBg = new Graphics();
    healthBarBg.beginFill(0x000000);
    healthBarBg.drawRect(-this.botSize/2, -this.botSize/2 - 10, this.botSize, 5);
    healthBarBg.endFill();
    
    // Health bar
    const healthBar = new Graphics();
    healthBar.beginFill(0x00ff00);
    healthBar.drawRect(-this.botSize/2, -this.botSize/2 - 10, this.botSize * (health / 100), 5);
    healthBar.endFill();
    
    // Energy bar background
    const energyBarBg = new Graphics();
    energyBarBg.beginFill(0x000000);
    energyBarBg.drawRect(-this.botSize/2, -this.botSize/2 - 5, this.botSize, 5);
    energyBarBg.endFill();
    
    // Energy bar
    const energyBar = new Graphics();
    energyBar.beginFill(0x0000ff);
    energyBar.drawRect(-this.botSize/2, -this.botSize/2 - 5, this.botSize * (energy / 100), 5);
    energyBar.endFill();
    
    container.addChild(bot, healthBarBg, healthBar, energyBarBg, energyBar);
    container.x = x;
    container.y = y;
    
    // Make bot interactive
    container.eventMode = 'dynamic';
    container.cursor = 'pointer';
    container.on('pointerdown', () => this.onBotClick(id));
    
    this.gameObjects.set(id, container);
    this.app.stage.addChild(container);
  }

  public updateBot(id: string, x: number, y: number, health: number, energy: number, isSelected: boolean = false) {
    const existingBot = this.gameObjects.get(id);
    if (existingBot) {
      this.app.stage.removeChild(existingBot);
      this.gameObjects.delete(id);
    }
    this.addBot(id, x, y, health, energy, isSelected);
  }

  public destroy() {
    try {
      // Remove all event listeners and objects
      this.gameObjects.forEach(obj => {
        obj.removeAllListeners();
        this.app.stage.removeChild(obj);
        obj.destroy();
      });
      this.gameObjects.clear();

      // Destroy the application
      this.app.destroy();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Command implementations
class MoveCommand implements GameCommand {
  type = 'MOVE' as const;
  
  constructor(
    public botId: string,
    public payload: { position: Position }
  ) {}
}

class AttackCommand implements GameCommand {
  type = 'ATTACK' as const;
  
  constructor(
    public botId: string,
    public payload: { target: string }
  ) {}
}

// Loader function to get initial game state
export const loader: LoaderFunction = async () => {
  // TODO: Replace with actual API call
  return {
    gameState: {
      id: "game1",
      status: "active",
      turn: 1,
      currentPlayer: "0x123...",
      bots: [
        { id: "bot1", position: { x: 100, y: 100 }, health: 100, energy: 100, name: "Bot 1", owner: "0x123..." },
        { id: "bot2", position: { x: 700, y: 500 }, health: 80, energy: 60, name: "Bot 2", owner: "0x456..." }
      ],
      lastUpdate: Date.now()
    }
  };
};

export default function Battle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameBoardRef = useRef<GameBoard | null>(null);
  const { gameState: initialGameState } = useLoaderData<typeof loader>();
  
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [selectedBot, setSelectedBot] = useAtom(selectedBotAtom);
  const [commandQueue, setCommandQueue] = useAtom(commandQueueAtom);
  const isCurrentTurn = useAtomValue(isCurrentTurnAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);
  const setError = useSetAtom(gameErrorAtom);

  // Initialize game state
  useEffect(() => {
    setGameState(initialGameState);
  }, [initialGameState, setGameState]);

  // Initialize game board
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    // Clean up previous instance if it exists
    if (gameBoardRef.current) {
      gameBoardRef.current.destroy();
      gameBoardRef.current = null;
    }

    const gameBoard = new GameBoard(canvasRef.current, (botId) => {
      setSelectedBot(selectedBot === botId ? null : botId);
    });
    gameBoardRef.current = gameBoard;

    gameState.bots.forEach((bot: Bot) => {
      gameBoard.addBot(
        bot.id,
        bot.position.x,
        bot.position.y,
        bot.health,
        bot.energy,
        bot.id === selectedBot
      );
    });

    return () => {
      if (gameBoardRef.current) {
        try {
          gameBoardRef.current.destroy();
          gameBoardRef.current = null;
        } catch (error) {
          console.error('Error cleaning up game board:', error);
        }
      }
    };
  }, [gameState, selectedBot]);

  // Poll for game state updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/game-state');
        const newGameState = await response.json() as GameState;
        setGameState(newGameState);
        setIsLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update game state');
        setIsLoading(false);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [setGameState, setIsLoading, setError]);

  // Handle command execution
  const executeCommand = async (command: GameCommand) => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      await fetch('/api/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      setCommandQueue([...commandQueue, command]);
      setIsLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute command');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6 pixelated">
          Battle Arena
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="md:col-span-2 bg-gray-900 p-4 rounded-lg pixelated-border">
            <canvas ref={canvasRef} className="w-full rounded-lg" />
          </div>
          
          {/* Game Controls */}
          <div className="space-y-4">
            {/* Game Status */}
            <div className="bg-gray-900 p-4 rounded-lg pixelated-border">
              <h2 className="text-xl font-bold text-blue-400 mb-2">Game Status</h2>
              <p>Turn: {gameState?.turn}</p>
              <p>Current Player: {gameState?.currentPlayer}</p>
              <p>Status: {gameState?.status}</p>
            </div>
            
            {/* Selected Bot Controls */}
            {selectedBot && isCurrentTurn && (
              <div className="bg-gray-900 p-4 rounded-lg pixelated-border">
                <h2 className="text-xl font-bold text-green-400 mb-2">Bot Controls</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded pixelated"
                    onClick={() => executeCommand(new MoveCommand(selectedBot, { position: { x: 0, y: 0 } }))}
                  >
                    Move
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded pixelated"
                    onClick={() => executeCommand(new AttackCommand(selectedBot, { target: "enemy" }))}
                  >
                    Attack
                  </button>
                </div>
              </div>
            )}
            
            {/* Command Queue */}
            <div className="bg-gray-900 p-4 rounded-lg pixelated-border">
              <h2 className="text-xl font-bold text-purple-400 mb-2">Command Queue</h2>
              <div className="space-y-2">
                {commandQueue.map((command: GameCommand, index: number) => (
                  <div key={index} className="text-sm">
                    {command.type}: Bot {command.botId}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 