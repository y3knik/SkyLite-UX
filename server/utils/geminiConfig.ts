export function getGeminiConfig(): { apiKey: string } | null {
  const config = useRuntimeConfig();
  let apiKey = (config.geminiApiKey as string) || "";

  // Fallback to direct environment variable
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || "";
  }

  if (!apiKey) return null;
  return { apiKey };
}
