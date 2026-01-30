<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

// @ts-ignore - Capacitor is added via script tag in Capacitor builds
const isCapacitor = typeof window !== "undefined" && "Capacitor" in window;

const isOpen = ref(false);
const logs = ref<{ type: string; message: string; timestamp: string }[]>([]);
const maxLogs = 100;

// Capture console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
};

function addLog(type: string, args: any[]) {
  const message = args.map(arg =>
    typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(" ");

  const timestamp = new Date().toLocaleTimeString();

  logs.value.push({ type, message, timestamp });

  // Keep only last maxLogs entries
  if (logs.value.length > maxLogs) {
    logs.value.shift();
  }

  // Auto-scroll to bottom
  setTimeout(() => {
    const container = document.getElementById("debug-console-logs");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 10);
}

onMounted(() => {
  if (!isCapacitor) return;

  // Override console methods to capture logs
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    addLog("log", args);
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    addLog("info", args);
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    addLog("debug", args);
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    addLog("warn", args);
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    addLog("error", args);
  };
});

onUnmounted(() => {
  if (!isCapacitor) return;

  // Restore original console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

function clearLogs() {
  logs.value = [];
}

function getLogColor(type: string) {
  switch (type) {
    case "error": return "text-red-600 bg-red-50";
    case "warn": return "text-yellow-600 bg-yellow-50";
    case "info": return "text-blue-600 bg-blue-50";
    case "debug": return "text-gray-600 bg-gray-50";
    default: return "text-gray-800 bg-white";
  }
}

async function copyAllLogs() {
  const logText = logs.value.map(log =>
    `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
  ).join("\n");

  try {
    await navigator.clipboard.writeText(logText);
    alert("Logs copied to clipboard!");
  }
  catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = logText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("Logs copied to clipboard!");
  }
}
</script>

<template>
  <div v-if="isCapacitor">
    <!-- Floating Debug Button -->
    <button
      class="fixed bottom-20 right-4 z-[9999] w-12 h-12 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center"
      @click="isOpen = !isOpen"
    >
      <span class="text-xs font-bold">{{ isOpen ? "✕" : "🐛" }}</span>
    </button>

    <!-- Debug Console Overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9998] bg-black bg-opacity-50 flex items-end"
      @click.self="isOpen = false"
    >
      <div class="bg-white w-full h-2/3 rounded-t-xl shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">Debug Console</h3>
          <div class="flex gap-2">
            <button
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded"
              @click="copyAllLogs"
            >
              Copy
            </button>
            <button
              class="px-3 py-1 text-sm bg-red-500 text-white rounded"
              @click="clearLogs"
            >
              Clear
            </button>
            <button
              class="px-3 py-1 text-sm bg-gray-500 text-white rounded"
              @click="isOpen = false"
            >
              Close
            </button>
          </div>
        </div>

        <!-- Logs Container -->
        <div
          id="debug-console-logs"
          class="flex-1 overflow-y-auto p-2 font-mono text-xs"
        >
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="mb-1 p-2 rounded"
            :class="getLogColor(log.type)"
          >
            <div class="flex items-start gap-2">
              <span class="text-gray-500 shrink-0">{{ log.timestamp }}</span>
              <span class="font-semibold shrink-0 uppercase">{{ log.type }}:</span>
              <pre class="whitespace-pre-wrap break-all flex-1">{{ log.message }}</pre>
            </div>
          </div>
          <div v-if="logs.length === 0" class="text-center text-gray-400 mt-8">
            No logs yet. Logs will appear here as the app runs.
          </div>
        </div>

        <!-- Footer Info -->
        <div class="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
          {{ logs.length }} logs (max {{ maxLogs }})
        </div>
      </div>
    </div>
  </div>
</template>
