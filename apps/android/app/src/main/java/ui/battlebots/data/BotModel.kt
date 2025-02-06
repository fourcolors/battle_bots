package ui.battlebots.data

data class BotModel(
    val x: Float,
    val y: Float,
    val orientation: Float,
    val HP: Int,
    val Attack: Int,
    val Defense: Int,
    val Speed: Int,
    val Fuel: Float,
    val damageDealt: Int,
    val weaponChoice: Int
)