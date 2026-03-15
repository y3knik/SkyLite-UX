<script setup lang="ts">
import { format, isToday } from "date-fns";

import type { MealType, MealWithDate } from "~/types/database";

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
  if (isToday(props.date))
    return "Today";
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

// Sync input values with existing meals when props change,
// but don't overwrite while the user is actively editing
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

// Clear saving state when meals update (meal appeared from server)
watch(() => props.meals, () => {
  savingSlots.value.clear();
});

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
    }
    else if (value !== slot.meal.name) {
      // Changed — update
      emit("updateMealName", { mealId: slot.meal.id, name: value });
    }
  }
  else if (value !== "") {
    // New meal
    savingSlots.value.add(slot.type);
    emit("saveMeal", { date: props.date, mealType: slot.type, name: value });
  }
}

function handleKeydown(event: KeyboardEvent, _slot: MealSlot) {
  if (event.key === "Enter") {
    event.preventDefault();
    (event.target as HTMLInputElement).blur();
  }
}
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
        <UBadge
          v-if="isToday(date)"
          color="primary"
          variant="soft"
          size="xs"
        >
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
        ><!-- eslint-disable-line vue/html-self-closing -->

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
