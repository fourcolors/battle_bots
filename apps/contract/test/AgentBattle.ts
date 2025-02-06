import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Contract, ethers } from "ethers";

describe("AgentBattle Contract with USDC Betting", function () {
  async function deployAgentBattleFixture() {
    const [owner, player1, player2, treasury] = await hre.ethers.getSigners();

    // Deploy a mock USDC token
    const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
    const initialSupply = ethers.parseUnits("1000000", 6); // USDC has 6 decimals
    const usdc = await ERC20Mock.deploy("Mock USDC", "USDC", owner.address, initialSupply);
    await usdc.waitForDeployment();

    // Transfer USDC to players
    const playerAmount = ethers.parseUnits("1000", 6);
    await usdc.transfer(player1.address, playerAmount);
    await usdc.transfer(player2.address, playerAmount);

    // Deploy AgentBattle contract
    const AgentBattle = await hre.ethers.getContractFactory("AgentBattle");
    const agentBattle = await AgentBattle.deploy(usdc.target, treasury.address);
    await agentBattle.waitForDeployment();

    return { agentBattle, usdc, owner, player1, player2, treasury };
  }

  describe("Deployment", function () {
    it("Should initialize gameCounter to 0", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);
      expect(await agentBattle.gameCounter()).to.equal(0);
    });
  });

  describe("Game Creation", function () {
    it("Should create a new game with correct bet amount", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);
      const betAmount = ethers.parseUnits("50", 6);
      
      await agentBattle.createGame(betAmount);
      
      expect(await agentBattle.gameCounter()).to.equal(1);
      const gameInfo = await agentBattle.games(1);
      expect(gameInfo.active).to.equal(true);
      expect(gameInfo.betAmount).to.equal(betAmount);
      expect(gameInfo.prizePool).to.equal(0);
    });
  });

  describe("Register Bots", function () {
    async function createGameAndRegisterBotFixture() {
      const { agentBattle, usdc, player1 } = await loadFixture(deployAgentBattleFixture);
      const betAmount = ethers.parseUnits("50", 6);
      
      await agentBattle.createGame(betAmount);
      await usdc.connect(player1).approve(agentBattle.target, betAmount);

      await agentBattle.connect(player1).registerBot(
        1, 5, 5, 180, 10, 3, 2, 2, 10, 1
      );

      return { agentBattle, usdc, player1, gameId: 1, betAmount };
    }

    it("Should allow a player to register a bot and lock bet USDC", async function () {
      const { agentBattle, usdc, player1, gameId, betAmount } = await createGameAndRegisterBotFixture();

      const gameInfo = await agentBattle.games(gameId);
      expect(gameInfo.prizePool).to.equal(betAmount);

      const botStruct = await agentBattle.getBot(gameId, 0);
      expect(botStruct.owner).to.equal(player1.address);

      const playerBalance = await usdc.balanceOf(player1.address);
      expect(playerBalance).to.equal(ethers.parseUnits("1000", 6) - betAmount);
    });

    it("Should revert if the game does not exist", async function () {
      const { agentBattle, player1, usdc } = await loadFixture(deployAgentBattleFixture);
      const betAmount = ethers.parseUnits("50", 6);
      
      await usdc.connect(player1).approve(agentBattle.target, betAmount);
      
      await expect(
        agentBattle.connect(player1).registerBot(1, 5, 5, 180, 10, 3, 2, 2, 10, 1)
      ).to.be.revertedWith("Game not active or doesn't exist");
    });
  });

  describe("Finish Game and Prize Distribution", function () {
    async function createGameAndFinishFixture() {
      const { agentBattle, usdc, player1, player2, treasury } = await loadFixture(deployAgentBattleFixture);
      const betAmount = ethers.parseUnits("50", 6);

      await agentBattle.createGame(betAmount);
      
      await usdc.connect(player1).approve(agentBattle.target, betAmount);
      await agentBattle.connect(player1).registerBot(1, 0, 0, 0, 10, 3, 2, 2, 10, 0);

      await usdc.connect(player2).approve(agentBattle.target, betAmount);
      await agentBattle.connect(player2).registerBot(1, 10, 10, 180, 10, 2, 3, 2, 10, 1);

      return { agentBattle, usdc, player1, player2, treasury, gameId: 1, betAmount };
    }

    it("Should distribute the prize correctly when game ends", async function () {
      const { agentBattle, usdc, player1, player2, treasury, gameId, betAmount } = await createGameAndFinishFixture();

      const prizePool = betAmount * BigInt(2);
      const treasuryCut = (prizePool * BigInt(10)) / BigInt(100);
      const winnerAmount = prizePool - treasuryCut;

      await agentBattle.finishGame(gameId, 0);

      expect(await agentBattle.finished(gameId)).to.equal(true);
      expect(await agentBattle.winnerBotId(gameId)).to.equal(0);

      const player1Balance = await usdc.balanceOf(player1.address);
      const treasuryBalance = await usdc.balanceOf(treasury.address);

      expect(player1Balance).to.equal(ethers.parseUnits("1000", 6) - betAmount + winnerAmount);
      expect(treasuryBalance).to.equal(treasuryCut);
    });

    it("Should revert if trying to finish an already finished game", async function () {
      const { agentBattle, gameId } = await createGameAndFinishFixture();
      await agentBattle.finishGame(gameId, 0);
      await expect(agentBattle.finishGame(gameId, 0)).to.be.revertedWith("Already finished");
    });

    it("Should revert if game does not exist", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);
      await expect(agentBattle.finishGame(1, 0)).to.be.revertedWith("Game not active");
    });
  });
});
