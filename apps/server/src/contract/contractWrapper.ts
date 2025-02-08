import { ethers } from "ethers";
// Adjust the path to your compiled artifact as needed.
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

    // Instantiate the contract using its ABI and address.
    this.contract = new ethers.Contract(contractAddress, AgentBattleArtifact.abi, this.wallet);
  }

  async createGame(betAmount: number): Promise<string> {
    // 1️⃣ Send transaction to create a game
    const tx = await this.contract.createGame(betAmount);
    const receipt = await tx.wait();
    // Fetch the new gameCounter (gameId).
    const gameCounter = await this.contract.gameCounter();
    return gameCounter.toString();
  }

  // console.log("receipt" + JSON.stringify(receipt))
    // const eventLogs = receipt.logs.map((log:any) => this.contract.interface.parseLog(log));
    // console.log("eventLogs")
    // console.log(eventLogs)
    // const gameCreatedLog = eventLogs.find((log:any) => log?.name === "GameCreated");

    // if (!gameCreatedLog) throw new Error("GameCreated event not found");

    // return gameCreatedLog.args[0].toString(); // Extracted gameId

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
