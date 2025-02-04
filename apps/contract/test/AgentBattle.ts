import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("AgentBattle Contract", function () {
  // -------------------------------------
  // FIXTURE: Deploy contract
  // -------------------------------------
  async function deployAgentBattleFixture() {
    const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    const AgentBattle = await hre.ethers.getContractFactory("AgentBattle");
    const agentBattle = await AgentBattle.deploy();

    return { agentBattle, owner, otherAccount, thirdAccount };
  }

  // -------------------------------------
  // DEPLOYMENT
  // -------------------------------------
  describe("Deployment", function () {
    it("Should set the initial gameCounter to 0", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);
      const counter = await agentBattle.gameCounter();
      expect(counter).to.equal(0);
    });
  });

  // -------------------------------------
  // CREATE GAME
  // -------------------------------------
  describe("Game Creation", function () {
    it("Should create a new game and increment the gameCounter", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);

      // gameCounter should start at 0
      expect(await agentBattle.gameCounter()).to.equal(0);

      // create a new game
      const tx = await agentBattle.createGame();
      await tx.wait();

      // now gameCounter should be 1
      expect(await agentBattle.gameCounter()).to.equal(1);

      // check game state
      const gameInfo = await agentBattle.games(1);
      expect(gameInfo.active).to.equal(true);
      // the owner of this game is the caller (test signer)
    });
  });

  // -------------------------------------
  // REGISTER BOTS
  // -------------------------------------
  describe("Register Bots", function () {
    async function createGameAndRegisterBotFixture() {
      const fixture = await loadFixture(deployAgentBattleFixture);
      const { agentBattle, owner } = fixture;

      // Create a game
      await agentBattle.createGame();
      // gameId will be 1 (since it starts at 0 and increments)

      // Register one bot
      const botTx = await agentBattle.registerBot(
        1, // gameId
        5, // x
        5, // y
        180, // orientation
        10, // HP
        3,  // Attack
        2,  // Defense
        2,  // Speed
        10, // Fuel
        1   // weaponChoice (basic gun)
      );
      await botTx.wait();

      return { ...fixture, gameId: 1 };
    }

    it("Should allow registering a bot for an active game", async function () {
      const { agentBattle, gameId } = await loadFixture(createGameAndRegisterBotFixture);

      // check botCount
      const botCount = await agentBattle.getBotCount(gameId);
      expect(botCount).to.equal(1);

      // check stored Bot data
      const botStruct = await agentBattle.getBot(gameId, 0);
      expect(botStruct.x).to.equal(5);
      expect(botStruct.y).to.equal(5);
      expect(botStruct.orientation).to.equal(180);
      expect(botStruct.HP).to.equal(10);
      expect(botStruct.Attack).to.equal(3);
      expect(botStruct.Defense).to.equal(2);
      expect(botStruct.Speed).to.equal(2);
      expect(botStruct.Fuel).to.equal(10);
      expect(botStruct.weaponChoice).to.equal(1);
    });

    it("Should revert if gameId does not exist (game not active)", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);

      // No game created => gameId=1 doesn't exist
      await expect(
        agentBattle.registerBot(
          1, // gameId that doesn't exist
          5, 5, 0, 10, 3, 3, 2, 10, 0
        )
      ).to.be.revertedWith("Game not active or doesn't exist");
    });
  });

  // -------------------------------------
  // UPDATE BOT STATE
  // -------------------------------------
  describe("Update Bot State", function () {
    async function createGameWithBotFixture() {
      const fixture = await loadFixture(deployAgentBattleFixture);
      const { agentBattle, owner } = fixture;

      // Create game #1
      await agentBattle.createGame();

      // Register bot #0
      await agentBattle.registerBot(
        1, // gameId
        1, 1, 0, 10, 2, 2, 2, 10, 0
      );

      return { ...fixture, gameId: 1 };
    }

    it("Should update a bot's position, orientation, HP, Fuel, and damageDealt", async function () {
      const { agentBattle, gameId } = await loadFixture(createGameWithBotFixture);

      // initial data
      let botStruct = await agentBattle.getBot(gameId, 0);
      expect(botStruct.x).to.equal(1);
      expect(botStruct.y).to.equal(1);
      expect(botStruct.orientation).to.equal(0);
      expect(botStruct.HP).to.equal(10);
      expect(botStruct.Fuel).to.equal(10);
      expect(botStruct.damageDealt).to.equal(0);

      // update the bot state
      await agentBattle.updateBotState(
        gameId,
        0,
        3, // new x
        4, // new y
        90, // new orientation
        7,  // new HP
        5,  // new Fuel
        2   // new damageDealt
      );

      // recheck
      botStruct = await agentBattle.getBot(gameId, 0);
      expect(botStruct.x).to.equal(3);
      expect(botStruct.y).to.equal(4);
      expect(botStruct.orientation).to.equal(90);
      expect(botStruct.HP).to.equal(7);
      expect(botStruct.Fuel).to.equal(5);
      expect(botStruct.damageDealt).to.equal(2);
    });

    it("Should revert if game is not active", async function () {
      const { agentBattle, gameId } = await loadFixture(createGameWithBotFixture);
      // finish the game => not active
      await agentBattle.finishGame(gameId, 0);

      await expect(
        agentBattle.updateBotState(
          gameId,
          0,
          10, 10, 0, 5, 5, 5
        )
      ).to.be.revertedWith("Game not active");
    });
  });

  // -------------------------------------
  // FINISH GAME
  // -------------------------------------
  describe("Finish Game", function () {
    async function createGameAndFinishFixture() {
      const fixture = await loadFixture(deployAgentBattleFixture);
      const { agentBattle, owner } = fixture;

      // Create game #1
      await agentBattle.createGame();

      // Register 2 bots
      await agentBattle.registerBot(
        1, // gameId
        0, 0, 0, 10, 3, 2, 2, 10, 0
      );
      await agentBattle.registerBot(
        1, // gameId
        10, 10, 180, 10, 2, 3, 2, 10, 1
      );

      // finish the game with bot #0 as winner
      const finishTx = await agentBattle.finishGame(1, 0);
      await finishTx.wait();

      return { ...fixture, gameId: 1 };
    }

    it("Should mark the game as finished and store the winner", async function () {
      const { agentBattle } = await loadFixture(createGameAndFinishFixture);

      // check that finished[1] == true
      expect(await agentBattle.finished(1)).to.equal(true);
      // check the winnerBotId
      expect(await agentBattle.winnerBotId(1)).to.equal(0);

      // The game struct’s 'active' field should be false
      const gameInfo = await agentBattle.games(1);
      expect(gameInfo.active).to.equal(false);
    });

    it("Should revert if the game was already finished once", async function () {
      const { agentBattle, gameId } = await loadFixture(createGameAndFinishFixture);

      // Attempt finishing again
      await expect(
        agentBattle.finishGame(gameId, 1)
      ).to.be.revertedWith("Already finished");
    });

    it("Should revert if the game does not exist or not active", async function () {
      const { agentBattle } = await loadFixture(deployAgentBattleFixture);

      // no game => gameId=1 doesn't exist
      await expect(agentBattle.finishGame(1, 0)).to.be.revertedWith("Game not active");
    });
  });
});
