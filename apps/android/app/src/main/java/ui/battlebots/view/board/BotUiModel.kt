package ui.battlebots.view.board

data class BotUI(
    val x: Float,           // in "meters" (range 0..20 typically)
    val y: Float,           // in "meters"
    val orientation: Float, // 0..359 degrees
    val hp: Int,            // HP to display
    val colorHex: String = "#FF0000" // optional color
)
