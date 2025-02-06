package ui.battlebots.data

import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object GameApi {
    // Adjust BASE_URL to match your server (e.g., http://10.0.2.2:3000 for Android emulator)
    private const val BASE_URL = "http://10.0.2.2:3000"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .build()

    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val service: GameApiService by lazy {
        retrofit.create(GameApiService::class.java)
    }
}

class GameRepository {
    private val api = GameApi.service

    suspend fun createGame(): CreateGameResponse? {
        val response = api.createGame()
        if (response.isSuccessful) {
            return response.body()
        }
        Log.e("GameRepository", "createGame failed: ${response.errorBody()?.string()}")
        return null
    }

    suspend fun registerBots(gameId: Int, bots: List<BotRegisterRequest>): Boolean {
        val response = api.registerBots(RegisterBotsRequest(gameId, bots))
        return response.isSuccessful && (response.body()?.ok == true)
    }

    suspend fun turn(gameId: Int, botIndex: Int, actions: List<TurnAction>): TurnResponse? {
        val turnActions = actions.map { action ->
            when(action) {
                is TurnAction.Move -> TurnActionRequest(
                    type = "move",
                    x = action.x,
                    y = action.y
                )
                is TurnAction.Rotate -> TurnActionRequest(
                    type = "rotate",
                    newOrientation = action.newOrientation
                )
                is TurnAction.Attack -> TurnActionRequest(
                    type = "attack",
                    targetIndex = action.targetIndex
                )
            }
        }
        val response = api.turn(TurnRequest(gameId, botIndex, turnActions))
        if (response.isSuccessful) {
            return response.body()
        }
        Log.e("GameRepository", "turn failed: ${response.errorBody()?.string()}")
        return null
    }

    suspend fun syncOnChain(gameId: Int): Boolean {
        val response = api.syncOnChain(SyncOnChainRequest(gameId))
        return response.isSuccessful && (response.body()?.ok == true)
    }

    suspend fun finishGame(gameId: Int): FinishGameResponse? {
        val response = api.finishGame(FinishGameRequest(gameId))
        if (response.isSuccessful) {
            return response.body()
        }
        Log.e("GameRepository", "finishGame failed: ${response.errorBody()?.string()}")
        return null
    }

    suspend fun getGameState(gameId: Int): GameStateResponse? {
        val response = api.getGameState(gameId)
        if (response.isSuccessful) {
            return response.body()
        }
        Log.e("GameRepository", "getGameState failed: ${response.errorBody()?.string()}")
        return null
    }
}
