<script setup lang="ts">
import { onMounted } from "vue";
import type { MealType } from "~/types/database";

type Props = {
  dayOfWeek: number;
  mealType: MealType;
  editingMeal?: any | null;
};

const props = withDefaults(defineProps<Props>(), {
  editingMeal: null,
});

const emit = defineEmits<{
  save: [data: { name: string; description: string; daysInAdvance: number }];
  delete: [];
  close: [];
}>();

// Form state
const name = ref("");
const description = ref("");
const daysInAdvance = ref(0);
const error = ref<string | null>(null);

// Refs for input elements
const nameInputRef = ref<any>(null);
const daysInputRef = ref<any>(null);

// Day names (Monday=0 to Sunday=6)
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayName = computed(() => dayNames[props.dayOfWeek]);

// Meal type labels
const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};
const mealTypeLabel = computed(() => mealTypeLabels[props.mealType]);

// Initialize form when editing
watch(() => props.editingMeal, (meal) => {
  if (meal) {
    name.value = meal.name || "";
    description.value = meal.description || "";
    daysInAdvance.value = meal.daysInAdvance || 0;
  }
  else {
    resetForm();
  }
}, { immediate: true });

// Add Enter key listener to native inputs after mount
onMounted(() => {
  // Find the actual native input elements inside UInput components
  const attachEnterListener = (ref: any) => {
    if (!ref)
      return;

    // UInput wraps the native input - find it
    const nativeInput = ref.$el?.querySelector("input") || ref.$el;

    if (nativeInput && nativeInput.addEventListener) {
      nativeInput.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSave();
        }
      });
    }
  };

  // Attach to both input refs
  attachEnterListener(nameInputRef.value);
  attachEnterListener(daysInputRef.value);
});

function resetForm() {
  name.value = "";
  description.value = "";
  daysInAdvance.value = 0;
  error.value = null;
}

function handleKeyDown(event: KeyboardEvent) {
  // Check if Enter key is pressed (without Shift for textarea)
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    handleSave();
  }
}

function handleFormSubmit(event: Event) {
  event.preventDefault();
  handleSave();
}

function handleSave() {
  // Validation
  if (!name.value.trim()) {
    error.value = "Meal name is required";
    return;
  }

  error.value = null;

  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    daysInAdvance: daysInAdvance.value,
  });

  resetForm();
}

function handleDelete() {
  // eslint-disable-next-line no-alert
  if (confirm("Are you sure you want to delete this meal?")) {
    emit("delete");
  }
}
</script>

<template>
  <form class="inline-form border border-default rounded-lg p-3 bg-default space-y-2.5" @submit="handleFormSubmit">
    <!-- Error message display -->
    <div v-if="error" class="bg-error/10 text-error rounded-md px-3 py-2 text-sm">
      {{ error }}
    </div>

    <!-- Context: Day + Meal Type -->
    <div class="text-xs text-muted">
      <span class="font-medium">{{ dayName }}</span> -
      <span class="font-medium">{{ mealTypeLabel }}</span>
    </div>

    <!-- Name input -->
    <div class="space-y-1">
      <label class="block text-xs font-medium text-highlighted">Meal Name</label>
      <UInput
        ref="nameInputRef"
        v-model="name"
        placeholder="e.g., Grilled Chicken Salad"
        size="lg"
      />
    </div>

    <!-- Description (compact) -->
    <div class="space-y-1">
      <label class="block text-xs font-medium text-highlighted">Description (optional)</label>
      <UTextarea
        v-model="description"
        placeholder="Notes..."
        :rows="2"
        class="text-base resize-none"
        @keydown="handleKeyDown"
      />
    </div>

    <!-- Days in advance -->
    <div class="space-y-1">
      <label class="block text-xs font-medium text-highlighted">Prep Days in Advance</label>
      <UInput
        ref="daysInputRef"
        v-model.number="daysInAdvance"
        type="number"
        :min="0"
        :max="7"
        size="lg"
      />
      <p class="text-xs text-muted">
        Days before to start prep
      </p>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2 pt-1">
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        size="md"
        class="flex-1"
        @click="emit('close')"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        color="primary"
        size="md"
        class="flex-1"
      >
        {{ editingMeal ? 'Update' : 'Add' }}
      </UButton>
    </div>

    <!-- Delete (if editing) -->
    <UButton
      v-if="editingMeal"
      color="error"
      variant="ghost"
      icon="i-lucide-trash"
      size="md"
      class="w-full"
      type="button"
      @click="handleDelete"
    >
      Delete Meal
    </UButton>
  </form>
</template>
