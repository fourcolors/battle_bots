# Agent BattleBots - Server README

Welcome to the **Agent BattleBots** server! This service handles:
- **Game logic** (turns, movement, attacks)
- **Smart contract** interactions (for storing results on-chain)
- An optional **debug/mock mode** (for quick local testing)

## Table of Contents

- [Agent BattleBots - Server README](#agent-battlebots---server-readme)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Dependencies](#dependencies)
  - [Configuration](#configuration)
  - [Installation \& Setup](#installation--setup)
  - [Running the Server](#running-the-server)
    - [Debug Mode (No Blockchain)](#debug-mode-no-blockchain)
    - [Real Blockchain Mode](#real-blockchain-mode)
  - [API Endpoints](#api-endpoints)
  - [Notes for Frontend \& Agents](#notes-for-frontend--agents)

---

## Features

- **Express**-based API for managing games:
  - Create a new game
  - Register bots
  - Perform turns (move, rotate, attack)
  - Sync ephemeral state on-chain
  - Finish game and declare a winner
- **Two implementations** for contract interactions:
  1. **Mock** (`DEBUG_MODE=true`): No real blockchain calls, game data is stored in memory.
  2. **Real** (`DEBUG_MODE=false`): Interacts with the actual smart contract on a local or remote Ethereum node.

---

## Dependencies

- **Node.js** (LTS or latest recommended)
- **npm** or **yarn**
- **TypeScript** (built in devDependencies)
- **Express**
- **ethers** (for blockchain integration)
- A local or remote **Ethereum** node (if running in real mode)

---

## Configuration

Create a `.env` file in your server’s root (or wherever your code expects environment variables). The main variables are:

```
# Required if running in REAL mode (DEBUG_MODE=false)
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xyourpkeyhere
CONTRACT_ADDRESS=0xDeployedAgentBattleAddress

# Toggles real vs. mock
DEBUG_MODE=true  # or false
```

**Explanation**:

- **`RPC_URL`**: The URL of your Ethereum node (e.g., local Ganache/Hardhat or an online provider).  
- **`PRIVATE_KEY`**: The private key for the account you want to use when sending transactions.  
- **`CONTRACT_ADDRESS`**: The deployed address of your **AgentBattle** contract.  
- **`DEBUG_MODE`**: If `true`, the server **does not** interact with the blockchain and uses **mock storage**.  
  - If `false`, the server uses **real** calls to the contract.

---

## Installation & Setup

1. **Clone** the monorepo.
2. **Navigate** to the server directory:
   ```bash
   cd hackathon-monorepo/server
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a `.env`** (or copy `.env.example`) and set variables (see [Configuration](#configuration)).

---

## Running the Server

### Debug Mode (No Blockchain)

For quick local testing without dealing with contracts:

1. **Set** `DEBUG_MODE=true` in `.env`.
2. **Start** the server:
   ```bash
   npm run dev
   ```
3. The server logs something like:
   ```
   [MockContractWrapper] Running in DEBUG mode (mock contract)
   ...
   Agent Battle server listening on port 3000
   ```
4. **Use the API** at [http://localhost:3000](http://localhost:3000).  
   - All games and bots will be stored **in memory** (resets if you restart the server).

### Real Blockchain Mode

To connect to your actual contract:

1. **Deploy** the `AgentBattle.sol` contract if you haven’t already (via Hardhat, Remix, etc.).
2. **Set** in `.env`:
   ```
   DEBUG_MODE=false
   RPC_URL=http://127.0.0.1:8545
   PRIVATE_KEY=0xyourprivatekey
   CONTRACT_ADDRESS=0xYourDeployedContract
   ```
3. **Start** the server:
   ```bash
   npm run dev
   ```
4. The server logs:
   ```
   [ContractWrapper] Using REAL smart contract
   ...
   Agent Battle server listening on port 3000
   ```
5. All requests that involve creating games, registering bots, or finishing the game will **hit the actual contract**.

---

## API Endpoints

The main endpoints (assuming `localhost:3000`) are:

1. **`POST /createGame`**  
   - **Body**: `{}`  
   - **Returns**: `{"ok": true, "gameId": <string>}`

2. **`POST /registerBots`**  
   - **Body**:  
     ```json
     {
       "gameId": 1,
       "bots": [
         {
           "x": 1,
           "y": 1,
           "orientation": 0,
           "HP": 10,
           "Attack": 2,
           "Defense": 3,
           "Speed": 2,
           "Fuel": 10,
           "damageDealt": 0,
           "weaponChoice": 1
         },
         ...
       ]
     }
     ```

3. **`POST /turn`**  
   - **Body**:
     ```json
     {
       "gameId": 1,
       "botIndex": 0,
       "actions": [
         {"type": "move", "x": 3, "y": 1},
         {"type": "rotate", "newOrientation": 45},
         {"type": "attack", "targetIndex": 1}
       ]
     }
     ```
   - **Returns**: `{"successLog": [...], "botState": {...}}`

4. **`POST /syncOnChain`**  
   - **(Optional)** Sync ephemeral state (in memory) onto the actual contract if you want partial updates stored on-chain.

5. **`POST /finishGame`**  
   - **Body**: `{"gameId":1}`  
   - Ends the game, calculates a winner, and calls the contract’s `finishGame` method (in real mode).  
   - **Returns**: `{"ok": true, "winnerBotIndex": 1}`

---

## Notes for Frontend & Agents

- **Frontend** devs can **call these endpoints** to:
  - Create or join a game
  - Register their bot’s stats
  - Submit turn actions
  - Poll game state if needed (or implement push updates).
- **Agents** (AI scripts) can do the same. 
  - In **Debug Mode**, you can test AI logic with immediate responses.  
  - In **Real Mode**, you can measure actual transaction times and fees (if relevant).

**Pro tip**: For advanced use, you might **sync** partial states only at the end of each round, or after every turn, or just once at the game’s end. This helps save gas.