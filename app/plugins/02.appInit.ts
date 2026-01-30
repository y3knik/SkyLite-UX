import { consola } from "consola";
import ical from "ical.js";

import type { CalendarEvent } from "~/types/calendar";
import type { AppSettings, Integration, MealPlanWithMeals, ShoppingListWithItemsAndCount, TodoColumn, TodoWithUser, User } from "~/types/database";
import type { CalendarIntegrationService, IntegrationService, ShoppingIntegrationService, TodoIntegrationService } from "~/types/integrations";

import { integrationConfigs } from "~/integrations/integrationConfig";
import { setBrowserTimezone, setTimezoneRegistered } from "~/types/global";
import { createIntegrationService, registerIntegration } from "~/types/integrations";

export const integrationServices = new Map<string, IntegrationService>();

export default defineNuxtPlugin(async () => {
  consola.start("AppInit: Starting up...");

  const config = useRuntimeConfig();
  const browserTimezone = config.public.tz;

  // In Capacitor builds (static), always use client-side data fetching
  // Check build-time env var, not runtime Capacitor detection
  const isCapacitorBuild = import.meta.env.CAPACITOR_BUILD === "true" || process.env.CAPACITOR_BUILD === "true";
  const fetchOnServer = !isCapacitorBuild;

  consola.info("[AppInit] Environment:", {
    isCapacitorBuild,
    fetchOnServer,
    isServer: import.meta.server,
    isClient: import.meta.client,
  });

  try {
    const apiUrl = `https://tz.add-to-calendar-technology.com/api/${encodeURIComponent(browserTimezone)}.ics`;
    const { data: vtimezoneBlock, error } = await useFetch(apiUrl, {
      key: `timezone-${browserTimezone}`,
      server: fetchOnServer,
      default: () => null,
    });

    if (error.value) {
      throw new Error(`Failed to fetch timezone data: ${error.value.statusCode || "Unknown error"}`);
    }

    if (!vtimezoneBlock.value) {
      throw new Error("No timezone data received");
    }

    const timezoneComponent = new ical.Component(ical.parse(vtimezoneBlock.value as string));
    const timezone = new ical.Timezone({
      tzid: browserTimezone,
      component: timezoneComponent,
    });

    ical.TimezoneService.register(timezone);
    consola.debug("AppInit: Successfully registered timezone:", browserTimezone, "on", import.meta.server ? "server" : "client");

    setTimezoneRegistered(true);
    setBrowserTimezone(browserTimezone);
  }
  catch (error) {
    consola.warn("AppInit: Failed to register timezone, calendar will use fallback:", error);
    setTimezoneRegistered(false);
  }

  integrationConfigs.forEach((config) => {
    registerIntegration(config);
  });
  consola.debug(`AppInit: Registered ${integrationConfigs.length} integrations`);

  try {
    consola.info("[AppInit] Starting data fetch...");

    const [_usersResult, _currentUserResult, integrationsResult, _appSettingsResult] = await Promise.all([
      useAsyncData("users", async () => {
        consola.debug("[AppInit] Fetching users...");
        const data = await $fetch<User[]>("/api/users");
        consola.debug("[AppInit] Users fetched:", data?.length || 0, "users");
        return data;
      }, {
        server: fetchOnServer,
        lazy: false,
        // For Capacitor, ignore any prerendered data - always fetch fresh on client
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),

      useAsyncData("current-user", () => Promise.resolve(null), {
        server: false,
        lazy: false,
      }),

      useAsyncData("integrations", () => $fetch<Integration[]>("/api/integrations"), {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),

      useAsyncData("app-settings", () => $fetch<AppSettings>("/api/app-settings"), {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),
    ]);

    consola.debug("AppInit: Core dependencies loaded successfully");

    const [_localCalendarResult, _localTodosResult, _localShoppingResult, _todoColumnsResult, _mealPlansResult] = await Promise.all([
      useAsyncData("calendar-events", () => $fetch<CalendarEvent[]>("/api/calendar-events"), {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),

      useAsyncData("todos", async () => {
        consola.info("[AppInit] Fetching todos from /api/todos...");
        try {
          const data = await $fetch<TodoWithUser[]>("/api/todos");
          consola.info("[AppInit] Todos fetched successfully:", data?.length || 0, "todos");
          return data;
        }
        catch (err) {
          consola.error("[AppInit] Failed to fetch todos:", err);
          throw err;
        }
      }, {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),

      useAsyncData("native-shopping-lists", () => $fetch<ShoppingListWithItemsAndCount[]>("/api/shopping-lists"), {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),

      useAsyncData("todo-columns", async () => {
        consola.info("[AppInit] Fetching todo-columns from /api/todo-columns...");
        try {
          const data = await $fetch<TodoColumn[]>("/api/todo-columns");
          consola.info("[AppInit] Todo-columns fetched successfully:", data?.length || 0, "columns");
          return data;
        }
        catch (err) {
          consola.error("[AppInit] Failed to fetch todo-columns:", err);
          throw err;
        }
      }, {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),

      useAsyncData("meal-plans", () => $fetch<MealPlanWithMeals[]>("/api/meal-plans"), {
        server: fetchOnServer,
        lazy: false,
        getCachedData: isCapacitorBuild ? () => undefined : undefined,
      }),
    ]);

    consola.debug("AppInit: Local data loaded successfully");

    const integrationDataPromises: ReturnType<typeof useAsyncData>[] = [];

    if (integrationsResult.data.value) {
      const enabledIntegrations = integrationsResult.data.value.filter(integration => integration.enabled);
      consola.debug(`AppInit: Found ${enabledIntegrations.length} enabled integrations`);

      for (const integration of enabledIntegrations) {
        consola.debug(`AppInit: Processing integration: ${integration.name} (${integration.type})`);

        try {
          const service = await createIntegrationService(integration);
          if (!service) {
            consola.warn(`AppInit: Failed to create service for ${integration.name}`);
            continue;
          }

          await service.initialize();

          integrationServices.set(integration.id, service);
          consola.debug(`AppInit: Service initialized and stored for ${integration.name}`);

          if (integration.type === "calendar") {
            integrationDataPromises.push(
              useAsyncData(`calendar-events-${integration.id}`, async () => {
                try {
                  const events = await (service as CalendarIntegrationService).getEvents();
                  return events || [];
                }
                catch (err) {
                  consola.error(`AppInit: Error fetching calendar events for ${integration.name}:`, err);
                  return [];
                }
              }, {
                server: fetchOnServer,
                lazy: false,
              }),
            );
          }
          else if (integration.type === "shopping") {
            integrationDataPromises.push(
              useAsyncData(`shopping-lists-${integration.id}`, async () => {
                try {
                  const lists = await (service as ShoppingIntegrationService).getShoppingLists();
                  return lists || [];
                }
                catch (err) {
                  consola.error(`AppInit: Error fetching shopping lists for ${integration.name}:`, err);
                  return [];
                }
              }, {
                server: fetchOnServer,
                lazy: false,
              }),
            );
          }
          else if (integration.type === "todo") {
            integrationDataPromises.push(
              useAsyncData(`todos-${integration.id}`, async () => {
                try {
                  const todos = await (service as TodoIntegrationService).getTodos();
                  return todos || [];
                }
                catch (err) {
                  consola.error(`AppInit: Error fetching todos for ${integration.name}:`, err);
                  return [];
                }
              }, {
                server: fetchOnServer,
                lazy: false,
              }),
            );
          }
        }
        catch (err) {
          consola.error(`AppInit: Error processing integration ${integration.name}:`, err);
        }
      }
    }

    if (integrationDataPromises.length > 0) {
      consola.debug(`AppInit: Loading data for ${integrationDataPromises.length} integrations...`);

      try {
        await Promise.all(integrationDataPromises);
        consola.debug("AppInit: Integration data loaded successfully");
      }
      catch (integrationError) {
        consola.error("AppInit: Error loading integration data:", integrationError);
      }
    }

    consola.debug(`AppInit: All data pre-loaded successfully. Initialized ${integrationServices.size} integration services.`);
  }
  catch (error) {
    consola.error("AppInit: Error pre-loading data:", error);
  }
});
