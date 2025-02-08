// test/integration/integration.test.ts
import { expect } from "chai";
import request from "supertest";
import { agentBattle, usdc, owner, player1, player2, treasury, app } from "./setup";
import { ethers } from "hardhat";

describe("Full Integration: Contract + Backend", function () {
  let gameId: string;

  it("should create a game, register bots, process turns, and finish the game", async function () {
    const betAmount = 10; // USDC bet amount (simple number here)

    // Create game via backend API
    const createRes = await request(app)
      .post("/createGame")
      .send({ betAmount });
    expect(createRes.status).to.equal(200);
    gameId = createRes.body.gameId;
    expect(createRes.body.betAmount).to.equal(betAmount);

    // Approve USDC from player1 and player2 (simulate backend behavior)
    const playerAmount = ethers.parseUnits("1000", 6);
    await usdc.connect(player1).approve(agentBattle.target, betAmount);
    await usdc.connect(player2).approve(agentBattle.target, betAmount);

    // Register two bots via backend API
    const bot0Res = await request(app)
      .post("/registerBot")
      .send({
        gameId,
        bot: { x: 1, y: 1, orientation: 0, HP: 10, Attack: 3, Defense: 1, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot0", owner: player1.address }
      });
    expect(bot0Res.status).to.equal(200);
    const bot0 = bot0Res.body;
    
    const bot1Res = await request(app)
      .post("/registerBot")
      .send({
        gameId,
        bot: { x: 2, y: 1, orientation: 180, HP: 3, Attack: 2, Defense: 2, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot1 (fragile)", owner: player2.address }
      });
    expect(bot1Res.status).to.equal(200);
    const bot1 = bot1Res.body;

    // Process a turn: Bot0 attacks Bot1 (and should kill Bot1)
    const turnRes = await request(app)
      .post("/turn")
      .send({ gameId, botIndex: bot0.botIndex, actions: [
        { type: "attack", targetIndex: bot1.botIndex },
        { type: "attack", targetIndex: bot1.botIndex }
      ]});
    expect(turnRes.status).to.equal(200);

    // Check game state: Bot1 should have HP = 0 and be skipped in turn order.
    const gameStateRes = await request(app).get(`/getGameState/${gameId}`);
    expect(gameStateRes.status).to.equal(200);
    const bot1State = gameStateRes.body.bots.find((b: any) => b.botIndex === bot1.botIndex);
    expect(bot1State.HP).to.equal(0);

    // Now, if Bot1 tries to take a turn, the backend should auto-skip and return an error.
    const turnSkipRes = await request(app)
      .post("/turn")
      .send({ gameId, botIndex: bot1.botIndex, actions: [
        { type: "attack", targetIndex: bot0.botIndex },
        { type: "rotate", newOrientation: 45 }
      ]});
    // In this flow, since bot1 is dead, the request should be rejected (or return a skip message).
    expect(turnSkipRes.status).to.equal(400);
    //expect(turnSkipRes.body.successLog).to.contain("Bot is dead. Skipping turn.");

    // Finally, finish the game using the finishGame endpoint.
    const finishRes = await request(app)
      .post("/finishGame")
      .send({ gameId });
    expect(finishRes.status).to.equal(200);
    expect(finishRes.body.winningBotIndex).to.be.a("number");
  });
});
