// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AgentBattle {
    // ----------------------------------
    // STRUCTURES
    // ----------------------------------

    struct Bot {
        uint256 x; 
        uint256 y; 
        uint256 orientation;
        uint256 HP;
        uint256 Attack;
        uint256 Defense;
        uint256 Speed;
        uint256 Fuel;
        uint256 damageDealt;
        uint256 weaponChoice;
        address owner;    // Address of the user who registered the bot
    }

    struct Game {
        bool active;
        address owner;
        uint256 turnCount;
        uint256 betAmount;    // Fixed bet amount per player
        uint256 prizePool;    // Accumulated prize pool
    }

    // ----------------------------------
    // STATE
    // ----------------------------------

    IERC20 public usdc;  // USDC token contract
    address public treasury;  // Address that collects the 10% fee
    uint256 public constant FEE_PERCENT = 10; // 10% fee on the total pot

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(uint256 => Bot)) public gameBots;
    mapping(uint256 => uint256) public botCountOfGame;
    mapping(uint256 => bool) public finished;
    mapping(uint256 => uint256) public winnerBotId;

    uint256 public gameCounter;

    // ----------------------------------
    // EVENTS
    // ----------------------------------

    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 betAmount);
    event BotRegistered(uint256 indexed gameId, uint256 indexed botId, address indexed owner);
    event GameEnded(uint256 indexed gameId, uint256 indexed winningBot, address indexed winner, uint256 prizeAmount);

    // ----------------------------------
    // CONSTRUCTOR
    // ----------------------------------

    constructor(address _usdc, address _treasury) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    // ----------------------------------
    // FUNCTIONS
    // ----------------------------------

    /**
     * @notice Creates a new game with a fixed bet amount.
     */
    function createGame(uint256 _betAmount) external returns (uint256) {
        gameCounter += 1;
        uint256 newId = gameCounter;
        games[newId] = Game({
            active: true,
            owner: msg.sender,
            turnCount: 0,
            betAmount: _betAmount,
            prizePool: 0
        });

        emit GameCreated(newId, msg.sender, _betAmount);
        return newId;
    }

    /**
     * @notice User registers a bot and pays the bet amount.
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
        require(usdc.transferFrom(msg.sender, address(this), games[_gameId].betAmount), "USDC Transfer failed");

        uint256 botId = botCountOfGame[_gameId];
        botCountOfGame[_gameId] = botId + 1;

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
            weaponChoice: _weaponChoice,
            owner: msg.sender
        });

        games[_gameId].prizePool += games[_gameId].betAmount;

        emit BotRegistered(_gameId, botId, msg.sender);
    }

    /**
     * @notice Updates a bot’s state. Called by the trusted server after turns.
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
        b.x = _x;
        b.y = _y;
        b.orientation = _orientation;
        b.HP = _hp;
        b.Fuel = _fuel;
        b.damageDealt = _damageDealt;
    }

    /**
     * @notice Finalize the game and distribute the prize pool.
     */
    function finishGame(uint256 _gameId, uint256 _winningBotId) external {
        require(!finished[_gameId], "Already finished");
        require(games[_gameId].active, "Game not active");

        finished[_gameId] = true;
        winnerBotId[_gameId] = _winningBotId;
        games[_gameId].active = false;

        address winner = gameBots[_gameId][_winningBotId].owner;
        uint256 prize = games[_gameId].prizePool;

        uint256 treasuryCut = (prize * FEE_PERCENT) / 100;
        uint256 winnerAmount = prize - treasuryCut;

        usdc.transfer(winner, winnerAmount);
        usdc.transfer(treasury, treasuryCut);

        emit GameEnded(_gameId, _winningBotId, winner, winnerAmount);
    }

     // ----------------------------------
    // VIEW FUNCTIONS
    // ----------------------------------

    /**
     * @notice Returns data about a specific bot in a game.
     */
    function getBot(uint256 _gameId, uint256 _botId) external view returns (Bot memory) {
        return gameBots[_gameId][_botId];
    }

    /**
     * @notice Returns the number of bots registered for a game.
     */
    function getBotCount(uint256 _gameId) external view returns (uint256) {
        return botCountOfGame[_gameId];
    }
}
