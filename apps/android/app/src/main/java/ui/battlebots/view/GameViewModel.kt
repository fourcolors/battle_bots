package ui.battlebots.view

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import ui.battlebots.data.BotRegisterRequest
import ui.battlebots.data.GameRepository
import ui.battlebots.data.TurnAction
import ui.battlebots.view.board.BotUI

data class GameUiState(
    val gameId: Int? = null,
    val isLoading: Boolean = false,
    val successLog: List<String> = emptyList(),
    val errorMessage: String? = null,
    val lastActionBotState: String? = null,
    val winnerBotIndex: Int? = null,
    val bots: List<BotUI> = emptyList(),
)

class GameViewModel : ViewModel() {

    private val repository = GameRepository()

    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState
    private var pollingJob: Job? = null // To cancel polling when needed

    fun createGame() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val response = repository.createGame()
            if (response != null && response.ok) {
                _uiState.value = _uiState.value.copy(
                    gameId = response.gameId,
                    isLoading = false,
                    errorMessage = null
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to create game"
                )
            }
        }
    }

    fun registerBots(gameId: Int, bots: List<BotRegisterRequest>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val success = repository.registerBots(gameId, bots)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = if (!success) "Failed to register bots" else null
            )
        }
    }

    fun doTurn(gameId: Int, botIndex: Int, actions: List<TurnAction>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val turnRes = repository.turn(gameId, botIndex, actions)
            if (turnRes != null) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successLog = turnRes.successLog,
                    lastActionBotState = "BotState: x=${turnRes.botState.x}, y=${turnRes.botState.y}, HP=${turnRes.botState.HP}, Fuel=${turnRes.botState.Fuel}",
                    errorMessage = null
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Turn action failed"
                )
            }
        }
    }

    fun syncOnChain(gameId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val success = repository.syncOnChain(gameId)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = if (!success) "Sync on chain failed" else null
            )
        }
    }

    fun finishGame(gameId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.finishGame(gameId)
            if (result != null) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    winnerBotIndex = result.winnerBotIndex,
                    errorMessage = null
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to finish game"
                )
            }
        }
    }

    fun getGameState(gameId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val state = repository.getGameState(gameId)
            if (state != null) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    gameId = state.gameId,
                    bots = state.bots.map { bot ->
                        BotUI(
                            x = bot.x,
                            y = bot.y,
                            orientation = bot.orientation,
                            hp = bot.HP,
                            colorHex = "#FF0000" // Assign colors dynamically later if needed
                        )
                    },
                    errorMessage = null
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to fetch game state"
                )
            }
        }
    }
    // Start polling game state every 3 seconds
    fun startGamePolling(gameId: Int) {
        if (pollingJob?.isActive == true) return // Prevent duplicate polling jobs

        pollingJob = viewModelScope.launch {
            while (true) {
                getGameState(gameId)
                delay(3000) // Fetch every 3 seconds
            }
        }
    }

    // Stop polling when the game ends or user leaves the screen
    fun stopGamePolling() {
        pollingJob?.cancel()
    }
}
