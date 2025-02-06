package ui.battlebots.view

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import ui.battlebots.ui.theme.BattleBotsTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BattleBotsTheme {
                AgentBattleApp()
            }
        }
    }
}

@Composable
fun AgentBattleApp(viewModel: GameViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    var currentScreen by remember { mutableStateOf("home") }

    Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (currentScreen) {
                "home" -> HomeScreen(
                    uiState = uiState,
                    onCreateGame = {
                        viewModel.createGame()
                    },
                    onNext = {
                        currentScreen = "register"
                    }
                )
                "register" -> RegisterBotsScreen(
                    uiState = uiState,
                    onRegisterBots = { bots ->
                        uiState.gameId?.let { gameId ->
                            viewModel.registerBots(gameId, bots)
                        }
                    },
                    onNext = {
                        currentScreen = "game"
                    }
                )
                "game" -> GameScreen(
                    uiState = uiState,
                    onDoTurn = { botIndex, actions ->
                        uiState.gameId?.let { gameId ->
                            viewModel.doTurn(gameId, botIndex, actions)
                        }
                    },
                    onSyncOnChain = {
                        uiState.gameId?.let { gameId ->
                            viewModel.syncOnChain(gameId)
                        }
                    },
                    onFinish = {
                        currentScreen = "finish"
                        uiState.gameId?.let { gameId ->
                            viewModel.finishGame(gameId)
                        }
                    },
                    viewModel = viewModel,
                )
                "finish" -> FinishScreen(
                    uiState = uiState,
                    onReset = {
                        currentScreen = "home"
                    }
                )
            }
        }
    }
}