<template>
  <div
    v-if="countdown"
    class="countdown-widget relative overflow-hidden rounded-2xl p-8 shadow-2xl cursor-pointer transition-transform hover:scale-105"
    @click="navigateToTodos"
  >
    <!-- Gradient Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 opacity-90" />

    <!-- Content -->
    <div class="relative z-10 text-white">
      <!-- Event Name -->
      <h2 class="text-4xl font-bold mb-4 text-center drop-shadow-lg">
        {{ countdown.title }}
      </h2>

      <!-- Days Remaining -->
      <div class="text-center mb-6">
        <div class="text-8xl font-extrabold drop-shadow-lg">
          {{ daysRemainingDisplay }}
        </div>
        <div class="text-2xl font-medium opacity-90">
          {{ daysRemainingLabel }}
        </div>
      </div>

      <!-- AI-Generated Message -->
      <div v-if="displayMessage" class="text-center">
        <p class="text-xl italic opacity-95 drop-shadow">
          "{{ displayMessage }}"
        </p>
      </div>

      <!-- Loading State -->
      <div v-else-if="loadingMessage" class="text-center">
        <UIcon name="i-heroicons-sparkles" class="w-6 h-6 animate-spin inline-block" />
        <span class="ml-2">Generating message...</span>
      </div>
    </div>
  </div>

  <!-- Loading Skeleton -->
  <div
    v-else-if="loading"
    class="countdown-widget-skeleton rounded-2xl p-8 shadow-2xl"
  >
    <USkeleton class="h-12 w-3/4 mx-auto mb-4" />
    <USkeleton class="h-24 w-32 mx-auto mb-6" />
    <USkeleton class="h-8 w-2/3 mx-auto" />
  </div>
</template>

<script setup lang="ts">
import type { Todo } from "~/types/database";
import consola from "consola";

const { fetchCountdowns, getEarliestCountdown, calculateDaysRemaining, getCountdownMessage } = useCountdowns();
const { homeSettings, fetchHomeSettings } = useHomeSettings();

const countdown = ref<Todo | null>(null);
const loading = ref(true);
const loadingMessage = ref(false);
const displayMessage = ref<string>("");
const daysRemaining = ref(0);

const daysRemainingDisplay = computed(() => {
  if (daysRemaining.value === 0) return "TODAY";
  if (daysRemaining.value === 1) return "1";
  return daysRemaining.value;
});

const daysRemainingLabel = computed(() => {
  if (daysRemaining.value === 0) return "";
  if (daysRemaining.value === 1) return "day to go";
  return "days to go";
});

const loadCountdown = async () => {
  loading.value = true;

  try {
    await fetchCountdowns();
    const earliest = getEarliestCountdown();

    if (earliest) {
      countdown.value = earliest;
      daysRemaining.value = calculateDaysRemaining(earliest.dueDate);

      // Load or generate the message
      loadingMessage.value = true;
      displayMessage.value = await getCountdownMessage(earliest);
      loadingMessage.value = false;

      consola.info(`Loaded countdown: ${earliest.title} (${daysRemaining.value} days)`);
    }
    else {
      countdown.value = null;
      consola.debug("No countdowns available");
    }
  }
  catch (error) {
    consola.error("Failed to load countdown:", error);
    countdown.value = null;
  }
  finally {
    loading.value = false;
  }
};

const navigateToTodos = () => {
  navigateTo("/toDoLists");
};

let intervalId: NodeJS.Timeout | null = null;

onMounted(async () => {
  // Fetch home settings first to get the refresh interval
  await fetchHomeSettings();

  loadCountdown();

  // Use the home settings refresh interval (convert hours to milliseconds)
  const refreshIntervalMs = (homeSettings.value?.refreshInterval || 6.0) * 3600000;

  // Set up auto-refresh with the configured interval
  intervalId = setInterval(() => {
    consola.debug("Auto-refreshing countdown widget");
    loadCountdown();
  }, refreshIntervalMs);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.countdown-widget {
  min-height: 300px;
}

.countdown-widget-skeleton {
  min-height: 300px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
}
</style>
