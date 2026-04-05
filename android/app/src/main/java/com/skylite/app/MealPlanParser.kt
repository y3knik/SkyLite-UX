package com.skylite.app

import org.json.JSONArray

data class ParsedMealInfo(
    val name: String,
    val mealType: String,
    val mealTypeLabel: String
)

data class ParsedWidgetData(
    val todayMeals: List<ParsedMealInfo>,
    val tomorrowMeals: List<ParsedMealInfo>,
    val error: String? = null
)

object MealPlanParser {
    private val mealTypeLabels = mapOf(
        "BREAKFAST" to "Breakfast",
        "LUNCH" to "Lunch",
        "DINNER" to "Dinner"
    )

    fun parseMealPlans(jsonResponse: String, todayApiDay: Int, tomorrowApiDay: Int): ParsedWidgetData {
        val plansArray = JSONArray(jsonResponse)

        if (plansArray.length() == 0) {
            return ParsedWidgetData(
                todayMeals = emptyList(),
                tomorrowMeals = emptyList(),
                error = null
            )
        }

        val latestPlan = plansArray.getJSONObject(0)
        val mealsArray = latestPlan.optJSONArray("meals") ?: JSONArray()

        val todayMeals = mutableListOf<ParsedMealInfo>()
        val tomorrowMeals = mutableListOf<ParsedMealInfo>()

        for (i in 0 until mealsArray.length()) {
            val meal = mealsArray.getJSONObject(i)
            val dayOfWeek = when {
                meal.has("dayOfWeek") -> meal.optInt("dayOfWeek", -1)
                meal.has("n") -> meal.optInt("n", -1)
                else -> -1
            }
            if (dayOfWeek !in 0..6) continue
            val name = meal.optString("name", "").trim()
            if (name.isEmpty()) continue
            val mealType = meal.optString("mealType", "DINNER").uppercase()
            val mealTypeLabel = mealTypeLabels[mealType] ?: mealType

            val mealInfo = ParsedMealInfo(
                name = name,
                mealType = mealType,
                mealTypeLabel = mealTypeLabel
            )

            when (dayOfWeek) {
                todayApiDay -> todayMeals.add(mealInfo)
                tomorrowApiDay -> tomorrowMeals.add(mealInfo)
            }
        }

        todayMeals.sortBy { getMealTypeOrder(it.mealType) }
        tomorrowMeals.sortBy { getMealTypeOrder(it.mealType) }

        return ParsedWidgetData(
            todayMeals = todayMeals,
            tomorrowMeals = tomorrowMeals,
            error = null
        )
    }

    private fun getMealTypeOrder(mealType: String): Int {
        return when (mealType) {
            "BREAKFAST" -> 0
            "LUNCH" -> 1
            "DINNER" -> 2
            else -> 3
        }
    }
}
