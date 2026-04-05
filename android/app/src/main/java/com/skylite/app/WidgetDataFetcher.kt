package com.skylite.app

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar

data class MealInfo(
    val name: String,
    val mealType: String,
    val mealTypeLabel: String
)

data class WidgetData(
    val todayMeals: List<MealInfo>,
    val tomorrowMeals: List<MealInfo>,
    val error: String? = null
)

object WidgetDataFetcher {
    private const val TAG = "WidgetDataFetcher"
    private const val PREFS_NAME = "CapacitorStorage"
    private const val KEY_SERVER_URL = "serverUrl"
    private const val TIMEOUT_MS = 10000

    private val mealTypeIcons = mapOf(
        "BREAKFAST" to R.drawable.ic_meal_breakfast,
        "LUNCH" to R.drawable.ic_meal_lunch,
        "DINNER" to R.drawable.ic_meal_dinner
    )

    fun getMealIcon(mealType: String): Int {
        return mealTypeIcons[mealType] ?: R.drawable.ic_meal_dinner
    }

    fun getSharedPreferences(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getServerUrl(context: Context): String? {
        val prefs = getSharedPreferences(context)
        return prefs.getString(KEY_SERVER_URL, null)
    }

    fun getTodayApiDayOfWeek(): Int {
        val javaDay = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
        return javaDay - 1
    }

    fun getTomorrowApiDayOfWeek(): Int {
        val today = getTodayApiDayOfWeek()
        return (today + 1) % 7
    }

    suspend fun fetchWidgetData(context: Context): WidgetData {
        return withContext(Dispatchers.IO) {
            try {
                val serverUrl = getServerUrl(context)
                if (serverUrl.isNullOrBlank()) {
                    return@withContext WidgetData(
                        todayMeals = emptyList(),
                        tomorrowMeals = emptyList(),
                        error = "Configure server in Skylite app"
                    )
                }

                val apiUrl = "$serverUrl/api/meal-plans"
                Log.d(TAG, "Fetching meal plans from: $apiUrl")

                val connection = URL(apiUrl).openConnection() as HttpURLConnection
                try {
                    connection.requestMethod = "GET"
                    connection.connectTimeout = TIMEOUT_MS
                    connection.readTimeout = TIMEOUT_MS
                    connection.setRequestProperty("Accept", "application/json")

                    val responseCode = connection.responseCode
                    if (responseCode != HttpURLConnection.HTTP_OK) {
                        return@withContext WidgetData(
                            todayMeals = emptyList(),
                            tomorrowMeals = emptyList(),
                            error = "Server error: $responseCode"
                        )
                    }

                    val response = BufferedReader(InputStreamReader(connection.inputStream)).use { reader ->
                        reader.readText()
                    }

                    parseMealPlans(response)
                } finally {
                    connection.disconnect()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to fetch widget data", e)
                WidgetData(
                    todayMeals = emptyList(),
                    tomorrowMeals = emptyList(),
                    error = "Unable to connect"
                )
            }
        }
    }

    private fun parseMealPlans(jsonResponse: String): WidgetData {
        val todayApiDay = getTodayApiDayOfWeek()
        val tomorrowApiDay = getTomorrowApiDayOfWeek()

        Log.d(TAG, "Parsing meals - todayApiDay=$todayApiDay, tomorrowApiDay=$tomorrowApiDay")

        val parsed = MealPlanParser.parseMealPlans(jsonResponse, todayApiDay, tomorrowApiDay)

        return WidgetData(
            todayMeals = parsed.todayMeals.map { MealInfo(it.name, it.mealType, it.mealTypeLabel) },
            tomorrowMeals = parsed.tomorrowMeals.map { MealInfo(it.name, it.mealType, it.mealTypeLabel) },
            error = parsed.error
        )
    }
}
