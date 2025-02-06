package ui.battlebots.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

// Data classes to match the server's JSON structures

data class CreateGameResponse(
    val ok: Boolean,
    val gameId: Int
)

data class RegisterBotsRequest(
    val gameId: Int,
    val bots: List<BotRegisterRequest>
)

data class BotRegisterRequest(
    val x: Int,
    val y: Int,
    val orientation: Int,
    val HP: Int,
    val Attack: Int,
    val Defense: Int,
    val Speed: Int,
    val Fuel: Int,
    val damageDealt: Int,
    val weaponChoice: Int
)

data class RegisterBotsResponse(
    val ok: Boolean
)

data class TurnRequest(
    val gameId: Int,
    val botIndex: Int,
    val actions: List<TurnActionRequest>
)

data class TurnActionRequest(
    val type: String,
    val x: Int? = null,
    val y: Int? = null,
    val newOrientation: Int? = null,
    val targetIndex: Int? = null
)

data class TurnResponse(
    val successLog: List<String>,
    val botState: BotStateResponse
)

data class BotStateResponse(
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

data class SyncOnChainRequest(
    val gameId: Int
)

data class SyncOnChainResponse(
    val ok: Boolean
)

data class FinishGameRequest(
    val gameId: Int
)

data class FinishGameResponse(
    val ok: Boolean,
    val winnerBotIndex: Int
)

data class GameStateResponse(
    val gameId: Int,
    val isActive: Boolean,
    val turnCount: Int,
    val bots: List<BotStateResponse>
)

// The Retrofit service
interface GameApiService {

    @POST("/createGame")
    suspend fun createGame(): Response<CreateGameResponse>

    @POST("/registerBots")
    suspend fun registerBots(
        @Body body: RegisterBotsRequest
    ): Response<RegisterBotsResponse>

    @POST("/turn")
    suspend fun turn(
        @Body body: TurnRequest
    ): Response<TurnResponse>

    @POST("/syncOnChain")
    suspend fun syncOnChain(
        @Body body: SyncOnChainRequest
    ): Response<SyncOnChainResponse>

    @POST("/finishGame")
    suspend fun finishGame(
        @Body body: FinishGameRequest
    ): Response<FinishGameResponse>

    @GET("/getGameState/{gameId}")
    suspend fun getGameState(@Path("gameId") gameId: Int): Response<GameStateResponse>
}
