#!/bin/bash
# simulate_game.sh
# This script creates a game, registers two bots (one with lower HP to force a win),
# and simulates turns until one bot wins.

BASE_URL="http://localhost:3000"

echo "Creating game with bet amount 10 USDC..."
CREATE_OUTPUT=$(curl -s -X POST $BASE_URL/createGame \
  -H "Content-Type: application/json" \
  -d '{"betAmount":10}')
echo "Game created: $CREATE_OUTPUT"
GAME_ID=$(echo $CREATE_OUTPUT | jq -r '.gameId')
echo "Game ID: $GAME_ID"

echo "Registering Bot 0 (HP:10)..."
REGISTER_BOT_0=$(curl -s -X POST $BASE_URL/registerBot \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$GAME_ID\", \"bot\": {\"x\": 1, \"y\": 1, \"orientation\": 0, \"HP\": 10, \"Attack\": 2, \"Defense\": 1, \"Speed\": 2, \"Fuel\": 10, \"weaponChoice\": 1, \"prompt\": \"Attack!\"}}")
echo "Bot 0 registration: $REGISTER_BOT_0"
BOT0_INDEX=$(echo $REGISTER_BOT_0 | jq -r '.botIndex')
echo "Bot 0 index: $BOT0_INDEX"

echo "Registering Bot 1 (HP:5)..."
REGISTER_BOT_1=$(curl -s -X POST $BASE_URL/registerBot \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$GAME_ID\", \"bot\": {\"x\": 3, \"y\": 3, \"orientation\": 0, \"HP\": 5, \"Attack\": 3, \"Defense\": 1, \"Speed\": 2, \"Fuel\": 10, \"weaponChoice\": 1, \"prompt\": \"Defend!\"}}")
echo "Bot 1 registration: $REGISTER_BOT_1"
BOT1_INDEX=$(echo $REGISTER_BOT_1 | jq -r '.botIndex')
echo "Bot 1 index: $BOT1_INDEX"

echo "Starting game simulation..."
while true; do
  # Retrieve current game state
  GAME_STATE=$(curl -s $BASE_URL/getGameState/$GAME_ID)
  echo "Current Game State: $GAME_STATE"
  
  IS_ACTIVE=$(echo $GAME_STATE | jq -r '.isActive')
  CURRENT_BOT_INDEX=$(echo $GAME_STATE | jq -r '.currentBotIndex')
  
  # Break if the game is finished
  if [ "$IS_ACTIVE" == "false" ]; then
      # Find the winning bot's index (the only bot with HP > 0)
      WINNER=$(echo $GAME_STATE | jq -r '.bots[] | select(.HP > 0) | .botIndex')
      echo "Game finished! Winning bot: $WINNER"
      break
  fi
  
  # Determine target: if current bot is 0, target 1; if current bot is 1, target 0.
  if [ "$CURRENT_BOT_INDEX" -eq "0" ]; then
    TARGET=1
  else
    TARGET=0
  fi
  
  echo "Bot $CURRENT_BOT_INDEX is attacking Bot $TARGET..."
  TURN_OUTPUT=$(curl -s -X POST $BASE_URL/turn \
    -H "Content-Type: application/json" \
    -d "{\"gameId\": \"$GAME_ID\", \"botIndex\": $CURRENT_BOT_INDEX, \"actions\": [{\"type\": \"attack\", \"targetIndex\": $TARGET}]}")  
  echo "Turn Output: $TURN_OUTPUT"
  
  sleep 1
done

echo "Simulation complete."
