import type { ActionFunction } from "@remix-run/node";
import type { GameCommand } from "~/types/game";

export const action: ActionFunction = async ({ request }) => {
  const command = await request.json() as GameCommand;
  
  // TODO: Replace with actual command execution logic
  console.log('Executing command:', command);
  
  // Return success response
  return {
    success: true,
    command
  };
}; 