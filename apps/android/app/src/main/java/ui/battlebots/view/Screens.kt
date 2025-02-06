package ui.battlebots.view

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ui.battlebots.data.BotRegisterRequest

@Composable
fun HomeScreen(
    uiState: GameUiState,
    onCreateGame: () -> Unit,
    onNext: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        if (uiState.isLoading) {
            CircularProgressIndicator()
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "Welcome to Agent BattleBots!")
                Spacer(modifier = Modifier.height(20.dp))
                Button(onClick = { onCreateGame() }) {
                    Text("Create New Game")
                }
                Spacer(modifier = Modifier.height(20.dp))
                if (uiState.gameId != null) {
                    Text(text = "Game created with ID: ${uiState.gameId}")
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(onClick = { onNext() }) {
                        Text("Next -> Register Bots")
                    }
                }
                uiState.errorMessage?.let {
                    Text(text = "Error: $it")
                }
            }
        }
    }
}

@Composable
fun RegisterBotsScreen(
    uiState: GameUiState,
    onRegisterBots: (List<BotRegisterRequest>) -> Unit,
    onNext: () -> Unit
) {
    // For simplicity, let's just register 2 bots with hardcoded or minimal input.
    var registerClicked by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        if (uiState.isLoading) {
            CircularProgressIndicator()
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "Register Bots")
                Spacer(modifier = Modifier.height(16.dp))

                Button(onClick = {
                    registerClicked = true
                    val bots = listOf(
                        BotRegisterRequest(1,1,0,10,2,3,2,10,0,1),  // Basic Gun
                        BotRegisterRequest(19,1,180,10,2,2,2,10,0,3) // Saw Blade
                    )
                    onRegisterBots(bots)
                }) {
                    Text("Register 2 Sample Bots")
                }

                if (registerClicked && uiState.errorMessage == null) {
                    Text("Registered bots (check logs or server).")
                }

                Spacer(modifier = Modifier.height(20.dp))
                if (uiState.errorMessage == null) {
                    Button(onClick = { onNext() }) {
                        Text("Next -> Game Screen")
                    }
                }

                uiState.errorMessage?.let {
                    Text("Error: $it")
                }
            }
        }
    }
}

@Composable
fun FinishScreen(
    uiState: GameUiState,
    onReset: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        if (uiState.isLoading) {
            CircularProgressIndicator()
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Game Finished!")
                if (uiState.winnerBotIndex != null) {
                    Text("Winner is Bot #${uiState.winnerBotIndex}")
                } else {
                    Text("No winner data available.")
                }
                Spacer(modifier = Modifier.height(20.dp))
                Button(onClick = { onReset() }) {
                    Text("Restart Game Flow")
                }
            }
        }
    }
}
