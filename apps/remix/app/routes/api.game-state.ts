import type { LoaderFunction } from "@remix-run/node";
import type { GameState } from "~/types/game";

export const loader: LoaderFunction = async () => {
  // TODO: Replace with actual database/state management
  return {
    id: "game1",
    status: "active",
    turn: 1,
    currentPlayer: "0x123...",
    bots: [
      {
        id: "bot1",
        position: { x: 100, y: 100 },
        health: 100,
        energy: 100,
        name: "Bot 1",
        owner: "0x123..."
      },
      {
        id: "bot2",
        position: { x: 700, y: 500 },
        health: 80,
        energy: 60,
        name: "Bot 2",
        owner: "0x456..."
      }
    ],
    lastUpdate: Date.now()
  } satisfies GameState;
}; 