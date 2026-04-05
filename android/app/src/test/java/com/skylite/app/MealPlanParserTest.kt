package com.skylite.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MealPlanParserTest {

    private fun makeMealPlan(mealsJson: String): String {
        return """[{"weekStart":"2026-04-05","meals":$mealsJson}]"""
    }

    @Test
    fun `parses meals with dayOfWeek key`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":0,"name":"Pancakes","mealType":"BREAKFAST"},
            {"dayOfWeek":0,"name":"Spaghetti","mealType":"DINNER"},
            {"dayOfWeek":1,"name":"Caesar Salad","mealType":"LUNCH"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals(2, result.todayMeals.size)
        assertEquals("Pancakes", result.todayMeals[0].name)
        assertEquals("Breakfast", result.todayMeals[0].mealTypeLabel)
        assertEquals("Spaghetti", result.todayMeals[1].name)
        assertEquals("Dinner", result.todayMeals[1].mealTypeLabel)
        assertEquals(1, result.tomorrowMeals.size)
        assertEquals("Caesar Salad", result.tomorrowMeals[0].name)
    }

    @Test
    fun `parses meals with n key as day index fallback`() {
        val json = makeMealPlan("""[
            {"n":0,"name":"Oatmeal","mealType":"BREAKFAST"},
            {"n":1,"name":"Tacos","mealType":"DINNER"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals(1, result.todayMeals.size)
        assertEquals("Oatmeal", result.todayMeals[0].name)
        assertEquals(1, result.tomorrowMeals.size)
        assertEquals("Tacos", result.tomorrowMeals[0].name)
    }

    @Test
    fun `prefers dayOfWeek over n when both present`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":2,"n":5,"name":"Test","mealType":"DINNER"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 2, tomorrowApiDay = 3)

        assertEquals(1, result.todayMeals.size)
        assertEquals("Test", result.todayMeals[0].name)
    }

    @Test
    fun `skips meals with invalid dayOfWeek`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":-1,"name":"Bad Day","mealType":"DINNER"},
            {"dayOfWeek":7,"name":"Also Bad","mealType":"DINNER"},
            {"dayOfWeek":3,"name":"Good Meal","mealType":"LUNCH"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 3, tomorrowApiDay = 4)

        assertEquals(1, result.todayMeals.size)
        assertEquals("Good Meal", result.todayMeals[0].name)
    }

    @Test
    fun `skips meals with empty name`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":0,"name":"","mealType":"DINNER"},
            {"dayOfWeek":0,"name":"  ","mealType":"DINNER"},
            {"dayOfWeek":0,"name":"Valid","mealType":"BREAKFAST"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals(1, result.todayMeals.size)
        assertEquals("Valid", result.todayMeals[0].name)
    }

    @Test
    fun `sorts meals by type order breakfast lunch dinner`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":0,"name":"Steak","mealType":"DINNER"},
            {"dayOfWeek":0,"name":"Eggs","mealType":"BREAKFAST"},
            {"dayOfWeek":0,"name":"Sandwich","mealType":"LUNCH"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals(3, result.todayMeals.size)
        assertEquals("Eggs", result.todayMeals[0].name)
        assertEquals("Sandwich", result.todayMeals[1].name)
        assertEquals("Steak", result.todayMeals[2].name)
    }

    @Test
    fun `normalizes mealType to uppercase`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":0,"name":"Test","mealType":"breakfast"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals("BREAKFAST", result.todayMeals[0].mealType)
        assertEquals("Breakfast", result.todayMeals[0].mealTypeLabel)
    }

    @Test
    fun `defaults mealType to DINNER when missing`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":0,"name":"Mystery Meal"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals("DINNER", result.todayMeals[0].mealType)
        assertEquals("Dinner", result.todayMeals[0].mealTypeLabel)
    }

    @Test
    fun `returns empty lists for empty meal plan array`() {
        val json = "[]"

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertTrue(result.todayMeals.isEmpty())
        assertTrue(result.tomorrowMeals.isEmpty())
    }

    @Test
    fun `returns empty lists when no meals match today or tomorrow`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":5,"name":"Weekend Meal","mealType":"DINNER"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertTrue(result.todayMeals.isEmpty())
        assertTrue(result.tomorrowMeals.isEmpty())
    }

    @Test
    fun `handles plan with no meals array`() {
        val json = """[{"weekStart":"2026-04-05"}]"""

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertTrue(result.todayMeals.isEmpty())
        assertTrue(result.tomorrowMeals.isEmpty())
    }

    @Test
    fun `trims whitespace from meal names`() {
        val json = makeMealPlan("""[
            {"dayOfWeek":0,"name":"  Pancakes  ","mealType":"BREAKFAST"}
        ]""")

        val result = MealPlanParser.parseMealPlans(json, todayApiDay = 0, tomorrowApiDay = 1)

        assertEquals("Pancakes", result.todayMeals[0].name)
    }
}
