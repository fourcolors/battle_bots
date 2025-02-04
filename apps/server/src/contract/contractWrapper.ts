// server/src/contractWrapper.ts
import { ethers } from "ethers";
// Path depends on where your compiled artifacts are located
// If using default Hardhat structure, they'll be in ../artifacts/contracts/...
import AgentBattleArtifact from "../../../contract/artifacts/contracts/AgentBattle.sol/AgentBattle.json";

import dotenv from "dotenv";
import { IContractWrapper } from "./IContractWrapper";
dotenv.config();

export class ContractWrapper implements IContractWrapper {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const privateKey = process.env.PRIVATE_KEY || "";
    const contractAddress = process.env.CONTRACT_ADDRESS || "";
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Use the ABI from your contract artifact
    this.contract = new ethers.Contract(contractAddress, AgentBattleArtifact.abi, this.wallet);
  }

  async createGame(): Promise<string> {
    const tx = await this.contract.createGame();
    await tx.wait();
    const gameCounter = await this.contract.gameCounter();
    return gameCounter.toString();
  }

  async registerBot(
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
  ): Promise<void> {
    const tx = await this.contract.registerBot(
      gameId,
      x,
      y,
      orientation,
      hp,
      attack,
      defense,
      speed,
      fuel,
      weaponChoice
    );
    await tx.wait();
  }

  async updateBotState(
    gameId: number,
    botId: number,
    x: number,
    y: number,
    orientation: number,
    hp: number,
    fuel: number,
    damageDealt: number
  ): Promise<void> {
    const tx = await this.contract.updateBotState(
      gameId,
      botId,
      x,
      y,
      orientation,
      hp,
      fuel,
      damageDealt
    );
    await tx.wait();
  }

  async finishGame(gameId: number, winningBotId: number): Promise<void> {
    const tx = await this.contract.finishGame(gameId, winningBotId);
    await tx.wait();
  }
}
