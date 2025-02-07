#!/bin/bash
# simulate_sophisticated_game.sh
# This script simulates a sophisticated game with 3 bots and at least 3 rounds.
# It creates a game, registers three bots, then repeatedly fetches the game state
# and issues a turn command for the current bot. The turn command is always sent
# for the bot index returned by the /getGameState endpoint, so that no out-of-turn
# errors occur. The simple logic is:
#   - If currentBot == 0, attack bot 1.
#   - If currentBot == 1, attack bot 2.
#   - If currentBot == 2, attack bot 0.
#
# The loop continues until the game auto-finishes (i.e. only one bot is alive).

BASE_URL="http://localhost:3000"

# Helper function to pause briefly
function pause() {
  sleep 0.5
}

# Function to fetch game state (using jq)
function get_game_state() {
  curl -s "$BASE_URL/getGameState/$1"
}

echo "Creating game with bet amount 10 USDC..."
CREATE_OUT=$(curl -s -X POST "$BASE_URL/createGame" \
  -H "Content-Type: application/json" \
  -d '{"betAmount":10}')
echo "Game creation output: $CREATE_OUT"
GAME_ID=$(echo "$CREATE_OUT" | jq -r '.gameId')
echo "Game ID: $GAME_ID"
pause

# Register Bot0
echo "Registering Bot0..."
BOT0_PAYLOAD=$(cat <<EOF
{
  "gameId": "$GAME_ID",
  "bot": {
    "x": 1,
    "y": 1,
    "orientation": 0,
    "HP": 10,
    "Attack": 2,
    "Defense": 1,
    "Speed": 2,
    "Fuel": 10,
    "weaponChoice": 1,
    "prompt": "Bot0: Ready to rumble!"
  }
}
EOF
)
BOT0_OUT=$(curl -s -X POST "$BASE_URL/registerBot" \
  -H "Content-Type: application/json" \
  -d "$BOT0_PAYLOAD")
echo "Bot0 registration: $BOT0_OUT"
BOT0_INDEX=$(echo "$BOT0_OUT" | jq -r '.botIndex')
echo "Bot0 index: $BOT0_INDEX"
pause

# Register Bot1
echo "Registering Bot1..."
BOT1_PAYLOAD=$(cat <<EOF
{
  "gameId": "$GAME_ID",
  "bot": {
    "x": 2,
    "y": 1,
    "orientation": 180,
    "HP": 12,
    "Attack": 2,
    "Defense": 2,
    "Speed": 2,
    "Fuel": 10,
    "weaponChoice": 1,
    "prompt": "Bot1: On guard!"
  }
}
EOF
)
BOT1_OUT=$(curl -s -X POST "$BASE_URL/registerBot" \
  -H "Content-Type: application/json" \
  -d "$BOT1_PAYLOAD")
echo "Bot1 registration: $BOT1_OUT"
BOT1_INDEX=$(echo "$BOT1_OUT" | jq -r '.botIndex')
echo "Bot1 index: $BOT1_INDEX"
pause

# Register Bot2
echo "Registering Bot2..."
BOT2_PAYLOAD=$(cat <<EOF
{
  "gameId": "$GAME_ID",
  "bot": {
    "x": 3,
    "y": 1,
    "orientation": 0,
    "HP": 8,
    "Attack": 2,
    "Defense": 1,
    "Speed": 2,
    "Fuel": 10,
    "weaponChoice": 1,
    "prompt": "Bot2: Aggressive!"
  }
}
EOF
)
BOT2_OUT=$(curl -s -X POST "$BASE_URL/registerBot" \
  -H "Content-Type: application/json" \
  -d "$BOT2_PAYLOAD")
echo "Bot2 registration: $BOT2_OUT"
BOT2_INDEX=$(echo "$BOT2_OUT" | jq -r '.botIndex')
echo "Bot2 index: $BOT2_INDEX"
pause

echo "Starting turn sequence simulation..."

# Loop until game is finished (isActive becomes false)
while true; do
  # Fetch current game state
  STATE=$(get_game_state "$GAME_ID")
  IS_ACTIVE=$(echo "$STATE" | jq -r '.isActive')
  CURRENT_BOT=$(echo "$STATE" | jq -r '.currentBotIndex')
  TURN_COUNT=$(echo "$STATE" | jq -r '.turnCount')
  BOT_COUNT=$(echo "$STATE" | jq '.bots | length')
  
  # If game is not active, break out of loop
  if [ "$IS_ACTIVE" != "true" ]; then
    echo "Game has finished."
    break
  fi

  # Decide on target for the current bot:
  # For simplicity, if currentBot is 0 target = 1; if 1 then target = 2; if 2 then target = 0.
  if [ "$CURRENT_BOT" -eq 0 ]; then
    TARGET=1
  elif [ "$CURRENT_BOT" -eq 1 ]; then
    TARGET=2
  else
    TARGET=0
  fi

  echo "Game ${GAME_ID} Turn ${TURN_COUNT}: Bot ${CURRENT_BOT} is acting; targeting bot ${TARGET}."

  # Send turn command: one attack action.
  TURN_OUT=$(curl -s -X POST "$BASE_URL/turn" \
    -H "Content-Type: application/json" \
    -d '{"gameId":"'"$GAME_ID"'","botIndex":'"$CURRENT_BOT"', "actions":[{"type":"attack","targetIndex":'"$TARGET"'}]}')
  echo "Turn output: $TURN_OUT"
  
  # Optionally, print a separator and pause
  echo "-------------------------------------------"
  pause
done

# Fetch and display final game state and determine winner
FINAL_STATE=$(get_game_state "$GAME_ID")
echo "Final game state:"
echo "$FINAL_STATE" | jq .
# Determine winner by selecting the bot with HP > 0
WINNER=$(echo "$FINAL_STATE" | jq -r '.bots[] | select(.HP > 0) | .botIndex')
if [ -z "$WINNER" ]; then
  echo "No winner detected."
else
  echo "Game finished! Winning bot: $WINNER"
fi

echo "Simulation complete."
