import { consola } from "consola";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

/**
 * Storage configuration for photos
 * Using a function to avoid direct process.env access at module level
 */
function getStorageDirectory(): string {
  return join(process.cwd(), "storage", "photos");
}

const DEFAULT_IMAGE_WIDTH = 1920;
const DEFAULT_IMAGE_HEIGHT = 1080;

/**
 * Ensures the storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  try {
    const storageDir = getStorageDirectory();
    await mkdir(storageDir, { recursive: true });
  }
  catch (error) {
    consola.error("Failed to create storage directory:", error);
    throw error;
  }
}

/**
 * Downloads a photo from Google Photos and saves it locally
 * @param baseUrl - The Google Photos base URL (without size parameters)
 * @param accessToken - OAuth access token
 * @param filename - Filename to save as (e.g., "album-id.jpg")
 * @param width - Image width (default 1920)
 * @param height - Image height (default 1080)
 * @returns Path to the saved file relative to storage directory
 */
export async function downloadAndSavePhoto(
  baseUrl: string,
  accessToken: string,
  filename: string,
  width: number = DEFAULT_IMAGE_WIDTH,
  height: number = DEFAULT_IMAGE_HEIGHT,
): Promise<string> {
  await ensureStorageDir();

  // Add size parameters to get optimized image
  const imageUrl = `${baseUrl}=w${width}-h${height}`;
  const storageDir = getStorageDirectory();
  const filepath = join(storageDir, filename);

  consola.info(`Downloading photo to: ${filepath}`);

  try {
    // Fetch image from Google Photos
    const response = await fetch(imageUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Stream to file
    const fileStream = createWriteStream(filepath);
    await pipeline(response.body as any, fileStream);

    consola.success(`Photo saved: ${filename}`);

    return filename; // Return relative path
  }
  catch (error) {
    consola.error(`Failed to download photo ${filename}:`, error);
    throw error;
  }
}

/**
 * Gets the full filesystem path for a stored photo
 */
export function getPhotoPath(filename: string): string {
  const storageDir = getStorageDirectory();
  return join(storageDir, filename);
}

/**
 * Deletes a stored photo
 */
export async function deletePhoto(filename: string): Promise<void> {
  try {
    const filepath = getPhotoPath(filename);
    await unlink(filepath);
    consola.info(`Deleted photo: ${filename}`);
  }
  catch (error) {
    consola.error(`Failed to delete photo ${filename}:`, error);
    throw error;
  }
}

/**
 * Gets the storage directory path
 */
export function getStorageDir(): string {
  return getStorageDirectory();
}
