package ui.battlebots.data

sealed class TurnAction {
    data class Move(val x: Int, val y: Int) : TurnAction()
    data class Rotate(val newOrientation: Int) : TurnAction()
    data class Attack(val targetIndex: Int) : TurnAction()
}
