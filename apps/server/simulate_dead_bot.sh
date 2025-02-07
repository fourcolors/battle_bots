#!/bin/bash
# simulate_dead_bot.sh
# This script simulates a game where one bot dies and its turn is skipped.
# Assumes the server is running at http://localhost:3000

BASE_URL="http://localhost:3000"

echo "Creating game with bet amount 10 USDC..."
create_game_output=$(curl -s -X POST "$BASE_URL/createGame" \
  -H "Content-Type: application/json" \
  -d '{"betAmount": 10}')
echo "Game creation output: $create_game_output"
gameId=$(echo $create_game_output | jq -r '.gameId')
echo "Game ID: $gameId"

echo "Registering Bot0 (healthy)..."
bot0=$(curl -s -X POST "$BASE_URL/registerBot" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$gameId\", \"bot\": {\"x\": 1, \"y\": 1, \"orientation\": 0, \"HP\": 10, \"Attack\": 3, \"Defense\": 1, \"Speed\": 2, \"Fuel\": 10, \"weaponChoice\": 1, \"prompt\": \"Bot0: Ready to rumble!\"}}")
echo "Bot0 registration: $bot0"
bot0_index=$(echo $bot0 | jq -r '.botIndex')
echo "Bot0 index: $bot0_index"

echo "Registering Bot1 (healthy)..."
bot1=$(curl -s -X POST "$BASE_URL/registerBot" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$gameId\", \"bot\": {\"x\": 2, \"y\": 1, \"orientation\": 180, \"HP\": 10, \"Attack\": 2, \"Defense\": 2, \"Speed\": 2, \"Fuel\": 10, \"weaponChoice\": 1, \"prompt\": \"Bot1: On guard!\"}}")
echo "Bot1 registration: $bot1"
bot1_index=$(echo $bot1 | jq -r '.botIndex')
echo "Bot1 index: $bot1_index"

echo "Registering Bot2 (fragile; low HP so it dies quickly)..."
bot2=$(curl -s -X POST "$BASE_URL/registerBot" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$gameId\", \"bot\": {\"x\": 3, \"y\": 1, \"orientation\": 0, \"HP\": 3, \"Attack\": 2, \"Defense\": 1, \"Speed\": 2, \"Fuel\": 10, \"weaponChoice\": 1, \"prompt\": \"Bot2: I might not last!\"}}")
echo "Bot2 registration: $bot2"
bot2_index=$(echo $bot2 | jq -r '.botIndex')
echo "Bot2 index: $bot2_index"

# --- Now simulate a sequence of turns.
echo "Starting turn simulation..."

# For clarity we assume the following round-robin:
# Turn order: Bot0, Bot1, Bot2. We will have Bot0 attack Bot2 so Bot2 dies.
# Then when Bot2’s turn comes, the API should immediately skip it.
# (We assume the API’s auto-skip logic works as implemented.)

# Turn 1: Bot0 acts
echo "Turn 1: Bot0 (index $bot0_index) attacks Bot2 (index $bot2_index)..."
turn1=$(curl -s -X POST "$BASE_URL/turn" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$gameId\", \"botIndex\": $bot0_index, \"actions\": [{\"type\": \"attack\", \"targetIndex\": $bot2_index}]}") 
echo "Turn 1 output: $turn1"

# Turn 2: Bot1 acts
echo "Turn 2: Bot1 (index $bot1_index) attacks Bot2 (index $bot2_index)..."
turn2=$(curl -s -X POST "$BASE_URL/turn" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$gameId\", \"botIndex\": $bot1_index, \"actions\": [{\"type\": \"attack\", \"targetIndex\": $bot2_index}]}") 
echo "Turn 2 output: $turn2"

# By now Bot2 should have its HP reduced (possibly to 0). Now, if it is Bot2’s turn, the API should skip its turn.
echo "Turn 3: Attempt Bot2's turn (should be auto-skipped if dead)..."
turn3=$(curl -s -X POST "$BASE_URL/turn" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\": \"$gameId\", \"botIndex\": $bot2_index, \"actions\": [{\"type\": \"attack\", \"targetIndex\": $bot0_index}]}") 
echo "Turn 3 output: $turn3"

# Finally, fetch the final game state.
echo "Fetching final game state..."
final_state=$(curl -s "$BASE_URL/getGameState/$gameId")
echo "Final game state: $final_state"

echo "Simulation complete."
