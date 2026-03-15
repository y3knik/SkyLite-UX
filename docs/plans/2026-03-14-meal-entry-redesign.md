# Meal Entry UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the accordion/modal meal planner with an infinite-scrolling list of day cards where each meal slot is a direct text input, with a bottom sheet for optional details.

**Architecture:** The page becomes a flat scrollable list of days starting from today. Each day is a bordered card with 3 labeled text inputs (Breakfast/Lunch/Dinner). Meals save on blur/enter. Tapping a chevron on a filled meal opens a `UDrawer` bottom sheet for description and prep details. The `getMealsForDateRange()` API handles data fetching; `MealPlan` weekly grouping is managed transparently.

**Tech Stack:** Nuxt 4, Vue 3, @nuxt/ui v3 (UDrawer, UInput, UButton, UIcon), Tailwind CSS, Capacitor, date-fns, Vitest

---

## Task 1: Create `mealDayCard.vue` component

**Files:**
- Create: `app/components/mealPlanner/mealDayCard.vue`

**Step 1: Create the component with props and template**

```vue
<script setup lang="ts">
import { format, isToday } from "date-fns";

import type { MealType } from "~/types/database";
import type { MealWithDate } from "~/types/database";

type MealSlot = {
  type: MealType;
  label: string;
  icon: string;
  meal: MealWithDate | null;
};

const props = defineProps<{
  date: Date;
  meals: MealWithDate[];
}>();

const emit = defineEmits<{
  (e: "saveMeal", data: { date: Date; mealType: MealType; name: string }): void;
  (e: "updateMealName", data: { mealId: string; name: string }): void;
  (e: "deleteMeal", mealId: string): void;
  (e: "openDetail", meal: MealWithDate): void;
}>();

const dayLabel = computed(() => {
  if (isToday(props.date)) return "Today";
  return format(props.date, "EEEE");
});

const dateLabel = computed(() => format(props.date, "MMM d"));

const slots = computed<MealSlot[]>(() => {
  const types: { type: MealType; label: string; icon: string }[] = [
    { type: "BREAKFAST", label: "Breakfast", icon: "i-lucide-sunrise" },
    { type: "LUNCH", label: "Lunch", icon: "i-lucide-cloud-sun" },
    { type: "DINNER", label: "Dinner", icon: "i-lucide-moon" },
  ];

  return types.map(t => ({
    ...t,
    meal: props.meals.find(m => m.mealType === t.type) || null,
  }));
});

// Track which slots are being edited (by mealType)
const editingSlots = ref<Set<MealType>>(new Set());
// Track input values for each slot
const inputValues = ref<Record<MealType, string>>({
  BREAKFAST: "",
  LUNCH: "",
  DINNER: "",
});
// Track saving state per slot
const savingSlots = ref<Set<MealType>>(new Set());

// Sync input values with existing meals
watch(() => props.meals, (meals) => {
  for (const meal of meals) {
    if (!editingSlots.value.has(meal.mealType)) {
      inputValues.value[meal.mealType] = meal.name;
    }
  }
  // Clear inputs for slots that no longer have meals
  const mealTypes = new Set(meals.map(m => m.mealType));
  for (const type of ["BREAKFAST", "LUNCH", "DINNER"] as MealType[]) {
    if (!mealTypes.has(type) && !editingSlots.value.has(type)) {
      inputValues.value[type] = "";
    }
  }
}, { immediate: true });

function handleFocus(mealType: MealType) {
  editingSlots.value.add(mealType);
}

function handleBlur(slot: MealSlot) {
  editingSlots.value.delete(slot.type);
  const value = inputValues.value[slot.type].trim();

  if (slot.meal) {
    // Existing meal
    if (value === "") {
      // Cleared — delete
      emit("deleteMeal", slot.meal.id);
    } else if (value !== slot.meal.name) {
      // Changed — update
      emit("updateMealName", { mealId: slot.meal.id, name: value });
    }
  } else if (value !== "") {
    // New meal
    savingSlots.value.add(slot.type);
    emit("saveMeal", { date: props.date, mealType: slot.type, name: value });
  }
}

function handleKeydown(event: KeyboardEvent, slot: MealSlot) {
  if (event.key === "Enter") {
    event.preventDefault();
    (event.target as HTMLInputElement).blur();
  }
}

// Clear saving state when meal appears
watch(() => props.meals, () => {
  savingSlots.value.clear();
});
</script>

<template>
  <div
    class="rounded-lg border border-default bg-default overflow-hidden"
    :class="{ 'border-primary/30': isToday(date) }"
  >
    <!-- Day header -->
    <div
      class="px-4 py-2.5 border-b border-default"
      :class="isToday(date) ? 'bg-primary/5' : 'bg-muted/5'"
    >
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-base">
          {{ dayLabel }}
        </h3>
        <span class="text-sm text-muted">{{ dateLabel }}</span>
        <UBadge v-if="isToday(date)" color="primary" variant="soft" size="xs">
          Today
        </UBadge>
      </div>
    </div>

    <!-- Meal slots -->
    <div>
      <div
        v-for="(slot, index) in slots"
        :key="slot.type"
        class="flex items-center gap-3 px-4 py-3"
        :class="{ 'border-b border-default': index < slots.length - 1 }"
      >
        <!-- Meal type icon -->
        <UIcon :name="slot.icon" class="h-4 w-4 text-muted flex-shrink-0" />

        <!-- Input field -->
        <input
          v-model="inputValues[slot.type]"
          type="text"
          :placeholder="slot.label"
          class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/50"
          :class="{ 'opacity-50': savingSlots.has(slot.type) }"
          enterkeyhint="done"
          @focus="handleFocus(slot.type)"
          @blur="handleBlur(slot)"
          @keydown="handleKeydown($event, slot)"
        />

        <!-- Detail chevron (only for filled meals) -->
        <button
          v-if="slot.meal"
          class="p-1 rounded hover:bg-muted/10 active:bg-muted/20 flex-shrink-0"
          aria-label="Meal details"
          @click="emit('openDetail', slot.meal!)"
        >
          <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-muted" />
        </button>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Verify it compiles**

Run: `cd C:/Skylight && npx nuxi typecheck 2>&1 | head -20`
Expected: No errors related to mealDayCard

**Step 3: Commit**

```bash
git add app/components/mealPlanner/mealDayCard.vue
git commit -m "feat(meal): add mealDayCard component with inline text inputs"
```

---

## Task 2: Create `mealDetailSheet.vue` bottom sheet component

**Files:**
- Create: `app/components/mealPlanner/mealDetailSheet.vue`

**Step 1: Create the bottom sheet component**

```vue
<script setup lang="ts">
import type { MealWithDate } from "~/types/database";

const props = defineProps<{
  meal: MealWithDate | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "save", data: { mealId: string; description: string; daysInAdvance: number }): void;
  (e: "delete", mealId: string): void;
}>();

const description = ref("");
const daysInAdvance = ref(0);

watch(() => props.meal, (meal) => {
  if (meal) {
    description.value = meal.description || "";
    daysInAdvance.value = meal.daysInAdvance || 0;
  }
}, { immediate: true });

function handleSave() {
  if (!props.meal) return;
  emit("save", {
    mealId: props.meal.id,
    description: description.value.trim(),
    daysInAdvance: daysInAdvance.value,
  });
  emit("update:open", false);
}

function handleDelete() {
  if (!props.meal) return;
  emit("delete", props.meal.id);
  emit("update:open", false);
}
</script>

<template>
  <UDrawer
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold">
          {{ meal?.name }}
        </h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4 px-4 pb-4">
        <!-- Description -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-highlighted">Description</label>
          <UTextarea
            v-model="description"
            placeholder="Notes about this meal..."
            :rows="3"
            class="w-full text-base resize-none"
          />
        </div>

        <!-- Prep days -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-highlighted">Prep Days in Advance</label>
          <UInput
            v-model.number="daysInAdvance"
            type="number"
            :min="0"
            :max="7"
            size="lg"
            class="w-full"
          />
          <p class="text-xs text-muted">
            Days before to start prep (e.g., defrosting)
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col gap-2 w-full">
        <UButton
          color="primary"
          size="lg"
          class="w-full"
          @click="handleSave"
        >
          Save Details
        </UButton>
        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-trash"
          size="lg"
          class="w-full"
          @click="handleDelete"
        >
          Delete Meal
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
```

**Step 2: Commit**

```bash
git add app/components/mealPlanner/mealDetailSheet.vue
git commit -m "feat(meal): add mealDetailSheet bottom sheet component"
```

---

## Task 3: Create `mealDayList.vue` infinite scroll component

**Files:**
- Create: `app/components/mealPlanner/mealDayList.vue`

**Step 1: Create the infinite scroll list component**

This component manages the array of days, fetches meals via date ranges, and handles lazy loading.

```vue
<script setup lang="ts">
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { consola } from "consola";

import type { MealType, MealWithDate } from "~/types/database";

import MealDayCard from "./mealDayCard.vue";
import MealDetailSheet from "./mealDetailSheet.vue";
import { useAlertToast } from "~/composables/useAlertToast";
import { useStableDate } from "~/composables/useStableDate";

const { showError, showSuccess } = useAlertToast();
const { getStableDate } = useStableDate();

const {
  getMealsForDateRange,
  getMealPlanByWeek,
  createMealPlan,
  addMealToPlan,
  updateMeal,
  deleteMeal,
} = useMealPlans();

const { isOnline } = useOfflineSync();

// State
const meals = ref<MealWithDate[]>([]);
const days = ref<Date[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const INITIAL_DAYS = 14;
const LOAD_MORE_DAYS = 7;
const SCROLL_THRESHOLD = 300; // px from bottom to trigger load

// Detail sheet state
const detailSheetOpen = ref(false);
const detailMeal = ref<MealWithDate | null>(null);

// Scroll container ref
const scrollContainer = ref<HTMLElement | null>(null);

// Initialize days array starting from today
function initDays() {
  const today = startOfDay(getStableDate());
  days.value = Array.from({ length: INITIAL_DAYS }, (_, i) => addDays(today, i));
}

// Get meals for a specific date
function getMealsForDate(date: Date): MealWithDate[] {
  const dateStr = format(date, "yyyy-MM-dd");
  return meals.value.filter((m) => {
    const mealDateStr = format(new Date(m.calculatedDate), "yyyy-MM-dd");
    return mealDateStr === dateStr;
  });
}

// Fetch meals for a date range
async function fetchMeals(startDate: Date, endDate: Date) {
  try {
    const fetched = await getMealsForDateRange(startDate, endDate);
    // Merge with existing meals (avoid duplicates by id)
    const existingIds = new Set(meals.value.map(m => m.id));
    const newMeals = fetched.filter(m => !existingIds.has(m.id));
    meals.value = [...meals.value, ...newMeals];

    // Also update any existing meals that may have changed
    for (const fetched_meal of fetched) {
      const idx = meals.value.findIndex(m => m.id === fetched_meal.id);
      if (idx !== -1) {
        meals.value[idx] = fetched_meal;
      }
    }
  } catch (error) {
    if (!isOnline.value) {
      showError("Offline", "Cannot load meals while offline.");
    } else {
      showError("Load Failed", "Failed to load meals.");
    }
    consola.error("Failed to fetch meals:", error);
  }
}

// Initial load
async function initialLoad() {
  loading.value = true;
  initDays();
  const startDate = days.value[0]!;
  const endDate = days.value[days.value.length - 1]!;
  await fetchMeals(startDate, endDate);
  loading.value = false;
}

// Load more days
async function loadMore() {
  if (loadingMore.value) return;
  loadingMore.value = true;

  const lastDay = days.value[days.value.length - 1]!;
  const newDays = Array.from(
    { length: LOAD_MORE_DAYS },
    (_, i) => addDays(lastDay, i + 1),
  );

  days.value = [...days.value, ...newDays];
  await fetchMeals(newDays[0]!, newDays[newDays.length - 1]!);
  loadingMore.value = false;
}

// Scroll handler for infinite loading
function handleScroll(event: Event) {
  const el = event.target as HTMLElement;
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (distanceFromBottom < SCROLL_THRESHOLD) {
    loadMore();
  }
}

// Ensure a meal plan exists for the week containing a date, return its ID
async function ensureMealPlan(date: Date): Promise<string> {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  let plan = await getMealPlanByWeek(weekStart);
  if (!plan) {
    plan = await createMealPlan({ weekStart, order: 0 });
  }
  return plan.id;
}

// Get dayOfWeek (0=Monday, 6=Sunday) from a Date
function getDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Handle new meal save
async function handleSaveMeal(data: { date: Date; mealType: MealType; name: string }) {
  try {
    const planId = await ensureMealPlan(data.date);
    await addMealToPlan(planId, {
      name: data.name,
      mealType: data.mealType,
      dayOfWeek: getDayOfWeek(data.date),
    });
    // Refresh meals for that day's week range
    const weekStart = startOfWeek(data.date, { weekStartsOn: 1 });
    await fetchMeals(weekStart, addDays(weekStart, 6));
  } catch (error) {
    consola.error("Failed to save meal:", error);
    showError("Save Failed", "Failed to save meal.");
  }
}

// Handle meal name update
async function handleUpdateMealName(data: { mealId: string; name: string }) {
  try {
    await updateMeal(data.mealId, { name: data.name });
    // Update local state
    const idx = meals.value.findIndex(m => m.id === data.mealId);
    if (idx !== -1) {
      meals.value[idx] = { ...meals.value[idx]!, name: data.name };
    }
  } catch (error) {
    consola.error("Failed to update meal:", error);
    showError("Update Failed", "Failed to update meal.");
  }
}

// Handle meal delete (from card — clears text)
async function handleDeleteMeal(mealId: string) {
  try {
    await deleteMeal(mealId);
    meals.value = meals.value.filter(m => m.id !== mealId);
    showSuccess("Deleted", "Meal removed.");
  } catch (error) {
    consola.error("Failed to delete meal:", error);
    showError("Delete Failed", "Failed to delete meal.");
  }
}

// Handle detail sheet open
function handleOpenDetail(meal: MealWithDate) {
  detailMeal.value = meal;
  detailSheetOpen.value = true;
}

// Handle detail sheet save
async function handleDetailSave(data: { mealId: string; description: string; daysInAdvance: number }) {
  try {
    await updateMeal(data.mealId, {
      description: data.description || undefined,
      daysInAdvance: data.daysInAdvance,
    });
    // Update local state
    const idx = meals.value.findIndex(m => m.id === data.mealId);
    if (idx !== -1) {
      meals.value[idx] = {
        ...meals.value[idx]!,
        description: data.description || null,
        daysInAdvance: data.daysInAdvance,
      };
    }
    showSuccess("Saved", "Meal details updated.");
  } catch (error) {
    consola.error("Failed to update meal details:", error);
    showError("Update Failed", "Failed to update meal details.");
  }
}

// Handle detail sheet delete
async function handleDetailDelete(mealId: string) {
  await handleDeleteMeal(mealId);
}

onMounted(() => {
  initialLoad();
});
</script>

<template>
  <div
    ref="scrollContainer"
    class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
    @scroll="handleScroll"
  >
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
        <p class="mt-2 text-sm text-muted">Loading meals...</p>
      </div>
    </div>

    <!-- Day cards -->
    <div v-else class="p-4 space-y-3">
      <MealDayCard
        v-for="day in days"
        :key="day.toISOString()"
        :date="day"
        :meals="getMealsForDate(day)"
        @save-meal="handleSaveMeal"
        @update-meal-name="handleUpdateMealName"
        @delete-meal="handleDeleteMeal"
        @open-detail="handleOpenDetail"
      />

      <!-- Loading more indicator -->
      <div v-if="loadingMore" class="flex items-center justify-center py-4">
        <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-muted" />
        <span class="ml-2 text-sm text-muted">Loading more days...</span>
      </div>
    </div>

    <!-- Detail bottom sheet -->
    <MealDetailSheet
      :meal="detailMeal"
      :open="detailSheetOpen"
      @update:open="detailSheetOpen = $event"
      @save="handleDetailSave"
      @delete="handleDetailDelete"
    />
  </div>
</template>
```

**Step 2: Commit**

```bash
git add app/components/mealPlanner/mealDayList.vue
git commit -m "feat(meal): add mealDayList infinite scroll component"
```

---

## Task 4: Rewrite `mealPlanner.vue` page to use new components

**Files:**
- Modify: `app/pages/mealPlanner.vue` (full rewrite)

**Step 1: Replace the page content**

Replace the entire file with:

```vue
<script setup lang="ts">
import GlobalDateHeader from "~/components/global/globalDateHeader.vue";
import MealDayList from "~/components/mealPlanner/mealDayList.vue";
import SyncStatusBar from "~/components/mealPlanner/syncStatusBar.vue";
</script>

<template>
  <div class="flex h-screen w-full flex-col overflow-x-hidden overflow-y-hidden">
    <!-- Header -->
    <div class="py-5 sm:px-4 flex-shrink-0 bg-default border-b border-default">
      <GlobalDateHeader />
    </div>

    <!-- Sync Status Bar -->
    <div class="flex-shrink-0">
      <SyncStatusBar />
    </div>

    <!-- Meal Day List (infinite scroll) -->
    <MealDayList />
  </div>
</template>
```

**Step 2: Commit**

```bash
git add app/pages/mealPlanner.vue
git commit -m "feat(meal): rewrite mealPlanner page with infinite scroll day list"
```

---

## Task 5: Delete old components

**Files:**
- Delete: `app/components/mealPlanner/weeklyMealGrid.vue`
- Delete: `app/components/mealPlanner/mealFormInline.vue`
- Delete: `app/components/mealPlanner/mealDialog.vue`

**Step 1: Remove old files**

```bash
git rm app/components/mealPlanner/weeklyMealGrid.vue
git rm app/components/mealPlanner/mealFormInline.vue
git rm app/components/mealPlanner/mealDialog.vue
```

**Step 2: Verify no remaining imports reference them**

Run: `grep -r "weeklyMealGrid\|mealFormInline\|mealDialog\|WeeklyMealGrid\|MealFormInline\|MealDialog" app/ --include="*.vue" --include="*.ts"`
Expected: No results (they should only have been imported in the files we already changed)

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor(meal): remove old weeklyMealGrid, mealFormInline, mealDialog components"
```

---

## Task 6: Verify the app builds and runs

**Step 1: Run type check**

Run: `cd C:/Skylight && npx nuxi typecheck`
Expected: No type errors

**Step 2: Run lint**

Run: `cd C:/Skylight && npm run lint`
Expected: No lint errors (or only pre-existing ones)

**Step 3: Run dev server and test manually**

Run: `cd C:/Skylight && npm run dev`
Expected: Navigate to /mealPlanner, see scrollable day cards starting from today, type a meal name in a slot and blur to save, tap chevron to open bottom sheet, scroll down to trigger lazy loading.

**Step 4: Fix any issues found, then commit**

```bash
git add -A
git commit -m "fix(meal): address build/lint issues from meal entry redesign"
```

---

## Task 7: Check for other references to old meal components and update

**Files:**
- Check: Any file that imports or references `preparationReminders`, old meal dialog, or weekly grid concepts
- Modify: `app/components/mealPlanner/preparationReminders.vue` if the `weekStart` prop needs updating

**Step 1: Search for any remaining references**

Run: `grep -r "weekStart\|currentWeekStart\|weekRange\|isCurrentWeek" app/ --include="*.vue" --include="*.ts" -l`

Check each file for references that no longer make sense without the weekly navigation.

**Step 2: Update or remove preparationReminders integration if needed**

The `preparationReminders.vue` component takes a `weekStart` prop. Since we no longer navigate by week, decide whether to:
- Keep it as-is and pass today's week start
- Or integrate prep reminders into the day cards themselves

For now, keep it simple: remove it from the page. Users can see prep info in the detail sheet. If needed later, add a separate prep reminders view.

**Step 3: Commit if changes were needed**

```bash
git add -A
git commit -m "refactor(meal): clean up remaining references to weekly navigation"
```

---

## Task 8: Update home page meal widget if it references old patterns

**Step 1: Search for meal references in home page**

Run: `grep -r "meal" app/pages/index.vue app/components/home/ --include="*.vue" --include="*.ts" -l 2>/dev/null`

**Step 2: Verify the home page meal widget still works**

The home page likely uses `getMealsForDateRange` or `getMealPlanByWeek` independently. Check that it still functions since we didn't change any API routes or composables.

**Step 3: Commit if changes were needed**

```bash
git add -A
git commit -m "fix(meal): ensure home page meal widget compatibility"
```
