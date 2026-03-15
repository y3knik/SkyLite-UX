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
