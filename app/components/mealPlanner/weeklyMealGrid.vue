<script setup lang="ts">
import { format } from "date-fns";
import { ref, computed, onMounted, onUnmounted } from "vue";

import type { Meal, MealType } from "~/types/database";

type MealWithPending = Meal & { _isPending?: boolean };

const props = defineProps<{
  weekStart: Date;
  meals: MealWithPending[];
}>();

const emit = defineEmits<{
  (e: "addMeal", dayOfWeek: number, mealType: MealType): void;
  (e: "editMeal", meal: Meal): void;
  (e: "moveMeal", data: { mealId: string; newDayOfWeek: number; newMealType: MealType }): void;
}>();

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

// Mobile detection
const isMobile = ref(false);
const movingMeal = ref<MealWithPending | null>(null);

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768; // Tailwind 'md' breakpoint
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  onUnmounted(() => window.removeEventListener('resize', checkMobile));
});

const mealGrid = computed(() => {
  const grid: Record<number, Record<MealType, Meal[]>> = {};

  for (let day = 0; day < 7; day++) {
    grid[day] = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
    };
  }

  props.meals.forEach((meal) => {
    if (grid[meal.dayOfWeek]?.[meal.mealType]) {
      grid[meal.dayOfWeek]![meal.mealType]!.push(meal);
    }
  });

  return grid;
});

function getDayDate(dayOfWeek: number): string {
  const date = new Date(props.weekStart);
  date.setDate(date.getDate() + dayOfWeek);
  return format(date, "MMM d");
}

function startMoveMode(meal: MealWithPending) {
  movingMeal.value = meal;
}

function cancelMoveMode() {
  movingMeal.value = null;
}

function moveMealToSlot(dayOfWeek: number, mealType: MealType) {
  if (!movingMeal.value) return;

  emit('moveMeal', {
    mealId: movingMeal.value.id,
    newDayOfWeek: dayOfWeek,
    newMealType: mealType
  });

  cancelMoveMode();
}
</script>

<template>
  <div>
    <!-- Move mode overlay (mobile) -->
    <div
      v-if="movingMeal && isMobile"
      class="fixed inset-0 z-40 bg-black/80 p-4 overflow-y-auto"
    >
      <!-- Header -->
      <div class="bg-default rounded-lg p-4 mb-4 sticky top-0 z-10 shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-lg">Move "{{ movingMeal.name }}"</h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            size="lg"
            @click="cancelMoveMode"
            aria-label="Cancel move"
          />
        </div>
        <p class="text-sm text-muted">Tap a destination slot below</p>
      </div>

      <!-- Destination picker (scrollable list of days) -->
      <div class="space-y-4 pb-4">
        <div
          v-for="dayOfWeek in 7"
          :key="dayOfWeek - 1"
          class="bg-default rounded-lg overflow-hidden shadow-md"
        >
          <!-- Day header -->
          <div class="p-3 bg-muted/10 font-semibold text-sm border-b border-default">
            {{ dayNames[dayOfWeek - 1] }} - {{ getDayDate(dayOfWeek - 1) }}
          </div>

          <!-- Meal type buttons -->
          <div class="p-3 space-y-2">
            <button
              v-for="mealType in mealTypes"
              :key="mealType"
              @click="moveMealToSlot(dayOfWeek - 1, mealType)"
              :disabled="dayOfWeek - 1 === movingMeal.dayOfWeek && mealType === movingMeal.mealType"
              class="w-full p-3 border-2 rounded-lg text-left active:bg-primary/5 transition-colors"
              :class="[
                dayOfWeek - 1 === movingMeal.dayOfWeek && mealType === movingMeal.mealType
                  ? 'border-default bg-muted/10 text-muted cursor-not-allowed'
                  : 'border-primary/30 hover:bg-primary/5 hover:border-primary'
              ]"
            >
              <span class="text-sm font-medium">{{ mealTypeLabels[mealType] }}</span>
              <span
                v-if="dayOfWeek - 1 === movingMeal.dayOfWeek && mealType === movingMeal.mealType"
                class="text-xs text-muted ml-2"
              >
                (current)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div v-if="isMobile" class="space-y-4">
      <div
        v-for="dayOfWeek in 7"
        :key="dayOfWeek - 1"
        class="bg-default rounded-lg shadow-sm border border-default"
      >
        <!-- Day header -->
        <div class="p-3 border-b border-default bg-muted/5">
          <h3 class="font-semibold text-base">{{ dayNames[dayOfWeek - 1] }}</h3>
          <p class="text-xs text-muted">{{ getDayDate(dayOfWeek - 1) }}</p>
        </div>

        <!-- Meal slots for this day -->
        <div class="p-3 space-y-3">
          <div
            v-for="mealType in mealTypes"
            :key="mealType"
            class="border border-default rounded-lg p-3 min-h-[80px] bg-default hover:bg-muted/5 active:bg-muted/10 transition-colors cursor-pointer"
            @click="emit('addMeal', dayOfWeek - 1, mealType)"
          >
            <!-- Time label -->
            <div class="text-xs text-muted font-medium mb-2">{{ mealTypeLabels[mealType] }}</div>

            <!-- Meals in this slot -->
            <div class="space-y-2">
              <div
                v-for="meal in mealGrid[dayOfWeek - 1]?.[mealType] || []"
                :key="meal.id"
                class="p-3 rounded bg-primary/10 border border-primary/20 active:bg-primary/20 transition-colors"
                @click.stop="emit('editMeal', meal)"
              >
                <!-- Meal content -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">{{ meal.name }}</div>
                    <div v-if="meal.description" class="text-xs text-muted line-clamp-2 mt-1">
                      {{ meal.description }}
                    </div>
                    <div v-if="meal.daysInAdvance > 0" class="text-xs text-muted mt-1">
                      Prep: {{ meal.daysInAdvance }}d before
                    </div>
                  </div>

                  <!-- Quick actions -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <!-- Move button -->
                    <button
                      @click.stop="startMoveMode(meal)"
                      class="p-2 rounded hover:bg-primary/10 active:bg-primary/20 transition-colors"
                      aria-label="Move meal"
                    >
                      <UIcon name="i-lucide-move" class="h-5 w-5 text-primary" />
                    </button>
                  </div>
                </div>

                <!-- Pending sync indicator -->
                <div
                  v-if="(meal as any)._isPending"
                  class="flex items-center gap-1 text-xs mt-2 text-yellow-600"
                >
                  <UIcon name="i-lucide-cloud-off" class="h-3 w-3" />
                  <span>Pending sync</span>
                </div>
              </div>
            </div>

            <!-- Empty slot indicator -->
            <div
              v-if="(mealGrid[dayOfWeek - 1]?.[mealType]?.length || 0) === 0"
              class="text-xs text-muted text-center py-2"
            >
              + Add meal
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Layout -->
    <div v-else class="overflow-x-auto">
      <div class="min-w-[900px]">
        <!-- Header Row -->
        <div class="grid grid-cols-8 gap-2 mb-2">
          <div class="font-medium text-sm text-muted">
            <!-- Empty cell for meal type column -->
          </div>
          <div
            v-for="(day, index) in dayNames"
            :key="index"
            class="text-center"
          >
            <div class="font-semibold text-sm">
              {{ day }}
            </div>
            <div class="text-xs text-muted">
              {{ getDayDate(index) }}
            </div>
          </div>
        </div>

        <!-- Meal Type Rows -->
        <div
          v-for="mealType in mealTypes"
          :key="mealType"
          class="mb-4"
        >
          <div class="grid grid-cols-8 gap-2">
            <!-- Meal Type Label -->
            <div class="flex items-center">
              <span class="font-medium text-sm text-muted">
                {{ mealTypeLabels[mealType] }}
              </span>
            </div>

            <!-- Day Cells -->
            <div
              v-for="dayOfWeek in 7"
              :key="dayOfWeek"
              class="border border-default rounded-md p-2 min-h-[100px] bg-default hover:bg-muted/5 transition-colors cursor-pointer"
              @click="emit('addMeal', dayOfWeek - 1, mealType)"
            >
              <div class="space-y-1">
                <div
                  v-for="meal in mealGrid[dayOfWeek - 1]?.[mealType] || []"
                  :key="meal.id"
                  class="relative text-sm bg-primary/10 hover:bg-primary/20 rounded px-2 py-1 transition-colors cursor-pointer"
                  @click.stop="emit('editMeal', meal)"
                >
                  <div class="font-medium truncate">
                    {{ meal.name }}
                  </div>
                  <div v-if="meal.daysInAdvance > 0" class="text-xs text-muted">
                    Prep: {{ meal.daysInAdvance }}d before
                  </div>

                  <!-- Pending sync indicator -->
                  <div
                    v-if="(meal as any)._isPending"
                    class="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"
                    title="Waiting to sync"
                  />
                </div>

                <div v-if="(mealGrid[dayOfWeek - 1]?.[mealType]?.length || 0) === 0" class="text-xs text-muted text-center py-2">
                  + Add meal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
