import { atom } from 'jotai';
import type { GameCommand, GameState } from '../types/game';

// Game state atom
export const gameStateAtom = atom<GameState | null>(null);

// Command queue atom
export const commandQueueAtom = atom<GameCommand[]>([]);

// Selected bot atom
export const selectedBotAtom = atom<string | null>(null);

// Game loading state
export const isLoadingAtom = atom<boolean>(false);

// Game error state
export const gameErrorAtom = atom<string | null>(null);

// Derived atoms
export const currentPlayerBotsAtom = atom((get) => {
  const gameState = get(gameStateAtom);
  if (!gameState) return [];
  
  return gameState.bots.filter(bot => bot.owner === gameState.currentPlayer);
});

export const isCurrentTurnAtom = atom((get) => {
  const gameState = get(gameStateAtom);
  if (!gameState) return false;
  
  // TODO: Replace with actual player address from wallet
  const playerAddress = "0x123..."; // This should come from wallet connection
  return gameState.currentPlayer === playerAddress;
}); 