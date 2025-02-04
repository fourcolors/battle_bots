import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BattleBots", (m) => {
  // 1) Define the contract deployment (no constructor args)
  const agentBattle = m.contract("AgentBattle", []);

  // 2) Optionally, call a function post-deployment
  //    For example, let's create an initial game
  m.call(agentBattle, "createGame", []);

  // 3) Return any contracts we want to export
  return { agentBattle };
});
