// test/integration/integration.test.ts
import { expect } from "chai";
import request from "supertest";
import { agentBattle, usdc, player1, player2, treasury, app } from "./setup";
import { ethers } from "hardhat";

describe("Full Integration: Contract + Backend", function () {
  let gameId: string;

  it("should create a game, register bots, process turns, finish the game, and settle USDC correctly", async function () {
    const betAmount = 10; // simple number for USDC bet (we assume USDC has 6 decimals)

    // Create game via backend API
    const createRes = await request(app)
      .post("/createGame")
      .send({ betAmount });
    expect(createRes.status).to.equal(200);
    gameId = createRes.body.gameId;
    expect(createRes.body.betAmount).to.equal(betAmount);
    console.log(`Game ${gameId} created with betAmount ${betAmount}`);

    // Approve USDC from player1 and player2 for registration
    // (simulate backend behavior by calling approve on the USDC token)
    await usdc.connect(player1).approve(agentBattle.target, betAmount);
    await usdc.connect(player2).approve(agentBattle.target, betAmount);

    // Register two bots via backend API.
    // Bot0 belongs to player1 (the eventual winner), Bot1 to player2 (fragile).
    const bot0Res = await request(app)
      .post("/registerBot")
      .send({
        gameId,
        bot: {
          x: 1, y: 1, orientation: 0, HP: 10, Attack: 3, Defense: 1, Speed: 2, Fuel: 10,
          weaponChoice: 1, prompt: "Bot0", owner: player1.address
        }
      });
    expect(bot0Res.status).to.equal(200);
    const bot0 = bot0Res.body;
    console.log(`Bot0 registered with index ${bot0.botIndex}`);

    const bot1Res = await request(app)
      .post("/registerBot")
      .send({
        gameId,
        bot: {
          x: 2, y: 1, orientation: 180, HP: 3, Attack: 2, Defense: 2, Speed: 2, Fuel: 10,
          weaponChoice: 1, prompt: "Bot1 (fragile)", owner: player2.address
        }
      });
    expect(bot1Res.status).to.equal(200);
    const bot1 = bot1Res.body;
    console.log(`Bot1 registered with index ${bot1.botIndex}`);

    // Process a turn: Bot0 uses two attacks to kill Bot1.
    // (Assume that each attack from Bot0 deals enough damage so that after two attacks Bot1's HP becomes 0.)
    const turnRes = await request(app)
      .post("/turn")
      .send({
        gameId,
        botIndex: bot0.botIndex,
        actions: [
          { type: "attack", targetIndex: bot1.botIndex },
          { type: "attack", targetIndex: bot1.botIndex }
        ]
      });
    expect(turnRes.status).to.equal(200);
    console.log("Turn processed by Bot0");

    // Query game state to verify that Bot1 is dead.
    const gameStateRes = await request(app).get(`/getGameState/${gameId}`);
    expect(gameStateRes.status).to.equal(200);
    const bot1State = gameStateRes.body.bots.find((b: any) => b.botIndex === bot1.botIndex);
    expect(bot1State.HP).to.equal(0);
    console.log("Verified that Bot1's HP is 0 (dead)");

    // Finish the game using the finishGame endpoint.
    const finishRes = await request(app)
      .post("/finishGame")
      .send({ gameId });
    expect(finishRes.status).to.equal(200);
    expect(finishRes.body.winningBotIndex).to.be.a("number");
    console.log(`Game finished. Winning bot index: ${finishRes.body.winningBotIndex}`);

    // --- On-Chain Settlement Checks ---
    // The prize pool is 10 USDC * 2 = 20 USDC.
    // Treasury fee is 10% of 20 = 2 USDC; winner should receive 18 USDC.
    //
    // Player1 (owner of Bot0) initially had 1000 USDC.
    // After registration, player1 spent 10 USDC, so his balance became 990 USDC.
    // After finishing the game, he should receive 18 USDC, so final balance should be 1008 USDC.
    //
    // Similarly, treasury should receive 2 USDC.
    const winnerBalance = await usdc.balanceOf(player1.address);
    const treasuryBalance = await usdc.balanceOf(treasury.address);

    console.log("Winner (player1) balance:", ethers.formatUnits(winnerBalance, 6));
    console.log("Treasury balance:", ethers.formatUnits(treasuryBalance, 6));

    expect(ethers.formatUnits(winnerBalance, 6)).to.equal("1008.0");
    expect(ethers.formatUnits(treasuryBalance, 6)).to.equal("2.0");
  });
});
