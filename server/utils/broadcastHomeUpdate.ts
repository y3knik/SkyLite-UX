import { consola } from "consola";

import type { HomeUpdateEventType } from "../../app/types/sync";

// Lazy-initialized references to avoid circular dependency with sync manager
let _broadcastToClients: ((event: any) => void) | null = null;
let _getConnectedClientsCount: (() => number) | null = null;

export function setBroadcastFunction(fn: (event: any) => void, countFn: () => number) {
  _broadcastToClients = fn;
  _getConnectedClientsCount = countFn;
}

export async function broadcastHomeUpdate(eventType: HomeUpdateEventType): Promise<void> {
  if (!_broadcastToClients || !_getConnectedClientsCount) {
    consola.debug(`[Home Broadcast] Not initialized, skipping ${eventType}`);
    return;
  }

  if (_getConnectedClientsCount() === 0) {
    consola.debug(`[Home Broadcast] No clients connected, skipping ${eventType}`);
    return;
  }

  try {
    const data = await fetchDataForEventType(eventType);

    const event = {
      type: eventType,
      data,
      timestamp: new Date(),
      success: true,
    };

    _broadcastToClients(event);
    consola.debug(`[Home Broadcast] Sent ${eventType} to ${_getConnectedClientsCount()} clients`);
  }
  catch (error) {
    consola.error(`[Home Broadcast] Failed to broadcast ${eventType}:`, error);
  }
}

async function fetchDataForEventType(eventType: HomeUpdateEventType): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
  const prisma = await import("../../app/lib/prisma").then(m => m.default);

  switch (eventType) {
    case "meals_update": {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

      return prisma.meal.findMany({
        where: {
          calculatedDate: {
            gte: new Date(`${today}T00:00:00`),
            lte: new Date(`${tomorrowStr}T23:59:59`),
          },
        },
        include: {
          mealPlan: true,
        },
      });
    }

    case "todos_update": {
      return prisma.todo.findMany({
        where: {
          completed: false,
        },
        include: {
          todoColumn: {
            select: {
              id: true,
              name: true,
              order: true,
              isDefault: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        take: 20,
      });
    }

    case "countdowns_update": {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      return prisma.todo.findMany({
        where: {
          isCountdown: true,
          completed: false,
          dueDate: {
            gte: now,
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      });
    }

    case "events_update": {
      return prisma.calendarEvent.findMany({
        where: {
          start: {
            gte: new Date(),
          },
        },
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          start: "asc",
        },
        take: 20,
      });
    }

    case "weather_update": {
      // Weather is fetched from external API, handled separately in sync manager
      return null;
    }

    default:
      consola.warn(`[Home Broadcast] Unknown event type: ${eventType}`);
      return null;
  }
}
