// game.test.ts
import request from 'supertest';
import express from 'express';
import { games } from '../memoryState';
import router from '../routes';

const app = express();
app.use(express.json());
app.use('/', router);

describe('Agent Battle Game API', () => {
  let gameId: string;

  beforeEach(() => {
    // Reset in-memory state before each test.
    for (const key in games) {
      delete games[key];
    }
  });

  test('should create a game with a valid betAmount', async () => {
    const response = await request(app)
      .post('/createGame')
      .send({ betAmount: 10 });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.betAmount).toBe(10);
    gameId = response.body.gameId;
  });

  test('should register bots and assign correct botIndex', async () => {
    const createRes = await request(app)
      .post('/createGame')
      .send({ betAmount: 10 });
    gameId = createRes.body.gameId;

    const botData = [
      { x: 1, y: 1, orientation: 0, HP: 10, Attack: 3, Defense: 1, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot0" },
      { x: 2, y: 1, orientation: 180, HP: 10, Attack: 2, Defense: 2, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot1" },
      { x: 3, y: 1, orientation: 0, HP: 3, Attack: 2, Defense: 1, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot2 (fragile)" }
    ];

    for (let i = 0; i < botData.length; i++) {
      const res = await request(app)
        .post('/registerBot')
        .send({ gameId, bot: botData[i] });
      expect(res.status).toBe(200);
      expect(res.body.botIndex).toBe(i);
    }
  });

  test('should process a complete turn and auto-skip a dead bot', async () => {
    // Create game and register three bots (Bot2 fragile)
    const createRes = await request(app)
      .post('/createGame')
      .send({ betAmount: 10 });
    gameId = createRes.body.gameId;

    const bot0 = (await request(app).post('/registerBot').send({
      gameId,
      bot: { x: 1, y: 1, orientation: 0, HP: 10, Attack: 3, Defense: 1, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot0" }
    })).body;
    const bot1 = (await request(app).post('/registerBot').send({
      gameId,
      bot: { x: 2, y: 1, orientation: 180, HP: 10, Attack: 2, Defense: 2, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot1" }
    })).body;
    const bot2 = (await request(app).post('/registerBot').send({
      gameId,
      bot: { x: 3, y: 1, orientation: 0, HP: 3, Attack: 2, Defense: 1, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot2 (fragile)" }
    })).body;

    // Turn 1: Bot0 uses two actions to attack Bot2, which should kill Bot2.
    const turn1 = await request(app)
      .post('/turn')
      .send({ gameId, botIndex: bot0.botIndex, actions: [
        { type: "attack", targetIndex: bot2.botIndex },
        { type: "attack", targetIndex: bot2.botIndex }
      ]});
    expect(turn1.status).toBe(200);
    const stateAfterTurn1 = await request(app).get(`/getGameState/${gameId}`);
    const bot2State = stateAfterTurn1.body.bots.find((b: any) => b.botIndex === bot2.botIndex);
    expect(bot2State.HP).toBe(0);

    // Turn 2: Now Bot1 should act normally.
    const turn2 = await request(app)
      .post('/turn')
      .send({ gameId, botIndex: bot1.botIndex, actions: [
        { type: "move", x: 3, y: 1 }, // Ensure 2 AP are consumed
        { type: "move", x: 4, y: 1 } // Ensure 2 AP are consumed
      ]});
    expect(turn2.status).toBe(200);

    // Turn 3: If Bot2 (dead) tries to act, it should be auto-skipped.
    const turn3 = await request(app)
      .post('/turn')
      .send({ gameId, botIndex: bot2.botIndex, actions: [
        { type: "attack", targetIndex: bot0.botIndex },
        { type: "rotate", newOrientation: 130 }
      ]});
    //console.log(turn3)
    expect(turn3.status).toBe(400);
    expect(turn3.body.error).toBe("It is not bot 2's turn. It is bot 0's turn.");
  });

  test('should finish the game when only one bot remains alive', async () => {
    // Create game and register two bots.
    const createRes = await request(app)
      .post('/createGame')
      .send({ betAmount: 10 });
    gameId = createRes.body.gameId;
    const bot0 = (await request(app).post('/registerBot').send({
      gameId,
      bot: { x: 1, y: 1, orientation: 0, HP: 10, Attack: 3, Defense: 1, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot0" }
    })).body;
    const bot1 = (await request(app).post('/registerBot').send({
      gameId,
      bot: { x: 2, y: 1, orientation: 180, HP: 3, Attack: 2, Defense: 2, Speed: 2, Fuel: 10, weaponChoice: 1, prompt: "Bot1 (fragile)" }
    })).body;

    // Bot0 attacks Bot1 to kill it (using two actions)
    const turn = await request(app)
      .post('/turn')
      .send({ gameId, botIndex: bot0.botIndex, actions: [
        { type: "attack", targetIndex: bot1.botIndex },
        { type: "attack", targetIndex: bot1.botIndex }
      ]});
    expect(turn.status).toBe(200);

    const finalStateRes = await request(app).get(`/getGameState/${gameId}`);
    expect(finalStateRes.body.isActive).toBe(false);
  });
});
