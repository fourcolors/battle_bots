// ignition/modules/BattleBots.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BattleBots", (m) => {
  // Get the deployer account (index 0 from Hardhat's accounts)
  const deployer = m.getAccount(0);
  
  // Deploy parameters with defaults
  const initialUsdcSupply = m.getParameter(
    "initialUsdcSupply", 
    BigInt(1000000 * 10 ** 18) // 1M tokens with 18 decimals
  );

  // 1. Deploy ERC20Mock first (USDC)
  const usdc = m.contract("ERC20Mock", [
    "Mock USDC",          // name
    "mUSDC",              // symbol
    deployer,             // initialAccount
    initialUsdcSupply     // initialBalance
  ]);

  // 2. Deploy AgentBattle with dependencies
  const agentBattle = m.contract("AgentBattle", [
    usdc,       // _usdc address
    deployer    // _treasury address
  ], {
    // Optional: Add dependencies to ensure deployment order
    after: [usdc]
  });

  // 3. Optional: Initialize with test data
  // m.call(agentBattle, "createGame", [ethers.parseUnits("100", 18)], {
  //   id: "createInitialGame",
  //   after: [agentBattle]
  // });

  return { 
    agentBattle,
    usdc 
  };
});