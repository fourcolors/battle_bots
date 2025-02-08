// test/integration/setup.ts
import { ethers } from "hardhat";
import express from "express";
import router from "../../../server/src/routes"; // reference your backend routes
import { writeFileSync } from "fs";
import path from "path";

export let agentBattle: any;
export let usdc: any;
export let owner: any, player1: any, player2: any, treasury: any;
export let app: express.Express;

export async function setupIntegrationEnvironment() {
  // Get signers from Hardhat.
  [owner, player1, player2, treasury] = await ethers.getSigners();

  // Deploy USDC mock
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const initialSupply = ethers.parseUnits("1000000", 6); // USDC uses 6 decimals
  usdc = await ERC20Mock.deploy("Mock USDC", "USDC", owner.address, initialSupply);
  await usdc.waitForDeployment();

  // Deploy AgentBattle contract
  const AgentBattleFactory = await ethers.getContractFactory("AgentBattle");
  agentBattle = await AgentBattleFactory.deploy(usdc.target, treasury.address);
  await agentBattle.waitForDeployment();

  // Optionally, write the contract address to a local .env file for your backend
//   writeFileSync(
//     path.join(__dirname, ".env"),
//     `CONTRACT_ADDRESS=${agentBattle.target}\nRPC_URL=http://127.0.0.1:8545\nPRIVATE_KEY=${owner.privateKey}\n`
//   );

  console.log("Contracts deployed successfully " + agentBattle.target);

  // Create an Express app and attach your backend routes.
  app = express();
  app.use(express.json());
  app.use('/', router);

  // Also, if your ContractWrapper expects environment variables, ensure they’re loaded.
}

before(async () => {
  await setupIntegrationEnvironment();
});

after(async () => {
  // Hardhat automatically shuts down; you can perform any cleanup here if needed.
});
