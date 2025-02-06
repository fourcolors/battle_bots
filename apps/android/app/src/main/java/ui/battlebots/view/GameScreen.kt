package ui.battlebots.view

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import ui.battlebots.data.TurnAction
import ui.battlebots.view.board.BoardCanvas

@Composable
fun GameScreen(
    uiState: GameUiState,
    onDoTurn: (botIndex: Int, actions: List<TurnAction>) -> Unit,
    onSyncOnChain: () -> Unit,
    onFinish: () -> Unit,
    viewModel: GameViewModel
) {
    val gameId = uiState.gameId

    // Remember a LazyListState to preserve scroll position
    val listState = rememberLazyListState()
    var chosenBotIndex by remember { mutableIntStateOf(0) }
    val context = LocalContext.current

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { error ->
            Toast.makeText(context, error, Toast.LENGTH_LONG).show()
        }
    }
    // Start polling when the gameId changes
    LaunchedEffect(key1 = gameId) {
        if (gameId != null) {
            viewModel.startGamePolling(gameId)
        }
    }
    // Stop polling when leaving the screen
    DisposableEffect(Unit) {
        onDispose {
            viewModel.stopGamePolling()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Fixed board display at the top (non-scrollable)
        BoardCanvas(
            bots = uiState.bots,
            boardSizeCells = 20,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        )

        // Scrollable controls and logs in a LazyColumn with remembered state
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f) // Take remaining space
                .padding(horizontal = 16.dp)
        ) {

            item {
                Text(text = "Game ID: ${uiState.gameId}", style = MaterialTheme.typography.headlineSmall)
                Spacer(modifier = Modifier.height(8.dp))
            }
            item {
                // Bot Index Input
                Text("Choose Bot Index for Next Action:")
                TextField(
                    value = chosenBotIndex.toString(),
                    onValueChange = { chosenBotIndex = it.toIntOrNull() ?: 0 },
                    label = { Text("Bot Index") },
                    modifier = Modifier.width(120.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
            item {
                // Move Action
                var moveX by remember { mutableStateOf("3") }
                var moveY by remember { mutableStateOf("1") }
                Text("Move Action (x,y):")
                Row {
                    TextField(
                        value = moveX,
                        onValueChange = { moveX = it },
                        label = { Text("X") },
                        modifier = Modifier.width(80.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    TextField(
                        value = moveY,
                        onValueChange = { moveY = it },
                        label = { Text("Y") },
                        modifier = Modifier.width(80.dp)
                    )
                }
                Button(onClick = {
                    onDoTurn( // Use the chosen bot index and move action
                        chosenBotIndex,
                        listOf(TurnAction.Move(moveX.toInt(), moveY.toInt()))
                    )
                }) {
                    Text("Perform Move (1 AP)")
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
            item {
                // Rotate Action
                var rotateAngle by remember { mutableStateOf("90") }
                Text("Rotate Action (newOrientation):")
                TextField(
                    value = rotateAngle,
                    onValueChange = { rotateAngle = it },
                    label = { Text("Angle") },
                    modifier = Modifier.width(120.dp)
                )
                Button(onClick = {
                    onDoTurn(
                        0,
                        listOf(TurnAction.Rotate(rotateAngle.toInt()))
                    )
                }) {
                    Text("Perform Rotate (1 AP)")
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
            item {
                // Attack Action
                var attackTargetIndex by remember { mutableStateOf("1") }
                Text("Attack Action (targetIndex):")
                TextField(
                    value = attackTargetIndex,
                    onValueChange = { attackTargetIndex = it },
                    label = { Text("TargetIdx") },
                    modifier = Modifier.width(120.dp)
                )
                Button(onClick = {
                    onDoTurn(
                        0,
                        listOf(TurnAction.Attack(attackTargetIndex.toInt()))
                    )
                }) {
                    Text("Perform Attack (1 AP)")
                }
                Spacer(modifier = Modifier.height(20.dp))
            }
            item {
                Button(onClick = { onSyncOnChain() }) {
                    Text("Sync On Chain")
                }
                Spacer(modifier = Modifier.height(20.dp))
            }
            item {
                Button(onClick = { onFinish() }) {
                    Text("Finish Game")
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
            item {
                Text("Success Log:")
            }
            items(uiState.successLog) { logItem ->
                Text(text = logItem)
            }
            item {
                uiState.lastActionBotState?.let {
                    Text("Last Action Bot State: $it")
                }
            }
            item {
                uiState.errorMessage?.let {
                    Text("Error: $it", color = Color.Red)
                }
            }
        }
    }
}
