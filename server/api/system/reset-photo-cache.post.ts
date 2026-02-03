import { consola } from "consola";

import prisma from "~/lib/prisma";
import { getStorageDir } from "~/server/utils/photoStorage";

/**
 * Resets all photo cache references in the database
 * This forces photos to be re-downloaded to the correct storage location
 *
 * POST /api/system/reset-photo-cache
 */
export default defineEventHandler(async (event) => {
  try {
    const storageLocation = getStorageDir();
    consola.info(`Resetting photo cache. New storage location: ${storageLocation}`);

    // Clear all localImagePath references - photos will be re-downloaded
    const result = await prisma.selectedAlbum.updateMany({
      where: {
        localImagePath: {
          not: null,
        },
      },
      data: {
        localImagePath: null,
        cachedWidth: null,
        cachedHeight: null,
        downloadedAt: null,
      },
    });

    consola.success(`Reset complete: Cleared ${result.count} album photo cache entries`);

    return {
      success: true,
      clearedCount: result.count,
      storageLocation,
      message: `Cleared ${result.count} album photo cache entry(ies). Photos will be re-downloaded to ${storageLocation} on next view.`,
    };
  }
  catch (error: any) {
    consola.error("Error during photo cache reset:", error);
    throw createError({
      statusCode: 500,
      message: `Reset failed: ${error.message || error}`,
    });
  }
});
