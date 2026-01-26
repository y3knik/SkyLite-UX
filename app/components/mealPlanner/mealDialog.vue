<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import type { CreateMealInput, Meal, MealType } from "~/types/database";

const props = defineProps<{
  isOpen: boolean;
  meal?: Meal | null;
  dayOfWeek: number;
  mealType: MealType;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", meal: CreateMealInput): void;
  (e: "delete"): void;
}>();

const name = ref("");
const description = ref("");
const daysInAdvance = ref(0);
const error = ref<string | null>(null);

// Mobile detection
const isMobile = ref(false);

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768; // Tailwind 'md' breakpoint
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  onUnmounted(() => window.removeEventListener('resize', checkMobile));
});

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

watch(() => [props.isOpen, props.meal], ([isOpen, meal]) => {
  if (isOpen) {
    resetForm();
    if (meal && typeof meal === "object") {
      name.value = meal.name || "";
      description.value = meal.description || "";
      daysInAdvance.value = meal.daysInAdvance || 0;
    }
  }
}, { immediate: true });

function resetForm() {
  name.value = "";
  description.value = "";
  daysInAdvance.value = 0;
  error.value = null;
}

function handleSave() {
  if (!name.value.trim()) {
    error.value = "Meal name is required";
    return;
  }

  emit("save", {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    mealType: props.mealType,
    dayOfWeek: props.dayOfWeek,
    daysInAdvance: daysInAdvance.value,
    completed: false,
    order: 0,
  });
}

function handleDelete() {
  emit("delete");
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50"
    @click="emit('close')"
  >
    <div
      class="w-full sm:w-[500px] max-w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-default rounded-t-2xl sm:rounded-lg border border-default shadow-lg"
      @click.stop
    >
      <!-- Mobile: Drag handle -->
      <div v-if="isMobile" class="flex justify-center py-2 border-b border-default">
        <div class="w-12 h-1 bg-muted rounded-full"></div>
      </div>

      <div class="flex items-center justify-between p-4 sm:p-4 border-b border-default">
        <h3 class="text-base sm:text-base font-semibold leading-6">
          {{ meal ? 'Edit Meal' : 'Add Meal' }}
        </h3>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          :size="isMobile ? 'lg' : 'md'"
          class="-my-1"
          aria-label="Close dialog"
          @click="emit('close')"
        />
      </div>

      <div class="p-4 sm:p-4 space-y-4">
        <div v-if="error" class="bg-error/10 text-error rounded-md px-3 py-2 text-sm">
          {{ error }}
        </div>

        <div class="text-sm text-muted">
          <span class="font-medium">{{ dayNames[dayOfWeek] }}</span> -
          <span class="font-medium">{{ mealTypeLabels[mealType] }}</span>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-highlighted">Meal Name</label>
          <UInput
            v-model="name"
            placeholder="e.g., Grilled Chicken Salad"
            class="w-full"
            :size="isMobile ? 'lg' : 'md'"
            @keydown.enter="handleSave"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-highlighted">Description (optional)</label>
          <UTextarea
            v-model="description"
            placeholder="Notes about the meal..."
            class="w-full text-base"
            :rows="3"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-highlighted">
            Days in Advance to Prepare
          </label>
          <UInput
            v-model.number="daysInAdvance"
            type="number"
            :min="0"
            :max="7"
            class="w-full"
            :size="isMobile ? 'lg' : 'md'"
          />
          <p class="text-xs text-muted">
            How many days before you need to start preparing this meal (e.g., for defrosting, marinating)
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-between gap-3 p-4 sm:p-4 border-t border-default">
        <div class="flex gap-2 justify-center sm:justify-start">
          <UButton
            v-if="meal"
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            :size="isMobile ? 'lg' : 'md'"
            :class="isMobile ? 'flex-1' : ''"
            @click="handleDelete"
          >
            Delete Meal
          </UButton>
        </div>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :size="isMobile ? 'lg' : 'md'"
            class="flex-1 sm:flex-none"
            @click="emit('close')"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :size="isMobile ? 'lg' : 'md'"
            class="flex-1 sm:flex-none"
            @click="handleSave"
          >
            {{ meal ? 'Update Meal' : 'Add Meal' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
