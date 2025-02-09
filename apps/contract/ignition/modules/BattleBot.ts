import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * BattleBot Ignition Module
 * Handles deployment and initialization of the BattleBot NFT contract
 */
const BattleBotModule = buildModule("BattleBot", (m) => {
  // Deploy the BattleBot contract
  const battleBot = m.contract("BattleBot");

  return {
    battleBot,
  };
});

export default BattleBotModule; 