package ui.battlebots.view.board

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun BoardCanvas(
    bots: List<BotUI>,
    boardSizeCells: Int = 20,  // Set to 20 because your bots use coordinates up to 19.
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val density = LocalDensity.current

    // Get the available screen width (in dp) and cap the board size to a max value (e.g. 400.dp)
    val screenWidthDp = with(density) { context.resources.displayMetrics.widthPixels.toDp() }
    val boardPixelSize = screenWidthDp.coerceAtMost(400.dp) // board will be a square with this size

    Box(
        modifier = modifier
            .size(boardPixelSize)
            .background(Color.LightGray, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        // Create a Canvas with an explicit size
        Canvas(modifier = Modifier.size(boardPixelSize)) {
            val width = size.width     // canvas width in pixels
            val height = size.height   // canvas height in pixels

            // Each cell is of equal size
            val cellSize = width / boardSizeCells.toFloat()

            // Draw grid lines – we need boardSizeCells+1 lines to create boardSizeCells cells
            for (i in 0..boardSizeCells) {
                val xPos = i * cellSize
                val yPos = i * cellSize

                // Vertical grid line
                drawLine(
                    start = Offset(xPos, 0f),
                    end = Offset(xPos, height),
                    color = Color.Gray,
                    strokeWidth = 1f
                )
                // Horizontal grid line
                drawLine(
                    start = Offset(0f, yPos),
                    end = Offset(width, yPos),
                    color = Color.Gray,
                    strokeWidth = 1f
                )
            }

            // Draw each bot centered in its cell.
            // Here, we assume bot.x and bot.y range from 0 to (boardSizeCells - 1).
            // For example, a bot at (1,1) is in the cell with lower-left corner (1,1),
            // and its center is at ((1+0.5)*cellSize, height - (1+0.5)*cellSize).
            bots.forEach { bot ->
                val botPxX = (bot.x + 0.5f) * cellSize
                val botPxY = height - (bot.y + 0.5f) * cellSize

                val botColor = Color(android.graphics.Color.parseColor(bot.colorHex))

                // Draw the bot as a circle (with radius relative to cell size)
                drawCircle(
                    color = botColor,
                    radius = cellSize * 0.25f,
                    center = Offset(botPxX, botPxY)
                )

                // Draw an orientation arrow.
                val orientationRad = Math.toRadians(bot.orientation.toDouble())
                // Arrow length is half the cell size for visual clarity
                val arrowLength = cellSize * 0.5f
                val dx = arrowLength * sin(orientationRad).toFloat()
                val dy = -arrowLength * cos(orientationRad).toFloat()
                val arrowEnd = Offset(botPxX + dx, botPxY + dy)
                drawLine(
                    color = botColor,
                    start = Offset(botPxX, botPxY),
                    end = arrowEnd,
                    strokeWidth = 2f
                )

                // Draw HP label near the bot
                drawContext.canvas.nativeCanvas.apply {
                    drawText(
                        "HP: ${bot.hp}",
                        botPxX + cellSize * 0.2f,
                        botPxY - cellSize * 0.2f,
                        android.graphics.Paint().apply {
                            color = android.graphics.Color.BLACK
                            textSize = cellSize * 0.3f
                        }
                    )
                }
            }
        }
    }
}


