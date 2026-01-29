<template>
  <div class="flex items-center gap-2">
    <UCheckbox
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <label class="text-sm font-medium cursor-pointer" @click="toggleCheckbox">
      Mark as Countdown Event
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const toggleCheckbox = () => {
  emit("update:modelValue", !defineProps<{ modelValue: boolean }>().modelValue);
};
</script>
