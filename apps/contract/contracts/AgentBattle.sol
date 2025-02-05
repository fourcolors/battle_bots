// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title AgentBattle
 * @notice Minimal contract for storing on-chain info about an Agentic BattleBots match.
 *         Actual logic (movement, damage, orientation checks) is mostly off-chain in a TS server.
 *
 * IMPORTANT:
 *  - For an MVP, we do not fully track each turn on-chain. 
 *  - We store each Bot's final or partial state, plus a flag if the game is finished.
 *  - The server is "trusted" in this approach (or possibly only to the extent that
 *    players sign off on moves).
 *  - For a more trustless approach, you'd store each turn or use commit-reveal, but that is
 *    more complex and expensive in gas. 
 */
contract AgentBattle {
    // ----------------------------------
    // STRUCTURES
    // ----------------------------------

    /// @dev Info about a single Bot
    struct Bot {
        // Continuous position (for MVP, store as integers; e.g. x=5 => 5m from left)
        uint256 x; 
        uint256 y; 
        // Orientation in degrees [0..359]
        uint256 orientation;
        // Stats
        uint256 HP;
        uint256 Attack;
        uint256 Defense;
        uint256 Speed;
        uint256 Fuel;
        // For tie-break or logs
        uint256 damageDealt;
        // e.g. 0 = Net Launcher, 1 = Basic Gun, 2 = Grenade, 3 = Saw Blade, 4 = Flamethrower
        uint256 weaponChoice;
    }

    /// @dev Store global data about a game
    struct Game {
        // game is 'active' means not ended
        bool active;
        address owner; // the address who created the game (could be the server or a DAO)
        uint256 turnCount; 
    }

    // ----------------------------------
    // STATE
    // ----------------------------------

    // We'll store each game in a mapping (gameId => Game)
    mapping(uint256 => Game) public games;

    // For each game, we store a mapping of (botId => Bot)
    //   e.g., if you have 4 bots in game #1, they might be IDs 0..3
    mapping(uint256 => mapping(uint256 => Bot)) public gameBots;

    // track how many bots in each game
    mapping(uint256 => uint256) public botCountOfGame;

    // track if a game is finished & who won
    mapping(uint256 => bool) public finished;
    mapping(uint256 => uint256) public winnerBotId;

    // increment to create unique game ids
    uint256 public gameCounter;

    // ----------------------------------
    // EVENTS
    // ----------------------------------

    event GameCreated(uint256 indexed gameId, address indexed creator);
    event BotRegistered(uint256 indexed gameId, uint256 indexed botId);
    event GameEnded(uint256 indexed gameId, uint256 indexed winningBot);

    // ----------------------------------
    // EXTERNAL FUNCTIONS
    // ----------------------------------

    /**
     * @notice Creates a new game. Usually your server calls this once per match.
     */
    function createGame() external returns (uint256) {
        gameCounter += 1;
        uint256 newId = gameCounter;
        games[newId] = Game({
            active: true,
            owner: msg.sender,
            turnCount: 0
        });
        emit GameCreated(newId, msg.sender);
        return newId;
    }

    /**
     * @notice Server or trusted entity adds new bots. 
     *         (Alternatively, you could let each user call registerBot themselves).
     * @dev Must only be called while the game is active.
     */
    function registerBot(
        uint256 _gameId,
        uint256 _x,
        uint256 _y,
        uint256 _orientation,
        uint256 _hp,
        uint256 _attack,
        uint256 _defense,
        uint256 _speed,
        uint256 _fuel,
        uint256 _weaponChoice
    ) external {
        require(games[_gameId].active, "Game not active or doesn't exist");

        uint256 botId = botCountOfGame[_gameId];
        botCountOfGame[_gameId] = botId + 1;

        // Store the Bot
        gameBots[_gameId][botId] = Bot({
            x: _x,
            y: _y,
            orientation: _orientation,
            HP: _hp,
            Attack: _attack,
            Defense: _defense,
            Speed: _speed,
            Fuel: _fuel,
            damageDealt: 0,
            weaponChoice: _weaponChoice
        });

        emit BotRegistered(_gameId, botId);
    }

    /**
     * @notice Update partial or final states of a bot.
     * @dev Called by the server after each turn or at intervals. 
     *      In a more trust-minimized scenario, you'd require signatures from players or do complex logic.
     */
    function updateBotState(
        uint256 _gameId,
        uint256 _botId,
        uint256 _x,
        uint256 _y,
        uint256 _orientation,
        uint256 _hp,
        uint256 _fuel,
        uint256 _damageDealt
    ) external {
        require(games[_gameId].active, "Game not active");
        Bot storage b = gameBots[_gameId][_botId];
        // For the MVP, we do no heavy checks on chain
        b.x = _x;
        b.y = _y;
        b.orientation = _orientation;
        b.HP = _hp;
        b.Fuel = _fuel;
        b.damageDealt = _damageDealt;
    }

    /**
     * @notice Called by the server when the match is over.
     * @param _winningBotId which bot (0-based ID) won
     */
    function finishGame(uint256 _gameId, uint256 _winningBotId) external {
        require(!finished[_gameId], "Already finished");
        require(games[_gameId].active, "Game not active");
        // You might add some security here (like require(msg.sender == game.owner))
        // or require that the game is actually in some final state.
        finished[_gameId] = true;
        winnerBotId[_gameId] = _winningBotId;

        // mark game no longer active
        games[_gameId].active = false;

        emit GameEnded(_gameId, _winningBotId);
    }

    // ----------------------------------
    // VIEW FUNCTIONS
    // ----------------------------------

    /**
     * @notice Returns data about a specific bot in a game
     */
    function getBot(uint256 _gameId, uint256 _botId) external view returns (Bot memory) {
        return gameBots[_gameId][_botId];
    }

    /**
     * @notice For convenience, returns how many bots in a game
     */
    function getBotCount(uint256 _gameId) external view returns (uint256) {
        return botCountOfGame[_gameId];
    }
}
