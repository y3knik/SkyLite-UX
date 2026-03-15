# Meal Entry UI Redesign

## Problem

The current meal entry flow has too many steps. Users must expand accordions, tap add buttons, fill a form, and submit. The goal is a fast, frictionless experience where you just scroll and type.

## Design

### Page Layout

- Replace the weekly grid/accordion with an **infinite scrolling list of days** starting from today
- No week navigation header (prev/next/today buttons removed)
- Sync status bar and page title remain at top
- Prep reminders section optionally sits above the day list
- Initial load fetches ~2 weeks of data; more days lazy-load as the user scrolls near the bottom (7 days per batch)

### Day Cards

Each day is a **bordered card with a light background** containing:
- **Sticky day header**: bold day name + date (e.g. "Saturday, Mar 14"), today gets an accent/"Today" badge
- **3 meal input slots** separated by light bottom-border dividers (no border on last slot)
- Small meal-type icon to the left of each input (sun/cloud/moon for breakfast/lunch/dinner)
- Compact spacing — 2-3 days visible on screen at once

### Meal Entry Interaction

**Adding a meal:**
- Tap an empty field, type the meal name, press Enter or blur to save automatically
- No submit button — save on blur/enter
- Subtle loading indicator (field dims briefly) confirms save
- Offline: queues via existing offline sync system

**Editing a meal:**
- Tap a filled field to make it editable, same save-on-blur behavior
- Clearing text and blurring deletes the meal (with a brief undo toast, no confirmation dialog)

**Viewing/editing details:**
- Tap a chevron/info icon on a filled meal to open a **bottom sheet**
- Bottom sheet contains: meal name as header, description textarea, prep days number input, delete button (red)
- Swipe down or tap outside to dismiss

### Components

**New:**
- `mealDayList.vue` — Infinite scrolling list, manages lazy loading, renders day cards, emits meal CRUD events
- `mealDayCard.vue` — Single day: header + 3 meal input slots, save-on-blur/enter logic
- `mealDetailSheet.vue` — Bottom sheet for description/prep details, uses USlideover or custom sheet

**Removed:**
- `weeklyMealGrid.vue` — replaced by mealDayList
- `mealFormInline.vue` — replaced by direct text inputs in mealDayCard
- `mealDialog.vue` — replaced by mealDetailSheet

**Kept:**
- `syncStatusBar.vue`
- `preparationReminders.vue` (optional, above day list)
- `useMealPlans.ts` — composable stays, uses `getMealsForDateRange()` instead of weekly fetch

### Data Flow

- Page calls `getMealsForDateRange(today, today + 14 days)` on mount
- Scroll near bottom triggers fetch of next 7 days
- Meal saves use existing `addMealToPlan` / `updateMeal` / `deleteMeal` APIs
- `MealPlan` weekly grouping handled transparently — auto-created on first meal save if missing

### Visual Design

- **Day cards**: subtle border, light background, rounded corners
- **Meal slots**: borderless inputs with light placeholder text, divided by thin lines
- **Filled meals**: normal weight text, chevron icon on right for detail sheet
- **Bottom sheet**: rounded top corners, drag handle, dimmed backdrop
- **Loading**: skeleton placeholders for incoming days, subtle pulse on saving fields
- **Overall feel**: clean, minimal — more like a notes app than a traditional meal planner
