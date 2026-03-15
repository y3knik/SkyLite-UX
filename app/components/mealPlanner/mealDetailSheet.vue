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
